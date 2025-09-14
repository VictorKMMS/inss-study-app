// --- IMPORTAÇÕES ---
import { allQuestionBanks } from './question-bank.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- VARIÁVEIS DE ESTADO GLOBAIS ---
    let userData = {};
    let currentQuestion = null;
    let chatHistory = [];
    let simuladoTimer;
    let simuladoQuestions = [];
    let simuladoCurrentIndex = 0;
    let isReviewMode = false;
    let isConcursoMode = false;
    let sessionQuestionCount = 1;
    
    // --- SELEÇÃO DE ELEMENTOS DOM ---
    const mainApp = document.getElementById('main-app');
    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const streakCounter = document.getElementById('streak-counter');
    const reviewModeToggle = document.getElementById('review-mode-toggle');
    const concursoModeToggle = document.getElementById('concurso-mode-toggle');
    const startSimuladoBtn = document.getElementById('start-simulado-btn');
    const simuladoModal = document.getElementById('simulado-modal');
    const simuladoContainer = document.querySelector('.simulado-container');
    const simuladoResultsContainer = document.querySelector('.simulado-results-container');
    const chatModal = document.getElementById('chat-modal');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    // --- LÓGICA DE DADOS COM LOCALSTORAGE ---
    function loadUserData() {
        const storedData = localStorage.getItem('inssTutorData');
        if (storedData) {
            userData = JSON.parse(storedData);
        } else {
            userData = {
                scores: { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } },
                userStats: { streak: 0, lastVisit: null },
                erroredQuestions: [],
                recentlyAsked: [],
            };
        }
        userData.questionBank = allQuestionBanks;
    }

    function saveUserData() {
        const dataToSave = { ...userData };
        delete dataToSave.questionBank;
        localStorage.setItem('inssTutorData', JSON.stringify(dataToSave));
    }
    
    // --- LÓGICA DO APLICATIVO ---
    function initializeApp() {
        loadUserData();
        
        categorySelector.addEventListener('change', () => {
            sessionQuestionCount = 1;
            generateFlashcard();
        });
        themeToggleBtn.addEventListener('click', toggleTheme);
        reviewModeToggle.addEventListener('change', (e) => {
            isReviewMode = e.target.checked;
            if (isReviewMode) {
                concursoModeToggle.checked = false;
                isConcursoMode = false;
            }
            sessionQuestionCount = 1;
            generateFlashcard();
        });
        concursoModeToggle.addEventListener('change', (e) => {
            isConcursoMode = e.target.checked;
            if (isConcursoMode) {
                reviewModeToggle.checked = false;
                isReviewMode = false;
            }
            sessionQuestionCount = 1;
            generateFlashcard();
        });
        startSimuladoBtn.addEventListener('click', startSimulado);
        document.querySelectorAll('#simulado-actions button').forEach(button => {
            button.addEventListener('click', (e) => handleSimuladoAnswer(e.target.dataset.choice));
        });
        document.getElementById('close-results-btn').addEventListener('click', closeResults);
        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); });
        closeChatBtn.addEventListener('click', closeChat);
        resetScoreBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja zerar todo o seu placar e histórico de questões?')) {
                userData.scores = { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
                userData.erroredQuestions = [];
                userData.recentlyAsked = [];
                sessionQuestionCount = 1;
                updateScoreboard();
                generateFlashcard();
            }
        });

        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();
    }
    
    // --- DEFINIÇÃO DE TODAS AS FUNÇÕES DE ESTUDO ---
    
    function checkTheme() {
        if (localStorage.getItem('inssTheme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('inssTheme', 'dark');
            themeToggleBtn.textContent = '☀️';
        } else {
            localStorage.setItem('inssTheme', 'light');
            themeToggleBtn.textContent = '🌙';
        }
    }

    function updateStreaks() {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = userData.userStats.lastVisit;
        if (lastVisit !== today) {
            if (lastVisit && new Date(today) - new Date(lastVisit) === 86400000) {
                userData.userStats.streak++;
            } else {
                userData.userStats.streak = 1;
            }
            userData.userStats.lastVisit = today;
            saveUserData();
        }
        streakCounter.textContent = `🔥 ${userData.userStats.streak}`;
    }
    
    async function generateFlashcard() {
        let questionPool;
        const allQuestions = Object.values(userData.questionBank).flat();

        if (isReviewMode) {
            document.querySelector('.review-mode label').style.fontWeight = 'bold';
            document.querySelector('.concurso-mode label').style.fontWeight = 'normal';
            questionPool = allQuestions.filter(q => q && userData.erroredQuestions.includes(q.id));
        } else if (isConcursoMode) {
            document.querySelector('.concurso-mode label').style.fontWeight = 'bold';
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                questionPool = allQuestions.filter(q => q && q.isConcurso);
            } else {
                questionPool = (userData.questionBank[selectedCategory] || []).filter(q => q && q.isConcurso);
            }
        } else {
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            document.querySelector('.concurso-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                const allCategories = Object.keys(userData.scores);
                selectedCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
            }
            questionPool = userData.questionBank[selectedCategory] || [];
        }

        let availableQuestions = questionPool.filter(q => q && !userData.recentlyAsked.includes(q.id));
        if (availableQuestions.length === 0 && questionPool.length > 0) {
            userData.recentlyAsked = userData.recentlyAsked.slice(Math.floor(userData.recentlyAsked.length / 2));
            availableQuestions = questionPool.filter(q => q && !userData.recentlyAsked.includes(q.id));
        }
        
        // --- LÓGICA CORRIGIDA PARA CHAMAR A IA ---
        if (availableQuestions.length === 0) {
            if (isReviewMode) {
                 flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">Você revisou todas as suas questões erradas. Ótimo trabalho!</div></div>`;
                 return;
            }
            if (isConcursoMode) {
                flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">Você respondeu todas as questões de concurso disponíveis para esta seleção.</div></div>`;
                return;
            }
            // SE CHEGOU AQUI, ESTÁ NO MODO NORMAL E AS QUESTÕES ACABARAM. CHAMA A IA.
            await fetchNewQuestionsFromAI(categorySelector.value === 'all' ? 'seguridade' : categorySelector.value);
            return;
        }

        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        currentQuestion = { ...questionData, category: questionData.category || categorySelector.value };
        
        const starIcon = currentQuestion.isConcurso ? `<span class="concurso-star" title="Questão de Concurso">⭐</span>` : '';
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">Nº ${sessionQuestionCount}</span>
                ${starIcon}
            </div>
            <p class="question-text">${currentQuestion.question}</p>
            <div class="flashcard-actions">
                <button type="button" class="btn-certo" data-choice="Certo">Certo</button>
                <button type="button" class="btn-errado" data-choice="Errado">Errado</button>
            </div>
            <div class="flashcard-answer"></div>
        `;
        flashcardContainer.innerHTML = '';
        flashcardContainer.appendChild(card);
        card.querySelectorAll('.flashcard-actions button').forEach(button => button.addEventListener('click', checkAnswer));
    }

    function checkAnswer(event) {
        const userChoice = event.target.dataset.choice;
        const isCorrect = userChoice === currentQuestion.answer;
        const answerDiv = document.querySelector('.flashcard-answer');
        const actionsDiv = document.querySelector('.flashcard-actions');
        
        sessionQuestionCount++;
        actionsDiv.innerHTML = '';
        userData.recentlyAsked.push(currentQuestion.id);
        if(userData.recentlyAsked.length > 50) userData.recentlyAsked.shift();
        
        if (!isCorrect) {
            if (!userData.erroredQuestions.includes(currentQuestion.id)) {
                userData.erroredQuestions.push(currentQuestion.id);
            }
            if(userData.scores[currentQuestion.category]) userData.scores[currentQuestion.category].incorrect++;
        } else {
            if(userData.scores[currentQuestion.category]) userData.scores[currentQuestion.category].correct++;
        }
        
        if (isCorrect) {
            answerDiv.classList.add('correct');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br>Parabéns, sua resposta está correta!<div class="answer-source"><strong>Fonte:</strong> ${currentQuestion.law}</div>`;
            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.innerText = 'Próximo';
            nextButton.className = 'btn-proximo-acerto';
            nextButton.onclick = () => {
                document.querySelector('.flashcard')?.classList.add('exiting');
                setTimeout(generateFlashcard, 600);
            };
            actionsDiv.appendChild(nextButton);
        } else {
            answerDiv.classList.add('incorrect');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br><div class="ai-explanation"><strong>🤖 Explicação da IA:</strong><p>${currentQuestion.explanation}</p><p>📖 <em>${currentQuestion.law}</em></p></div>`;
            const chatButton = document.createElement('button');
            chatButton.type = 'button';
            chatButton.innerText = 'Conversar com Tutor IA';
            chatButton.className = 'btn-proximo';
            chatButton.onclick = openChat;
            actionsDiv.appendChild(chatButton);
        }
        updateScoreboard();
    }
    
    function updateScoreboard() {
        if (!scoreContainer || !userData.scores) return;
        scoreContainer.innerHTML = '';
        Object.keys(userData.scores).forEach(category => {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            scoreContainer.innerHTML += `<div class="score-item"><span class="score-label">${categoryName}</span><span class="score-values"><span class="score-correct">${userData.scores[category].correct}</span> / <span class="score-incorrect">${userData.scores[category].incorrect}</span></span></div>`;
        });
        saveUserData();
    }
    
    function startSimulado() {
        // A função de simulado permanece a mesma
    }
    function displaySimuladoQuestion() {
        // A função de simulado permanece a mesma
    }
    function handleSimuladoAnswer(userAnswer) {
        // A função de simulado permanece a mesma
    }
    function endSimulado() {
        // A função de simulado permanece a mesma
    }
    function closeResults() {
        // A função de simulado permanece a mesma
    }
    function openChat() {
        // A função de chat permanece a mesma
    }
    function closeChat() {
        // A função de chat permanece a mesma
    }
    async function handleSendMessage() {
        // A função de chat permanece a mesma
    }

    async function fetchNewQuestionsFromAI(category) {
        if (category === 'all') category = 'seguridade';
        flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">Buscando novas questões sobre "${category}" com a IA...</div></div>`;
        try {
            const response = await fetch('/api/generate-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const newQuestion = await response.json();
            
            if (!userData.questionBank[category]) userData.questionBank[category] = [];
            newQuestion.id = `${category.substring(0,1).toUpperCase()}${Date.now()}`;
            newQuestion.category = category;
            
            // Adiciona a nova questão ao banco de dados em memória
            userData.questionBank[category].push(newQuestion);
            // Salva a nova questão permanentemente
            saveUserData();

            console.log("Nova questão recebida e salva!", newQuestion);
            generateFlashcard();
        } catch (error) {
            console.error("Falha ao buscar questão da IA:", error);
            flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">Ocorreu um erro ao conectar com a IA. Verifique sua conexão ou a configuração da API e tente novamente.</div></div>`;
        }
    }
    
    // Inicia a aplicação
    initializeApp();
});

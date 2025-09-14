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
        
        categorySelector.addEventListener('change', generateFlashcard);
        themeToggleBtn.addEventListener('click', toggleTheme);
        reviewModeToggle.addEventListener('change', (e) => {
            isReviewMode = e.target.checked;
            if (isReviewMode) {
                concursoModeToggle.checked = false;
                isConcursoMode = false;
            }
            generateFlashcard();
        });
        concursoModeToggle.addEventListener('change', (e) => {
            isConcursoMode = e.target.checked;
            if (isConcursoMode) {
                reviewModeToggle.checked = false;
                isReviewMode = false;
            }
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
                updateScoreboard();
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
            if (questionPool.length === 0) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você não tem questões erradas para revisar.</p></div>`;
                return;
            }
        } else if (isConcursoMode) {
            document.querySelector('.concurso-mode label').style.fontWeight = 'bold';
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                questionPool = allQuestions.filter(q => q && q.isConcurso);
            } else {
                questionPool = (userData.questionBank[selectedCategory] || []).filter(q => q && q.isConcurso);
            }
            if (questionPool.length === 0) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Não há questões de concurso para esta matéria.</p></div>`;
                return;
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
        
        if (availableQuestions.length === 0) {
            if (isReviewMode) {
                 flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você revisou todas as suas questões erradas. Ótimo trabalho!</p></div>`;
                 return;
            }
            if (isConcursoMode) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você respondeu todas as questões de concurso disponíveis para esta seleção.</p></div>`;
                return;
            }
            flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Buscando novas questões sobre o tema com a IA...</p></div>`;
            await fetchNewQuestionsFromAI(categorySelector.value === 'all' ? 'seguridade' : categorySelector.value);
            return;
        }

        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        currentQuestion = { ...questionData, category: questionData.category || categorySelector.value };
        
        const starIcon = currentQuestion.isConcurso ? `<span class="concurso-star" title="Questão de Concurso">⭐</span>` : '';
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `<p class="flashcard-question">${currentQuestion.question} ${starIcon}</p><div class="flashcard-actions"><button type="button" class="btn-certo" data-choice="Certo">Certo</button><button type="button" class="btn-errado" data-choice="Errado">Errado</button></div><div class="flashcard-answer"></div>`;
        flashcardContainer.innerHTML = '';
        flashcardContainer.appendChild(card);
        card.querySelectorAll('.flashcard-actions button').forEach(button => button.addEventListener('click', checkAnswer));
    }

    function checkAnswer(event) {
        const userChoice = event.target.dataset.choice;
        const isCorrect = userChoice === currentQuestion.answer;
        const answerDiv = document.querySelector('.flashcard-answer');
        const actionsDiv = document.querySelector('.flashcard-actions');
        
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
    
    function startSimulado() { /* ... Lógica do simulado ... */ }
    function displaySimuladoQuestion() { /* ... Lógica do simulado ... */ }
    function handleSimuladoAnswer(userAnswer) { /* ... Lógica do simulado ... */ }
    function endSimulado() { /* ... Lógica do simulado ... */ }
    function closeResults() { /* ... Lógica do simulado ... */ }
    function openChat() { /* ... Lógica do chat ... */ }
    function closeChat() { /* ... Lógica do chat ... */ }
    async function handleSendMessage() { /* ... Lógica do chat ... */ }
    async function fetchNewQuestionsFromAI(category) { /* ... Lógica da IA ... */ }

    // Inicia a aplicação
    initializeApp();
});

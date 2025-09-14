// --- IMPORTAÇÕES ---
import { allQuestionBanks } from './question-bank.js';
import { initStatistics } from './features/statistics.js';
import { initTopicExplorer } from './features/topic-explorer.js';
import { initAchievements, checkAchievements } from './features/achievements.js';

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
        // Garante que a estrutura para novas funcionalidades exista e que o banco de questões seja sempre o mais atual do código
        if (!userData.userStats) userData.userStats = { streak: 0, lastVisit: null };
        if (!userData.userStats.unlockedAchievements) userData.userStats.unlockedAchievements = [];
        if (!userData.userStats.simuladosCompletos) userData.userStats.simuladosCompletos = 0;
        if (!userData.userStats.errosRevisados) userData.userStats.errosRevisados = 0;
        userData.questionBank = allQuestionBanks;
    }

    function saveUserData() {
        const dataToSave = { ...userData };
        delete dataToSave.questionBank; // Não salva o banco de questões no localStorage para economizar espaço
        localStorage.setItem('inssTutorData', JSON.stringify(dataToSave));
    }
    
    // --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---
    function initializeApp() {
        loadUserData();
        
        // Event Listeners Principais
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
        document.getElementById('chat-send-btn').addEventListener('click', handleSendMessage);
        document.getElementById('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } });
        document.getElementById('close-chat-btn').addEventListener('click', closeChat);
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

        // Inicializa os Módulos
        initStatistics(userData);
        initTopicExplorer();
        initAchievements(userData);

        // Executa as funções de UI iniciais
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
        if(!document.getElementById('stats-modal').classList.contains('hidden')){
            const showStatsBtn = document.getElementById('show-stats-btn');
            if (showStatsBtn) showStatsBtn.click();
            if (showStatsBtn) showStatsBtn.click();
        }
    }

    function updateStreaks() {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = userData.userStats.lastVisit;
        let needsSave = false;
        if (lastVisit !== today) {
            if (lastVisit && new Date(today) - new Date(lastVisit) === 86400000) {
                userData.userStats.streak++;
            } else {
                userData.userStats.streak = 1;
            }
            userData.userStats.lastVisit = today;
            needsSave = true;
        }
        streakCounter.textContent = `🔥 ${userData.userStats.streak}`;
        if(checkAchievements(userData) || needsSave) saveUserData();
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
            questionPool = (selectedCategory === 'all')
                ? allQuestions.filter(q => q && q.isConcurso)
                : (userData.questionBank[selectedCategory] || []).filter(q => q && q.isConcurso);
        } else {
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            document.querySelector('.concurso-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                questionPool = allQuestions;
            } else {
                questionPool = userData.questionBank[selectedCategory] || [];
            }
        }

        let availableQuestions = questionPool.filter(q => q && !userData.recentlyAsked.includes(q.id));
        
        if (availableQuestions.length === 0) {
            if (questionPool.length > 0 && (isReviewMode || isConcursoMode)) {
                let msg = isReviewMode ? 'Você revisou todas as suas questões erradas. Ótimo trabalho!' : 'Você respondeu todas as questões de concurso disponíveis.';
                flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">${msg}</div></div>`;
                return;
            }
            
            const categoryToFetch = categorySelector.value === 'all' ? 'seguridade' : categorySelector.value;
            await fetchNewQuestionsFromAI(categoryToFetch);
            return;
        }

        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        let categoryOfQuestion = 'geral';
        for (const category in userData.questionBank) {
            if (userData.questionBank[category] && userData.questionBank[category].some(q => q.id === questionData.id)) {
                categoryOfQuestion = category;
                break;
            }
        }
        currentQuestion = { ...questionData, category: categoryOfQuestion };
        
        const starIcon = currentQuestion.isConcurso ? `<span class="concurso-star" title="Questão de Concurso">⭐</span>` : '';
        const enunciadoHTML = currentQuestion.enunciado ? `<div class="enunciado-box">${currentQuestion.enunciado}</div>` : '';
        const imageHTML = currentQuestion.imageUrl ? `<img src="${currentQuestion.imageUrl}" alt="Contexto da questão" class="question-image">` : '';

        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">Nº ${sessionQuestionCount}</span>
                ${starIcon}
            </div>
            ${enunciadoHTML}
            ${imageHTML}
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
            if (isReviewMode) userData.userStats.errosRevisados = (userData.userStats.errosRevisados || 0) + 1;
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
        
        if(checkAchievements(userData)) {
            saveUserData();
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

    
    // --- FUNÇÕES DO MODO SIMULADO ---
    function startSimulado() {
        const simuladoModal = document.getElementById('simulado-modal');
        const simuladoContainer = simuladoModal.querySelector('.simulado-container');
        const simuladoResultsContainer = simuladoModal.querySelector('.simulado-results-container');
        
        const SIMULADO_QUESTION_COUNT = 20;
        const SIMULADO_DURATION_MINUTES = 30;
        let questionPool = Object.values(userData.questionBank).flat().filter(q => q && q.id);
        if (questionPool.length < SIMULADO_QUESTION_COUNT) {
            alert(`Não há questões suficientes para um simulado de ${SIMULADO_QUESTION_COUNT} itens. Gere mais questões com a IA.`);
            return;
        }
        simuladoQuestions = questionPool.sort(() => 0.5 - Math.random()).slice(0, SIMULADO_QUESTION_COUNT);
        simuladoCurrentIndex = 0;
        mainApp.style.display = 'none';
        simuladoModal.classList.remove('hidden');
        simuladoContainer.classList.remove('hidden');
        simuladoResultsContainer.classList.add('hidden');
        let timeLeft = SIMULADO_DURATION_MINUTES * 60;
        document.getElementById('simulado-timer').textContent = `Tempo: ${SIMULADO_DURATION_MINUTES}:00`;
        clearInterval(simuladoTimer);
        simuladoTimer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('simulado-timer').textContent = `Tempo: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            if (timeLeft <= 0) {
                alert("Tempo esgotado!");
                endSimulado();
            }
        }, 1000);
        displaySimuladoQuestion();
    }

    function displaySimuladoQuestion() {
        const question = simuladoQuestions[simuladoCurrentIndex];
        document.getElementById('simulado-question-container').textContent = question.question;
        document.getElementById('simulado-progress').textContent = `Questão ${simuladoCurrentIndex + 1}/${simuladoQuestions.length}`;
        const progressPercent = ((simuladoCurrentIndex + 1) / simuladoQuestions.length) * 100;
        document.getElementById('simulado-progress-bar').style.width = `${progressPercent}%`;
    }

    function handleSimuladoAnswer(userAnswer) {
        const currentSimuladoQuestion = simuladoQuestions[simuladoCurrentIndex];
        currentSimuladoQuestion.userAnswer = userAnswer;
        currentSimuladoQuestion.wasCorrect = (userAnswer === currentSimuladoQuestion.answer);
        simuladoCurrentIndex++;
        if (simuladoCurrentIndex >= simuladoQuestions.length) {
            endSimulado();
        } else {
            displaySimuladoQuestion();
        }
    }

    function endSimulado() {
        clearInterval(simuladoTimer);
        const simuladoContainer = document.querySelector('.simulado-container');
        const simuladoResultsContainer = document.querySelector('.simulado-results-container');
        simuladoContainer.classList.add('hidden');
        simuladoResultsContainer.classList.remove('hidden');
        let correctAnswers = 0;
        const newErroredIds = [];
        simuladoQuestions.forEach(q => {
            if (q.wasCorrect) correctAnswers++;
            else newErroredIds.push(q.id);
        });
        const accuracy = ((correctAnswers / simuladoQuestions.length) * 100).toFixed(1);
        document.getElementById('simulado-results-summary').innerHTML = `Você acertou <strong>${correctAnswers} de ${simuladoQuestions.length}</strong> questões (${accuracy}%)`;
        const resultsList = document.getElementById('simulado-results-list');
        resultsList.innerHTML = '';
        simuladoQuestions.forEach((q, index) => {
            const resultClass = q.wasCorrect ? 'correct' : 'incorrect';
            const icon = q.wasCorrect ? '✅' : '❌';
            resultsList.innerHTML += `<div class="result-item ${resultClass}"><div class="result-item-icon">${icon}</div><div class="result-item-details"><p><strong>Questão ${index + 1}:</strong> ${q.question}</p><p class="user-answer ${resultClass}"><strong>Sua resposta:</strong> ${q.userAnswer || 'Não respondida'}</p><p><strong>Gabarito:</strong> ${q.answer}</p></div></div>`;
        });
        
        userData.userStats.simuladosCompletos = (userData.userStats.simuladosCompletos || 0) + 1;
        userData.erroredQuestions = [...new Set([...userData.erroredQuestions, ...newErroredIds])];
        if(checkAchievements(userData)) {
            saveUserData();
        }
    }
    
    function closeResults() {
        const simuladoModal = document.getElementById('simulado-modal');
        simuladoModal.classList.add('hidden');
        mainApp.style.display = 'block';
        sessionQuestionCount = 1;
        generateFlashcard();
    }
    
    // --- FUNÇÕES DO CHAT ---
    function openChat() {
        const chatModal = document.getElementById('chat-modal');
        const chatInput = document.getElementById('chat-input');
        const chatHistoryDiv = document.getElementById('chat-history');
        chatHistory = [];
        chatHistoryDiv.innerHTML = '';
        const contextMessage = `<div class="chat-message tutor-context"><strong>Contexto:</strong> A IA irá te ajudar com base na questão que você errou. A explicação inicial é: "${currentQuestion.explanation}"</div>`;
        chatHistoryDiv.innerHTML += contextMessage;
        chatModal.classList.remove('hidden');
        chatInput.focus();
    }

    function closeChat() {
        const chatModal = document.getElementById('chat-modal');
        chatModal.classList.add('hidden');
        document.querySelector('.flashcard')?.classList.add('exiting');
        setTimeout(generateFlashcard, 600);
    }

    async function handleSendMessage() {
        const chatInput = document.getElementById('chat-input');
        const chatHistoryDiv = document.getElementById('chat-history');
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        chatHistoryDiv.innerHTML += `<div class="chat-message user">${userMessage}</div>`;
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        chatInput.value = '';
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        chatHistoryDiv.innerHTML += `<div class="chat-message ai typing-indicator">Tutor IA está digitando...</div>`;
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        try {
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: chatHistory, context: currentQuestion }) });
            if (!response.ok) throw new Error('Erro na resposta da API');
            const data = await response.json();
            const aiMessage = data.response;
            document.querySelector('.typing-indicator')?.remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">${aiMessage}</div>`;
            chatHistory.push({ role: 'model', parts: [{ text: aiMessage }] });
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        } catch (error) {
            document.querySelector('.typing-indicator')?.remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">Desculpe, ocorreu um erro. Tente novamente.</div>`;
        }
    }

    // --- FUNÇÃO DE FETCH DE NOVAS QUESTÕES ---
    async function fetchNewQuestionsFromAI(category) {
        flashcardContainer.innerHTML = `<div class="flashcard"><div class="question-text">Buscando novas questões sobre "${category}" com a IA...</div></div>`;
        try {
            const response = await fetch('/api/generate-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const newQuestion = await response.json();
            
            if (!userData.questionBank[category]) userData.questionBank[category] = [];
            newQuestion.id = `${category.substring(0,1).toUpperCase()}${Date.now()}`;
            newQuestion.category = category;
            
            userData.questionBank[category].push(newQuestion);
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

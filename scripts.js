import { allQuestionBanks } from './question-bank.js';

document.addEventListener('DOMContentLoaded', function() {
    let userData = {};
    let currentQuestion = null;
    let isReviewMode = false;
    let isConcursoMode = false; 
    let simuladoQuestions = [];
    let simuladoCurrentIndex = 0;
    let simuladoTimer;
    let chatHistory = [];

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

    function loadUserData() {
        const storedData = localStorage.getItem('inssTutorData');
        if (storedData) {
            userData = JSON.parse(storedData);
        } else {
            userData = {};
        }

        userData.questionBank = allQuestionBanks;
        userData.scores = userData.scores || { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
        userData.userStats = userData.userStats || { streak: 0, lastVisit: null };
        userData.erroredQuestions = userData.erroredQuestions || [];
        userData.recentlyAsked = userData.recentlyAsked || [];
    }

    function saveUserData() {
        localStorage.setItem('inssTutorData', JSON.stringify(userData));
    }
    
    function initializeAppLogic() {
        loadUserData();
        
        mainApp.classList.remove('hidden');
        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();

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
                localStorage.removeItem('inssTutorData');
                loadUserData();
                updateScoreboard();
                updateStreaks();
                generateFlashcard();
            }
        });
    }

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
            if (lastVisit && (new Date(today) - new Date(lastVisit) === 86400000)) {
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
        if (isReviewMode) {
            document.querySelector('.review-mode label').style.fontWeight = 'bold';
            document.querySelector('.concurso-mode label').style.fontWeight = 'normal';
            const allQuestions = Object.values(userData.questionBank).flat();
            questionPool = allQuestions.filter(q => q && userData.erroredQuestions.includes(q.id));
            if (questionPool.length === 0) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você não tem questões erradas para revisar. Desmarque o modo de revisão para continuar.</p></div>`;
                return;
            }
        } else if (isConcursoMode) {
            document.querySelector('.concurso-mode label').style.fontWeight = 'bold';
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                questionPool = Object.values(userData.questionBank).flat().filter(q => q && q.isConcurso);
            } else {
                questionPool = userData.questionBank[selectedCategory].filter(q => q && q.isConcurso);
            }

            if (questionPool.length === 0) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Não há questões de concurso nesta categoria. Tente outra.</p></div>`;
                return;
            }
        }
        else {
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
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você já viu todas as questões de concurso nesta categoria. Tente outra!</p></div>`;
                return;
            }
            flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Não há mais questões nesta categoria. Tente outra.</p></div>`;
            return;
        }
        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        currentQuestion = { ...questionData, category: questionData.category || categorySelector.value };
        const starIcon = currentQuestion.isConcurso ? `<span class="concurso-star" title="Questão de Concurso">&starf;</span>` : '';
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
        if (userData.recentlyAsked.length > 50) userData.recentlyAsked.shift();
        if (!isCorrect) {
            if (!userData.erroredQuestions.includes(currentQuestion.id)) {
                userData.erroredQuestions.push(currentQuestion.id);
            }
            if(userData.scores[currentQuestion.category]) {
              userData.scores[currentQuestion.category].incorrect++;
            }
        } else {
            if(userData.scores[currentQuestion.category]) {
              userData.scores[currentQuestion.category].correct++;
            }
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
        const SIMULADO_QUESTION_COUNT = 20;
        const SIMULADO_DURATION_MINUTES = 30;
        let questionPool = Object.values(userData.questionBank).flat().filter(q => q && q.id);
        if (questionPool.length < SIMULADO_QUESTION_COUNT) {
            alert(`Não há questões suficientes para um simulado de ${SIMULADO_QUESTION_COUNT} itens. Adicione mais questões.`);
            return;
        }
        simuladoQuestions = questionPool.sort(() => 0.5 - Math.random()).slice(0, SIMULADO_QUESTION_COUNT);
        simuladoCurrentIndex = 0;
        mainApp.classList.add('hidden');
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
        const starIcon = question.isConcurso ? ` &starf;` : '';
        document.getElementById('simulado-question-container').textContent = question.question;
        document.getElementById('simulado-progress').textContent = `Questão ${simuladoCurrentIndex + 1}/${simuladoQuestions.length}${starIcon}`;
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
        userData.erroredQuestions = [...new Set([...userData.erroredQuestions, ...newErroredIds])];
        saveUserData();
    }
    function closeResults() {
        simuladoModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
        generateFlashcard();
    }
    function openChat() {
        chatHistory = [];
        chatHistoryDiv.innerHTML = '';
        const contextMessage = `<div class="chat-message tutor-context"><strong>Contexto:</strong> A IA irá te ajudar com base na questão que você errou. A explicação inicial é: "${currentQuestion.explanation}"</div>`;
        chatHistoryDiv.innerHTML += contextMessage;
        chatModal.classList.remove('hidden');
        chatInput.focus();
    }
    function closeChat() {
        chatModal.classList.add('hidden');
        document.querySelector('.flashcard')?.classList.add('exiting');
        setTimeout(generateFlashcard, 600);
    }
    async function handleSendMessage() {
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
            document.querySelector('.typing-indicator').remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">${aiMessage}</div>`;
            chatHistory.push({ role: 'model', parts: [{ text: aiMessage }] });
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        } catch (error) {
            document.querySelector('.typing-indicator')?.remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">Desculpe, ocorreu um erro. Tente novamente.</div>`;
        }
    }
    
    initializeAppLogic();
});

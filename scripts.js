document.addEventListener('DOMContentLoaded', function() {
    // --- BANCO DE QUESTÕES INICIAL ---
    const defaultQuestionBank = {
        seguridade: [
            { id: "S001", question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' },
            { id: "S002", question: 'A pessoa jurídica em débito com o sistema da seguridade social, conforme estabelecido em lei, pode contratar com o Poder Público, mas não pode receber benefícios ou incentivos fiscais.', answer: 'Errado', explanation: 'A Constituição é clara ao vedar tanto a contratação com o Poder Público quanto o recebimento de benefícios ou incentivos fiscais ou creditícios para a pessoa jurídica em débito.', law: 'CF/88, Art. 195, § 3º' }
        ],
        constitucional: [
            { id: "C001", question: 'É plena a liberdade de associação para fins lícitos, sendo vedada a de caráter paramilitar.', answer: 'Certo', explanation: 'Exatamente o que dispõe a Constituição. A liberdade de associação é um direito fundamental, com a única ressalva expressa para associações de caráter paramilitar.', law: 'CF/88, Art. 5º, XVII' }
        ],
    };

    // --- VARIÁVEIS DE ESTADO E CARREGAMENTO DO LOCALSTORAGE ---
    let questionBank = JSON.parse(localStorage.getItem('inssQuestionBank')) || defaultQuestionBank;
    let scores = JSON.parse(localStorage.getItem('inssScores')) || { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
    let userStats = JSON.parse(localStorage.getItem('inssUserStats')) || { streak: 0, lastVisit: null };
    let erroredQuestions = JSON.parse(localStorage.getItem('inssErroredQuestions')) || [];
    let recentlyAsked = JSON.parse(localStorage.getItem('inssRecentlyAsked')) || [];
    let isReviewMode = false;
    let currentQuestion = null;
    let chatHistory = [];

    // --- SELEÇÃO DE ELEMENTOS DOM ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const streakCounter = document.getElementById('streak-counter');
    const reviewModeToggle = document.getElementById('review-mode-toggle');
    const startSimuladoBtn = document.getElementById('start-simulado-btn');
    const mainApp = document.getElementById('main-app');
    const simuladoModal = document.getElementById('simulado-modal');
    const simuladoContainer = document.querySelector('.simulado-container');
    const simuladoResultsContainer = document.querySelector('.simulado-results-container');
    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    const chatModal = document.getElementById('chat-modal');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    // --- FUNÇÕES DE INICIALIZAÇÃO E UTILITÁRIOS ---
    function initialize() {
        categorySelector.addEventListener('change', generateFlashcard);
        themeToggleBtn.addEventListener('click', toggleTheme);
        reviewModeToggle.addEventListener('change', (e) => {
            isReviewMode = e.target.checked;
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
                Object.keys(scores).forEach(category => { scores[category] = { correct: 0, incorrect: 0 }; });
                localStorage.removeItem('inssErroredQuestions');
                localStorage.removeItem('inssRecentlyAsked');
                erroredQuestions = [];
                recentlyAsked = [];
                updateScoreboard();
            }
        });

        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();
    }

    function saveDataToLocalStorage() {
        localStorage.setItem('inssQuestionBank', JSON.stringify(questionBank));
        localStorage.setItem('inssScores', JSON.stringify(scores));
        localStorage.setItem('inssUserStats', JSON.stringify(userStats));
        localStorage.setItem('inssErroredQuestions', JSON.stringify(erroredQuestions));
        localStorage.setItem('inssRecentlyAsked', JSON.stringify(recentlyAsked));
    }

    // --- MODO NOTURNO E STREAKS ---
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
        const lastVisit = userStats.lastVisit;
        if (lastVisit === today) {
        } else if (lastVisit && new Date(today) - new Date(lastVisit) === 86400000) {
            userStats.streak++;
        } else {
            userStats.streak = 1;
        }
        userStats.lastVisit = today;
        streakCounter.textContent = `🔥 ${userStats.streak}`;
        saveDataToLocalStorage();
    }
    
    // --- LÓGICA PRINCIPAL DE FLASHCARDS ---
    function updateRecentlyAsked(questionId) {
        if (!questionId) return;
        recentlyAsked.push(questionId);
        if (recentlyAsked.length > 50) recentlyAsked.shift();
        saveDataToLocalStorage();
    }

    async function generateFlashcard() {
        let questionPool;
        if (isReviewMode) {
            document.querySelector('.review-mode label').style.fontWeight = 'bold';
            const allQuestions = Object.values(questionBank).flat();
            questionPool = allQuestions.filter(q => q && erroredQuestions.includes(q.id));
            if (questionPool.length === 0) {
                flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você não tem questões erradas para revisar. Desmarque o modo de revisão para continuar.</p></div>`;
                return;
            }
        } else {
            document.querySelector('.review-mode label').style.fontWeight = 'normal';
            let selectedCategory = categorySelector.value;
            if (selectedCategory === 'all') {
                const allCategories = Object.keys(scores);
                selectedCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
            }
            questionPool = questionBank[selectedCategory] || [];
        }

        let availableQuestions = questionPool.filter(q => q && !recentlyAsked.includes(q.id));
        
        if (availableQuestions.length === 0 && questionPool.length > 0) {
            // Se todas as questões do pool foram vistas, libera as mais antigas para repetição
            recentlyAsked = recentlyAsked.slice(Math.floor(recentlyAsked.length / 2));
            availableQuestions = questionPool.filter(q => q && !recentlyAsked.includes(q.id));
        }
        
        if (availableQuestions.length === 0) {
            if (isReviewMode) {
                 flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você revisou todas as suas questões erradas. Ótimo trabalho!</p></div>`;
                 return;
            }
            flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Buscando novas questões sobre o tema com a IA...</p></div>`;
            await fetchNewQuestionsFromAI(categorySelector.value === 'all' ? 'Seguridade Social' : categorySelector.value);
            return;
        }

        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        currentQuestion = { ...questionData, category: questionData.category || categorySelector.value };
        
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `<p class="flashcard-question">${currentQuestion.question}</p><div class="flashcard-actions"><button type="button" class="btn-certo" data-choice="Certo">Certo</button><button type="button" class="btn-errado" data-choice="Errado">Errado</button></div><div class="flashcard-answer"></div>`;
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
        updateRecentlyAsked(currentQuestion.id);
        if(!isCorrect) {
            if (!erroredQuestions.includes(currentQuestion.id)) {
                erroredQuestions.push(currentQuestion.id);
            }
        }

        if (isCorrect) {
            scores[currentQuestion.category].correct++;
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
            scores[currentQuestion.category].incorrect++;
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
    
    // --- LÓGICA DO MODO SIMULADO COMPLETA ---
    let simuladoTimer;
    let simuladoQuestions = [];
    let simuladoCurrentIndex = 0;
    
    function startSimulado() {
        const SIMULADO_QUESTION_COUNT = 20;
        const SIMULADO_DURATION_MINUTES = 30;

        let questionPool = Object.values(questionBank).flat().filter(q => q && q.id);
        if (questionPool.length < SIMULADO_QUESTION_COUNT) {
            alert(`Não há questões suficientes para um simulado de ${SIMULADO_QUESTION_COUNT} itens. Gere mais questões com a IA.`);
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

        erroredQuestions = [...new Set([...erroredQuestions, ...newErroredIds])];
        saveDataToLocalStorage();
    }
    
    function closeResults() {
        simuladoModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
        generateFlashcard();
    }
    
    // --- LÓGICA DO CHAT E FETCH DE QUESTÕES ---
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
    async function fetchNewQuestionsFromAI(category) {
        if (category === 'all') category = 'Seguridade Social'; // Default para 'all'
        console.log(`Buscando nova questão de IA para: ${category}...`);
        try {
            const response = await fetch('/api/generate-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const newQuestion = await response.json();
            if (!questionBank[category]) questionBank[category] = [];
            newQuestion.id = `${category.substring(0,1).toUpperCase()}${Date.now()}`;
            questionBank[category].push(newQuestion);
            saveDataToLocalStorage();
            console.log("Nova questão recebida e salva!", newQuestion);
            setTimeout(generateFlashcard, 1000);
        } catch (error) {
            console.error("Falha ao buscar questão da IA:", error);
            setTimeout(generateFlashcard, 3000);
        }
    }
    
    function updateScoreboard() {
        scoreContainer.innerHTML = '';
        Object.keys(scores).forEach(category => {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            scoreContainer.innerHTML += `<div class="score-item"><span class="score-label">${categoryName}</span><span class="score-values"><span class="score-correct">${scores[category].correct}</span> / <span class="score-incorrect">${scores[category].incorrect}</span></span></div>`;
        });
        saveDataToLocalStorage();
    }
    
    initialize();
});
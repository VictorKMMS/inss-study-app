// --- IMPORTAÇÕES ---
import { auth, db } from './firebase-init.js';
// Remove o GoogleAuthProvider e o signInWithPopup
import { signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // --- VARIÁVEIS DE ESTADO GLOBAIS ---
    let user = null;
    let userData = {};
    const defaultQuestionBank = {
        seguridade: [
            { id: "S001", question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' },
            { id: "S002", question: 'A pessoa jurídica em débito com o sistema da seguridade social, conforme estabelecido em lei, pode contratar com o Poder Público, mas não pode receber benefícios ou incentivos fiscais.', answer: 'Errado', explanation: 'A Constituição é clara ao vedar tanto a contratação com o Poder Público quanto o recebimento de benefícios ou incentivos fiscais ou creditícios para a pessoa jurídica em débito.', law: 'CF/88, Art. 195, § 3º' }
        ],
        constitucional: [
            { id: "C001", question: 'É plena a liberdade de associação para fins lícitos, sendo vedada a de caráter paramilitar.', answer: 'Certo', explanation: 'Exatamente o que dispõe a Constituição. A liberdade de associação é um direito fundamental, com a única ressalva expressa para associações de caráter paramilitar.', law: 'CF/88, Art. 5º, XVII' }
        ],
    };
    
    // --- SELEÇÃO DE ELEMENTOS DOM ---
    const mainApp = document.getElementById('main-app');
    const loginPrompt = document.getElementById('login-prompt');
    const mainLoginBtn = document.getElementById('google-login-main-btn'); // Renomear
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    const userPic = document.getElementById('user-pic');
    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const streakCounter = document.getElementById('streak-counter');
    const reviewModeToggle = document.getElementById('review-mode-toggle');
    const startSimuladoBtn = document.getElementById('start-simulado-btn');
    const simuladoModal = document.getElementById('simulado-modal');
    const simuladoContainer = document.querySelector('.simulado-container');
    const simuladoResultsContainer = document.querySelector('.simulado-results-container');
    const chatModal = document.getElementById('chat-modal');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    // --- LÓGICA DE AUTENTICAÇÃO ---
    onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            // Se o usuário anônimo existe
            user = firebaseUser;
            userProfile.classList.remove('hidden');
            // Remove a linha que define a foto de perfil, já que não há uma
            // userPic.src = user.photoURL;
            mainApp.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
            loadUserData();
        } else {
            // Se não, faz o login anônimo
            signInAnonymously(auth).then((result) => {
                user = result.user;
                // A interface de usuário será atualizada pelo próprio onAuthStateChanged
            }).catch((error) => {
                console.error("Erro ao fazer login anônimo:", error);
            });
            user = null;
            userProfile.classList.add('hidden');
            mainApp.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }
    });

    // --- FUNÇÕES DE LOGIN/LOGOUT (RESTAURADAS) ---
    // Remove a função signInWithGoogle, pois não é mais necessária
    // async function signInWithGoogle() { ... }

    // Mantém a função de logout para que o usuário possa "zerar" a sessão
    async function logOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    }

    // --- LÓGICA DE DADOS COM FIRESTORE ---
    async function loadUserData() {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            userData = docSnap.data();
            if (!userData.scores) userData.scores = { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
            if (!userData.userStats) userData.userStats = { streak: 0, lastVisit: null };
            if (!userData.erroredQuestions) userData.erroredQuestions = [];
            if (!userData.recentlyAsked) userData.recentlyAsked = [];
            if (!userData.questionBank) userData.questionBank = defaultQuestionBank;
        } else {
            userData = {
                questionBank: defaultQuestionBank,
                scores: { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } },
                userStats: { streak: 0, lastVisit: null },
                erroredQuestions: [],
                recentlyAsked: [],
                createdAt: serverTimestamp()
            };
        }
        initializeAppLogic();
    }

    async function saveUserData() {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userDocRef, userData, { merge: true });
        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
        }
    }
    
    // --- LÓGICA DO APLICATIVO DE ESTUDOS (INICIALIZADOR) ---
    function initializeAppLogic() {
        let currentQuestion = null;
        let chatHistory = [];
        let simuladoTimer;
        let simuladoQuestions = [];
        let simuladoCurrentIndex = 0;
        let isReviewMode = false;
        
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
                userData.scores = { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
                userData.erroredQuestions = [];
                userData.recentlyAsked = [];
                saveUserData();
                updateScoreboard();
            }
        });

        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();

        // --- DEFINIÇÃO DE TODAS AS FUNÇÕES DE ESTUDO ---
        function checkTheme() { /* ... */ }
        function toggleTheme() { /* ... */ }
        function updateStreaks() { /* ... */ }
        async function generateFlashcard() { /* ... */ }
        function checkAnswer(event) { /* ... */ }
        function updateScoreboard() { /* ... */ }
        function startSimulado() { /* ... */ }
        function displaySimuladoQuestion() { /* ... */ }
        function handleSimuladoAnswer(userAnswer) { /* ... */ }
        function endSimulado() { /* ... */ }
        function closeResults() { /* ... */ }
        function openChat() { /* ... */ }
        function closeChat() { /* ... */ }
        async function handleSendMessage() { /* ... */ }
        async function fetchNewQuestionsFromAI(category) { /* ... */ }

        // COLE A IMPLEMENTAÇÃO COMPLETA DAS FUNÇÕES ACIMA AQUI
        // (Para manter a legibilidade, o código completo está abaixo)

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
            if (isReviewMode) {
                document.querySelector('.review-mode label').style.fontWeight = 'bold';
                const allQuestions = Object.values(userData.questionBank).flat();
                questionPool = allQuestions.filter(q => q && userData.erroredQuestions.includes(q.id));
                if (questionPool.length === 0) {
                    flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Você não tem questões erradas para revisar. Desmarque o modo de revisão para continuar.</p></div>`;
                    return;
                }
            } else {
                document.querySelector('.review-mode label').style.fontWeight = 'normal';
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
            userData.recentlyAsked.push(currentQuestion.id);
            if (userData.recentlyAsked.length > 50) userData.recentlyAsked.shift();
            if (!isCorrect) {
                if (!userData.erroredQuestions.includes(currentQuestion.id)) {
                    userData.erroredQuestions.push(currentQuestion.id);
                }
                userData.scores[currentQuestion.category].incorrect++;
            } else {
                userData.scores[currentQuestion.category].correct++;
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
        async function fetchNewQuestionsFromAI(category) {
            if (category === 'all') category = 'Seguridade Social';
            console.log(`Buscando nova questão de IA para: ${category}...`);
            try {
                const response = await fetch('/api/generate-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) });
                if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
                const newQuestion = await response.json();
                if (!userData.questionBank[category]) userData.questionBank[category] = [];
                newQuestion.id = `${category.substring(0, 1).toUpperCase()}${Date.now()}`;
                newQuestion.category = category;
                userData.questionBank[category].push(newQuestion);
                saveUserData();
                console.log("Nova questão recebida e salva!", newQuestion);
                setTimeout(generateFlashcard, 1000);
            } catch (error) {
                console.error("Falha ao buscar questão da IA:", error);
                setTimeout(generateFlashcard, 3000);
            }
        }
    }
    
    // Altera o evento do botão de login principal
    // mainLoginBtn.addEventListener('click', signInAnonymously);
    // Não precisa de um evento, pois o login anônimo é automático
    logoutBtn.addEventListener('click', logOut);
});

// --- IMPORTAÇÕES ---
import { auth, db } from './firebase-init.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // --- VARIÁVEIS DE ESTADO GLOBAIS ---
    let user = null;
    let userData = {}; // Objeto único que guarda TODO o progresso do usuário.
    const defaultQuestionBank = { /* ... seu banco de questões inicial ... */ };
    let currentQuestion = null;
    let chatHistory = [];
    let simuladoTimer;
    let simuladoQuestions = [];
    let simuladoCurrentIndex = 0;
    
    // --- SELEÇÃO DE ELEMENTOS DOM ---
    // (seleciona todos os seus elementos HTML aqui, ex: mainApp, loginPrompt, etc.)
    const mainApp = document.getElementById('main-app');
    const loginPrompt = document.getElementById('login-prompt');
    const mainLoginBtn = document.getElementById('google-login-main-btn');
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
            user = firebaseUser;
            userProfile.classList.remove('hidden');
            userPic.src = user.photoURL;
            mainApp.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
            loadUserData();
        } else {
            user = null;
            userProfile.classList.add('hidden');
            mainApp.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }
    });

    async function signInWithGoogle() { /* ... igual à versão anterior ... */ }
    async function logOut() { /* ... igual à versão anterior ... */ }

    // --- LÓGICA DE DADOS COM FIRESTORE ---
    async function loadUserData() {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
            // Garante que todos os campos existam para evitar erros
            if (!userData.scores) userData.scores = { /* ... scores zerados ... */ };
            if (!userData.userStats) userData.userStats = { streak: 0, lastVisit: null };
            // etc.
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
            await setDoc(userDocRef, userData, { merge: true }); // Usamos 'merge: true' para não sobrescrever dados se outra aba estiver aberta
        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
        }
    }

    // --- LÓGICA DO APLICATIVO DE ESTUDOS ---
    // Agora, todas as funções de estudo vivem aqui dentro e usam o objeto `userData`.
    function initializeAppLogic() {
        let isReviewMode = false;

        // Adiciona todos os event listeners
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
                // Reseta os dados no objeto userData
                userData.scores = { /* ... scores zerados ... */ };
                userData.erroredQuestions = [];
                userData.recentlyAsked = [];
                saveUserData(); // Salva as alterações na nuvem
                updateScoreboard(); // Atualiza a UI
            }
        });

        // Executa as funções iniciais
        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();

        // --- DEFINIÇÃO DE TODAS AS FUNÇÕES DE ESTUDO ---
        // Elas agora leem e escrevem em `userData` e chamam `saveUserData()`
        
        function checkTheme() { /* ... igual à versão anterior, mas usando localStorage para o tema, pois é preferência do dispositivo */ }
        function toggleTheme() { /* ... igual à versão anterior ... */ }

        function updateStreaks() {
            const today = new Date().toISOString().split('T')[0];
            const lastVisit = userData.userStats.lastVisit;
            if (lastVisit === today) {
            } else if (lastVisit && new Date(today) - new Date(lastVisit) === 86400000) {
                userData.userStats.streak++;
            } else {
                userData.userStats.streak = 1;
            }
            userData.userStats.lastVisit = today;
            streakCounter.textContent = `🔥 ${userData.userStats.streak}`;
            saveUserData();
        }
        
        async function generateFlashcard() {
            // Esta função agora deve usar `userData.questionBank`, `userData.erroredQuestions`, etc.
            // Exemplo:
            let questionPool;
            if (isReviewMode) {
                const allQuestions = Object.values(userData.questionBank).flat();
                questionPool = allQuestions.filter(q => q && userData.erroredQuestions.includes(q.id));
                // ... resto da lógica ...
            } else {
                // ... resto da lógica ...
            }
            // ... Toda a lógica de generateFlashcard vai aqui ...
        }
        
        function checkAnswer(event) {
            const userChoice = event.target.dataset.choice;
            const isCorrect = userChoice === currentQuestion.answer;

            // Adiciona à lista de recentes
            userData.recentlyAsked.push(currentQuestion.id);
            if(userData.recentlyAsked.length > 50) userData.recentlyAsked.shift();
            
            if (!isCorrect) {
                // Adiciona à lista de erros (sem duplicatas)
                if (!userData.erroredQuestions.includes(currentQuestion.id)) {
                    userData.erroredQuestions.push(currentQuestion.id);
                }
                userData.scores[currentQuestion.category].incorrect++;
            } else {
                userData.scores[currentQuestion.category].correct++;
            }
            
            updateScoreboard(); // Atualiza a UI do placar
            saveUserData(); // SALVA TUDO NA NUVEM!

            // ... O resto da lógica para mostrar a resposta e os botões (Próximo/Chat) vai aqui ...
        }

        function updateScoreboard() {
            if (!scoreContainer || !userData.scores) return;
            scoreContainer.innerHTML = '';
            Object.keys(userData.scores).forEach(category => {
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                scoreContainer.innerHTML += `<div class="score-item"><span class="score-label">${categoryName}</span><span class="score-values"><span class="score-correct">${userData.scores[category].correct}</span> / <span class="score-incorrect">${userData.scores[category].incorrect}</span></span></div>`;
            });
        }

        // Mova TODAS as outras funções (startSimulado, handleSimuladoAnswer, openChat, fetchNewQuestionsFromAI, etc.)
        // para dentro deste escopo `initializeAppLogic`, garantindo que elas modifiquem `userData` e chamem `saveUserData()`
        // quando necessário.
    }

    // Eventos de Login/Logout
    mainLoginBtn.addEventListener('click', signInWithGoogle);
    logoutBtn.addEventListener('click', logOut);
});

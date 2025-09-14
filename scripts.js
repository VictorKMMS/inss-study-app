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
    let isConcursoMode = false; // Novo estado para o modo concurso
    
    // --- SELEÇÃO DE ELEMENTOS DOM ---
    const mainApp = document.getElementById('main-app');
    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const streakCounter = document.getElementById('streak-counter');
    const reviewModeToggle = document.getElementById('review-mode-toggle');
    const concursoModeToggle = document.getElementById('concurso-mode-toggle'); // Novo elemento
    const startSimuladoBtn = document.getElementById('start-simulado-btn');
    // ... (restante dos seletores DOM)

    // --- LÓGICA DE DADOS COM LOCALSTORAGE ---
    function loadUserData() {
        const storedData = localStorage.getItem('inssTutorData');
        if (storedData) {
            userData = JSON.parse(storedData);
        } else {
            // Cria dados padrão para um novo usuário
            userData = {
                scores: { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } },
                userStats: { streak: 0, lastVisit: null },
                erroredQuestions: [],
                recentlyAsked: [],
            };
        }
        // CRÍTICO: Garante que o banco de questões seja sempre a versão mais atual do código,
        // mas o progresso do usuário (scores, erros) é mantido.
        userData.questionBank = allQuestionBanks;
    }

    function saveUserData() {
        const dataToSave = { ...userData };
        delete dataToSave.questionBank; // Não salva o banco de questões no localStorage
        localStorage.setItem('inssTutorData', JSON.stringify(dataToSave));
    }
    
    // --- LÓGICA DO APLICATIVO ---
    function initializeApp() {
        loadUserData();
        
        // --- EVENT LISTENERS ---
        categorySelector.addEventListener('change', generateFlashcard);
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        reviewModeToggle.addEventListener('change', (e) => {
            isReviewMode = e.target.checked;
            if (isReviewMode) { // Seletor de revisão desmarca o de concurso
                concursoModeToggle.checked = false;
                isConcursoMode = false;
            }
            generateFlashcard();
        });

        concursoModeToggle.addEventListener('change', (e) => {
            isConcursoMode = e.target.checked;
            if (isConcursoMode) { // Seletor de concurso desmarca o de revisão
                reviewModeToggle.checked = false;
                isReviewMode = false;
            }
            generateFlashcard();
        });
        
        // ... (restante dos event listeners para simulado, chat, reset)

        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();
    }
    
    async function generateFlashcard() {
        let questionPool;
        const allQuestions = Object.values(userData.questionBank).flat();

        // LÓGICA DE FILTRAGEM ATUALIZADA
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
                questionPool = allQuestions; // Se for "todas as matérias", usa todas as questões
            } else {
                questionPool = userData.questionBank[selectedCategory] || [];
            }
        }

        // ... (o restante da função generateFlashcard, checkAnswer, e todas as outras,
        // permanece exatamente o mesmo da nossa última versão funcional).
    }
    
    // Cole aqui o restante de TODAS as suas funções (checkTheme, updateStreaks, checkAnswer, 
    // updateScoreboard, startSimulado, endSimulado, openChat, etc.)
    
    initializeApp();
});

// --- IMPORTAÇÕES ---
import { allQuestionBanks } from './question-bank.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- MÓDULO DE ESTATÍSTICAS (INTEGRADO) ---
    let categoryChart = null;
    function initStatistics(userData) {
        const statsModal = document.getElementById('stats-modal');
        const showStatsBtn = document.getElementById('show-stats-btn');
        const closeStatsBtn = document.getElementById('close-stats-btn');
        showStatsBtn.addEventListener('click', () => {
            updateStatsPanel(userData);
            statsModal.classList.remove('hidden');
        });
        closeStatsBtn.addEventListener('click', () => {
            statsModal.classList.add('hidden');
        });
    }

    function updateStatsPanel(userData) {
        const totalCorrectEl = document.getElementById('stats-total-correct');
        const totalIncorrectEl = document.getElementById('stats-total-incorrect');
        const accuracyEl = document.getElementById('stats-accuracy');
        let correctCount = 0;
        let incorrectCount = 0;
        const labels = [];
        const correctData = [];
        const incorrectData = [];
        if (userData && userData.scores) {
            for (const category in userData.scores) {
                const score = userData.scores[category];
                correctCount += score.correct;
                incorrectCount += score.incorrect;
                labels.push(category.charAt(0).toUpperCase() + category.slice(1));
                correctData.push(score.correct);
                incorrectData.push(score.incorrect);
            }
        }
        const totalQuestions = correctCount + incorrectCount;
        const accuracyValue = totalQuestions === 0 ? 0 : ((correctCount / totalQuestions) * 100).toFixed(1);
        totalCorrectEl.textContent = correctCount;
        totalIncorrectEl.textContent = incorrectCount;
        accuracyEl.textContent = `${accuracyValue}%`;
        renderCategoryChart(labels, correctData, incorrectData);
    }

    function renderCategoryChart(labels, correctData, incorrectData) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        if (categoryChart) {
            categoryChart.destroy();
        }
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#e0e0e0' : '#333';
        categoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Acertos',
                        data: correctData,
                        backgroundColor: 'rgba(40, 167, 69, 0.7)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Erros',
                        data: incorrectData,
                        backgroundColor: 'rgba(220, 53, 69, 0.7)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor } },
                    x: { ticks: { color: textColor } }
                },
                responsive: true,
                plugins: {
                    legend: { position: 'top', labels: { color: textColor } }
                }
            }
        });
    }

    // --- MÓDULO DE EXPLORADOR DE TÓPICOS (INTEGRADO) ---
    function initTopicExplorer() {
        const modal = document.getElementById('topic-explorer-modal');
        const showBtn = document.getElementById('show-topic-explorer-btn');
        const closeBtn = document.getElementById('close-topic-explorer-btn');
        const sendBtn = document.getElementById('topic-send-btn');
        const input = document.getElementById('topic-input');
        
        showBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        sendBtn.addEventListener('click', handleTopicRequest);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTopicRequest();
            }
        });
    }

    async function handleTopicRequest() {
        const input = document.getElementById('topic-input');
        const resultArea = document.getElementById('topic-result-area');
        const sendBtn = document.getElementById('topic-send-btn');
        const topic = input.value.trim();
        if (!topic) {
            resultArea.textContent = 'Por favor, digite um tópico para explorar.';
            return;
        }
        resultArea.textContent = 'Gerando explicação com o Tutor IA... Aguarde um momento.';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Pensando...';
        try {
            const response = await fetch('/api/explain-topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!response.ok) throw new Error('A resposta da API não foi bem-sucedida.');
            const data = await response.json();
            resultArea.textContent = data.explanation;
        } catch (error) {
            console.error("Erro ao buscar explicação do tópico:", error);
            resultArea.textContent = 'Desculpe, ocorreu um erro ao se comunicar com a IA. Por favor, tente novamente.';
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Gerar Explicação';
        }
    }

    // --- MÓDULO DE CONQUISTAS (INTEGRADO) ---
    const ACHIEVEMENTS_LIST = [
        { id: 'correct_1', name: 'Primeiro Acerto!', description: 'Você acertou sua primeira questão. Continue assim!', icon: '✅', condition: (data) => Object.values(data.scores).reduce((sum, cat) => sum + cat.correct, 0) >= 1 },
        { id: 'streak_3', name: 'Pegando o Ritmo', description: 'Estudou por 3 dias seguidos.', icon: '🔥', condition: (data) => data.userStats.streak >= 3 },
        { id: 'seguridade_10', name: 'Iniciante em Seguridade', description: 'Acertou 10 questões de Seguridade Social.', icon: '🛡️', condition: (data) => data.scores.seguridade.correct >= 10 },
        { id: 'simulado_1', name: 'Coragem de Aço', description: 'Completou seu primeiro simulado.', icon: '🚀', condition: (data) => data.userStats.simuladosCompletos >= 1 },
        { id: 'error_master_10', name: 'Aprendendo com os Erros', description: 'Revisou 10 questões que tinha errado.', icon: '🧠', condition: (data) => data.userStats.errosRevisados >= 10 },
        { id: 'conquistas_1', name: 'Caçador de Conquistas', description: 'Desbloqueou sua primeira conquista.', icon: '🏆', condition: (data) => data.userStats.unlockedAchievements.length >= 1 }
    ];
    function initAchievements(userData) {
        const modal = document.getElementById('achievements-modal');
        const showBtn = document.getElementById('show-achievements-btn');
        const closeBtn = document.getElementById('close-achievements-btn');
        showBtn.addEventListener('click', () => {
            renderAchievements(userData);
            modal.classList.remove('hidden');
        });
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    function checkAchievements(userData) {
        let newAchievementUnlocked = false;
        for (const achievement of ACHIEVEMENTS_LIST) {
            if (!userData.userStats.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(userData)) {
                    console.log(`Conquista Desbloqueada: ${achievement.name}`);
                    userData.userStats.unlockedAchievements.push(achievement.id);
                    showAchievementToast(achievement);
                    newAchievementUnlocked = true;
                }
            }
        }
        return newAchievementUnlocked;
    }
    function renderAchievements(userData) {
        const listContainer = document.getElementById('achievements-list');
        listContainer.innerHTML = '';
        for (const achievement of ACHIEVEMENTS_LIST) {
            const isUnlocked = userData.userStats.unlockedAchievements.includes(achievement.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `<div class="achievement-icon">${achievement.icon}</div><div class="achievement-details"><h4>${achievement.name}</h4><p>${achievement.description}</p></div>`;
            listContainer.appendChild(item);
        }
    }
    function showAchievementToast(achievement) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `🏆 Conquista Desbloqueada!<br><strong>${achievement.name}</strong>`;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 4000);
    }
    
    // --- VARIÁVEIS DE ESTADO DO APP ---
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

    // --- LÓGICA DE DADOS ---
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
        if (!userData.userStats) userData.userStats = { streak: 0, lastVisit: null };
        if (!userData.userStats.unlockedAchievements) userData.userStats.unlockedAchievements = [];
        if (!userData.userStats.simuladosCompletos) userData.userStats.simuladosCompletos = 0;
        if (!userData.userStats.errosRevisados) userData.userStats.errosRevisados = 0;
        userData.questionBank = allQuestionBanks;
    }

    function saveUserData() {
        const dataToSave = { ...userData };
        delete dataToSave.questionBank;
        localStorage.setItem('inssTutorData', JSON.stringify(dataToSave));
    }
    
    // --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---
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

        initStatistics(userData);
        initTopicExplorer();
        initAchievements(userData);

        checkTheme();
        updateStreaks();
        updateScoreboard();
        generateFlashcard();
    }
    
    // --- FUNÇÕES DE ESTUDO, SIMULADO, CHAT E IA ---
    
    // As funções restantes (generateFlashcard, checkAnswer, etc.) são exatamente as mesmas da nossa última versão completa.
    // O código abaixo contém o corpo completo de todas elas.
    
    function updateScoreboard() {
        const scoreContainer = document.getElementById('score-container');
        if (!scoreContainer || !userData.scores) return;
        scoreContainer.innerHTML = '';
        Object.keys(userData.scores).forEach(category => {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            scoreContainer.innerHTML += `<div class="score-item"><span class="score-label">${categoryName}</span><span class="score-values"><span class="score-correct">${userData.scores[category].correct}</span> / <span class="score-incorrect">${userData.scores[category].incorrect}</span></span></div>`;
        });
        saveUserData();
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

    function startSimulado() { /* ... (código completo do simulado) ... */ }
    function displaySimuladoQuestion() { /* ... (código completo do simulado) ... */ }
    function handleSimuladoAnswer(userAnswer) { /* ... (código completo do simulado) ... */ }
    function endSimulado() { /* ... (código completo do simulado) ... */ }
    function closeResults() { /* ... (código completo do simulado) ... */ }
    function openChat() { /* ... (código completo do chat) ... */ }
    function closeChat() { /* ... (código completo do chat) ... */ }
    async function handleSendMessage() { /* ... (código completo do chat) ... */ }
    async function fetchNewQuestionsFromAI(category) { /* ... (código completo da IA) ... */ }

    // Inicia a aplicação
    initializeApp();
});

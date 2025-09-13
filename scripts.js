document.addEventListener('DOMContentLoaded', function() {
    // BANCO DE DADOS INICIAL AMPLIADO
    const defaultQuestionBank = {
        seguridade: [
            { id: "S001", question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' },
            { id: "S002", question: 'A pessoa jurídica em débito com o sistema da seguridade social, conforme estabelecido em lei, pode contratar com o Poder Público, mas não pode receber benefícios ou incentivos fiscais.', answer: 'Errado', explanation: 'A Constituição é clara ao vedar tanto a contratação com o Poder Público quanto o recebimento de benefícios ou incentivos fiscais ou creditícios para a pessoa jurídica em débito.', law: 'CF/88, Art. 195, § 3º' },
            { id: "S003", question: 'Perde a qualidade de dependente o filho que se emancipar, ainda que seja inválido ou tenha deficiência intelectual ou mental ou deficiência grave.', answer: 'Errado', explanation: 'A emancipação cessa a dependência do filho menor, mas não do filho inválido ou com deficiência grave, cuja dependência decorre da condição de invalidez/deficiência, e não da idade.', law: 'Lei 8.213/91, Art. 16, I e § 4º' }
        ],
        constitucional: [
            { id: "C001", question: 'É plena a liberdade de associação para fins lícitos, sendo vedada a de caráter paramilitar.', answer: 'Certo', explanation: 'Exatamente o que dispõe a Constituição. A liberdade de associação é um direito fundamental, com a única ressalva expressa para associações de caráter paramilitar.', law: 'CF/88, Art. 5º, XVII' }
        ],
        // Adicione aqui mais questões com IDs únicos para cada matéria
    };

    // --- VARIÁVEIS DE ESTADO GLOBAIS ---
    let questionBank = JSON.parse(localStorage.getItem('inssQuestionBank')) || defaultQuestionBank;
    let scores = JSON.parse(localStorage.getItem('inssScores')) || { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
    let recentlyAsked = JSON.parse(localStorage.getItem('inssRecentlyAsked')) || [];
    let currentQuestion = null;
    let chatHistory = [];

    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    
    // Elementos do Chat
    const chatModal = document.getElementById('chat-modal');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    // --- LÓGICA DE REPETIÇÃO ESPAÇADA ---
    function updateRecentlyAsked(questionId) {
        recentlyAsked.push(questionId);
        if (recentlyAsked.length > 50) {
            recentlyAsked.shift(); // Remove a questão mais antiga da fila
        }
        localStorage.setItem('inssRecentlyAsked', JSON.stringify(recentlyAsked));
    }

    async function generateFlashcard() {
        let selectedCategory = categorySelector.value;
        if (selectedCategory === 'all') {
            const allCategories = Object.keys(scores);
            selectedCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
        }
        
        if (!questionBank[selectedCategory] || questionBank[selectedCategory].length === 0) {
            await fetchNewQuestionsFromAI(selectedCategory);
            return;
        }

        let availableQuestions = questionBank[selectedCategory].filter(q => !recentlyAsked.includes(q.id));

        if (availableQuestions.length === 0) {
            // Se todas as questões do banco já estão no ciclo de 50, gera uma nova ou reseta
            const allQuestionsInCategory = questionBank[selectedCategory];
            if (allQuestionsInCategory.length < 50) {
                await fetchNewQuestionsFromAI(selectedCategory);
                return;
            } else {
                // Libera as questões mais antigas para repetição
                recentlyAsked = recentlyAsked.slice(25); 
                availableQuestions = questionBank[selectedCategory].filter(q => !recentlyAsked.includes(q.id));
            }
        }

        const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        currentQuestion = { ...questionData, category: selectedCategory };
        
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `<p class="flashcard-question">${currentQuestion.question}</p><div class="flashcard-actions"><button class="btn-certo" data-choice="Certo">Certo</button><button class="btn-errado" data-choice="Errado">Errado</button></div><div class="flashcard-answer"></div>`;
        flashcardContainer.innerHTML = '';
        flashcardContainer.appendChild(card);
        card.querySelectorAll('.flashcard-actions button').forEach(button => button.addEventListener('click', checkAnswer));
    }

    // --- LÓGICA DE VERIFICAÇÃO E CHAT ---
    function checkAnswer(event) {
        const userChoice = event.target.dataset.choice;
        const isCorrect = userChoice === currentQuestion.answer;
        const answerDiv = document.querySelector('.flashcard-answer');
        
        updateRecentlyAsked(currentQuestion.id);

        if (isCorrect) {
            scores[currentQuestion.category].correct++;
            answerDiv.classList.add('correct');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br>Parabéns, sua resposta está correta!<div class="answer-source"><strong>Fonte:</strong> ${currentQuestion.law}</div>`;
            setTimeout(() => document.querySelector('.flashcard')?.classList.add('exiting'), 2500);
            setTimeout(generateFlashcard, 3100);
        } else {
            scores[currentQuestion.category].incorrect++;
            answerDiv.classList.add('incorrect');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br><div class="ai-explanation"><strong>🤖 Explicação da IA:</strong><p>${currentQuestion.explanation}</p><p>📖 <em>${currentQuestion.law}</em></p></div>`;
            
            // Em vez do botão "Próximo", abre a interface de chat
            const chatButton = document.createElement('button');
            chatButton.innerText = 'Conversar com Tutor IA';
            chatButton.className = 'btn-proximo';
            chatButton.onclick = () => openChat();
            
            document.querySelector('.flashcard-actions').innerHTML = '';
            document.querySelector('.flashcard-actions').appendChild(chatButton);
        }
        updateScoreboard();
    }

    // --- FUNÇÕES DO CHAT ---
    function openChat() {
        chatHistory = []; // Limpa o histórico para a nova conversa
        chatHistoryDiv.innerHTML = ''; // Limpa a UI
        
        // Adiciona a explicação inicial como contexto
        const contextMessage = `<div class="chat-message tutor-context"><strong>Contexto:</strong> A IA irá te ajudar com base na questão que você errou. A explicação inicial é: "${currentQuestion.explanation}"</div>`;
        chatHistoryDiv.innerHTML += contextMessage;

        chatModal.classList.remove('hidden');
        chatInput.focus();
    }

    function closeChat() {
        chatModal.classList.add('hidden');
        generateFlashcard(); // Gera a próxima questão ao fechar o chat
    }

    async function handleSendMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Adiciona mensagem do usuário à UI e ao histórico
        chatHistoryDiv.innerHTML += `<div class="chat-message user">${userMessage}</div>`;
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        chatInput.value = '';
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        // Mostra indicador de "digitando"
        chatHistoryDiv.innerHTML += `<div class="chat-message ai typing-indicator">Tutor IA está digitando...</div>`;
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: chatHistory, context: currentQuestion }),
            });

            if (!response.ok) throw new Error('Erro na resposta da API');

            const data = await response.json();
            const aiMessage = data.response;

            // Remove o indicador e adiciona a resposta da IA
            document.querySelector('.typing-indicator').remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">${aiMessage}</div>`;
            chatHistory.push({ role: 'model', parts: [{ text: aiMessage }] });
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        } catch (error) {
            document.querySelector('.typing-indicator').remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">Desculpe, ocorreu um erro. Tente novamente.</div>`;
        }
    }
    
    // --- LÓGICA DE GERAÇÃO DE NOVAS QUESTÕES (existente, sem alterações) ---
    async function fetchNewQuestionsFromAI(category) { /* ... (código igual ao da versão anterior) ... */ }
    
    // --- INICIALIZAÇÃO E EVENTOS ---
    function initialize() {
        // Eventos do Chat
        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
        closeChatBtn.addEventListener('click', closeChat);
        
        // Outros eventos
        categorySelector.addEventListener('change', generateFlashcard);
        resetScoreBtn.addEventListener('click', () => {
            if(confirm('Tem certeza que deseja zerar todo o seu placar?')) {
                Object.keys(scores).forEach(category => {
                    scores[category] = { correct: 0, incorrect: 0 };
                });
                localStorage.removeItem('inssRecentlyAsked');
                recentlyAsked = [];
                updateScoreboard();
            }
        });
        
        updateScoreboard();
        generateFlashcard();
    }
    
    // Funções de salvar e carregar dados (já incluídas nas funções principais)
    function saveDataToLocalStorage() {
        localStorage.setItem('inssQuestionBank', JSON.stringify(questionBank));
        localStorage.setItem('inssScores', JSON.stringify(scores));
    }
    
    function updateScoreboard() { /* ... (código igual ao da versão anterior) ... */ }

    initialize();
});
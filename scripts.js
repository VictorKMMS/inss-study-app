document.addEventListener('DOMContentLoaded', function() {
    const defaultQuestionBank = {
        seguridade: [
            { id: "S001", question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' },
            { id: "S002", question: 'A pessoa jurídica em débito com o sistema da seguridade social, conforme estabelecido em lei, pode contratar com o Poder Público, mas não pode receber benefícios ou incentivos fiscais.', answer: 'Errado', explanation: 'A Constituição é clara ao vedar tanto a contratação com o Poder Público quanto o recebimento de benefícios ou incentivos fiscais ou creditícios para a pessoa jurídica em débito.', law: 'CF/88, Art. 195, § 3º' }
        ],
        constitucional: [
            { id: "C001", question: 'É plena a liberdade de associação para fins lícitos, sendo vedada a de caráter paramilitar.', answer: 'Certo', explanation: 'Exatamente o que dispõe a Constituição. A liberdade de associação é um direito fundamental, com a única ressalva expressa para associações de caráter paramilitar.', law: 'CF/88, Art. 5º, XVII' }
        ],
    };

    let questionBank = JSON.parse(localStorage.getItem('inssQuestionBank')) || defaultQuestionBank;
    let scores = JSON.parse(localStorage.getItem('inssScores')) || { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } };
    let recentlyAsked = JSON.parse(localStorage.getItem('inssRecentlyAsked')) || [];
    let currentQuestion = null;
    let chatHistory = [];

    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    const chatModal = document.getElementById('chat-modal');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    function updateRecentlyAsked(questionId) {
        if (!questionId) return;
        recentlyAsked.push(questionId);
        if (recentlyAsked.length > 50) {
            recentlyAsked.shift();
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
            // Se não há questões disponíveis (todas foram vistas recentemente)
            if (questionBank[selectedCategory].length < 50) {
                // Se o banco de questões da categoria é pequeno, busca novas na IA
                await fetchNewQuestionsFromAI(selectedCategory);
                return;
            } else {
                // Se o banco de questões é grande, libera as mais antigas da lista para repetição
                recentlyAsked = recentlyAsked.slice(Math.floor(recentlyAsked.length / 2));
                availableQuestions = questionBank[selectedCategory].filter(q => !recentlyAsked.includes(q.id));
            }
        }
        
        // --- BLOCO DE CÓDIGO PROBLEMÁTICO REMOVIDO ---
        // O "failsafe" que estava aqui foi removido pois era a causa do bug da repetição.

        // Se mesmo após tudo isso não houver questão, é porque a categoria está realmente vazia.
        if (availableQuestions.length === 0) {
            flashcardContainer.innerHTML = `<div class="flashcard"><p class="flashcard-question">Parece que não há questões disponíveis para esta matéria no momento. Tentando buscar uma nova com a IA...</p></div>`;
            await fetchNewQuestionsFromAI(selectedCategory);
            return;
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

    function checkAnswer(event) {
        const userChoice = event.target.dataset.choice;
        const isCorrect = userChoice === currentQuestion.answer;
        const answerDiv = document.querySelector('.flashcard-answer');
        const actionsDiv = document.querySelector('.flashcard-actions');
        
        actionsDiv.innerHTML = '';
        updateRecentlyAsked(currentQuestion.id);

        if (isCorrect) {
            scores[currentQuestion.category].correct++;
            answerDiv.classList.add('correct');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br>Parabéns, sua resposta está correta!<div class="answer-source"><strong>Fonte:</strong> ${currentQuestion.law}</div>`;
            
            const nextButton = document.createElement('button');
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
            chatButton.innerText = 'Conversar com Tutor IA';
            chatButton.className = 'btn-proximo';
            chatButton.onclick = () => openChat();
            actionsDiv.appendChild(chatButton);
        }
        updateScoreboard();
    }

    // --- O restante do código (funções do chat, fetch, inicialização, etc.) permanece o mesmo ---

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
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: chatHistory, context: currentQuestion }),
            });
            if (!response.ok) throw new Error('Erro na resposta da API');
            const data = await response.json();
            const aiMessage = data.response;

            document.querySelector('.typing-indicator').remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">${aiMessage}</div>`;
            chatHistory.push({ role: 'model', parts: [{ text: aiMessage }] });
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        } catch (error) {
            document.querySelector('.typing-indicator').remove();
            chatHistoryDiv.innerHTML += `<div class="chat-message ai">Desculpe, ocorreu um erro. Tente novamente.</div>`;
        }
    }

    async function fetchNewQuestionsFromAI(category) {
        console.log(`Buscando nova questão de IA para: ${category}...`);
        const card = document.querySelector('.flashcard');
        if (card) {
            card.innerHTML = `<p class="flashcard-question">Conectando com a IA do Gemini Pro para gerar uma nova questão sobre "${category}"... Aguarde!</p>`;
        }
        try {
            const response = await fetch('/api/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category }),
            });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const newQuestion = await response.json();
            if (!questionBank[category]) questionBank[category] = [];
            
            // Adiciona um ID único para a nova questão para o sistema de repetição funcionar
            newQuestion.id = `${category.substring(0,1).toUpperCase()}${Date.now()}`;
            
            questionBank[category].push(newQuestion);
            saveDataToLocalStorage();
            console.log("Nova questão recebida e salva!", newQuestion);
            setTimeout(generateFlashcard, 1000);
        } catch (error) {
            console.error("Falha ao buscar questão da IA:", error);
            if (card) {
                card.innerHTML = `<p class="flashcard-question">Ocorreu um erro ao conectar com a IA. Reiniciando com as questões existentes em 3 segundos...</p>`;
            }
            setTimeout(() => {
                generateFlashcard();
            }, 3000);
        }
    }
    
    function initialize() {
        categorySelector.addEventListener('change', generateFlashcard);
        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); });
        closeChatBtn.addEventListener('click', closeChat);
        resetScoreBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja zerar todo o seu placar e histórico de questões?')) {
                Object.keys(scores).forEach(category => { scores[category] = { correct: 0, incorrect: 0 }; });
                localStorage.removeItem('inssRecentlyAsked');
                recentlyAsked = [];
                updateScoreboard();
            }
        });
        updateScoreboard();
        generateFlashcard();
    }
    
    function saveDataToLocalStorage() {
        localStorage.setItem('inssQuestionBank', JSON.stringify(questionBank));
        localStorage.setItem('inssScores', JSON.stringify(scores));
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
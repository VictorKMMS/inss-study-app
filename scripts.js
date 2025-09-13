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
            if (questionBank[selectedCategory].length < 50) {
                await fetchNewQuestionsFromAI(selectedCategory);
                return;
            } else {
                recentlyAsked = recentlyAsked.slice(Math.floor(recentlyAsked.length / 2));
                availableQuestions = questionBank[selectedCategory].filter(q => !recentlyAsked.includes(q.id));
            }
        }
        
        if(availableQuestions.length === 0) {
            // Failsafe in case all questions are somehow still in the recently asked list
            availableQuestions = questionBank[selectedCategory];
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
        
        actionsDiv.innerHTML = ''; // Limpa os botões Certo/Errado
        updateRecentlyAsked(currentQuestion.id);

        if (isCorrect) {
            scores[currentQuestion.category].correct++;
            answerDiv.classList.add('correct');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br>Parabéns, sua resposta está correta!<div class="answer-source"><strong>Fonte:</strong> ${currentQuestion.law}</div>`;
            
            // --- BOTÃO "PRÓXIMO" PARA ACERTOS ---
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
            chatButton.className = 'btn-proximo'; // Azul
            chatButton.onclick = () => openChat();
            actionsDiv.appendChild(chatButton);
        }
        updateScoreboard();
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
        // Esta função permanece a mesma da versão anterior
    }

    function initialize() {
        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); });
        closeChatBtn.addEventListener('click', closeChat);
        categorySelector.addEventListener('change', generateFlashcard);
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
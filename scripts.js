document.addEventListener('DOMContentLoaded', function() {
    const defaultQuestionBank = {
        seguridade: [
            { question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' }
        ],
    };

    let questionBank = JSON.parse(localStorage.getItem('inssQuestionBank')) || defaultQuestionBank;
    let scores = JSON.parse(localStorage.getItem('inssScores')) || {
        seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 },
        constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 },
        raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 },
        etica: { correct: 0, incorrect: 0 },
    };
    let answeredQuestions = {};

    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('category-selector');
    const scoreContainer = document.getElementById('score-container');
    const resetScoreBtn = document.getElementById('reset-score');
    let currentQuestion = null;

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
                answeredQuestions[category] = [];
                generateFlashcard();
            }, 3000);
        }
    }

    async function generateFlashcard() {
        let selectedCategory = categorySelector.value;
        if (selectedCategory === 'all') {
            const allCategories = Object.keys(scores);
            selectedCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
        }
        
        if (!answeredQuestions[selectedCategory]) answeredQuestions[selectedCategory] = [];
        if (!questionBank[selectedCategory]) questionBank[selectedCategory] = [];

        let availableQuestions = questionBank[selectedCategory].filter((q, index) => !answeredQuestions[selectedCategory].includes(index));

        if (availableQuestions.length === 0) {
            await fetchNewQuestionsFromAI(selectedCategory);
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const questionData = availableQuestions[randomIndex];
        const originalIndex = questionBank[selectedCategory].indexOf(questionData);
        answeredQuestions[selectedCategory].push(originalIndex);
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
        
        actionsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);

        if (isCorrect) {
            scores[currentQuestion.category].correct++;
            answerDiv.classList.add('correct');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br>Parabéns, sua resposta está correta!`;
            setTimeout(() => document.querySelector('.flashcard')?.classList.add('exiting'), 1500);
            setTimeout(generateFlashcard, 2100);
        } else {
            scores[currentQuestion.category].incorrect++;
            answerDiv.classList.add('incorrect');
            answerDiv.innerHTML = `<strong>Gabarito: ${currentQuestion.answer}</strong><br><div class="ai-explanation"><strong>🤖 Explicação da IA:</strong><p>${currentQuestion.explanation}</p><p>📖 <em>${currentQuestion.law}</em></p></div>`;
            const nextButton = document.createElement('button');
            nextButton.innerText = 'Próximo';
            nextButton.className = 'btn-proximo';
            nextButton.onclick = () => {
                document.querySelector('.flashcard')?.classList.add('exiting');
                setTimeout(generateFlashcard, 600);
            };
            actionsDiv.innerHTML = '';
            actionsDiv.appendChild(nextButton);
        }
        updateScoreboard();
    }

    categorySelector.addEventListener('change', generateFlashcard);
    resetScoreBtn.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja zerar todo o seu placar?')) {
            Object.keys(scores).forEach(category => {
                scores[category] = { correct: 0, incorrect: 0 };
            });
            updateScoreboard();
        }
    });

    updateScoreboard();
    generateFlashcard();
});

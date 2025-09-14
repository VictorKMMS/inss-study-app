// features/topic-explorer.js

export function initTopicExplorer() {
    const modal = document.getElementById('topic-explorer-modal');
    const showBtn = document.getElementById('show-topic-explorer-btn');
    const closeBtn = document.getElementById('close-topic-explorer-btn');
    const sendBtn = document.getElementById('topic-send-btn');
    const input = document.getElementById('topic-input');
    const resultArea = document.getElementById('topic-result-area');

    showBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    sendBtn.addEventListener('click', handleTopicRequest);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTopicRequest();
        }
    });

    async function handleTopicRequest() {
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

            if (!response.ok) {
                throw new Error('A resposta da API não foi bem-sucedida.');
            }

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
}

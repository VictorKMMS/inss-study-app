// features/statistics.js

let categoryChart = null; // Variável para guardar a instância do gráfico

// Função principal que será exportada e chamada pelo script principal
export function initStatistics(userData) {
    const statsModal = document.getElementById('stats-modal');
    const showStatsBtn = document.getElementById('show-stats-btn');
    const closeStatsBtn = document.getElementById('close-stats-btn');

    showStatsBtn.addEventListener('click', () => {
        updateStatsPanel(userData); // Calcula e atualiza os dados antes de mostrar
        statsModal.classList.remove('hidden');
    });

    closeStatsBtn.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });
}

// Função que faz todos os cálculos e atualiza os elementos do painel
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

// Função que usa a biblioteca Chart.js para desenhar o gráfico
function renderCategoryChart(labels, correctData, incorrectData) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Se um gráfico anterior já existir, ele é destruído para evitar sobreposição
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
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor }
                }
            }
        }
    });
}

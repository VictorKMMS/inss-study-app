// features/achievements.js

// Lista Mestra de todas as conquistas possíveis no app
const ACHIEVEMENTS_LIST = [
    {
        id: 'correct_1',
        name: 'Primeiro Acerto!',
        description: 'Você acertou sua primeira questão. Continue assim!',
        icon: '✅',
        condition: (userData) => {
            const totalCorrect = Object.values(userData.scores).reduce((sum, cat) => sum + cat.correct, 0);
            return totalCorrect >= 1;
        }
    },
    {
        id: 'streak_3',
        name: 'Pegando o Ritmo',
        description: 'Estudou por 3 dias seguidos.',
        icon: '🔥',
        condition: (userData) => userData.userStats.streak >= 3
    },
    {
        id: 'seguridade_10',
        name: 'Iniciante em Seguridade',
        description: 'Acertou 10 questões de Seguridade Social.',
        icon: '🛡️',
        condition: (userData) => userData.scores.seguridade.correct >= 10
    },
    {
        id: 'simulado_1',
        name: 'Coragem de Aço',
        description: 'Completou seu primeiro simulado.',
        icon: '🚀',
        condition: (userData) => userData.userStats.simuladosCompletos >= 1
    },
    {
        id: 'error_master_10',
        name: 'Aprendendo com os Erros',
        description: 'Revisou 10 questões que tinha errado.',
        icon: '🧠',
        condition: (userData) => userData.userStats.errosRevisados >= 10
    },
    {
        id: 'conquistas_1',
        name: 'Caçador de Conquistas',
        description: 'Desbloqueou sua primeira conquista.',
        icon: '🏆',
        condition: (userData) => userData.userStats.unlockedAchievements.length >= 1
    }
];

// Função que será chamada para inicializar o módulo
export function initAchievements(userData) {
    const modal = document.getElementById('achievements-modal');
    const showBtn = document.getElementById('show-achievements-btn');
    const closeBtn = document.getElementById('close-achievements-btn');

    showBtn.addEventListener('click', () => {
        renderAchievements(userData);
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Função que verifica se alguma nova conquista foi desbloqueada
export function checkAchievements(userData) {
    let newAchievementUnlocked = false;
    for (const achievement of ACHIEVEMENTS_LIST) {
        // Se a conquista ainda não foi desbloqueada
        if (!userData.userStats.unlockedAchievements.includes(achievement.id)) {
            // E a condição para desbloqueá-la é verdadeira
            if (achievement.condition(userData)) {
                console.log(`Conquista Desbloqueada: ${achievement.name}`);
                userData.userStats.unlockedAchievements.push(achievement.id);
                showAchievementToast(achievement);
                newAchievementUnlocked = true;
            }
        }
    }
    return newAchievementUnlocked; // Retorna true se algo novo foi desbloqueado
}

// Renderiza a lista de conquistas (bloqueadas e desbloqueadas) no modal
function renderAchievements(userData) {
    const listContainer = document.getElementById('achievements-list');
    listContainer.innerHTML = '';

    for (const achievement of ACHIEVEMENTS_LIST) {
        const isUnlocked = userData.userStats.unlockedAchievements.includes(achievement.id);
        const item = document.createElement('div');
        item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        item.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class.achievement-details">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
            </div>
        `;
        listContainer.appendChild(item);
    }
}

// Mostra a notificação de nova conquista
function showAchievementToast(achievement) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `🏆 Conquista Desbloqueada!<br><strong>${achievement.name}</strong>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// --- IMPORTAÇÕES ---
import { auth, db } from './firebase-init.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // --- VARIÁVEIS DE ESTADO GLOBAIS ---
    let user = null;
    let userData = {}; // Um único objeto para guardar todos os dados do usuário
    const defaultQuestionBank = { /* ... seu banco de questões inicial ... */ };
    
    // --- SELEÇÃO DE ELEMENTOS DOM ---
    const mainLoginBtn = document.getElementById('google-login-main-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    const userPic = document.getElementById('user-pic');
    const mainApp = document.getElementById('main-app');
    const loginPrompt = document.getElementById('login-prompt');
    // ... adicione aqui todos os outros seletores de elementos do seu app (flashcardContainer, etc.)

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

    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Erro ao fazer login com Google:", error);
            alert("Não foi possível fazer o login. Tente novamente.");
        }
    }

    async function logOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    }

    // --- LÓGICA DE DADOS COM FIRESTORE ---
    async function loadUserData() {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
        } else {
            // Cria dados padrão para um novo usuário
            userData = {
                questionBank: defaultQuestionBank,
                scores: { seguridade: { correct: 0, incorrect: 0 }, administrativo: { correct: 0, incorrect: 0 }, constitucional: { correct: 0, incorrect: 0 }, portugues: { correct: 0, incorrect: 0 }, raciocinio: { correct: 0, incorrect: 0 }, informatica: { correct: 0, incorrect: 0 }, etica: { correct: 0, incorrect: 0 } },
                userStats: { streak: 0, lastVisit: null },
                erroredQuestions: [],
                recentlyAsked: [],
            };
        }
        initializeAppLogic(); // Inicia o resto do app com os dados carregados/criados
    }

    async function saveUserData() {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userDocRef, userData);
        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
        }
    }
    
    // --- LÓGICA DO APLICATIVO DE ESTUDOS ---
    function initializeAppLogic() {
        // Todo o seu código de lógica de estudo que antes era global, agora vive aqui dentro.
        // Ele só roda depois que os dados do usuário foram carregados.

        // Exemplo:
        // const themeToggleBtn = document.getElementById('theme-toggle-btn');
        // themeToggleBtn.addEventListener('click', toggleTheme);
        
        // E agora, as funções usam `userData` em vez de variáveis globais
        // e chamam `saveUserData()` em vez de `localStorage.setItem()`
        
        // function checkAnswer(event) {
        //     // ... lógica ...
        //     userData.scores[category].correct++;
        //     userData.recentlyAsked.push(questionId);
        //     saveUserData(); // Salva tudo na nuvem!
        // }
        
        // Para simplificar, vou colocar o console.log para você ver que funcionou.
        // No nosso próximo passo, moveremos toda a lógica de flashcards para cá.
        console.log("App inicializado com os dados do usuário:", userData);
        
        // Simplesmente para ter algo visual, vamos atualizar o placar
        updateScoreboard();
    }
    
    function updateScoreboard() {
        const scoreContainer = document.getElementById('score-container');
        if (!scoreContainer || !userData.scores) return; // Checagem de segurança
        
        scoreContainer.innerHTML = '';
        Object.keys(userData.scores).forEach(category => {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            scoreContainer.innerHTML += `<div class="score-item"><span class="score-label">${categoryName}</span><span class="score-values"><span class="score-correct">${userData.scores[category].correct}</span> / <span class="score-incorrect">${userData.scores[category].incorrect}</span></span></div>`;
        });
    }

    // Adiciona os eventos principais aos botões de login/logout
    mainLoginBtn.addEventListener('click', signInWithGoogle);
    logoutBtn.addEventListener('click', logOut);
});

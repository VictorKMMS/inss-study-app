// firebase-init.js

// Importa as funções que precisamos do Firebase SDK (Software Development Kit)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADlFeBBwwXinQ2Ip3eh4GUYn_hEajgbpQ",
  authDomain: "tutor-inss-app.firebaseapp.com",
  projectId: "tutor-inss-app",
  storageBucket: "tutor-inss-app.firebasestorage.app",
  messagingSenderId: "882642662903",
  appId: "1:882642662903:web:60c31d7d374188e25f2af2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa a conexão com o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços de Autenticação e Banco de Dados para usarmos no nosso site
export const auth = getAuth(app);
export const db = getFirestore(app);

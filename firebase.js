// --- 1. IMPORTACIONES ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// --- 2. TUS CREDENCIALES (ETI2025) ---
const firebaseConfig = {
    apiKey: "AIzaSyCOU_q1A0pff3EBbM5wmdFIZCFS6n1GUHU",
    authDomain: "eti2025.firebaseapp.com",
    projectId: "eti2025",
    storageBucket: "eti2025.firebasestorage.app",
    messagingSenderId: "328999649672",
    appId: "1:328999649672:web:c8abb8071f041d8341fa3d",
    measurementId: "G-J4JX2ZE1QH"
};

// --- 3. INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- 4. EXPORTAR HERRAMIENTAS PARA EL OTRO ARCHIVO ---
export { signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, collection, addDoc, serverTimestamp };
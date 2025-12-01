import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===============================================
// CONFIGURACIÓN FIREBASE
// IMPORTANTE: REEMPLAZA CON TUS PROPIOS DATOS
// ===============================================
let firebaseConfig;
let appId = 'default-app';

try {
    firebaseConfig = JSON.parse(__firebase_config); // Solo para entorno online
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app';
} catch (e) {
    // PON AQUÍ TUS CREDENCIALES DE FIREBASE SI ESTÁS EN LOCAL
    firebaseConfig = {
        apiKey: "TU_API_KEY",
        authDomain: "tu-proyecto.firebaseapp.com",
        projectId: "tu-proyecto",
        storageBucket: "tu-proyecto.appspot.com",
        messagingSenderId: "000000000",
        appId: "1:00000000:web:00000000"
    };
    console.log("Modo local activado");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado
let currentUser = null;
let cart = [];

// Datos Kits
const kits = [
    { id: 1, name: "Canasta Nutrición", price: 25, desc: "Alimentos 1 semana", img: "https://images.unsplash.com/photo-1595350796339-440939eb9f8b?w=400" },
    { id: 2, name: "Kit de Abrigo", price: 15, desc: "Ropa térmica", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },
    { id: 3, name: "Kit Escolar", price: 10, desc: "Útiles básicos", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400" },
    { id: 4, name: "Salud Básica", price: 30, desc: "Medicinas", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400" },
    { id: 5, name: "Juguete Didáctico", price: 12, desc: "Desarrollo cognitivo", img: "https://images.unsplash.com/photo-1596464716127-f9a862557963?w=400" },
    { id: 6, name: "Aporte Libre", price: 5, desc: "Fondo emergencia", img: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400" }
];

// Auth
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if(user) {
        const btn = document.getElementById('btn-login-nav');
        if(btn) btn.style.color = 'var(--color-teal-light)';
    }
});

// Funciones Globales
window.handleLogin = async (e) => {
    e.preventDefault();
    try {
        if(typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        window.showSection('home');
    } catch(err) {
        document.getElementById('login-error').classList.remove('hidden');
        // Fallback local
        try { await signInAnonymously(auth); window.showSection('home'); } catch(ex){}
    }
};

window.showSection = (id) => {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('main > section').forEach(s => s.classList.remove('active'));
    
    const sec = document.getElementById(id + '-section');
    if(sec) {
        sec.classList.remove('hidden');
        sec.classList.add('active');
        // Reiniciar animación
        const content = sec.querySelector('.hero-content') || sec;
        content.classList.remove('fade-in');
        void content.offsetWidth;
        content.classList.add('fade-in');
    }
    
    document.getElementById('mobile-menu').classList.remove('active');
    window.scrollTo(0,0);
};

window.initShop = () => {
    const grid = document.getElementById('donation-grid');
    if(!grid) return;
    
    grid.innerHTML = kits.map(k => `
        <div class="product-card">
            <div class="product-img-box">
                <img src="${k.img}" class="product-img">
                <span class="price-tag">$${k.price}</span>
            </div>
            <div class="product-info">
                <h4>${k.name}</h4>
                <p>${k.desc}</p>
                <button onclick="window.addToCart(${k.id})" class="btn-outline">
                    AGREGAR
                </button>
            </div>
        </div>
    `).join('');
};

window.addToCart = (id) => {
    cart.push(kits.find(k => k.id === id));
    window.updateCart();
};

window.removeFromCart = (idx) => { 
    cart.splice(idx, 1); 
    window.updateCart(); 
};

window.updateCart = () => {
    const count = document.getElementById('cart-count');
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    count.innerText = cart.length;
    
    if(cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Carrito vacío</p>';
        totalEl.innerText = "$0.00";
        return;
    }
    
    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div>
                <strong>${item.name}</strong><br>
                <small>$${item.price}</small>
            </div>
            <button onclick="window.removeFromCart(${i})" style="color:var(--color-red)"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
    
    const total = cart.reduce((a,b) => a + b.price, 0);
    totalEl.innerText = '$' + total.toFixed(2);
};

window.toggleCart = () => {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
};

window.checkout = async () => {
    if(!cart.length) return;
    if(!currentUser) { 
        alert("Inicia sesión primero"); 
        window.toggleCart();
        window.showSection('login'); 
        return; 
    }
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'donations'), {
            items: cart,
            total: cart.reduce((a,b) => a + b.price, 0),
            date: serverTimestamp()
        });
        cart = []; 
        window.updateCart(); 
        window.toggleCart();
        document.getElementById('success-modal').classList.remove('hidden');
    } catch(e) { alert("Error al procesar"); }
};

window.handleReport = async (e) => {
    e.preventDefault();
    if(!currentUser) await signInAnonymously(auth);
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), {
            loc: document.getElementById('report-loc').value,
            desc: document.getElementById('report-desc').value,
            date: serverTimestamp()
        });
        e.target.reset();
        document.getElementById('modal-title').innerText = "Reporte Enviado";
        document.getElementById('modal-msg').innerText = "Tu denuncia anónima ha sido registrada.";
        document.getElementById('success-modal').classList.remove('hidden');
    } catch(e) { alert("Error al enviar"); }
};

// Iniciar
window.initShop();
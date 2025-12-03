// Estado global
let currentUser = null;
let cart = [];

// Datos de kits
const kits = [
    { id: 1, name: "Canasta Nutrición", price: 25, desc: "Alimentos 1 semana", img: "https://images.unsplash.com/photo-1595350796339-440939eb9f8b?w=400" },
    { id: 2, name: "Kit de Abrigo", price: 15, desc: "Ropa térmica", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },
    { id: 3, name: "Kit Escolar", price: 10, desc: "Útiles básicos", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400" },
    { id: 4, name: "Salud Básica", price: 30, desc: "Medicinas", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400" },
    { id: 5, name: "Juguete Didáctico", price: 12, desc: "Desarrollo cognitivo", img: "https://images.unsplash.com/photo-1596464716127-f9a862557963?w=400" },
    { id: 6, name: "Aporte Libre", price: 5, desc: "Fondo emergencia", img: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400" }
];

// Delegación de eventos global
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-section], [data-action]');
    if (!target) return;

    const section = target.dataset.section;
    const action = target.dataset.action;

    if (section) {
        showSection(section);
    }

    if (action) {
        handleAction(action);
    }
});

// Keyboard navigation para elementos con data-section
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target.closest('[data-section], [data-action]');
        if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            target.click();
        }
    }
});

// Delegación de eventos para formularios
document.addEventListener('submit', (e) => {
    const form = e.target;
    const formType = form.dataset.formType;

    if (formType === 'report') {
        handleReport(e);
    }
    if (formType === 'login') {
        handleLogin(e);
    }
});

// Funciones de navegación
function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const sec = document.getElementById(id + '-section');
    if (sec) {
        sec.classList.remove('hidden');
        sec.classList.add('active');
        
        // Reiniciar animación
        const content = sec.querySelector('.hero-content') || sec;
        content.classList.remove('fade-in');
        void content.offsetWidth;
        content.classList.add('fade-in');
    }

    // Cerrar menú móvil
    document.getElementById('mobile-menu').classList.remove('active');
    window.scrollTo(0, 0);
}

// Manejador de acciones
function handleAction(action) {
    switch (action) {
        case 'toggle-cart':
            toggleCart();
            break;
        case 'checkout':
            checkout();
            break;
        case 'close-modal':
            document.getElementById('success-modal').classList.add('hidden');
            break;
    }
}

// Carrito
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
}

function addToCart(id) {
    const item = kits.find(k => k.id === id);
    if (item) {
        cart.push(item);
        updateCart();
    }
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCart();
}

function updateCart() {
    const count = document.getElementById('cart-count');
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    count.innerText = cart.length;

    if (cart.length === 0) {
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
            <button onclick="removeFromCart(${i})" style="color:var(--color-red); border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    const total = cart.reduce((a, b) => a + b.price, 0);
    totalEl.innerText = '$' + total.toFixed(2);
}

function checkout() {
    if (!cart.length) return;
    
    if (!currentUser) {
        alert("Por favor inicia sesión");
        toggleCart();
        showSection('login');
        return;
    }

    // Simular checkout (sin Firebase por ahora)
    cart = [];
    updateCart();
    toggleCart();

    document.getElementById('modal-title').innerText = "¡Donación Recibida!";
    document.getElementById('modal-msg').innerText = "Gracias por tu solidaridad.";
    document.getElementById('success-modal').classList.remove('hidden');
}

// Tienda
function initShop() {
    const grid = document.getElementById('donation-grid');
    if (!grid) return;

    grid.innerHTML = kits.map(k => `
        <div class="product-card">
            <div class="product-img-box">
                <img src="${k.img}" class="product-img">
                <span class="price-tag">$${k.price}</span>
            </div>
            <div class="product-info">
                <h4>${k.name}</h4>
                <p>${k.desc}</p>
                <button onclick="addToCart(${k.id})" class="btn-outline">
                    AGREGAR
                </button>
            </div>
        </div>
    `).join('');
}

// Formularios
function handleLogin(e) {
    e.preventDefault();
    currentUser = { uid: 'user-' + Date.now() };
    showSection('home');
    document.getElementById('login-error').classList.add('hidden');
}

function handleReport(e) {
    e.preventDefault();

    const loc = document.getElementById('report-loc').value;
    const desc = document.getElementById('report-desc').value;

    if (loc && desc) {
        e.target.reset();

        document.getElementById('modal-title').innerText = "Reporte Enviado";
        document.getElementById('modal-msg').innerText = "Tu denuncia anónima ha sido registrada.";
        document.getElementById('success-modal').classList.remove('hidden');
    }
}

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
    initShop();
    
    // Menú móvil
    const btnMenuToggle = document.getElementById('btn-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (btnMenuToggle && mobileMenu) {
        btnMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en un botón del menú
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.dataset.section) {
                mobileMenu.classList.remove('active');
            }
        });
    }
});

// Exposer funciones para atributos onclick que quedan
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

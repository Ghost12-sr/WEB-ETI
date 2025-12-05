// 1. IMPORTAMOS LAS HERRAMIENTAS DESDE TU FIREBASE.JS
import { auth, db, signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, collection, addDoc, serverTimestamp } from './firebase.js';

// --- ESTADO GLOBAL ---
let currentUser = null;
let cart = [];

// --- MODO OSCURO ---
function initDarkMode() {
    const darkModeBtn = document.getElementById('dark-mode-fab');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    console.log('initDarkMode ejecutado, botón:', darkModeBtn);
    
    // Aplicar modo oscuro si estaba guardado
    if (savedDarkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeBtn) {
            const icon = darkModeBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                darkModeBtn.title = 'Cambiar a modo claro';
            }
        }
    }
    
    // Escuchar clics en el botón flotante
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Click en botón de modo oscuro');
            
            document.body.classList.toggle('dark-mode');
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            console.log('Modo oscuro ahora es:', isDarkMode);
            
            // Cambiar icono
            const icon = darkModeBtn.querySelector('i');
            if (icon) {
                if (isDarkMode) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    darkModeBtn.title = 'Cambiar a modo claro';
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    darkModeBtn.title = 'Cambiar a modo oscuro';
                }
            }
        });
    } else {
        console.error('No se encontró el botón dark-mode-fab');
    }
}

// Inicializar modo oscuro cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    // El DOM ya está listo
    initDarkMode();
}

// --- UTILIDADES DE LOADER ---
function showLoader() {
    const loader = document.getElementById('page-loader');
    if(loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('page-loader');
    if(loader) {
        loader.classList.add('hidden');
    }
}

// Lista de Productos (Kits)
const products = [
    { id: 1, name: "Kit Escolar Básico", price: 15.00, image: "https://images.unsplash.com/photo-1577720643272-265226b33ba0?w=400&h=300&fit=crop", desc: "Cuadernos, lápices y mochila." },
    { id: 2, name: "Kit Alimentación", price: 25.00, image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop", desc: "Alimentos no perecibles para 1 semana." },
    { id: 3, name: "Kit Abrigo", price: 20.00, image: "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=300&fit=crop", desc: "Chompa térmica y guantes." },
    { id: 4, name: "Beca Transporte", price: 10.00, image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop", desc: "Pasajes para un mes de escuela." },
    { id: 5, name: "Kit Higiene", price: 12.00, image: "https://images.unsplash.com/photo-1585021906259-c3c0ceb0f8f0?w=400&h=300&fit=crop", desc: "Jabón, pasta, cepillo y toalla." },
    { id: 6, name: "Apoyo Legal", price: 50.00, image: "https://images.unsplash.com/photo-1553697031-d5a9f8e46bb2?w=400&h=300&fit=crop", desc: "Apoyo a procesos de restitución." }
];

// --- 2. SISTEMA DE LOGIN (Autenticación) ---

// Escuchamos si el usuario entra o sale (Automático)
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const container = document.getElementById('user-auth-container');
    const mobileLogoutBtn = document.getElementById('btn-mobile-logout');
    
    if (user) {
        console.log("Usuario conectado ID:", user.uid);
        
        // --- LÓGICA MÓVIL: Mostrar opción de cerrar sesión en menú ---
        if(mobileLogoutBtn) {
            mobileLogoutBtn.classList.remove('hidden');
            mobileLogoutBtn.onclick = handleLogout;
        }

        // Mostrar nombre del usuario con botón de perfil y cerrar sesión
        if(container) {
            const userName = user.displayName || user.email.split('@')[0];
            
            // Función para obtener el primer nombre
            const getFirstName = (name) => {
                const parts = name.trim().split(' ');
                return parts[0];
            };
            
            // Detectar si es móvil
            const isMobile = window.innerWidth <= 768;
            const displayName = isMobile ? getFirstName(userName) : `Bienvenido ${userName}`;
            
            container.innerHTML = `
                <button id="profile-btn" class="btn-nav-highlight">${displayName}</button>
                <button id="logout-btn" class="btn-logout-auth">Cerrar Sesión</button>
            `;
            
            // Conectar eventos
            document.getElementById('profile-btn').addEventListener('click', () => showSection('profile'));
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
        }
        
        // Si estaba en el login, lo mandamos a la tienda
        const loginSection = document.getElementById('login-section');
        if (loginSection && !loginSection.classList.contains('hidden')) {
            showSection('shop');
        }
    } else {
        console.log("Usuario desconectado");
        
        // --- LÓGICA MÓVIL: Ocultar opción de cerrar sesión ---
        if(mobileLogoutBtn) {
            mobileLogoutBtn.classList.add('hidden');
        }

        if(container) {
            container.innerHTML = '<button id="auth-btn" data-section="login" class="btn-nav-highlight">Ingresar</button>';
            // Reconectar el evento al nuevo botón dinámico
            const authBtn = document.getElementById('auth-btn');
            if(authBtn) {
                authBtn.addEventListener('click', () => showSection('login'));
            }
        }
    }
});

// Función para el botón "ENTRAR" del formulario
async function handleLogin(e) {
    if(e) e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Verificando...";
    btn.disabled = true;
    
    showLoader();
    
    try {
        // Login con email y contraseña
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        setTimeout(() => {
            hideLoader();
            showModal("¡Bienvenido Voluntario!", `Hola ${user.displayName || 'Voluntario'}, has iniciado sesión correctamente.`);
        }, 500);

    } catch (error) {
        hideLoader();
        console.error("Error login:", error);
        const errorDiv = document.getElementById('login-error');
        if(errorDiv) {
            errorDiv.classList.remove('hidden');
            errorDiv.innerText = "Error: " + (error.code === 'auth/user-not-found' ? 'Usuario no encontrado' : error.code === 'auth/wrong-password' ? 'Contraseña incorrecta' : error.message);
        }
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Función para el registro de voluntarios
async function handleRegister(e) {
    if(e) e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const errorDiv = document.getElementById('register-error');
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    
    // Validaciones
    if (password.length < 6) {
        errorDiv.classList.remove('hidden');
        errorDiv.innerText = "La contraseña debe tener al menos 6 caracteres.";
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.classList.remove('hidden');
        errorDiv.innerText = "Las contraseñas no coinciden.";
        return;
    }
    
    btn.innerText = "Registrando...";
    btn.disabled = true;
    
    showLoader();
    
    try {
        // Crear usuario con email y contraseña
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualizar perfil con el nombre
        await updateProfile(user, {
            displayName: name
        });
        
        // Guardar información del voluntario en Firestore
        await addDoc(collection(db, "volunteers"), {
            uid: user.uid,
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            status: "activo"
        });
        
        errorDiv.classList.add('hidden');
        e.target.reset();
        
        setTimeout(() => {
            hideLoader();
            showModal("¡Registro Exitoso!", `Bienvenido ${name}, tu cuenta ha sido creada. Ahora puedes iniciar sesión.`);
            showSection('login');
        }, 500);

    } catch (error) {
        hideLoader();
        console.error("Error registro:", error);
        errorDiv.classList.remove('hidden');
        errorDiv.innerText = "Error: " + (error.code === 'auth/email-already-in-use' ? 'Este email ya está registrado' : error.code === 'auth/invalid-email' ? 'Email inválido' : error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function handleLogout() {
    await signOut(auth);
    showModal("Sesión Cerrada", "Has salido del sistema.");
    showSection('home');
    
    // Cerrar menú móvil si estaba abierto
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenu) mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Función para login con Google
async function handleGoogleSignIn() {
    // Cerrar menú móvil si está abierto
    const mobileMenu = document.getElementById('mobile-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if(mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        if(menuToggle) menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    showLoader();
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Verificar si es un usuario nuevo (con validación segura)
        const isNewUser = result.additionalUserInfo && result.additionalUserInfo.isNewUser ? true : false;
        
        if(isNewUser) {
            // Guardar información del voluntario en Firestore si es nuevo
            await addDoc(collection(db, "volunteers"), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                createdAt: serverTimestamp(),
                status: "activo",
                provider: "google"
            });
            
            setTimeout(() => {
                hideLoader();
                showModal("¡Bienvenido!", `Hola ${user.displayName}, tu cuenta ha sido creada exitosamente.`);
            }, 1000);
        } else {
            setTimeout(() => {
                hideLoader();
                showModal("¡Bienvenido Voluntario!", `Hola ${user.displayName}, has iniciado sesión correctamente.`);
            }, 1000);
        }
        
        showSection('shop');
        
    } catch (error) {
        hideLoader();
        console.error("Error Google Sign-in:", error);
        console.error("Código de error:", error.code);
        console.error("Mensaje:", error.message);
        
        if(error.code !== 'auth/popup-closed-by-user') {
            showModal("Error de Acceso", `No pudimos iniciar sesión con Google. Error: ${error.message}`);
        }
    }
}

// --- 3. NAVEGACIÓN (Mostrar/Ocultar secciones) ---

function showSection(sectionName) {
    // Ocultar todas
    document.querySelectorAll('main .section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active', 'fade-in');
    });
    
    // Mostrar la elegida
    const target = document.getElementById(`${sectionName}-section`);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active', 'fade-in'), 10);
        window.scrollTo(0, 0);
        
        // Si es la sección de perfil, actualizar datos
        if(sectionName === 'profile' && currentUser) {
            updateProfileDisplay();
        }
    }
    
    // Cerrar menú móvil si está abierto
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenu) mobileMenu.classList.remove('active');
}

// Actualizar información del perfil
function updateProfileDisplay() {
    if(!currentUser) return;
    
    const name = currentUser.displayName || 'Usuario';
    const email = currentUser.email || '--';
    const createdDate = currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('es-ES') : '--';
    
    document.getElementById('profile-name').textContent = `Hola, ${name}`;
    document.getElementById('profile-email').textContent = email;
    document.getElementById('profile-date').textContent = createdDate;
}

// --- 4. TIENDA Y CARRITO ---

function renderShop() {
    const grid = document.getElementById('donation-grid');
    if(!grid) return;

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h4>${p.name}</h4>
                <p>${p.desc}</p>
                <div class="price-display">$${p.price.toFixed(2)}</div>
                <button onclick="window.addToCart(${p.id})" class="btn-add-cart">AÑADIR</button>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(product) {
        cart.push(product);
        updateCartUI();
        
        // Animación pequeña en el carrito
        const cartIcon = document.querySelector('.cart-btn i');
        if(cartIcon) {
            cartIcon.classList.add('fa-bounce');
            setTimeout(() => cartIcon.classList.remove('fa-bounce'), 1000);
        }
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    // Actualizar número en el icono
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.textContent = cart.length;
    
    // Actualizar lista visual
    const itemsEl = document.getElementById('cart-items');
    if (itemsEl) {
        if(cart.length === 0) {
            itemsEl.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">Tu carrito está vacío.</p>';
        } else {
            itemsEl.innerHTML = cart.map((item, index) => `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #eee;">
                    <div>
                        <strong>${item.name}</strong>
                        <div style="font-size:0.8rem; color:#666;">$${item.price.toFixed(2)}</div>
                    </div>
                    <button onclick="window.removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    // Actualizar Total
    const totalEl = document.getElementById('cart-total');
    if(totalEl) {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if(modal) modal.classList.toggle('hidden');
}

// --- 5. SIMULACIÓN DE COMPRA (Guardar en Base de Datos) ---

async function checkout() {
    if(cart.length === 0) return alert("El carrito está vacío.");
    
    if(!currentUser) {
        toggleCart(); // Cierra carrito
        showModal("Identificación Requerida", "Debes iniciar sesión para registrar la donación.");
        showSection('login');
        return;
    }

    // Mostrar modal de pago
    showPaymentForm();
}

function showPaymentForm() {
    const paymentModal = document.getElementById('payment-modal');
    if(!paymentModal) {
        console.error('Modal de pago no encontrado');
        return;
    }
    
    // Calcular total del carrito
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const totalElement = document.getElementById('payment-total');
    if(totalElement) {
        totalElement.innerText = total.toFixed(2);
    }
    
    // Limpiar campos del formulario
    document.getElementById('card-number').value = '';
    document.getElementById('card-holder').value = '';
    document.getElementById('expiry').value = '';
    document.getElementById('cvv').value = '';
    
    paymentModal.classList.remove('hidden');
}

async function processPayment(e) {
    e.preventDefault();
    
    const cardNumber = document.getElementById('card-number').value;
    const cardHolder = document.getElementById('card-holder').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    // Validaciones básicas
    if(cardNumber.replace(/\s/g, '').length !== 16) {
        return alert('El número de tarjeta debe tener 16 dígitos');
    }
    if(!expiry.match(/^\d{2}\/\d{2}$/)) {
        return alert('El formato de fecha debe ser MM/YY');
    }
    if(cvv.length !== 3) {
        return alert('El CVV debe tener 3 dígitos');
    }
    
    btn.innerText = "Procesando pago...";
    btn.disabled = true;
    
    showLoader();
    
    try {
        // Simular procesamiento de pago
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Guardar datos de la donación
        const orderData = {
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price, 0),
            date: serverTimestamp(),
            userId: currentUser.uid,
            status: "pagado",
            paymentMethod: "tarjeta_debito",
            cardLast4: cardNumber.slice(-4),
            cardHolder: cardHolder
        };

        await addDoc(collection(db, "donations"), orderData);

        // Limpiar todo
        cart = [];
        updateCartUI();
        toggleCart();
        
        // Cerrar modal de pago
        const paymentModal = document.getElementById('payment-modal');
        if(paymentModal) paymentModal.classList.add('hidden');
        
        // Limpiar formulario
        e.target.reset();
        
        // Mostrar éxito
        hideLoader();
        showModal("¡Pago Exitoso!", `Se ha procesado tu donación de $${orderData.total.toFixed(2)} exitosamente. ¡Gracias por tu aporte!`);

    } catch (error) {
        hideLoader();
        console.error("Error al procesar pago:", error);
        showModal("Error en el Pago", "Hubo un problema al procesar tu pago. Por favor intenta de nuevo.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- 6. REPORTES (Denuncias) ---

async function handleReport(e) {
    if(e) e.preventDefault();
    
    const loc = document.getElementById('report-loc').value;
    const desc = document.getElementById('report-desc').value;
    const btn = e.target.querySelector('button');
    
    if(btn) {
        btn.innerText = "Enviando...";
        btn.disabled = true;
    }

    showLoader();

    try {
        await addDoc(collection(db, "reports"), {
            location: loc,
            description: desc,
            date: serverTimestamp(),
            status: "nuevo"
        });

        e.target.reset();
        hideLoader();
        showModal("Reporte Recibido", "Gracias por alertarnos. La información es anónima.");

    } catch (error) {
        hideLoader();
        console.error("Error reporte:", error);
        alert("Error al enviar.");
    } finally {
        if(btn) {
            btn.innerText = "ENVIAR REPORTE";
            btn.disabled = false;
        }
    }
}

// --- UTILIDADES ---

function showModal(title, msg) {
    const t = document.getElementById('modal-title');
    const m = document.getElementById('modal-msg');
    const modal = document.getElementById('success-modal');
    
    if(t) t.textContent = title;
    if(m) m.textContent = msg;
    if(modal) modal.classList.remove('hidden');
}

// Inicializar la tienda al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar loader
    const loader = document.getElementById('page-loader');
    if(loader) {
        loader.classList.remove('hidden');
    }
    
    // Simular tiempo de carga
    setTimeout(() => {
        renderShop();
        
        // Ocultar loader después del tiempo de carga
        if(loader) {
            loader.classList.add('hidden');
        }
    }, 800);
    
    // Conectar el logo para ir al inicio
    const logo = document.querySelector('.logo');
    if(logo) {
        logo.addEventListener('click', () => showSection('home'));
        logo.addEventListener('keypress', (e) => {
            if(e.key === 'Enter' || e.key === ' ') showSection('home');
        });
    }
    
    // Manejo del menú hamburguesa
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if(menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if(mobileMenu) {
                mobileMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
                // Prevenir scroll del body cuando el menú está abierto
                if(mobileMenu.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    // Cerrar menú al hacer click en una opción
    if(mobileMenu) {
        mobileMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                if(menuToggle) menuToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if(mobileMenu && menuToggle) {
            if(!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                if(mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        }
    });
    
    // Conectar formularios con sus manejadores
    const loginForm = document.querySelector('form[data-form-type="login"]');
    if(loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.querySelector('form[data-form-type="register"]');
    if(registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const reportForm = document.querySelector('form[data-form-type="report"]');
    if(reportForm) {
        reportForm.addEventListener('submit', handleReport);
    }
    
    // Conectar todos los botones con data-section
    document.querySelectorAll('button[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = btn.getAttribute('data-section');
            if(section) showSection(section);
        });
    });
    
    // Manejador para el botón del carrito
    document.querySelectorAll('button[data-action="toggle-cart"]').forEach(btn => {
        btn.addEventListener('click', toggleCart);
    });
    
    // Manejador para el botón CONFIRMAR (checkout)
    document.querySelectorAll('button[data-action="checkout"]').forEach(btn => {
        btn.addEventListener('click', checkout);
    });
    
    // Manejador para cerrar el modal
    document.querySelectorAll('button[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('success-modal');
            if(modal) modal.classList.add('hidden');
        });
    });
});

// --- ¡ESTO ES CRUCIAL! ---
// Exponemos las funciones para que el HTML pueda verlas
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.handleGoogleSignIn = handleGoogleSignIn;
window.showSection = showSection;
window.updateProfileDisplay = updateProfileDisplay;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.processPayment = processPayment;
window.handleReport = handleReport;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
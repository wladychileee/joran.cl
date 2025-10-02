// Mobile Navigation Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenu && navMenu) {
    // A11y: reflect expanded state
    mobileMenu.setAttribute('aria-expanded', 'false');
    function toggleNav() {
        const isActive = mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
        mobileMenu.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    }
    mobileMenu.addEventListener('click', toggleNav);
    // Keyboard support for role="button"
    mobileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleNav();
        }
    });
}

// Hide all quote-improvement UI globally as per requirement
function disableQuoteImprovementFeature() {
    try {
        // Inject CSS to hide any remaining sections
        const style = document.createElement('style');
        style.setAttribute('data-hide-improvement', '1');
        style.textContent = `.quote-improvement-section{display:none !important;}`;
        document.head.appendChild(style);
        // Remove improvement modal if present in DOM
        const impModal = document.getElementById('improvement-modal');
        if (impModal && impModal.parentElement) {
            impModal.parentElement.removeChild(impModal);
        }
    } catch(_) {}
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu && navMenu) {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
        }
    });
});

// Smooth scrolling for navigation links, ensuring we exit product view first
function exitProductView() {
    // Remove product-view class and hide product pages container
    document.body.classList.remove('product-view');
    // Hide all product pages
    document.querySelectorAll('.product-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    const productPagesContainer = document.getElementById('product-pages');
    if (productPagesContainer) {
        productPagesContainer.style.display = 'none';
    }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return; // ignore non-target anchors
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        // Always exit product view before navigating
        if (document.body.classList.contains('product-view')) {
            exitProductView();
        }

        // Close mobile menu if open
        if (mobileMenu && navMenu) {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
        }

        // Wait a frame to allow layout to update before scrolling
        requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// --- Dynamic product data rendering (DESACTIVADO: no mostrar ejemplos) ---
let productsData = null;
const productsRendered = {}; // pageId -> true

async function loadProductsData() {
    // No-op: no cargar ejemplos din?micos
    return null;
}

async function renderCategoryIfNeeded(pageId) {
    // No-op: no renderizar ejemplos din?micos
    return;
}

// Form submission: only simulate if no external action is configured
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    const hasExternalAction = !!contactForm.getAttribute('action');
    if (!hasExternalAction) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Por favor, completa todos los campos.');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('.btn');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('?Mensaje enviado correctamente! Te contactar? pronto.');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.service-card, .about-text, .contact-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Product search filter
    const searchInput = document.getElementById('product-search');
    const serviceCards = Array.from(document.querySelectorAll('.services-grid .service-card'));
    if (searchInput && serviceCards.length) {
        function normalize(t){ return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
        const cardIndex = serviceCards.map(card => ({
            el: card,
            text: normalize((card.querySelector('h3')?.textContent || '') + ' ' + (card.querySelector('p')?.textContent || ''))
        }));
        searchInput.addEventListener('input', () => {
            const q = normalize(searchInput.value);
            cardIndex.forEach(({el, text}) => {
                const match = !q || text.includes(q);
                el.style.display = match ? '' : 'none';
            });
        });
    }
});

// Add some interactive effects
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    const heroTitle = document.getElementById('typing-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 80);
    }
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Product page navigation
function showProductPage(pageId) {
    console.log('Mostrando p?gina:', pageId); // Debug
    
    // Hide main content
    document.body.classList.add('product-view');
    
    // Hide all product pages first
    document.querySelectorAll('.product-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show selected product page
    const targetPage = document.getElementById(pageId + '-page');
    console.log('P?gina encontrada:', targetPage); // Debug
    
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
        
        // Show the product pages container
        const productPagesContainer = document.getElementById('product-pages');
        if (productPagesContainer) {
            productPagesContainer.style.display = 'block';
        }
    }
    // No render de ejemplos din?micos
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    console.log('Volviendo atr?s'); // Debug
    
    // Show main content
    document.body.classList.remove('product-view');
    
    // Hide all product pages
    document.querySelectorAll('.product-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Hide the product pages container
    const productPagesContainer = document.getElementById('product-pages');
    if (productPagesContainer) {
        productPagesContainer.style.display = 'none';
    }
    
    // Scroll to products section
    const productsSection = document.getElementById('productos');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add event listeners for product buttons
document.addEventListener('DOMContentLoaded', () => {
    // Product category buttons
    const productButtons = {
        'construccion': 'construccion',
        'medicos': 'medicos', 
        'oficina': 'oficina',
        'muebles': 'muebles',
        'electrodomesticos': 'electrodomesticos'
    };
    
    Object.entries(productButtons).forEach(([buttonClass, pageId]) => {
        const buttons = document.querySelectorAll(`.${buttonClass}-btn`);
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                showProductPage(pageId);
            });
        });
    });
});

// Shopping Cart functionality disabled (no-op stubs)
let cart = [];

function updateCartCount() { /* no-op */ }

function addToCart(productName) { /* no-op */ }

function addCustomProduct(category) { /* no-op */ }

function getCurrentCategory() { return 'general'; }

function showCartNotification(productName) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Agregado al carrito: ${productName}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return; // Cart UI removed
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
        renderCartItems();
    }
}

function renderCartItems() { /* no-op */ }

function removeFromCart(itemId) { /* no-op */ }

function clearCart() { cart = []; }

function openQuoteModal() {
    const quoteModal = document.getElementById('quote-modal');
    if (!quoteModal) return;
    quoteModal.style.display = 'block';
}

function closeQuoteModal() {
    const quoteModal = document.getElementById('quote-modal');
    quoteModal.style.display = 'none';
    
    // Reset form
    document.getElementById('quote-form').reset();
}

// File upload functionality
let uploadedFiles = {};

function handleFileUpload(input, category) {
    const file = input.files[0];
    if (!file) return;
    
    const fileId = Date.now();
    const fileInfo = {
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        category: category,
        file: file
    };
    
    if (!uploadedFiles[category]) {
        uploadedFiles[category] = [];
    }
    
    uploadedFiles[category].push(fileInfo);
    console.log('[upload] file selected for', category, file.name);
    displayFilePreview(fileInfo, category);
    
    // Show notification
    showFileNotification(`Archivo "${file.name}" cargado correctamente`);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function displayFilePreview(fileInfo, category) {
    const preview = document.getElementById(`file-preview-${category}`);
    const fileIcon = getFileIcon(fileInfo.type);

    // No limpiar el preview: permitir múltiples archivos (cada uno con su propio formulario)

    const wrap = document.createElement('div');
    wrap.className = 'file-item';
    const formId = `attach-inline-${category}-${fileInfo.id}`;

    wrap.innerHTML = `
        <div class="file-info" style="align-items:flex-start;gap:12px;">
            <i class="${fileIcon} file-icon"></i>
            <div class="file-details">
                <h5 style="margin:0 0 4px 0;">${fileInfo.name}</h5>
                <small>${fileInfo.size}</small>
            </div>
        </div>
        <form id="${formId}" class="quote-form" style="margin-top:12px; width:100%;">
            <div class="form-group"><label>Nombre Personal *</label>
                <input type="text" name="name" placeholder="Tu nombre" required>
            </div>
            <div class="form-group"><label>Nombre de la Empresa *</label>
                <input type="text" name="company" placeholder="Nombre de tu empresa" required>
            </div>
            <div class="form-group"><label>Correo Electrónico *</label>
                <input type="email" name="email" placeholder="correo@empresa.cl" required>
            </div>
            <div class="form-group"><label>Teléfono *</label>
                <input type="tel" name="phone" placeholder="+56 9 1234 5678" required>
            </div>
            <div class="quote-footer" style="display:flex; gap:8px;">
                <button type="submit" class="btn btn-primary" disabled>
                    <i class="fas fa-paper-plane"></i> Enviar
                </button>
                <button type="button" class="btn btn-secondary" data-remove="1">
                    Eliminar
                </button>
            </div>
            <input type="hidden" name="_subject" value="Adjunto de Cotización desde sección ${category}">
            <input type="hidden" name="_template" value="table">
            <input type="hidden" name="_next" value="https://joran.cl/thanks.html">
            <input type="hidden" name="_captcha" value="false">
        </form>
    `;

    preview.appendChild(wrap);
    try { preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(_) {}

    // Validaci?n simple para habilitar Enviar
    const formEl = document.getElementById(formId);
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const removeBtn = formEl.querySelector('button[data-remove="1"]');
    const requiredInputs = Array.from(formEl.querySelectorAll('input[required]'));

    function validate() {
        const allOk = requiredInputs.every(inp => (inp.value || '').trim().length > 0);
        submitBtn.disabled = !allOk;
    }
    requiredInputs.forEach(inp => inp.addEventListener('input', validate));
    validate();

    // Configurar envío estándar para soportar adjuntos en FormSubmit
    try {
        // Usar endpoint estándar (no AJAX)
        formEl.setAttribute('action', 'https://formsubmit.co/cotizaciones@joran.cl');
        formEl.setAttribute('method', 'POST');
        formEl.setAttribute('enctype', 'multipart/form-data');
        // Mover el input real dentro del formulario y crear un reemplazo para mantener el click del área
        const originalInput = document.getElementById(`file-upload-${category}`);
        if (originalInput) {
            const originalParent = originalInput.parentElement;
            const originalId = originalInput.id;
            if (originalParent && originalInput.parentElement !== formEl) {
                // Renombrar id para evitar colisión y anexar al form
                originalInput.id = `${originalId}-${fileInfo.id}`;
                originalInput.name = 'attachment';
                originalInput.style.display = 'none';
                formEl.appendChild(originalInput);

                // Crear input de reemplazo con el id original para que el área siga funcionando
                const replacement = document.createElement('input');
                replacement.type = 'file';
                replacement.id = originalId; // mantener id que usa el onclick del área
                replacement.accept = originalInput.accept || '.pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png';
                replacement.style.display = 'none';
                replacement.onchange = function(){ handleFileUpload(this, category); };
                originalParent.appendChild(replacement);
            }
        }
        // Spinner de envío sin impedir el submit nativo
        formEl.addEventListener('submit', () => {
            try { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'; } catch(_) {}
        }, { once: true });
    } catch(_) {}

    // Remover archivo y limpiar preview
    removeBtn.addEventListener('click', () => {
        // limpiar data en memoria
        if (uploadedFiles[category]) {
            uploadedFiles[category] = uploadedFiles[category].filter(f => f.id !== fileInfo.id);
        }
        preview.innerHTML = '';
    });
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel';
    if (fileType.includes('image')) return 'fas fa-file-image';
    return 'fas fa-file';
}

function sendFileViaWhatsApp(fileId, category) {
    const fileInfo = uploadedFiles[category]?.find(f => f.id === fileId);
    if (!fileInfo) return;
    
    const message = `Hola, tengo una cotización que necesito procesar. He subido el archivo: "${fileInfo.name}" (${fileInfo.size}). Por favor, ayúdenme con este pedido.`;
    const whatsappUrl = `https://wa.me/56962378434?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    showFileNotification('Redirigiendo a WhatsApp para enviar el archivo...');
}

function removeFile(fileId, category) {
    if (!uploadedFiles[category]) return;
    
    uploadedFiles[category] = uploadedFiles[category].filter(f => f.id !== fileId);
    
    // Remove from DOM
    const preview = document.getElementById(`file-preview-${category}`);
    const fileElements = preview.querySelectorAll('.file-item');
    fileElements.forEach(element => {
        const sendBtn = element.querySelector('.send-file');
        if (sendBtn && sendBtn.onclick.toString().includes(fileId)) {
            element.remove();
        }
    });
}

function showFileNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <i class="fas fa-file-check"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}

// Quote improvement functionality
function openImprovementModal() {
    const modal = document.getElementById('improvement-modal');
    modal.style.display = 'block';
}

function closeImprovementModal() {
    const modal = document.getElementById('improvement-modal');
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('improvement-form').reset();
    document.getElementById('improvement-file-preview').innerHTML = '';
}

function handleImprovementFile(input) {
    const file = input.files[0];
    if (!file) return;
    
    const preview = document.getElementById('improvement-file-preview');
    const fileIcon = getFileIcon(file.type);
    
    preview.innerHTML = `
        <div class="file-item">
            <div class="file-info">
                <i class="${fileIcon} file-icon"></i>
                <div class="file-details">
                    <h5>${file.name}</h5>
                    <small>${formatFileSize(file.size)}</small>
                </div>
            </div>
            <div class="file-actions">
                <button type="button" class="file-btn remove-file" onclick="removeImprovementFile()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function removeImprovementFile() {
    document.getElementById('imp-quote-file').value = '';
    document.getElementById('improvement-file-preview').innerHTML = '';
}

function handleImprovementSubmission(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('imp-name').value,
        email: document.getElementById('imp-email').value,
        company: document.getElementById('imp-company').value,
        phone: document.getElementById('imp-phone').value,
        currentSupplier: document.getElementById('imp-current-supplier').value,
        deadline: document.getElementById('imp-deadline').value,
        message: document.getElementById('imp-message').value,
        file: document.getElementById('imp-quote-file').files[0]
    };
    
    sendImprovementRequest(formData);
}

function sendImprovementRequest(formData) {
    const submitBtn = document.querySelector('#improvement-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const deadlineText = {
            'urgente': 'Urgente (24 horas)',
            'rapido': 'R?pido (2-3 d?as)', 
            'normal': 'Normal (1 semana)',
            'flexible': 'Flexible (cuando sea posible)'
        };
        
        const emailContent = `
Nueva Solicitud de An?lisis de Cotizaci?n Competitiva

Datos del Cliente:
- Nombre: ${formData.name}
- Email: ${formData.email}
- Empresa: ${formData.company}
- Tel?fono: ${formData.phone || 'No especificado'}
- Proveedor Actual: ${formData.currentSupplier || 'No especificado'}

Urgencia: ${deadlineText[formData.deadline]}

Archivo adjunto: ${formData.file ? formData.file.name : 'No adjuntado'}

Informaci?n adicional:
${formData.message || 'Ninguna'}

IMPORTANTE: El cliente entiende que no se garantizan mejores precios, 
solo se realizar? un an?lisis seg?n disponibilidad y condiciones del mercado.

---
Enviado desde el sitio web de PRODUCTOS JORAN SPA
        `;
        
        console.log('Solicitud de mejora enviada a cotizaciones@joran.cl:', emailContent);
        
        showCartNotification('Solicitud enviada. Te contactaremos para analizar tu cotizaci?n.');
        
        closeImprovementModal();
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    }, 2000);
}

// Handle quote form submission
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Quote form handler: only simulate if no external action
    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
        const hasExternalAction = !!quoteForm.getAttribute('action');
        if (!hasExternalAction) {
            quoteForm.addEventListener('submit', handleQuoteSubmission);
        }
    }
    
    // Improvement form handler: only simulate if no external action
    const improvementForm = document.getElementById('improvement-form');
    if (improvementForm) {
        const hasExternalAction = !!improvementForm.getAttribute('action');
        if (!hasExternalAction) {
            improvementForm.addEventListener('submit', handleImprovementSubmission);
        }
    }
});

function handleQuoteSubmission(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('quote-name').value,
        email: document.getElementById('quote-email').value,
        company: document.getElementById('quote-company').value,
        phone: document.getElementById('quote-phone').value,
        message: document.getElementById('quote-message').value,
        products: cart
    };
    
    // Simulate email sending (in production, this would go to a backend)
    sendQuoteEmail(formData);
}

function sendQuoteEmail(formData) {
    // Show loading state
    const submitBtn = document.querySelector('#quote-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Create email content
        const productList = formData.products.map(item => 
            `. ${item.name}${item.custom ? ' (Personalizado)' : ''}`
        ).join('\n');
        
        const emailContent = `
Nueva Solicitud de Cotizaci?n

Datos del Cliente:
- Nombre: ${formData.name}
- Email: ${formData.email}
- Empresa: ${formData.company || 'No especificada'}
- Tel?fono: ${formData.phone || 'No especificado'}

Productos solicitados:
${productList}

Mensaje adicional:
${formData.message || 'Ninguno'}

---
Enviado desde el sitio web de PRODUCTOS JORAN SPA
        `;
        
        // In production, this would be sent to cotizaciones@joran.cl
        console.log('Email enviado a cotizaciones@joran.cl:', emailContent);
        
        // Show success message
        showCartNotification('Cotizaci?n enviada correctamente al correo cotizaciones@joran.cl');
        
        // Reset form and close modal
        closeQuoteModal();
        clearCart();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    }, 2000);
}

// Asegurar que el body siempre est? visible (eliminar animaci?n anterior)
window.addEventListener('load', () => {
    try {
        document.body.style.opacity = '1';
        document.body.style.transition = '';
    } catch(_) {}
});

// Eliminar flujo AJAX por completo: usamos envío estándar en todos los formularios
// Global exposure for inline handlers (ensures availability)
window.showProductPage = showProductPage;
window.goBack = goBack;
window.openImprovementModal = openImprovementModal;
window.closeImprovementModal = closeImprovementModal;
window.openQuoteModal = openQuoteModal;
window.closeQuoteModal = closeQuoteModal;
window.handleFileUpload = handleFileUpload;
window.handleImprovementFile = handleImprovementFile;
window.removeImprovementFile = removeImprovementFile;
window.handleImprovementSubmission = handleImprovementSubmission;
window.sendImprovementRequest = sendImprovementRequest;
window.handleQuoteSubmission = handleQuoteSubmission;
window.sendQuoteEmail = sendQuoteEmail;



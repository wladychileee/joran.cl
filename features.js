// Quote list, product search, kits, campaign banner and WhatsApp helpers.
// Depends on showProductPage() / exitProductView() from script.js.
(function () {
    'use strict';

    const WHATSAPP_NUMBER = '56962378434';
    const LIST_KEY = 'joran-quote-list';
    const CAMPAIGN_KEY = 'joran-campaign-dismissed';
    const GREETED_KEY = 'joran-wa-greeted';
    const NOTES_KEY = 'joran-quote-notes';
    const DEFAULT_WA_TEXT = 'Hola, necesito cotizar productos para mi empresa';

    const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    const storage = {
        get(store, key) { try { return window[store].getItem(key); } catch (_) { return null; } },
        set(store, key, value) { try { window[store].setItem(key, value); } catch (_) { /* ignore */ } }
    };

    function getCategories() {
        return [...document.querySelectorAll('.product-page')].map((page) => {
            const h2 = page.querySelector('.section-header h2');
            return { id: page.id.replace(/-page$/, ''), title: h2 ? h2.textContent.trim() : '', page };
        });
    }

    function productItems(page) {
        return [...page.querySelectorAll('li')].filter((li) => !li.closest('.section-quick-links'));
    }

    function goToCategory(id) {
        if (typeof window.showProductPage === 'function') window.showProductPage(id);
    }

    /* ---------- Toast ---------- */
    let toastEl, toastTimer;
    function toast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'ql-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
    }

    /* ---------- Quote list ---------- */
    let list = loadList();
    let toggleBtn, panel, backdrop, itemsEl, emptyEl, notesEl, countEl;

    function loadList() {
        try {
            const value = JSON.parse(storage.get('localStorage', LIST_KEY));
            return Array.isArray(value) ? value.filter((i) => i && i.name) : [];
        } catch (_) { return []; }
    }

    function saveList() {
        storage.set('localStorage', LIST_KEY, JSON.stringify(list));
        renderList();
    }

    function addItem(name, category, { silent = false } = {}) {
        const key = norm(name);
        const existing = list.find((i) => norm(i.name) === key);
        if (existing) existing.qty += 1;
        else list.push({ name: name.trim(), category: category || '', qty: 1 });
        saveList();
        if (!silent) {
            toast(`Agregado a tu cotización: ${name}`);
            toggleBtn.classList.remove('bump');
            void toggleBtn.offsetWidth;
            toggleBtn.classList.add('bump');
        }
    }

    function buildMessage() {
        const lines = ['Hola, quiero cotizar los siguientes productos:'];
        list.forEach((i) => lines.push(`- ${i.qty} x ${i.name}${i.category ? ` (${i.category})` : ''}`));
        const notes = notesEl.value.trim();
        if (notes) lines.push('', `Comentarios: ${notes}`);
        return lines.join('\n');
    }

    function buildListUI() {
        toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'ql-toggle';
        toggleBtn.hidden = true;
        toggleBtn.setAttribute('aria-haspopup', 'dialog');
        toggleBtn.innerHTML = '<i class="fas fa-clipboard-list" aria-hidden="true"></i><span>Mi cotización</span><span class="ql-count">0</span>';
        countEl = toggleBtn.querySelector('.ql-count');

        backdrop = document.createElement('div');
        backdrop.className = 'ql-backdrop';
        backdrop.hidden = true;

        panel = document.createElement('aside');
        panel.className = 'ql-panel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'ql-title');
        panel.innerHTML = `
            <div class="ql-header">
                <h3 id="ql-title">Mi lista de cotización</h3>
                <button type="button" class="ql-close" aria-label="Cerrar">&times;</button>
            </div>
            <div class="ql-body">
                <p class="ql-empty">Tu lista está vacía. Agrega productos desde las categorías, el buscador o los kits.</p>
                <ul class="ql-items"></ul>
                <label class="ql-notes-label" for="ql-notes">Comentarios (opcional)</label>
                <textarea id="ql-notes" class="ql-notes" rows="3" placeholder="Marcas, medidas, plazos de entrega, dirección..."></textarea>
            </div>
            <div class="ql-footer">
                <button type="button" class="btn btn-primary ql-whatsapp"><i class="fab fa-whatsapp"></i> Enviar por WhatsApp</button>
                <button type="button" class="btn btn-primary ql-email"><i class="fas fa-envelope"></i> Enviar por correo</button>
                <button type="button" class="link-btn ql-clear">Vaciar lista</button>
            </div>`;
        itemsEl = panel.querySelector('.ql-items');
        emptyEl = panel.querySelector('.ql-empty');
        notesEl = panel.querySelector('.ql-notes');
        notesEl.value = storage.get('localStorage', NOTES_KEY) || '';
        notesEl.addEventListener('input', () => storage.set('localStorage', NOTES_KEY, notesEl.value));

        document.body.append(toggleBtn, backdrop, panel);

        toggleBtn.addEventListener('click', openPanel);
        backdrop.addEventListener('click', closePanel);
        panel.querySelector('.ql-close').addEventListener('click', closePanel);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) closePanel(); });

        itemsEl.addEventListener('change', (e) => {
            if (!e.target.classList.contains('ql-qty')) return;
            const item = list[Number(e.target.dataset.index)];
            if (item) item.qty = Math.max(1, parseInt(e.target.value, 10) || 1);
            saveList();
        });
        itemsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.ql-remove');
            if (!btn) return;
            list.splice(Number(btn.dataset.index), 1);
            saveList();
        });

        panel.querySelector('.ql-whatsapp').addEventListener('click', () => {
            if (!list.length) return toast('Agrega al menos un producto a tu lista');
            window.open(waLink(buildMessage()), '_blank', 'noopener');
        });
        panel.querySelector('.ql-email').addEventListener('click', sendByForm);
        panel.querySelector('.ql-clear').addEventListener('click', () => {
            if (!list.length || !window.confirm('¿Vaciar tu lista de cotización?')) return;
            list = [];
            notesEl.value = '';
            storage.set('localStorage', NOTES_KEY, '');
            saveList();
        });
    }

    function renderList() {
        const total = list.reduce((sum, i) => sum + i.qty, 0);
        countEl.textContent = String(total);
        toggleBtn.hidden = list.length === 0;
        emptyEl.hidden = list.length > 0;
        itemsEl.innerHTML = list.map((i, index) => `
            <li class="ql-item">
                <div class="ql-item-info">
                    <span class="ql-item-name">${esc(i.name)}</span>
                    ${i.category ? `<span class="ql-item-cat">${esc(i.category)}</span>` : ''}
                </div>
                <input type="number" class="ql-qty" min="1" value="${i.qty}" data-index="${index}" aria-label="Cantidad de ${esc(i.name)}">
                <button type="button" class="ql-remove" data-index="${index}" aria-label="Quitar ${esc(i.name)}"><i class="fas fa-trash-alt"></i></button>
            </li>`).join('');
    }

    let lastFocus = null;
    function openPanel() {
        lastFocus = document.activeElement;
        hideBubble();
        backdrop.hidden = false;
        panel.hidden = false;
        document.body.style.overflow = 'hidden';
        panel.querySelector('.ql-close').focus();
    }

    function closePanel() {
        backdrop.hidden = true;
        panel.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function sendByForm() {
        if (!list.length) return toast('Agrega al menos un producto a tu lista');
        const form = document.getElementById('contact-form');
        const message = form && form.querySelector('textarea[name="message"]');
        if (!form || !message) return;
        const text = buildMessage();
        message.value = message.value.trim() ? `${message.value.trim()}\n\n${text}` : text;
        closePanel();
        if (document.body.classList.contains('product-view') && typeof window.exitProductView === 'function') {
            window.exitProductView();
        }
        if (history.replaceState) history.replaceState(null, '', '#contacto');
        requestAnimationFrame(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const first = form.querySelector('input[name="company"]');
            if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
        });
        toast('Completa tus datos y envía el formulario');
    }

    function addButtonsToCategories() {
        getCategories().forEach(({ title, page }) => {
            productItems(page).forEach((li) => {
                const name = li.textContent.trim();
                if (!name || li.querySelector('.ql-add')) return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ql-add';
                btn.setAttribute('aria-label', `Agregar ${name} a mi cotización`);
                btn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i><span>Agregar</span>';
                btn.addEventListener('click', () => {
                    addItem(name, title);
                    btn.classList.add('added');
                    btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Agregado</span>';
                    setTimeout(() => {
                        btn.classList.remove('added');
                        btn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i><span>Agregar</span>';
                    }, 1500);
                });
                li.appendChild(btn);
            });
        });
    }

    /* ---------- Product search ---------- */
    function initSearch() {
        const input = document.getElementById('product-search-input');
        const results = document.getElementById('product-search-results');
        if (!input || !results) return;

        const index = [];
        getCategories().forEach(({ id, title, page }) => {
            productItems(page).forEach((li) => {
                const name = (li.firstChild && li.firstChild.textContent ? li.childNodes[0].textContent : li.textContent).trim();
                if (name) index.push({ name, id, title, key: norm(`${name} ${title}`) });
            });
        });

        let timer;
        const run = () => {
            const raw = input.value.trim();
            const words = norm(raw).split(/\s+/).filter(Boolean);
            if (!raw || norm(raw).length < 2) { results.innerHTML = ''; return; }
            const matches = index.filter((item) => words.every((w) => item.key.includes(w))).slice(0, 8);
            const custom = `<button type="button" class="link-btn search-custom">Agregar «${esc(raw)}» a mi cotización</button>`;
            if (!matches.length) {
                results.innerHTML = `<div class="search-empty"><p>No lo encontramos en nuestras listas, pero lo conseguimos para ti.</p>${custom}</div>`;
                return;
            }
            results.innerHTML = `<ul class="search-results-list">${matches.map((m, i) => `
                <li class="search-result">
                    <span class="search-result-name">${esc(m.name)}</span>
                    <button type="button" class="search-result-cat" data-cat="${esc(m.id)}">${esc(m.title)}</button>
                    <button type="button" class="ql-add" data-match="${i}" aria-label="Agregar ${esc(m.name)} a mi cotización"><i class="fas fa-plus" aria-hidden="true"></i><span>Agregar</span></button>
                </li>`).join('')}</ul><div class="search-more">¿No es lo que buscas? ${custom}</div>`;
            results._matches = matches;
        };

        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 150); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; run(); } });
        results.addEventListener('click', (e) => {
            const cat = e.target.closest('.search-result-cat');
            if (cat) return goToCategory(cat.dataset.cat);
            const add = e.target.closest('.ql-add');
            if (add && results._matches) {
                const m = results._matches[Number(add.dataset.match)];
                if (m) addItem(m.name, m.title);
                return;
            }
            if (e.target.closest('.search-custom')) addItem(input.value.trim(), 'Otro');
        });
    }

    /* ---------- Kits ---------- */
    function initKits() {
        document.querySelectorAll('.kit-card').forEach((card) => {
            const btn = card.querySelector('.kit-quote-btn');
            const title = (card.querySelector('h3') || {}).textContent || 'Kit';
            if (!btn) return;
            btn.addEventListener('click', () => {
                card.querySelectorAll('li').forEach((li) => addItem(li.textContent.trim(), title.trim(), { silent: true }));
                toast(`${title.trim()} agregado a tu cotización`);
                openPanel();
            });
        });
    }

    /* ---------- Campaign banner ---------- */
    function initCampaign() {
        const banner = document.getElementById('campaign-banner');
        if (!banner) return;
        const id = banner.dataset.campaign || 'default';
        if (storage.get('localStorage', CAMPAIGN_KEY) === id) return;
        banner.hidden = false;
        const close = banner.querySelector('.campaign-close');
        if (close) close.addEventListener('click', () => {
            banner.hidden = true;
            storage.set('localStorage', CAMPAIGN_KEY, id);
        });
    }

    /* ---------- WhatsApp: contextual message and greeting ---------- */
    let bubble;
    function currentWhatsAppText() {
        if (document.body.classList.contains('product-view')) {
            const active = document.querySelector('.product-page.active .section-header h2');
            if (active) return `Hola, necesito cotizar productos de ${active.textContent.trim()} para mi empresa`;
        }
        return DEFAULT_WA_TEXT;
    }

    function updateWhatsAppLinks() {
        const href = waLink(currentWhatsAppText());
        document.querySelectorAll('.whatsapp-btn').forEach((a) => { a.href = href; });
    }

    function hideBubble() {
        if (bubble) bubble.hidden = true;
    }

    function initWhatsApp() {
        updateWhatsAppLinks();
        new MutationObserver(updateWhatsAppLinks).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        document.querySelectorAll('.product-page').forEach((page) => {
            new MutationObserver(updateWhatsAppLinks).observe(page, { attributes: true, attributeFilter: ['class'] });
        });

        if (storage.get('sessionStorage', GREETED_KEY)) return;
        setTimeout(() => {
            if (storage.get('sessionStorage', GREETED_KEY) || (panel && !panel.hidden)) return;
            storage.set('sessionStorage', GREETED_KEY, '1');
            bubble = document.createElement('div');
            bubble.className = 'wa-bubble';
            bubble.setAttribute('role', 'button');
            bubble.tabIndex = 0;
            bubble.innerHTML = '<button type="button" class="wa-bubble-close" aria-label="Cerrar">&times;</button><strong>¡Hola!</strong>¿Te ayudamos a cotizar? Escríbenos por WhatsApp.';
            document.body.appendChild(bubble);
            const open = () => { window.open(waLink(currentWhatsAppText()), '_blank', 'noopener'); hideBubble(); };
            bubble.addEventListener('click', (e) => {
                if (e.target.closest('.wa-bubble-close')) { e.stopPropagation(); hideBubble(); return; }
                open();
            });
            bubble.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
        }, 8000);
    }

    function init() {
        buildListUI();
        addButtonsToCategories();
        renderList();
        initSearch();
        initKits();
        initCampaign();
        initWhatsApp();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

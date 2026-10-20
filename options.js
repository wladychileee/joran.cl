// Product options modal: brand/model alternatives grouped by tier, loaded from data/alternativas.json.
// Depends on window.joranQuoteList (features.js).
(function () {
    'use strict';

    const DATA_URL = 'data/alternativas.json?v=20261020';
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let modal, lastFocus, current;

    function productName(li) {
        const node = li.childNodes[0];
        return (node && node.nodeType === Node.TEXT_NODE ? node.textContent : li.textContent).trim();
    }

    function add(name, category) {
        if (window.joranQuoteList) window.joranQuoteList.add(name, category);
    }

    function buildModal() {
        modal = document.createElement('div');
        modal.className = 'opt-modal';
        modal.hidden = true;
        modal.innerHTML = `
            <div class="opt-backdrop"></div>
            <div class="opt-dialog" role="dialog" aria-modal="true" aria-labelledby="opt-title">
                <div class="opt-header">
                    <div>
                        <p class="opt-kicker">Opciones disponibles</p>
                        <h3 id="opt-title"></h3>
                    </div>
                    <button type="button" class="opt-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="opt-body"></div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.opt-backdrop').addEventListener('click', close);
        modal.querySelector('.opt-close').addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
        modal.querySelector('.opt-body').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-add]');
            if (btn) {
                add(btn.dataset.add, current.category);
                btn.classList.add('added');
                btn.textContent = 'Agregado ✓';
                setTimeout(() => { btn.classList.remove('added'); btn.textContent = btn.dataset.label; }, 1500);
                return;
            }
            if (e.target.closest('.opt-custom-btn')) addCustom();
        });
        modal.querySelector('.opt-body').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('opt-custom-input')) { e.preventDefault(); addCustom(); }
        });
    }

    function addCustom() {
        const input = modal.querySelector('.opt-custom-input');
        const value = input.value.trim();
        if (!value) { input.focus(); return; }
        add(`${current.product} — ${value}`, current.category);
        input.value = '';
    }

    function addButton(label, value) {
        return `<button type="button" class="opt-add" data-add="${esc(value)}" data-label="${esc(label)}">${esc(label)}</button>`;
    }

    function open(product, category, info) {
        current = { product, category };
        lastFocus = document.activeElement;
        modal.querySelector('#opt-title').textContent = product;
        const tiers = info.gamas.map((g) => `
            <section class="opt-tier opt-tier-${esc(g.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())}">
                <div class="opt-tier-head">
                    <h4>Gama ${esc(g.nombre)}</h4>
                    ${g.descripcion ? `<p>${esc(g.descripcion)}</p>` : ''}
                </div>
                <div class="opt-cards">
                    ${g.opciones.map((o) => `
                        <div class="opt-card">
                            <div class="opt-card-info">
                                <strong class="opt-brand">${esc(o.marca)}</strong>
                                <span class="opt-model">${esc(o.modelo || '')}</span>
                                ${(o.detalle || []).length ? `<ul>${o.detalle.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
                            </div>
                            ${addButton('Agregar esta opción', `${product} — ${o.marca}${o.modelo ? ' ' + o.modelo : ''}`)}
                        </div>`).join('')}
                </div>
                ${addButton(`Cotizar gama ${g.nombre} (marca a elección)`, `${product} — gama ${g.nombre}`).replace('opt-add', 'opt-add opt-add-tier')}
            </section>`).join('');
        modal.querySelector('.opt-body').innerHTML = `
            ${info.ejemplo ? '<p class="opt-note"><i class="fas fa-info-circle"></i> Marcas de ejemplo (por confirmar). Sujeto a disponibilidad.</p>' : '<p class="opt-note"><i class="fas fa-info-circle"></i> Sujeto a disponibilidad. Te confirmamos precio y stock en la cotización.</p>'}
            ${tiers}
            <div class="opt-custom">
                <label for="opt-custom-input">¿Buscas otra marca o modelo?</label>
                <div class="opt-custom-row">
                    <input type="text" id="opt-custom-input" class="opt-custom-input" placeholder="Ej: marca, modelo, medida...">
                    <button type="button" class="btn btn-primary opt-custom-btn">Agregar</button>
                </div>
            </div>`;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        modal.querySelector('.opt-body').scrollTop = 0;
        modal.querySelector('.opt-close').focus();
    }

    function close() {
        modal.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function decorate(data) {
        const products = (data && data.productos) || {};
        document.querySelectorAll('.product-page').forEach((page) => {
            const h2 = page.querySelector('.section-header h2');
            const category = h2 ? h2.textContent.trim() : '';
            page.querySelectorAll('li').forEach((li) => {
                if (li.closest('.section-quick-links') || li.querySelector('.opt-open')) return;
                const name = productName(li);
                const info = products[name];
                if (!info || !Array.isArray(info.gamas) || !info.gamas.length) return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'opt-open';
                btn.setAttribute('aria-label', `Ver marcas y modelos de ${name}`);
                btn.innerHTML = '<i class="fas fa-layer-group" aria-hidden="true"></i><span>Opciones</span>';
                btn.addEventListener('click', () => open(name, category, info));
                const addBtn = li.querySelector('.ql-add');
                li.insertBefore(btn, addBtn || null);
                li.classList.add('has-options');
            });
        });
    }

    function init() {
        buildModal();
        fetch(DATA_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then(decorate)
            .catch(() => { /* options are optional */ });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

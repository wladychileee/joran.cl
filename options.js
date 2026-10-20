// Brand/model alternatives by tier, loaded from data/alternativas.json.
// Depends on window.joranQuoteList (features.js).
(function () {
    'use strict';

    const DATA_URL = 'data/alternativas.json?v=20261020k';
    const TIERS = {
        economica: { icon: 'fa-tag', label: 'Económica' },
        estandar: { icon: 'fa-check-circle', label: 'Estándar' },
        premium: { icon: 'fa-crown', label: 'Premium' },
        cementos: { icon: 'fa-cubes', label: 'Cementos' },
        'morteros y hormigones': { icon: 'fa-fill-drip', label: 'Morteros y hormigones' },
        adhesivos: { icon: 'fa-th-large', label: 'Adhesivos' },
        martillos: { icon: 'fa-hammer', label: 'Martillos' }
    };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let modal, body, lastFocus, current, products = {};

    function productName(li) {
        const clone = li.cloneNode(true);
        clone.querySelectorAll('button').forEach((b) => b.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function initials(brand) {
        const words = brand.replace(/[()]/g, '').split(/[\s+/-]+/).filter(Boolean);
        return (words.length > 1 ? words[0][0] + words[1][0] : brand.slice(0, 2)).toUpperCase();
    }

    function hue(brand) {
        let h = 0;
        for (const c of brand) h = (h * 31 + c.charCodeAt(0)) % 360;
        return h;
    }

    function add(name, btn) {
        if (!window.joranQuoteList) return;
        window.joranQuoteList.add(name, current.category);
        if (btn) {
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Agregado';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = btn.dataset.html;
            }, 1600);
        }
    }

    function buildModal() {
        modal = document.createElement('div');
        modal.className = 'opt-modal';
        modal.hidden = true;
        modal.innerHTML = `
            <div class="opt-backdrop"></div>
            <div class="opt-dialog" role="dialog" aria-modal="true" aria-labelledby="opt-title">
                <header class="opt-header">
                    <div class="opt-header-text">
                        <p class="opt-kicker"></p>
                        <h3 id="opt-title"></h3>
                        <p class="opt-summary"></p>
                    </div>
                    <button type="button" class="opt-close" aria-label="Cerrar"><i class="fas fa-times" aria-hidden="true"></i></button>
                </header>
                <div class="opt-filters" role="tablist" aria-label="Filtrar por gama"></div>
                <div class="opt-body"></div>
                <footer class="opt-footer">
                    <label for="opt-custom-input">¿Buscas otra marca o modelo?</label>
                    <div class="opt-custom-row">
                        <input type="text" id="opt-custom-input" class="opt-custom-input" placeholder="Ej: marca, modelo o medida" autocomplete="off">
                        <button type="button" class="opt-custom-btn"><i class="fas fa-plus" aria-hidden="true"></i><span>Agregar</span></button>
                    </div>
                    <button type="button" class="opt-view-list"><i class="fas fa-clipboard-list" aria-hidden="true"></i> Ver mi cotización</button>
                </footer>
            </div>`;
        document.body.appendChild(modal);
        body = modal.querySelector('.opt-body');

        modal.querySelector('.opt-backdrop').addEventListener('click', close);
        modal.querySelector('.opt-close').addEventListener('click', close);
        modal.querySelector('.opt-view-list').addEventListener('click', () => {
            close();
            if (window.joranQuoteList) window.joranQuoteList.open();
        });
        modal.querySelector('.opt-custom-btn').addEventListener('click', addCustom);
        modal.querySelector('.opt-custom-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
        });
        modal.querySelector('.opt-filters').addEventListener('click', (e) => {
            const chip = e.target.closest('[data-filter]');
            if (chip) filter(chip.dataset.filter);
        });
        body.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-add]');
            if (btn) add(btn.dataset.add, btn);
        });
        document.addEventListener('keydown', (e) => {
            if (modal.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'Tab') trapFocus(e);
        });
    }

    function trapFocus(e) {
        const items = [...modal.querySelectorAll('button, input')].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function addCustom() {
        const input = modal.querySelector('.opt-custom-input');
        const value = input.value.trim();
        if (!value) { input.focus(); return; }
        add(`${current.product} — ${value}`);
        input.value = '';
    }

    function filter(key) {
        modal.querySelectorAll('.opt-chip').forEach((c) => {
            const on = c.dataset.filter === key;
            c.classList.toggle('active', on);
            c.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        body.querySelectorAll('.opt-tier').forEach((t) => { t.hidden = key !== 'all' && t.dataset.tier !== key; });
        body.scrollTop = 0;
    }

    function addBtn(html, value, cls) {
        return `<button type="button" class="${cls}" data-add="${esc(value)}" data-html="${esc(html)}">${html}</button>`;
    }

    function card(product, o) {
        const label = `${o.marca}${o.modelo ? ' ' + o.modelo : ''}`;
        const models = o.modelos || [];
        const list = models.length ? `
                <details class="opt-models">
                    <summary><span>Ver los ${models.length} modelos</span><i class="fas fa-chevron-down" aria-hidden="true"></i></summary>
                    <ul class="opt-model-list">${models.map((md) => `
                        <li>
                            <div class="opt-model-info">
                                <strong>${esc(md.nombre)}</strong>
                                ${(md.specs || []).length ? `<span>${md.specs.map(esc).join(' · ')}</span>` : ''}
                            </div>
                            ${addBtn('<i class="fas fa-plus" aria-hidden="true"></i> Agregar', `${product} — ${o.marca} ${md.nombre}`, 'opt-add-model')}
                        </li>`).join('')}
                    </ul>
                    ${o.fuente ? `<a class="opt-source" href="${esc(o.fuente)}" target="_blank" rel="noopener">Ver catálogo oficial de ${esc(o.marca)} <i class="fas fa-external-link-alt" aria-hidden="true"></i></a>` : ''}
                </details>` : '';
        return `
            <article class="opt-card${models.length ? ' opt-card-wide' : ''}">
                <div class="opt-card-top">
                    <span class="opt-avatar" style="--h:${hue(o.marca)}" aria-hidden="true">${esc(initials(o.marca))}</span>
                    <div class="opt-card-title">
                        <strong class="opt-brand">${esc(o.marca)}</strong>
                        ${o.modelo ? `<span class="opt-model">${esc(o.modelo)}</span>` : ''}
                    </div>
                </div>
                ${(o.detalle || []).length ? `<ul class="opt-tags">${o.detalle.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
                ${models.length
                    ? addBtn('<i class="fas fa-plus" aria-hidden="true"></i> Agregar marca', `${product} — ${o.marca} (modelo a recomendar)`, 'opt-add')
                    : addBtn('<i class="fas fa-plus" aria-hidden="true"></i> Agregar', `${product} — ${label}`, 'opt-add')}
                ${list}
            </article>`;
    }

    function open(product, category, info) {
        current = { product, category };
        lastFocus = document.activeElement;
        const brands = new Set();
        let models = 0;
        info.gamas.forEach((g) => g.opciones.forEach((o) => { brands.add(o.marca); models += (o.modelos || []).length; }));

        modal.querySelector('.opt-kicker').textContent = category || 'Opciones';
        modal.querySelector('#opt-title').textContent = product;
        modal.querySelector('.opt-summary').textContent =
            `${brands.size} ${brands.size === 1 ? 'marca' : 'marcas'} en ${info.gamas.length} ${info.gamas.length === 1 ? 'gama' : 'gamas'}` +
            (models ? ` · ${models} modelos` : '');

        modal.querySelector('.opt-filters').innerHTML =
            '<button type="button" class="opt-chip active" role="tab" aria-selected="true" data-filter="all">Todas</button>' +
            info.gamas.map((g) => {
                const key = slug(g.nombre);
                const t = TIERS[key] || { icon: 'fa-circle' };
                return `<button type="button" class="opt-chip opt-chip-${esc(key)}" role="tab" aria-selected="false" data-filter="${esc(key)}"><i class="fas ${t.icon}" aria-hidden="true"></i> ${esc(g.nombre)}</button>`;
            }).join('');

        body.innerHTML = `
            <p class="opt-note"><i class="fas fa-info-circle" aria-hidden="true"></i>
                ${info.ejemplo ? 'Marcas de ejemplo (por confirmar).' : 'Marcas de referencia que se comercializan en Chile.'}
                Precio y disponibilidad se confirman en tu cotización.</p>
            ${info.gamas.map((g) => {
                const key = slug(g.nombre);
                const t = TIERS[key] || { icon: 'fa-circle' };
                const badge = ['economica', 'estandar', 'premium'].includes(key) ? `Gama ${esc(g.nombre)}` : esc(g.nombre);
                return `
                <section class="opt-tier opt-tier-${esc(key)}" data-tier="${esc(key)}">
                    <div class="opt-tier-head">
                        <span class="opt-tier-badge"><i class="fas ${t.icon}" aria-hidden="true"></i> ${badge}</span>
                        ${g.descripcion ? `<p>${esc(g.descripcion)}</p>` : ''}
                    </div>
                    <div class="opt-cards">${g.opciones.map((o) => card(product, o)).join('')}</div>
                    ${addBtn(`<i class="fas fa-random" aria-hidden="true"></i> Cotizar ${badge.startsWith('Gama') ? 'gama ' + esc(g.nombre) : esc(g.nombre.toLowerCase())} con la marca que nos recomiendes`, `${product} — ${g.nombre} (marca a elección)`, 'opt-add-tier')}
                </section>`;
            }).join('')}`;

        modal.querySelector('.opt-custom-input').value = '';
        modal.hidden = false;
        document.body.classList.add('opt-lock');
        requestAnimationFrame(() => modal.classList.add('open'));
        body.scrollTop = 0;
        modal.querySelector('.opt-close').focus();
    }

    function close() {
        modal.classList.remove('open');
        modal.hidden = true;
        document.body.classList.remove('opt-lock');
        if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) lastFocus.focus();
    }

    function makeButton(name, category) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt-open';
        btn.setAttribute('aria-label', `Ver marcas y modelos de ${name}`);
        btn.innerHTML = '<i class="fas fa-layer-group" aria-hidden="true"></i><span>Ver marcas</span>';
        btn.addEventListener('click', () => open(name, category, products[name]));
        return btn;
    }

    function decorateItem(li, name, category) {
        if (li.querySelector('.opt-open') || !products[name]) return;
        li.insertBefore(makeButton(name, category), li.querySelector('.ql-add'));
        li.classList.add('has-options');
    }

    function decoratePages() {
        document.querySelectorAll('.product-page').forEach((page) => {
            const h2 = page.querySelector('.section-header h2');
            const category = h2 ? h2.textContent.trim() : '';
            page.querySelectorAll('li').forEach((li) => {
                if (!li.closest('.section-quick-links')) decorateItem(li, productName(li), category);
            });
            const header = page.querySelector('.section-header');
            if (header && !header.querySelector('.opt-hint') && page.querySelector('.opt-open')) {
                header.insertAdjacentHTML('beforeend', '<p class="opt-hint"><i class="fas fa-layer-group" aria-hidden="true"></i> Toca <strong>Ver marcas</strong> para comparar marcas y modelos por gama.</p>');
            }
        });
    }

    function decorateSearch() {
        const results = document.getElementById('product-search-results');
        if (!results) return;
        const run = () => results.querySelectorAll('.search-result').forEach((li) => {
            const name = li.querySelector('.search-result-name');
            const cat = li.querySelector('.search-result-cat');
            if (name) decorateItem(li, name.textContent.trim(), cat ? cat.textContent.trim() : '');
        });
        new MutationObserver(run).observe(results, { childList: true, subtree: true });
        run();
    }

    function init() {
        buildModal();
        fetch(DATA_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                products = (data && data.productos) || {};
                decoratePages();
                decorateSearch();
            })
            .catch(() => { /* options are optional */ });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

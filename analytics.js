(function () {
    var ID = 'G-1N789GWF29';
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);

    var txt = function (el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100); };
    var send = function (name, params) { try { gtag('event', name, params || {}); } catch (_) {} };

    var open = window.open;
    window.open = function (url) {
        if (typeof url === 'string' && url.indexOf('wa.me') !== -1) send('whatsapp_click', { origen: 'boton' });
        return open.apply(window, arguments);
    };

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (a) {
            var h = a.getAttribute('href');
            if (h.indexOf('wa.me') !== -1) return send('whatsapp_click', { origen: txt(a) || 'enlace' });
            if (h.indexOf('mailto:') === 0) return send('contact_click', { metodo: 'email' });
            if (h.indexOf('tel:') === 0) return send('contact_click', { metodo: 'telefono' });
        }
        var b = e.target.closest && e.target.closest('button');
        if (!b) return;
        if (b.classList.contains('opt-open')) {
            var li = b.closest('li'), c = li ? li.cloneNode(true) : null;
            if (c) c.querySelectorAll('button, img').forEach(function (n) { n.remove(); });
            return send('ver_marcas', { producto: txt(c) });
        }
        if (/agregar/i.test(txt(b))) {
            var item = b.getAttribute('data-add') || txt(b.closest('li'));
            send('add_to_quote', { producto: item.slice(0, 100) });
        }
    }, true);

    document.addEventListener('submit', function (e) {
        var f = e.target;
        send('generate_lead', { formulario: f.id || f.getAttribute('name') || 'formulario' });
    }, true);
})();

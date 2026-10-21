"""Genera páginas estáticas por categoría (productos/<categoria>/) y sitemap.xml
a partir de index.html y data/alternativas.json. Ejecutar desde la raíz:
    python3 tools/generar_paginas.py
"""
import html
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://joran.cl'
WA = '56962378434'
MAX_MODELS = 6

INTRO = {
    'construccion': 'Herramientas eléctricas y manuales, cementos, morteros, volcanitas, aislantes, pinturas, fijaciones y materiales de obra para empresas y constructoras.',
    'medicos': 'Insumos y equipos médicos para empresas, clínicas, colegios y botiquines: tensiómetros, termómetros, oxímetros, DEA, guantes, mascarillas, jeringas y más.',
    'oficina': 'Artículos de oficina para empresas: papel, tóner, calculadoras, archivadores, rotuladoras, corcheteras, bolígrafos y organizadores.',
    'muebles': 'Muebles de oficina: sillas ergonómicas, escritorios, mesas de reunión, archivadores, casilleros, estanterías, cajas fuertes y recepción.',
    'electrodomesticos': 'Electrodomésticos para oficina: televisores de 50", refrigeradores y frigobares, microondas, cafeteras, hervidores, dispensadores de agua y aire acondicionado.',
    'libreria': 'Librería para oficina: resaltadores, plumones, timbres, correctores, notas adhesivas, carpetas, cuadernos y útiles de escritorio.',
    'desbrozadoras': 'Desbrozadoras, desmalezadoras y orilladoras a bencina, batería y eléctricas, con accesorios y repuestos para mantención de áreas verdes.',
}


class BlockParser(HTMLParser):
    """Lee título, subtítulo, grupos (h4) y productos (li) de un bloque .product-page."""

    def __init__(self, cat_id):
        super().__init__()
        self.cat = {'id': cat_id, 'title': '', 'sub': '', 'groups': []}
        self.tag = None
        self.buf = ''
        self.in_header = False

    def handle_starttag(self, tag, attrs):
        if tag == 'div' and 'section-header' in (dict(attrs).get('class') or ''):
            self.in_header = True
        if tag in ('h2', 'h4', 'li') or (tag == 'p' and self.in_header):
            self.tag, self.buf = tag, ''

    def handle_endtag(self, tag):
        if tag != self.tag:
            return
        c = self.cat
        text = re.sub(r'\s+', ' ', self.buf).strip()
        if tag == 'h2' and not c['title']:
            c['title'] = text
        elif tag == 'p' and self.in_header:
            c['sub'] = c['sub'] or text
            self.in_header = False
        elif tag == 'h4' and text:
            c['groups'].append({'name': text.rstrip(':'), 'items': []})
        elif tag == 'li' and text:
            if not c['groups']:
                c['groups'].append({'name': '', 'items': []})
            c['groups'][-1]['items'].append(text)
        self.tag = None

    def handle_data(self, data):
        if self.tag:
            self.buf += data


def parse_categories(src):
    marks = list(re.finditer(r'<div id="([a-z]+)-page" class="product-page">', src))
    cats = []
    for i, m in enumerate(marks):
        block = src[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(src)]
        block = block.split('file-upload-section')[0]
        bp = BlockParser(m.group(1))
        bp.feed(block)
        cats.append(bp.cat)
    return cats


e = lambda s: html.escape(str(s), quote=True)


def wa_link(text):
    return f'https://wa.me/{WA}?text={quote(text)}'


def model_item(brand, m):
    pic = ''
    if m.get('foto'):
        pic = f'<img src="/{e(m["foto"])}" alt="{e(brand)} {e(m["nombre"])}" loading="lazy" width="56" height="56">'
    specs = f'<small>{e(" · ".join(m["specs"][:3]))}</small>' if m.get('specs') else ''
    return f'<li>{pic}<span><strong>{e(m["nombre"])}</strong>{specs}</span></li>'


def product_block(cat, name, info, logos):
    brands = []
    if info:
        for g in info['gamas']:
            for o in g['opciones']:
                models = o.get('modelos') or []
                pics = [o.get('foto')] + [m.get('foto') for m in models]
                pics = [p for p in pics if p]
                items = ''.join(model_item(o['marca'], m) for m in models[:MAX_MODELS])
                more = f'<p class="more">+ {len(models) - MAX_MODELS} modelos más en la ficha</p>' if len(models) > MAX_MODELS else ''
                logo = logos.get(o['marca'])
                head = (f'<img class="logo" src="/{e(logo)}" alt="{e(o["marca"])}" loading="lazy">' if logo else '') + \
                       f'<div><h4>{e(o["marca"])}</h4><span class="tier">{e(g["nombre"])}</span></div>'
                photo = f'<img class="hero" src="/{e(pics[0])}" alt="{e(o["marca"])} {e(name)}" loading="lazy">' if pics and not models else ''
                desc = f'<p class="model">{e(o["modelo"])}</p>' if o.get('modelo') and not models else ''
                tags = ''.join(f'<li>{e(d)}</li>' for d in o.get('detalle', [])[:4])
                brands.append(f'<article class="brand"><header>{head}</header>{photo}{desc}'
                              f'{"<ul class=tags>" + tags + "</ul>" if tags else ""}'
                              f'{"<ul class=models>" + items + "</ul>" if items else ""}{more}</article>')
    img = f'<img class="prod-img" src="/{e(info["foto"])}" alt="{e(name)}" loading="lazy" width="120" height="120">' if info and info.get('foto') else ''
    return f'''
        <section class="product" id="{e(re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"))}">
            <div class="product-head">{img}<div><h3>{e(name)}</h3>
                <div class="cta"><a class="btn" href="/#{cat}"><i class="fas fa-clipboard-list"></i> Cotizar en el catálogo</a>
                <a class="btn wa" href="{e(wa_link(f"Hola, necesito cotizar {name} para mi empresa"))}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Cotizar por WhatsApp</a></div></div></div>
            {"<div class=brands>" + "".join(brands) + "</div>" if brands else ""}
        </section>'''


def page(cat, cats, products, logos):
    c = next(x for x in cats if x['id'] == cat)
    lookup = lambda n: products.get(f"{c['title']} · {n}") or products.get(n)
    intro = INTRO.get(cat, c['sub'])
    names = [n for g in c['groups'] for n in g['items']]
    brand_names = sorted({o['marca'] for n in names if lookup(n) for g in lookup(n)['gamas'] for o in g['opciones']
                          if not re.search(r'gen[ée]ric|fabricaci|importad|compatible|confecci|[áa]ridos|varias', o['marca'], re.I)})
    title = f"{c['title']} para empresas en Chile | PRODUCTOS JORAN SPA"
    desc = f"{intro} Despacho a todo Chile en 48 horas y pago a crédito para empresas."[:300]
    url = f'{SITE}/productos/{cat}/'
    first_img = next((lookup(n)['foto'] for n in names if lookup(n) and lookup(n).get('foto')), None)
    ld = [{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Productos', 'item': SITE + '/productos/'},
            {'@type': 'ListItem', 'position': 3, 'name': c['title'], 'item': url}]
    }, {
        '@context': 'https://schema.org', '@type': 'ItemList', 'name': c['title'],
        'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n} for i, n in enumerate(names)]
    }]
    groups = ''.join(
        (f'<h2 class="group">{e(g["name"])}</h2>' if g['name'] else '') + ''.join(product_block(cat, n, lookup(n), logos) for n in g['items'])
        for g in c['groups'])
    toc = ''.join(f'<a href="#{e(re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-"))}">{e(n)}</a>' for n in names)
    nav = ''.join(f'<a href="/productos/{x["id"]}/"{" aria-current=page" if x["id"] == cat else ""}>{e(x["title"])}</a>' for x in cats)
    return layout(title, desc, url, first_img, ld, f'''
    <section class="intro">
        <nav class="crumbs"><a href="/">Inicio</a> › <a href="/productos/">Productos</a> › <span>{e(c["title"])}</span></nav>
        <h1>{e(c["title"])} para empresas</h1>
        <p>{e(intro)}</p>
        <ul class="perks"><li><i class="fas fa-truck"></i> Despacho a todo Chile en 48 horas</li><li><i class="fas fa-file-invoice-dollar"></i> Pago a crédito previa verificación</li><li><i class="fas fa-clipboard-check"></i> Cotización personalizada</li></ul>
        {f'<p class="brandline"><strong>Marcas:</strong> {e(", ".join(brand_names))}</p>' if brand_names else ''}
        <div class="toc">{toc}</div>
    </section>
    {groups}
    <nav class="cats"><h2>Otras categorías</h2>{nav}</nav>''')


def layout(title, desc, url, img, ld, body):
    og = f'{SITE}/{img}' if img else f'{SITE}/logo.png'
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{e(title)}</title>
    <meta name="description" content="{e(desc)}">
    <link rel="canonical" href="{url}">
    <meta property="og:title" content="{e(title)}">
    <meta property="og:description" content="{e(desc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{og}">
    <meta property="og:locale" content="es_CL">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/logo.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="/productos/catalogo.css?v=1">
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
    <header class="top"><div class="wrap">
        <a class="brand-home" href="/"><img src="/logo.png" alt="PRODUCTOS JORAN SPA" width="40" height="40"><span>PRODUCTOS JORAN SPA</span></a>
        <nav><a href="/productos/">Productos</a><a href="/#contacto">Contacto</a><a class="btn wa" href="{e(wa_link("Hola, necesito cotizar productos para mi empresa"))}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a></nav>
    </div></header>
    <main class="wrap">{body}
    </main>
    <footer class="foot"><div class="wrap">
        <p><strong>PRODUCTOS JORAN SPA</strong> · Todo lo que tu empresa necesita, cuando lo necesita</p>
        <p><a href="mailto:cotizaciones@joran.cl"><i class="fas fa-envelope"></i> cotizaciones@joran.cl</a> · <a href="tel:+56962378434"><i class="fas fa-phone"></i> +56 9 6237 8434</a> · 4 Norte 1070, Viña del Mar</p>
        <p class="small">Imágenes referenciales. Precio y disponibilidad se confirman en la cotización.</p>
    </div></footer>
    <a class="wa-float" href="{e(wa_link("Hola, necesito cotizar productos para mi empresa"))}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
</body>
</html>
'''


def index_page(cats, products):
    cards = ''
    for c in cats:
        lookup = lambda n: products.get(f"{c['title']} · {n}") or products.get(n)
        names = [n for g in c['groups'] for n in g['items']]
        pics = [lookup(n)['foto'] for n in names if lookup(n) and lookup(n).get('foto')][:4]
        cards += (f'<a class="cat-card" href="/productos/{c["id"]}/"><div class="pics">'
                  + ''.join(f'<img src="/{e(p)}" alt="" loading="lazy">' for p in pics)
                  + f'</div><h2>{e(c["title"])}</h2><p>{e(INTRO.get(c["id"], c["sub"]))}</p><span>{len(names)} productos <i class="fas fa-arrow-right"></i></span></a>')
    ld = [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Productos', 'item': SITE + '/productos/'}]}]
    return layout('Catálogo de productos para empresas | PRODUCTOS JORAN SPA',
                  'Catálogo de suministros para empresas en Chile: construcción, insumos médicos, oficina, muebles, electrodomésticos, librería y desbrozadoras. Despacho nacional en 48 horas.',
                  SITE + '/productos/', None, ld, f'''
    <section class="intro"><nav class="crumbs"><a href="/">Inicio</a> › <span>Productos</span></nav>
        <h1>Catálogo de productos para empresas</h1>
        <p>Elige una categoría para ver marcas, modelos y cotizar. Despacho a todo Chile en 48 horas y pago a crédito previa verificación.</p></section>
    <div class="cat-grid">{cards}</div>''')


def main():
    cats = [c for c in parse_categories((ROOT / 'index.html').read_text(encoding='utf-8')) if c['groups']]
    data = json.loads((ROOT / 'data/alternativas.json').read_text(encoding='utf-8'))
    products, logos = data['productos'], data.get('logos', {})
    out = ROOT / 'productos'
    for c in cats:
        d = out / c['id']
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(page(c['id'], cats, products, logos), encoding='utf-8')
    (out / 'index.html').write_text(index_page(cats, products), encoding='utf-8')
    today = date.today().isoformat()
    urls = [SITE + '/', SITE + '/productos/'] + [f'{SITE}/productos/{c["id"]}/' for c in cats]
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n  </url>\n' for u in urls)
        + '</urlset>\n', encoding='utf-8')
    print(len(cats), 'categorías:', ', '.join(f"{c['id']} ({sum(len(g['items']) for g in c['groups'])})" for c in cats))


if __name__ == '__main__':
    main()

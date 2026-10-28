"""Genera el logo (fábrica sobre el mundo): logo.svg, logo-claro.svg, logo-icono.svg y logo-icono-claro.svg.

Requiere:
- Montserrat variable: https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf
- Natural Earth 1:110m (dominio público): ne_110m_land.geojson y ne_110m_admin_0_countries.geojson
  de https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
Uso: MONTSERRAT=/ruta/Montserrat.ttf NE_DIR=/ruta/geojson python3 tools/generar_logo.py
Los PNG (logo.png, favicon-32.png, apple-touch-icon.png, og-image.png) se exportan desde estos SVG.
"""
import json, math, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = os.environ.get('MONTSERRAT', os.path.expanduser('~/fonts/Montserrat.ttf'))
NE = os.environ.get('NE_DIR', os.path.expanduser('~/logo/geo'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

_fonts = {}
def text_path(s, w, size, cx, baseline, track=0):
    if w not in _fonts:
        _fonts[w] = instantiateVariableFont(TTFont(FONT), {'wght': w})
    f = _fonts[w]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); sc = size / f['head'].unitsPerEm
    names = [cmap[ord(c)] for c in s]
    adv = [f['hmtx'][n][0] * sc + track for n in names]
    x = cx - (sum(adv) - track) / 2
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, x, baseline))); x += a
    return pen.getCommands()

def rings(fname):
    out = []
    for feat in json.load(open(os.path.join(NE, fname)))['features']:
        g = feat['geometry']
        for poly in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']):
            out += poly
    return out

def densify(ring, step=1.5):
    o = []
    for (a, b), (c, d) in zip(ring, ring[1:] + ring[:1]):
        n = 1 if abs(c - a) > 180 else max(1, int(max(abs(c - a), abs(d - b)) / step))
        o += [(a + (c - a) * i / n, b + (d - b) * i / n) for i in range(n)]
    return o

def ortho(lon, lat, lon0, lat0):
    l, p, l0, p0 = map(math.radians, (lon, lat, lon0, lat0))
    x = math.cos(p) * math.sin(l - l0)
    y = math.cos(p0) * math.sin(p) - math.sin(p0) * math.cos(p) * math.cos(l - l0)
    visible = math.sin(p0) * math.sin(p) + math.cos(p0) * math.cos(p) * math.cos(l - l0) >= 0
    if not visible:  # hidden points are pushed onto the rim; the circle clipPath does the rest
        n = math.hypot(x, y) or 1; x, y = x / n, y / n
    return x, y, visible

def map_path(rs, cx, cy, r, lon0, lat0):
    ds = []
    for ring in rs:
        pts = [ortho(a, b, lon0, lat0) for a, b in densify(ring)]
        if not any(v for _, _, v in pts): continue
        P = [(cx + r * x, cy - r * y) for x, y, _ in pts]
        if abs(sum(P[i][0] * P[i-1][1] - P[i-1][0] * P[i][1] for i in range(len(P)))) / 2 < r * r * 0.0004: continue
        ds.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in P) + 'Z')
    return ''.join(ds)

LAND, COUNTRIES = rings('ne_110m_land.geojson'), rings('ne_110m_admin_0_countries.geojson')
def globe(cid, cx, cy, r, ocean, land, lon0=-38, lat0=14):
    return (f'<clipPath id="{cid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath><g clip-path="url(#{cid})">'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{ocean}"/>'
            f'<path fill="{land}" d="{map_path(LAND, cx, cy, r, lon0, lat0)}"/>'
            f'<path fill="none" stroke="{ocean}" stroke-width="{r/110:.2f}" stroke-linejoin="round" d="{map_path(COUNTRIES, cx, cy, r, lon0, lat0)}"/></g>')

def factory(d, a, c, tx, ty, s):
    return f'''<g transform="translate({tx} {ty}) scale({s}) translate(-300 -298)">
  <g fill="none" stroke="{a}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M232 112 V82 Q232 64 250 64 H382"/><path d="M352 140 V122 Q352 106 368 106 H452"/></g>
  <g fill="{d}"><path d="M206 128 H286 L296 244 H196 Z"/><rect x="198" y="118" width="96" height="22" rx="6"/><path d="M322 156 H398 L408 244 H312 Z"/><rect x="314" y="146" width="92" height="22" rx="6"/><rect x="160" y="236" width="280" height="62" rx="12"/></g>
  <g fill="{c}"><rect x="188" y="258" width="40" height="18" rx="9"/><rect x="248" y="258" width="40" height="18" rx="9"/><rect x="312" y="258" width="40" height="18" rx="9"/><rect x="372" y="258" width="40" height="18" rx="9"/></g></g>'''

THEMES = {
    '':       dict(d='#2a3138', a='#2f6f6a', c='#ffffff', sub='#5b6670', ocean='#2f6f6a', land='#dcebe8'),
    '-claro': dict(d='#f4f3ef', a='#7fb5ae', c='#2c333b', sub='#c9cfd4', ocean='#5f9d96', land='#f4f3ef'),
}
def mark(t, cid):
    return globe(cid, 200, 268, 124, t['ocean'], t['land']) + factory(t['d'], t['a'], t['c'], 200, 206, 0.68)

for suf, t in THEMES.items():
    name = text_path('PRODUCTOS JORAN SPA', 700, 26, 200, 462, 0.8)
    tag = text_path('TODO EN UN MISMO LUGAR', 600, 14, 200, 494, 3)
    full = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 400 500" role="img" aria-label="PRODUCTOS JORAN SPA">'
            f'<title>PRODUCTOS JORAN SPA</title>{mark(t, "g")}<path fill="{t["d"]}" d="{name}"/><path fill="{t["sub"]}" d="{tag}"/></svg>\n')
    icon = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="66 36 268 368" role="img" aria-label="PRODUCTOS JORAN SPA">'
            f'<title>PRODUCTOS JORAN SPA</title>{mark(t, "g")}</svg>\n')
    open(os.path.join(OUT, f'logo{suf}.svg'), 'w').write(full)
    open(os.path.join(OUT, f'logo-icono{suf}.svg'), 'w').write(icon)

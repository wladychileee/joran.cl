"""Genera logo.svg, logo-claro.svg, logo-icono.svg y logo-icono-claro.svg en la raíz del sitio.

Requiere Montserrat (variable): https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf
Uso: MONTSERRAT=/ruta/Montserrat.ttf python3 tools/generar_logo.py
Los PNG (logo.png, favicon-32.png, apple-touch-icon.png, og-image.png) se exportan desde estos SVG.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
FONT = os.environ.get('MONTSERRAT', os.path.expanduser('~/fonts/Montserrat.ttf'))
_cache = {}
def font(w):
    if w not in _cache:
        _cache[w] = instantiateVariableFont(TTFont(FONT), {'wght': w})
    return _cache[w]
def text_path(s, w, size, cx, baseline, track=0):
    f = font(w); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    hmtx = f['hmtx']; sc = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [hmtx[n][0] * sc + track for n in names]
    total = sum(adv) - track
    x = cx - total / 2
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        tp = TransformPen(pen, (sc, 0, 0, -sc, x, baseline))
        gs[n].draw(tp); x += a
    return pen.getCommands(), total

def mark(dark, accent, cut):
    # factory icon in a 600-wide space, top region y 40..290
    return f'''
  <g fill="none" stroke="{accent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
    <path d="M232 112 V82 Q232 64 250 64 H382"/>
    <path d="M352 140 V122 Q352 106 368 106 H452"/>
  </g>
  <g fill="{dark}">
    <path d="M206 128 H286 L296 244 H196 Z"/>
    <rect x="198" y="118" width="96" height="22" rx="6"/>
    <path d="M322 156 H398 L408 244 H312 Z"/>
    <rect x="314" y="146" width="92" height="22" rx="6"/>
    <rect x="160" y="236" width="280" height="62" rx="12"/>
  </g>
  <g fill="{cut}">
    <rect x="188" y="258" width="40" height="18" rx="9"/>
    <rect x="248" y="258" width="40" height="18" rx="9"/>
    <rect x="312" y="258" width="40" height="18" rx="9"/>
    <rect x="372" y="258" width="40" height="18" rx="9"/>
  </g>'''

def full(dark, accent, cut, sub):
    name, _ = text_path('PRODUCTOS JORAN SPA', 700, 40, 300, 362, 1.2)
    tag, _ = text_path('TODO EN UN MISMO LUGAR', 600, 21, 300, 540, 4.5)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="PRODUCTOS JORAN SPA - Todo en un mismo lugar">
  <title>PRODUCTOS JORAN SPA</title>{mark(dark, accent, cut)}
  <path fill="{dark}" d="{name}"/>
  <path fill="{accent}" d="M96 404 Q300 386 504 404 Q520 406 524 422 L540 486 Q542 498 528 498 H72 Q58 498 60 486 L76 422 Q80 406 96 404 Z"/>
  <path fill="none" stroke="{cut}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M66 446 L150 432 L188 462 L176 498 M236 396 L262 430 L238 458 L300 474 L326 498 M402 395 L382 424 L430 446 L418 474 L470 498"/>
  <path fill="{sub}" d="{tag}"/>
</svg>
'''
def icon(dark, accent, cut):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="140 44 320 270" role="img" aria-label="PRODUCTOS JORAN SPA">{mark(dark, accent, cut)}
</svg>
'''
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
open(f'{out}/logo.svg','w').write(full('#2a3138', '#2f6f6a', '#ffffff', '#5b6670'))
open(f'{out}/logo-claro.svg','w').write(full('#f4f3ef', '#7fb5ae', '#2c333b', '#c9cfd4'))
open(f'{out}/logo-icono.svg','w').write(icon('#2a3138', '#2f6f6a', '#ffffff'))
open(f'{out}/logo-icono-claro.svg','w').write(icon('#f4f3ef', '#7fb5ae', '#2c333b'))

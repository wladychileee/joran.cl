# PRODUCTOS JORAN SPA

Sitio web estático publicado con GitHub Pages.

URL pública: https://joran.cl/

## Estructura del proyecto
- `index.html`: Página principal y páginas internas (productos) + formularios.
- `styles.min.css`: Estilos globales que carga la página (`styles.css` es la versión sin minificar; si editas `styles.css`, vuelve a generar `styles.min.css`).
- `overrides.css`: Ajustes de estilo adicionales (versión móvil, mapa, contacto). Es el lugar más simple para agregar CSS nuevo.
- `script.js`: Comportamiento de navegación, modales y utilidades. Cada categoría tiene un enlace directo, p. ej. `https://joran.cl/#construccion`.
- `logo.png`: Logo usado como favicon y en cabecera.

## Formularios (FormSubmit)
Los formularios de contacto y cotización envían a `https://formsubmit.co/cotizaciones@joran.cl`.

Notas:
- Los formularios con adjuntos usan `enctype="multipart/form-data"`.
- Campos ocultos usados: `_subject` (asunto), `_template`, `_next` (redirige a `thanks.html`) y `_captcha=true` (anti-spam).

## Despliegue en GitHub Pages
1. El repositorio está configurado en la rama `main`, carpeta raíz (`/`).
2. Cada push a `main` despliega automáticamente el sitio (puede tardar 1–3 minutos).
3. URL: https://joran.cl/ (dominio configurado en `CNAME`)

## Flujo de trabajo (actualizaciones)
```powershell
# Desde la carpeta del proyecto
# C:\Users\w_sal\CascadeProjects\mi-pagina-web

git add .
git commit -m "Actualización de contenido"
git push
```

## Personalización y mejoras sugeridas
- Añadir más contenido en secciones de productos.
- Completar redes sociales reales en el footer.
- Optimización: minificar CSS/JS y cargar icons/fonts de forma eficiente.
- SEO: revisar título, descripciones y Open Graph según campaña.
- Accesibilidad: revisar contrastes, tamaños y etiquetas.

## Licencia
Este proyecto no define licencia específica. Si lo deseas, agrega un archivo `LICENSE`.

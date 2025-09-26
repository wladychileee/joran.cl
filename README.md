# PRODUCTOS JORAN SPA

Sitio web estático publicado con GitHub Pages.

URL pública: https://wladychileee.github.io/pagina-web-joran/

## Estructura del proyecto
- `index.html`: Página principal y páginas internas (productos) + formularios.
- `styles.css`: Estilos globales.
- `script.js`: Comportamiento de navegación, modales y utilidades.
- `logo.png`: Logo usado como favicon y en cabecera.

## Formularios (Formspree)
Están integrados 3 formularios de Formspree:
- Contacto: https://formspree.io/f/xnngqkwa
- Cotización (modal): https://formspree.io/f/xdkworbk
- Análisis de Cotización: https://formspree.io/f/mqaykvnp

Notas:
- Los formularios con adjuntos usan `enctype="multipart/form-data"`.
- Puedes configurar `_redirect` y `_subject` como campos ocultos si deseas redirección y asunto personalizado.

## Despliegue en GitHub Pages
1. El repositorio está configurado en la rama `main`, carpeta raíz (`/`).
2. Cada push a `main` despliega automáticamente el sitio (puede tardar 1–3 minutos).
3. URL: https://wladychileee.github.io/pagina-web-joran/

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

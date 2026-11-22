# Clínica Jacarandá · Sitio web

Sitio estático (HTML + CSS + JS) en negro y violeta: quiénes somos, profesionales con días y horarios, reserva de turnos, perfil de paciente de ejemplo (Merilin Suárez), carga de documentos obligatoria antes de reservar, agenda y video instructivo.

## Publicar en GitHub Pages
1. Subí el contenido de esta carpeta a un repositorio.
2. Settings → Pages → rama `main`, carpeta `/ (root)`.

## Editar
- Profesionales, días y horas: arreglo `PROS` al inicio de `app.js` (los nombres son de ejemplo).
- Video instructivo: constante `VIDEO_URL` en `app.js` (enlace de embed).
- Documentos solicitados: arreglo `DOCS`.

## Importante
Es una demo sin servidor: turnos y documentos se guardan solo en el navegador de cada persona. Para uso real hace falta un backend con autenticación y almacenamiento seguro, por los datos clínicos (Leyes 18.331 y 18.335).

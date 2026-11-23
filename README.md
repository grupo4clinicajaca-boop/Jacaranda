# Clínica Jacarandá · Sitio web

Sitio estático (HTML + CSS + JS) en negro y violeta: quiénes somos, profesionales con días y horarios, cuenta de paciente (crear cuenta, ingresar, cerrar sesión), agendado de citas con seña (tarjeta, Mercado Pago o transferencia), comprobante por WhatsApp, carga de documentos, agenda, mapa y video instructivo.

## Publicar en GitHub Pages
1. Subí el contenido de esta carpeta al repositorio (reemplazando los archivos viejos).
2. Settings → Pages → rama `main`, carpeta `/ (root)`.

## Cuentas guardadas en Google (Firebase)
Sin configurar nada, el sitio anda en **modo demo**: las cuentas viven solo en el navegador de cada persona. Para guardarlas en Google:

1. Entrá a https://console.firebase.google.com con tu cuenta de Google y creá un proyecto.
2. **Authentication → Comenzar → Método de acceso**: activá **Correo electrónico/contraseña** y **Google**.
3. **Authentication → Configuración → Dominios autorizados**: agregá tu dominio de GitHub Pages (por ejemplo `tuusuario.github.io`).
4. **Firestore Database → Crear base de datos** (modo producción) y, en la pestaña **Reglas**, pegá:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /turnos/{id} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && request.resource.data.u == request.auth.uid;
    }
  }
}
```
(Para `delete`, si Firebase marca error en `request.resource`, separá la regla: `allow delete: if request.auth != null && resource.data.u == request.auth.uid;`)

5. **Configuración del proyecto → Tus apps → Web (</>)**: registrá la app y copiá el objeto `firebaseConfig`.
6. Abrí `firebase-config.js`, sacá los `//` y pegá tus valores en `window.FIREBASE_CONFIG`.

Con eso: las contraseñas las maneja Google (el sitio nunca las ve ni las guarda), el ingreso con Google funciona, y los turnos quedan compartidos (un horario ocupado se bloquea para todos).

## Editar
- Profesionales, días y horas: arreglo `PROS` al inicio de `app.js` (los nombres son de ejemplo).
- Precios, cuenta bancaria, WhatsApp y enlace de Mercado Pago: `PRECIO`, `PAGO` y `WSP` en `app.js` (son datos de ejemplo).
- Video instructivo: constante `VIDEO_URL` en `app.js` (enlace de embed).
- Documentos solicitados: arreglo `DOCS`.

## Importante
- Los **documentos** solo registran el nombre del archivo; no se suben archivos. Para guardarlos de verdad hace falta Firebase Storage o un backend.
- El **pago con tarjeta es una simulación**: no cobra nada y no guarda ni envía los datos de la tarjeta. Para cobrar de verdad hace falta un procesador de pagos (por ejemplo Mercado Pago Checkout).
- Para uso real con datos clínicos hace falta un backend con autenticación y almacenamiento seguro (Leyes 18.331 y 18.335).

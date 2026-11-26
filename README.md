# Clínica Jacarandá · Sitio web

Sitio estático (HTML + CSS + JS) en negro y violeta, con **páginas separadas** (Inicio, Nosotros, Cómo reservar, Profesionales, Contacto, Ingresar, Mi cuenta, Panel y Administración), navegables desde la barra superior.

## Cómo funcionan las cuentas
- **No hay registro propio ni ingreso con Google.** Las cuentas las crea la clínica cuando la familia acepta el tratamiento.
- Se ingresa con **cédula + contraseña**.
- Hay tres roles, controlados por el campo `role` de cada cuenta:
  - **admin** (administrador supremo): solo crea **funcionarios**.
  - **funcionario**: crea **pacientes** (con contraseña temporal), revisa documentos (aprobar / rechazar), ve la agenda de cada paciente (botón «Ver agenda» en su ficha) y la de todos los turnos.
  - **paciente**: cambia su contraseña la primera vez, sube documentos, ve el estado, reserva turnos.
- La contraseña temporal se muestra **una sola vez** al crear la cuenta. En el primer ingreso se obliga a cambiarla y no vuelve a pedirse.
- Al **rechazar** un documento el funcionario ve nombre, cédula y teléfono del paciente (con botones de llamar y WhatsApp). El paciente ve el estado de cada documento y, si fue rechazado, el motivo.
- Contraseñas: las guarda Firebase Authentication **hasheadas** (scrypt); el sitio nunca las ve ni las almacena.
- **Demo**: el botón «Seguir sin iniciar sesión (demo)» entra como paciente de prueba. Nada se envía a Firebase; los datos viven en la pestaña y se borran al salir. Sirve para el QR de la presentación.

## Publicar en GitHub Pages
1. Subí el contenido de esta carpeta al repositorio (reemplazando los archivos viejos).
2. Settings → Pages → rama `main`, carpeta `/ (root)`.

## Configurar Firebase (una sola vez)
1. **Authentication → Método de acceso**: dejá activado solo **Correo electrónico/contraseña**. Podés desactivar Google.
2. **Firestore Database**: creá la base (modo producción) y en **Reglas** pegá el contenido de `firestore.rules`, y tocá **Publicar**.
3. `firebase-config.js` ya tiene los datos de tu proyecto.
4. **Crear el administrador supremo** (a mano, una sola vez):
   1. Authentication → Usuarios → **Agregar usuario**. Correo: `ci` + cédula de 8 dígitos sin puntos ni guión + `@ci.jacaranda.uy`. Ejemplo: cédula 1.234.567-2 → `ci12345672@ci.jacaranda.uy`. Poné la contraseña que quieras y copiá el **UID**.
   2. Firestore → **Iniciar colección** `users` → ID del documento = el **UID** copiado, con los campos:
      `n` (string) = tu nombre · `ci` (string) = `12345672` · `tel` (string) · `role` (string) = `admin` · `mustChange` (boolean) = `false`
   3. Ingresá al sitio con esa cédula y contraseña: vas a ver la página **Administración**.
5. **Crear el primer funcionario** (el resto se crean desde el panel de Administración): ingresá como administrador → Administración → «Crear cuenta de funcionario» → entregá la contraseña temporal que aparece. Si preferís dejarlo creado a mano, hacelo igual que el administrador (paso 4) con otra cédula, `role` = `funcionario` y `mustChange` = `true`.
6. Los usuarios y datos de prueba que ya tengas en Firebase del sitio anterior no tienen `role`: no van a poder ingresar. Podés borrarlos.

## Documentos
Los archivos se guardan dentro de Firestore (no hace falta Firebase Storage ni plan de pago). Las fotos se comprimen solas; los **PDF no pueden pesar más de 650 KB**.

## Editar
- Profesionales, días y horas: arreglo `PROS` al inicio de `app.js` (los nombres son de ejemplo).
- Precios, cuenta bancaria, WhatsApp y Mercado Pago: `PRECIO`, `PAGO` y `WSP` en `app.js` (datos de ejemplo).
- Video instructivo: `VIDEO_URL` en `app.js`. Documentos solicitados: `DOCS`.

## Importante
- Si alguien olvida su contraseña, hoy no se puede restablecer desde el sitio (no hay correo real asociado). Opciones: borrar el usuario en Firebase y crearlo de nuevo, o agregar una Cloud Function (plan Blaze).
- El **pago con tarjeta es una simulación**: no cobra nada ni guarda los datos.
- Para uso real con datos clínicos conviene revisar los requisitos de las Leyes 18.331 y 18.335.
- Sin Firebase configurado el sitio arranca en «modo de pruebas» local (administración: cédula 1.234.567-2 / `admin1234` · funcionario: 4.123.456-3 / `func1234`).

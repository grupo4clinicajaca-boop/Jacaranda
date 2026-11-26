# Clínica Jacarandá · Sitio web

Sitio estático (HTML + CSS + JS) en negro y violeta, con **páginas separadas** (Inicio, Nosotros, Cómo reservar, Profesionales, Contacto, Ingresar, Mi cuenta, Panel y Administración), navegables desde la barra superior.

## Una plataforma, cuatro entornos
Al ingresar con **cédula y contraseña**, el sistema lee el rol guardado en Firestore y lleva a cada persona a su entorno. Quien no inició sesión ve la página pública.

| Entorno | Qué ve | Qué NO ve |
|---|---|---|
| **Público** | Inicio, Nosotros, Cómo reservar, Profesionales, Contacto, Ingresar, demo | — |
| **Paciente / Familia** | La página general + Mi cuenta: documentos, reservas, agenda, seña, datos y (si es BPS) Cobertura BPS | Paneles internos |
| **Funcionario** | Solo su panel: pacientes (búsqueda y ficha), documentos y estados, motivos de rechazo, contacto del tutor, modalidad, cobertura BPS, importes, seña, historial y agenda de turnos | Navegación pública, reservas, crear funcionarios |
| **Administrador supremo** | Solo la gestión de funcionarios: crear, consultar, modificar y activar/desactivar | Todo lo demás; no accede a pacientes, documentos ni turnos |

Administrador y funcionario no ven la barra ni el pie de la página pública; tienen su propia barra con el rol y «Cerrar sesión». Si escriben a mano la dirección de otra sección, el sitio los devuelve a su panel.

**La separación también está en el backend:** `firestore.rules` verifica el rol en cada operación (el administrador no puede leer pacientes, documentos ni turnos; el funcionario no puede crear funcionarios; una cuenta desactivada pierde el acceso a los datos). Esconder botones no alcanza y no es lo único que se hace.

## Flujo
1. **Entrevista y cuenta.** Un funcionario crea el usuario de la familia (cédula + contraseña temporal que se muestra una vez) y elige **Particular** o **Con cobertura BPS**. En el primer ingreso se obliga a cambiar la contraseña.
2. **Documentación.** Todos: cédula del menor, cédula del tutor e informes médicos o evaluaciones anteriores (opcional, «si los tiene»). Con BPS se suman el informe diagnóstico o psicodiagnóstico y la documentación adicional requerida por BPS (obligatorios). El funcionario marca cada documento: 🟠 en revisión, 🟢 aprobado, 🔴 no aprobado. Al no aprobar, ve el teléfono del tutor (llamar / WhatsApp) y registra el motivo, que la familia también ve.
3. **BPS.** Jacarandá envía la documentación al BPS; el funcionario marca el estado (sin enviar / enviado / aprobada / no aprobada) y, al aprobarse, registra el **importe aprobado por sesión**. El sistema calcula costo total, cobertura BPS, saldo restante y seña por especialidad. La familia lo ve en la pestaña «Cobertura BPS».
4. **Reservas.** Particular: se habilitan al aprobarse los documentos obligatorios. BPS: además tiene que estar aprobada la cobertura.
5. **Seña.** Particular: 50 % del valor de la sesión (sin cambios). BPS: 50 % del saldo no cubierto por el BPS. El comprobante se envía por WhatsApp como antes. El pago con tarjeta es una simulación.
6. **Bajas lógicas.** Nada se borra. Los funcionarios se desactivan desde Administración. Los pacientes se dan de baja desde su ficha (con motivo): no pueden ingresar pero se conservan datos, documentos e historial, y se pueden reactivar. Al cancelar un turno se archiva quién y cuándo lo canceló (colección `cancelaciones`) y el horario queda libre.
7. **Historial.** Cada alta, cambio de estado de documentos y cambio de cobertura queda registrado con fecha y funcionario (no se puede editar ni borrar).

- Contraseñas: las guarda Firebase Authentication **hasheadas**; el sitio nunca las ve.
- **Demo**: «Seguir sin iniciar sesión (demo)» entra como paciente particular de prueba, con reservas habilitadas y sin guardar nada en Firebase.

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
      `n` (string) = tu nombre · `ci` (string) = `12345672` · `tel` (string) · `role` (string) = `admin` · `mustChange` (boolean) = `false` · `activo` (boolean) = `true`
   3. Ingresá al sitio con esa cédula y contraseña: vas a ver la página **Administración**.
5. **Crear funcionarios**: ingresá como administrador → «Crear cuenta de funcionario» (nombre, cédula, fecha de nacimiento, correo, teléfono y contraseña temporal; rol funcionario). Desde ahí también se modifican y se activan o desactivan.
6. Los usuarios y datos de prueba que ya tengas en Firebase del sitio anterior no tienen `role`: no van a poder ingresar. Podés borrarlos.

## Documentos
Los archivos se guardan dentro de Firestore (no hace falta Firebase Storage ni plan de pago). Las fotos se comprimen solas; los **PDF no pueden pesar más de 650 KB**.

## Editar
- Profesionales, días y horas: arreglo `PROS` al inicio de `app.js` (los nombres son de ejemplo).
- Precios, cuenta bancaria, WhatsApp y Mercado Pago: `PRECIO`, `PAGO` y `WSP` en `app.js` (datos de ejemplo).
- Video instructivo: `VIDEO_URL` en `app.js`. Documentos solicitados: `DOCS`.

## Importante
- La habilitación para reservar se controla en la interfaz; las reglas de Firestore no la verifican.
- El paciente dado de baja no aparece en el listado «Activos» (filtro «De baja» o «Todos»).
- Las cuentas desactivadas no pueden ingresar ni leer datos, pero su usuario de Firebase Authentication sigue existiendo.
- El correo del funcionario es un dato de contacto: el ingreso es siempre con la cédula.
- Si alguien olvida su contraseña, hoy no se puede restablecer desde el sitio (no hay correo real asociado). Opciones: borrar el usuario en Firebase y crearlo de nuevo, o agregar una Cloud Function (plan Blaze).
- El **pago con tarjeta es una simulación**: no cobra nada ni guarda los datos.
- Para uso real con datos clínicos conviene revisar los requisitos de las Leyes 18.331 y 18.335.
- Sin Firebase configurado el sitio arranca en «modo de pruebas» local (administración: cédula 1.234.567-2 / `admin1234` · funcionario: 4.123.456-3 / `func1234`).

# R5 — Sistema de Usuarios (React + API PHP + MySQL)

> **Novedad R5:** además del email y contraseña, se puede iniciar sesión (o
> registrarse) con **Google, GitHub y Discord**. Ver la sección 12.

## 1. Arquitectura general

```
React (frontend, puerto 5173)
   │  fetch()
   ▼
API REST en PHP (backend/api/...)
   │  PDO con consultas preparadas
   ▼
MySQL (base de datos "sistema_usuarios_r5")
```

React nunca se conecta directamente a MySQL: toda la comunicación pasa por
los endpoints PHP en `backend/api/`, que son los únicos que abren conexión
a la base de datos (`backend/config/database.php`).

## 2. Estructura de carpetas

```
proyecto/
├── frontend/                  (React + Vite)
│   └── src/
│       ├── components/        Navbar, UserCard, UserForm, UserManageForm,
│       │                      LoginForm, BotonesSociales, Loading, ErrorMessage,
│       │                      ProtectedRoute, AdminRoute
│       ├── context/           AuthContext.jsx
│       ├── hooks/             useForm.js, validadores.js
│       ├── services/          userService.js, authService.js, apiConfig.js
│       ├── pages/router/      Sistema 1 (React Router) — usuario/administrador
│       ├── pages/estado/      Sistema 2 (useState) — dueño, + RegistroInicial.jsx
│       ├── App.jsx            Decide solo qué mostrar (nunca pregunta)
│       └── main.jsx
│
├── backend/                   (API en PHP puro + PDO)
│   ├── config/                database.php, cors.php, helpers.php,
│   │                          oauth.php, credenciales.local.php (tuyo, no se sube)
│   └── api/
│       ├── usuarios/index.php GET / POST / PUT / DELETE (con permisos por rango)
│       └── auth/               login.php, logout.php, me.php, estado.php
│           └── oauth/          redirect.php, callback.php  (Google/GitHub/Discord)
│
└── database/
    └── schema.sql              Script de creación de la BBDD
```

## 3. Roles y permisos

El sistema tiene tres rangos jerárquicos:

- **usuario** — rango por defecto de cualquiera que se registre desde el
  formulario público. Solo puede ver el listado y el detalle.
- **administrador** — puede crear, editar y eliminar cuentas de rango
  *usuario*. No puede tocar a otro administrador ni al dueño.
- **dueño** — único en todo el sistema. Puede crear, editar y eliminar a
  cualquiera, y es el único que puede ascender un *usuario* a
  *administrador* (o volverlo a degradar).

**¿Quién se vuelve dueño?** La primera cuenta que se registre mientras
todavía no exista ningún dueño, sin importar desde qué formulario se haya
creado (y aunque la base ya tuviera usuarios comunes de pruebas
anteriores). A partir de ahí, cualquier registro público nuevo entra
siempre como *usuario*; nadie puede autoasignarse el rango
*administrador*. El backend también crea los tres rangos por su cuenta si
faltan en la tabla `roles` (por ejemplo, si la base se armó con una
versión vieja de `schema.sql`).

**¿Qué sistema usa cada rango?**

| Rango          | Sistema que ve automáticamente |
|----------------|----------------------------------|
| usuario        | Sistema 1 (React Router)        |
| administrador  | Sistema 1 (React Router)        |
| dueño          | Sistema 2 (useState)            |

La persona **nunca elige** un sistema. La aplicación es una sola página que
decide sola:

- Si todavía no existe ningún usuario en la base, muestra la pantalla de
  configuración inicial (construida con useState). Esa primera cuenta se
  vuelve dueño automáticamente en el backend.
- Si ya existe gente registrada pero nadie inició sesión, muestra el login
  (parte del Sistema 1).
- Apenas alguien inicia sesión, la app mira el rol que devolvió la API: si
  es "dueño", cambia sola al panel useState; si es "usuario" o
  "administrador", se queda en el panel con React Router.

Esto es solo el comportamiento del frontend. El **backend** vuelve a
validar cada permiso de forma independiente (crear, editar, eliminar,
cambiar de rango): un pedido hecho "a mano" con Postman con el token de un
usuario común es rechazado igual, aunque la interfaz nunca haya mostrado
esos botones.

## 4. Diseño de la base de datos

Tablas:

- **roles** (`id`, `nombre_rol`): catálogo de los tres rangos —
  *usuario*, *administrador*, *dueño*.
- **usuarios** (`id`, `nombre`, `apellido`, `email`, `password_hash`,
  `rol_id`, `fecha_registro`): datos de cada usuario, con `rol_id` como
  clave foránea hacia `roles`. `password_hash` es `NULL` en las cuentas
  creadas con Google/GitHub/Discord.
- **cuentas_oauth** (`id`, `usuario_id`, `proveedor`, `proveedor_uid`,
  `fecha_vinculacion`): vincula un usuario con su identidad en un proveedor
  externo. Es única por (`proveedor`, `proveedor_uid`) y por
  (`usuario_id`, `proveedor`).
- **oauth_estados** (`state`, `proveedor`, `fecha_expiracion`): valores
  `state` de un solo uso que protegen el login externo contra CSRF.
- **sesiones** (`id`, `usuario_id`, `token`, `fecha_creacion`,
  `fecha_expiracion`): tokens activos emitidos al iniciar sesión, con
  clave foránea hacia `usuarios`.

### Formas normales

- **1FN**: todas las columnas guardan un único valor atómico (por ejemplo,
  no se guarda una lista de roles separada por comas dentro de `usuarios`).
- **2FN**: todas las tablas usan una clave primaria simple (`id`
  autoincremental), por lo que no puede existir una dependencia parcial de
  una clave compuesta.
- **3FN**: `nombre_rol` no se repite en cada fila de `usuarios`; vive una
  sola vez en `roles` y se referencia por `rol_id`, evitando dependencias
  transitivas (ningún atributo no clave depende de otro atributo no clave).

## 5. Endpoints de la API

| Método | Endpoint                          | Descripción                          |
|--------|------------------------------------|---------------------------------------|
| GET    | `/api/usuarios/index.php`          | Lista todos los usuarios (requiere sesión) |
| GET    | `/api/usuarios/index.php?id=:id`   | Detalle de un usuario (requiere sesión) |
| POST   | `/api/usuarios/index.php`          | Crea un usuario. Público = siempre rango "usuario" (o "dueño" si es el primero de toda la base); con sesión de dueño puede incluir `"rol": "administrador"` |
| PUT    | `/api/usuarios/index.php?id=:id`   | Actualiza nombre/apellido/email y, si quien llama es el dueño, el campo `rol` |
| DELETE | `/api/usuarios/index.php?id=:id`   | Elimina un usuario, respetando la jerarquía de rangos |
| POST   | `/api/auth/login.php`              | Inicia sesión, devuelve un token y el rol del usuario |
| POST   | `/api/auth/logout.php`             | Invalida el token actual              |
| GET    | `/api/auth/me.php`                 | Valida el token y devuelve el usuario junto con su rol |
| GET    | `/api/auth/estado.php`             | Público. Informa si ya existe un usuario con rango dueño |
| GET    | `/api/auth/oauth/redirect.php?proveedor=google\|github\|discord` | Inicia el login externo: genera el `state` y redirige al proveedor |
| GET    | `/api/auth/oauth/callback.php`     | Redirect URI de los proveedores: valida `state`, intercambia el `code`, crea/vincula el usuario y vuelve al frontend con el token |

Se usa `?id=` en lugar de `/usuarios/5` para poder ejecutar el proyecto en
XAMPP sin configurar `mod_rewrite`; el comportamiento es equivalente al de
`/usuarios/:id`.

Los endpoints `oauth/*` no devuelven JSON: son redirecciones del navegador
(el resultado vuelve al frontend en el fragmento de la URL).

Códigos de respuesta usados: `200 OK`, `201 Created`, `400 Bad Request`,
`401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.

## 6. Diferencias entre el Sistema 1 y el Sistema 2

| Aspecto           | Sistema 1 (React Router)                      | Sistema 2 (useState)                          |
|--------------------|-----------------------------------------------|------------------------------------------------|
| Navegación         | `BrowserRouter`, `Routes`, `Link`, `useNavigate` | Un solo componente con `useState('vista')`   |
| URL                | Cambia según la página (`/usuarios/5`)        | Siempre la misma URL                            |
| Identificar un usuario en el detalle | `useParams()` lee el `:id` de la URL | El `id` viaja como prop de un componente a otro |
| Ruta protegida     | Componente `ProtectedRoute` + `<Navigate>`    | No aplica: el panel del dueño solo se monta cuando ya hay sesión de dueño confirmada |
| Página 404         | Ruta comodín `path="*"`                       | No aplica (no hay URLs distintas)               |

Ambos sistemas comparten los mismos componentes de presentación
(`UserCard`, `UserForm`, `LoginForm`), el mismo `AuthContext` y los mismos
servicios de API, pero **cada uno resuelve la navegación de forma
completamente distinta**, que es justamente lo que pide la consigna. La
persona nunca ve ambos ni elige entre ellos: `App.jsx` monta uno solo,
automáticamente, según exista o no un dueño y según el rol de quien inició
sesión.

## 7. Flujo de información

1. El usuario interactúa con un componente de React (por ejemplo, envía el
   formulario de registro).
2. El componente llama a una función de `services/userService.js` o
   `authService.js`.
3. Esa función hace un `fetch()` hacia el endpoint PHP correspondiente.
4. El endpoint valida los datos, arma una consulta preparada con PDO y la
   ejecuta contra MySQL.
5. MySQL devuelve el resultado; PHP lo convierte a JSON y responde con el
   código HTTP adecuado.
6. React recibe la respuesta, actualiza su estado (`useState`) y vuelve a
   renderizar la interfaz.

## 8. Persistencia: qué se guarda y dónde

- **MySQL (servidor)**: usuarios, contraseñas hasheadas y tokens de sesión.
  Es la fuente de verdad; sobrevive a un reinicio del navegador o del
  servidor.
- **localStorage (cliente)**: únicamente el *token* de sesión
  (`sistemaUsuarios_token`), para no pedir el login de nuevo en cada
  recarga de la página. Nunca se guarda la contraseña ni el hash.

---

## 9. Puesta en marcha

### 9.1 Requisitos

- Node.js 18+ y npm.
- XAMPP (Apache + MySQL + PHP 8+).

### 9.2 Configurar XAMPP y la base de datos

1. Copiar la carpeta `backend/` dentro de `htdocs`, por ejemplo:
   `C:\xampp\htdocs\sistema-usuarios\backend`.
2. Iniciar los módulos **Apache** y **MySQL** desde el panel de XAMPP.
3. Abrir phpMyAdmin (`http://localhost/phpmyadmin`).
4. Ir a la pestaña **Importar**, elegir el archivo `database/schema.sql` y
   ejecutar. Esto crea la base `sistema_usuarios_r5` con sus tablas.
5. Si el usuario/clave de MySQL no son los de XAMPP por defecto (`root` sin
   clave), ajustar `backend/config/database.php`.

### 9.3 Iniciar el backend

No requiere pasos adicionales: al estar dentro de `htdocs` con Apache
corriendo, los endpoints ya están disponibles en, por ejemplo:

```
http://localhost/sistema-usuarios/backend/api/usuarios/index.php
```

Si la carpeta del proyecto tiene otro nombre, actualizar
`frontend/src/services/apiConfig.js` con la URL correcta (por defecto
`http://localhost/R5/backend/api`, es decir, la carpeta debe llamarse `R5`
en `htdocs`).

> **R5 usa su propia base de datos (`sistema_usuarios_r5`)**, separada de la
> de R3 (`sistema_usuarios`), para que los dos trabajos no se mezclen.
> Basta con importar `database/schema.sql`: crea la base nueva y no toca la de R3.
> - Para llevar a R5 los usuarios que ya tenías en R3, ejecutar una vez
>   `database/copiar_usuarios_desde_R3.sql`.
> - Si ya habías modificado la base de R3 con la migración de OAuth, se
>   puede dejar como estaba con `database/restaurar_base_R3.sql`.

### 9.4 Instalar y correr el frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir la URL que indique la consola (por defecto `http://localhost:5173`).

---

## 10. Cómo probar cada parte

### Primer arranque: crear al dueño

1. Con la base recién importada (sin usuarios todavía), abrir el frontend.
   Como no existe nadie, la app muestra directamente la pantalla de
   **configuración inicial** (sin pedir elegir nada).
2. Completar ese formulario: la cuenta creada se vuelve **dueño**
   automáticamente y la app te deja ya logueado, mostrando el panel del
   dueño (Sistema 2, useState).

> **Si la base ya tenía usuarios de pruebas anteriores** y todos son
> comunes (no hay dueño), la app igual muestra la pantalla de configuración
> inicial: la cuenta que registres ahí se vuelve dueño. No hace falta
> borrar nada. Usá un email distinto a los que ya existen.

### Probar el Sistema 1 (React Router) — usuario y administrador

1. Cerrar sesión del dueño (botón "Cerrar sesión"): como ya existe un
   dueño, la app ahora muestra el login normal.
2. Ir a "Registro" y crear una cuenta nueva: entra automáticamente como
   rango **usuario**, y al iniciar sesión con ella verás el panel con
   React Router.
3. Navegar a "Usuarios": debería verse el listado (si no hay sesión,
   `/usuarios` redirige solo a `/login`).
4. Hacer clic en "Ver detalle" de una tarjeta: la URL cambia a
   `/usuarios/:id` sin recargar la página.
5. Probar una URL inexistente, por ejemplo `/algo-que-no-existe`, y
   verificar que aparece la página 404.

### Probar el Sistema 2 (useState) — dueño

1. Cerrar sesión e iniciar sesión de nuevo con la cuenta del dueño.
2. Notar que la app cambia sola al panel useState (sin ningún botón para
   elegirlo): la URL del navegador nunca cambia ahí, todo se resuelve
   actualizando estado interno con `useState`.

### Probar la API directamente

Con Apache corriendo, se puede probar desde el navegador o Postman:

- `GET http://localhost/sistema-usuarios/backend/api/auth/estado.php`
  (no requiere sesión).
- `POST http://localhost/sistema-usuarios/backend/api/auth/login.php`
  con body JSON `{ "email": "...", "password": "..." }`.

### Comprobar la jerarquía de rangos

1. El primer registro de todo el sistema (el de la pantalla de
   configuración inicial) es siempre el **dueño**; comprobalo viendo que,
   al iniciar sesión con él, la app entra directo al panel useState.
2. Registrar un segundo usuario desde "Registro": debería quedar como
   rango **usuario** (comprobalo con el badge de su tarjeta, o mirando
   `rol_id` en la tabla `usuarios`).
3. Iniciar sesión como dueño, entrar a "Usuarios" y usar el botón
   **"Hacer administrador"** sobre ese segundo usuario.
4. Cerrar sesión e iniciar sesión con esa cuenta: al ser administrador,
   la app te deja en el panel con React Router, y ahí vas a ver el botón
   "Crear usuario" en la barra de navegación (exclusivo de administrador).
5. Con esa cuenta de administrador, intentar eliminar a otra cuenta
   administrador o al dueño: la interfaz no debería mostrar esos botones,
   y si se fuerza la llamada a la API igual (por ejemplo con Postman), el
   backend debe responder `403 Forbidden`.
6. Volver a entrar como dueño al Sistema 2 y comprobar que ahí sí puede
   editar o quitarle el rango de administrador a esa cuenta.

### Comprobar la persistencia

1. Registrar un usuario y cerrar el navegador.
2. Abrir MySQL / phpMyAdmin y ver que el registro sigue en la tabla
   `usuarios` (persistencia de servidor).
3. Iniciar sesión, recargar la página (F5): la sesión se mantiene porque el
   token sigue en `localStorage` y `AuthContext` lo valida contra
   `/api/auth/me.php` al montar la app.
4. Abrir las herramientas de desarrollador → Application → Local Storage:
   se ve la clave `sistemaUsuarios_token`, nunca una contraseña.

### Comprobar las medidas de seguridad

1. Revisar `backend/api/usuarios/index.php`: todas las consultas usan
   `prepare()` + parámetros nombrados, nunca concatenación de strings.
2. Revisar la tabla `usuarios` en phpMyAdmin: la columna `password_hash`
   contiene un hash BCRYPT (empieza con `$2y$`), nunca texto plano.
3. Intentar registrar un usuario con una contraseña corta (por ejemplo
   `"123"`): el backend debe rechazarla con `400 Bad Request`, incluso si
   se desactiva JavaScript en el navegador (la validación del backend es
   independiente de la del frontend).
4. Revisar que `backend/config/database.php` nunca se importa ni se
   referencia desde el frontend: las credenciales de MySQL no viajan al
   navegador.

---

## 11. Conceptos para defender el trabajo

- **useState**: guarda datos que cambian con el tiempo dentro de un
  componente (la lista de usuarios, los valores de un formulario, si se
  está cargando o no) y hace que React vuelva a renderizar cuando cambian.
- **useEffect**: ejecuta código en respuesta a un evento del ciclo de vida
  del componente (por ejemplo, "cuando se monta esta página, pedile los
  usuarios a la API"), en lugar de ejecutarlo en cada render.
- **useForm (hook propio)**: centraliza el manejo de un formulario
  (valores, errores, validación) para no repetir esa lógica en cada
  formulario del proyecto.
- **Context (AuthContext)**: comparte el usuario autenticado y las
  funciones de login/logout con cualquier componente del árbol, sin tener
  que pasarlos como props manualmente por cada nivel.
- **React Router**: permite tener varias "páginas" dentro de una misma
  aplicación de una sola página (SPA), cambiando lo que se muestra según
  la URL, sin recargar el navegador.
- **localStorage**: almacenamiento del navegador que persiste aunque se
  cierre la pestaña; acá se usa solo para el token de sesión.
- **API REST**: conjunto de endpoints HTTP (`GET`, `POST`, `PUT`,
  `DELETE`) que exponen operaciones sobre los usuarios sin que el
  frontend necesite saber nada de SQL.
- **PDO con consultas preparadas**: forma segura de ejecutar SQL desde
  PHP, donde los valores del usuario se pasan como parámetros separados de
  la consulta, evitando inyección SQL.
- **Hashing de contraseñas (`password_hash` / `password_verify`)**:
  transforma la contraseña en un valor que no se puede revertir; el
  backend nunca guarda ni compara contraseñas en texto plano.
- **Normalización (1FN/2FN/3FN)**: reglas de diseño de bases de datos
  relacionales que evitan datos duplicados o mal relacionados, explicadas
  en la sección 3 de este documento.

---

## 12. Iniciar sesión con Google, GitHub y Discord

### 12.1 Cómo funciona (OAuth 2.0, flujo "authorization code")

```
Botón (<a href>) ─► redirect.php ─► pantalla del proveedor
                       │ guarda "state" (10 min, un solo uso)
                       ▼
proveedor ─► callback.php?code=...&state=...
                       │ 1. valida y consume el state
                       │ 2. cambia el code por un access token (con el client secret)
                       │ 3. pide el perfil (id, email verificado, nombre)
                       │ 4. busca / vincula / crea el usuario local
                       │ 5. crea la sesión (mismo token que el login normal)
                       ▼
frontend  /login#oauth_token=...  ─► AuthContext guarda el token y limpia la URL
```

Reglas de cuentas:

- Si esa cuenta del proveedor ya había entrado antes, se usa el mismo usuario.
- Si existe un usuario con el **mismo email** (verificado por el proveedor),
  se **vincula** a él: mismo rol, mismos datos.
- Si no existe, se crea con rango *usuario* y sin contraseña. Si todavía no
  hay dueño, esa cuenta pasa a ser el **dueño** (misma regla de siempre).
- Se exige un **email verificado** en el proveedor; si no lo entrega, se
  rechaza el ingreso con un mensaje claro.
- Las cuentas sin contraseña no pueden entrar por el formulario de email.

### 12.2 Crear las credenciales

En los tres casos la URL de redireccionamiento (Redirect URI / Callback URL)
debe ser **exactamente**:

```
http://localhost/R5/backend/api/auth/oauth/callback.php
```

**Google** — <https://console.cloud.google.com/>
1. Crear un proyecto → *APIs y servicios* → *Pantalla de consentimiento de
   OAuth* (tipo Externo). En modo "Prueba", agregar tu email en *Usuarios de prueba*.
2. *Credenciales* → *Crear credenciales* → *ID de cliente de OAuth* →
   tipo *Aplicación web*.
3. En *URI de redireccionamiento autorizados* pegar la URL de arriba.
4. Copiar el *ID de cliente* y el *Secreto del cliente*.

**GitHub** — <https://github.com/settings/developers>
1. *OAuth Apps* → *New OAuth App*.
2. *Homepage URL*: `http://localhost:5173`.
3. *Authorization callback URL*: la URL de arriba.
4. Copiar el *Client ID* y generar un *Client secret*.

**Discord** — <https://discord.com/developers/applications>
1. *New Application*.
2. Menú *OAuth2* → en *Redirects* agregar la URL de arriba y guardar.
3. Copiar el *Client ID* y usar *Reset Secret* para obtener el *Client Secret*.

### 12.3 Cargar las credenciales en el backend

1. Copiar `backend/config/credenciales.local.example.php` como
   `backend/config/credenciales.local.php`.
2. Completar `client_id` y `client_secret` de cada proveedor. Los que queden
   vacíos muestran un aviso al hacer clic en su botón; no rompen nada.
3. Si tu frontend no corre en `http://localhost:5173` o la carpeta no se llama
   `R5`, descomentar y ajustar `BACKEND_URL` / `FRONTEND_URL` en ese mismo archivo.

`credenciales.local.php` ya está en `.gitignore`. El *client secret* vive solo
en el backend: nunca llega al navegador.

### 12.4 Requisitos de PHP y problemas típicos

- Extensiones `curl` y `mbstring` activas (vienen activas en XAMPP).
- **"SSL certificate problem"** en XAMPP para Windows: descargar
  <https://curl.se/ca/cacert.pem>, guardarlo (por ejemplo en
  `C:\xampp\php\extras\ssl\cacert.pem`) y en `php.ini` poner
  `curl.cainfo = "C:\xampp\php\extras\ssl\cacert.pem"`; reiniciar Apache.
  No desactivar la verificación de certificados.
- **`redirect_uri_mismatch`** (Google) o similar: la URL registrada en el
  proveedor no coincide letra por letra con la del callback.
- **"No entregó un email verificado"**: verificar el email en la cuenta de
  Google/GitHub/Discord.

### 12.5 Medidas de seguridad incluidas

- `state` aleatorio (32 bytes), con vencimiento de 10 minutos y de un solo
  uso, contra CSRF en el login.
- El token de sesión vuelve en el **fragmento** (`#`) de la URL, que no se
  envía al servidor ni en el header `Referer`, y el frontend lo borra de la
  barra de direcciones apenas lo lee.
- Vinculación por email solo si el proveedor lo marca como verificado.
- Verificación de certificados SSL siempre activa en las llamadas cURL.
- Consultas preparadas en todas las tablas nuevas.

**Limitación conocida:** el registro con email y contraseña de este sistema
no verifica que el email sea de quien lo escribe. Si alguien registra a mano
el email de otra persona y esa persona luego entra con Google, ambas
identidades quedan vinculadas a la misma cuenta. Para un entorno real
conviene agregar verificación de email al registro clásico.

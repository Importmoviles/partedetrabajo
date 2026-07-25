# Panel de gestión — ImportMóviles Technologies (Fase 1)

Panel de trabajo interno: clientes, trabajos, materiales, partes de trabajo con PDF, catálogo de materiales/componentes y documentación adjunta.

## Stack

- **Backend:** Node.js + Express (`server/`)
- **Base de datos:** SQLite mediante el módulo integrado `node:sqlite` de Node 22 — un solo archivo en `server/data/panel.db`, sin dependencias nativas que compilar
- **Frontend:** React + Vite + Tailwind CSS (`client/`)
- **Login:** usuario único con sesión (cookie), pensado solo para ti en esta Fase 1
- **Archivos:** subidos a `server/uploads/`
- **Partes de trabajo:** generados en PDF con `pdfkit`

## Primer arranque

En dos terminales distintas (o usando `npm run dev` en cada carpeta):

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Abre `http://localhost:5173`. Usuario y contraseña iniciales están en `server/.env`
(`admin` / `importmoviles` por defecto) — **cámbialos ahí antes de usar la app en serio**.

## Uso diario en desarrollo

Con ambos `npm run dev` corriendo (backend en `:3001`, frontend en `:5173` con proxy hacia la API),
cualquier cambio que guardes se recarga solo.

## Poner la app en marcha "de verdad" (un solo proceso)

Para uso normal (por ejemplo, dejarla corriendo en un ordenador/servidor y acceder desde el móvil),
no hace falta el servidor de desarrollo de Vite: se compila el frontend una vez y Express lo sirve él solo.

```bash
cd client
npm run build          # genera server/client-dist

cd ../server
npm start               # sirve todo en http://localhost:3001
```

Para que el móvil pueda entrar, ese `:3001` tiene que ser accesible desde la red (o publicado con HTTPS
si quieres acceder desde fuera de casa/oficina — eso es un paso aparte que no hemos configurado en esta fase).

## Actualizar el servidor en producción (partes.importmoviles.com)

Está desplegado en Plesk, que gestiona el proceso Node con su propio supervisor — **no** con el `npm start`
que lanzarías a mano por SSH. Tras cada cambio, en este orden:

1. `git pull`
2. `cd client && npm run build`
3. **Reiniciar la app desde Plesk**: Sitios web y dominios → `partes.importmoviles.com` → pestaña Node.js →
   "Restart App". Sin este paso, la web sigue sirviendo el proceso viejo aunque los archivos ya estén actualizados.

## Copias de seguridad

Todo lo importante vive en dos sitios, ambos dentro de `server/`:

- `data/panel.db` — toda la base de datos (clientes, trabajos, partes de trabajo...)
- `uploads/` — los archivos subidos (fotos, contratos, certificados...)

Copiar esas dos carpetas a otro sitio (otro disco, un USB, la nube) es toda la copia de seguridad que necesitas.

## Variables de entorno (`server/.env`)

```
PORT=3001
SESSION_SECRET=...        # cámbialo si vas a exponer la app a internet
ADMIN_USER=admin
ADMIN_PASSWORD=importmoviles
```

`ADMIN_USER`/`ADMIN_PASSWORD` solo se usan la primera vez que arranca el servidor (cuando crea el usuario).
Para cambiar la contraseña después, hay que borrar `data/panel.db` (pierdes los datos) o actualizar el hash
directamente — si llega el momento, pídemelo y lo dejamos como una pantalla de "cambiar contraseña" en la app.

## Estructura

```
server/
  index.js              punto de entrada
  db.js                  esquema de la base de datos
  routes/                un archivo por módulo (clientes, trabajos, partes, materialesCatalogo, documentos, auth, dashboard)
  middleware/auth.js      protege la API para que solo tú puedas usarla
client/
  src/pages/              una carpeta por módulo (clientes, trabajos, partes, maestros) + Inicio, Login
  src/components/         piezas visuales reutilizadas (tarjetas, botones, subida de documentos)
  src/lib/                cliente HTTP hacia la API y catálogos (categorías, estados)
```

## Qué falta para la Fase 2 (portal de clientes)

Cuando llegue el momento: añadir un rol "cliente" en la tabla `usuarios`, endpoints que filtren por
`cliente_id` del usuario logueado, y una sección de tickets. La base de datos actual ya está pensada
para eso (las tablas `clientes`, `trabajos`, `partes` y `documentos` no cambian).

## Notas de migración (julio 2026)

Esta versión renombró "Factura" a "Parte de trabajo" en toda la aplicación (tablas, rutas y textos).
La migración es automática: al arrancar el servidor con datos antiguos, `db.js` detecta las tablas
`facturas`/`factura_lineas`/`factura_trabajos` y las renombra conservando todas las filas — no hace
falta ningún paso manual, basta con `git pull` y reiniciar. También se añadió un catálogo maestro de
Materiales y Componentes (pestaña "Maestros").

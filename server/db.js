const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "panel.db"));
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;"); // necesario para acceso concurrente seguro (compartido con el CRM)

// --- Migración: "factura" -> "parte de trabajo" (conserva todas las filas existentes) ---
function tableExists(name) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
}

function columnExists(table, column) {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((c) => c.name === column);
}

if (tableExists("facturas") && !tableExists("partes")) {
  db.exec("ALTER TABLE facturas RENAME TO partes");
  console.log('Migración: tabla "facturas" renombrada a "partes" (datos conservados)');
}
if (tableExists("factura_lineas") && !tableExists("parte_lineas")) {
  db.exec("ALTER TABLE factura_lineas RENAME TO parte_lineas");
  db.exec("ALTER TABLE parte_lineas RENAME COLUMN factura_id TO parte_id");
}
if (tableExists("factura_trabajos") && !tableExists("parte_trabajos")) {
  db.exec("ALTER TABLE factura_trabajos RENAME TO parte_trabajos");
  db.exec("ALTER TABLE parte_trabajos RENAME COLUMN factura_id TO parte_id");
}
if (tableExists("partes")) {
  // Numeración antigua FAC-0001 -> PARTE-0001 (no-op si ya está migrado)
  db.exec("UPDATE partes SET numero = 'PARTE-' || substr(numero, 5) WHERE numero LIKE 'FAC-%'");
  // El parte de trabajo deja de llevar sus propios estados de cobro (eso pasa a vivir
  // en las facturas del CRM). Se simplifica a pendiente/facturado (no-op si ya migrado).
  db.exec("UPDATE partes SET estado = 'facturado' WHERE estado = 'pagada'");
  db.exec("UPDATE partes SET estado = 'pendiente' WHERE estado IN ('borrador', 'emitida', 'vencida')");
}

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  nif TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  tarifa_hora REAL DEFAULT 0,
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_alta TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS trabajos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  categoria TEXT NOT NULL,
  ubicacion TEXT NOT NULL DEFAULT 'oficina_cliente',
  estado TEXT NOT NULL DEFAULT 'presupuestado',
  fecha_inicio TEXT,
  fecha_fin TEXT,
  horas REAL DEFAULT 0,
  notas_tecnicas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipos_afectados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT
);

CREATE TABLE IF NOT EXISTS materiales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'fisico',
  nombre TEXT NOT NULL,
  cantidad REAL NOT NULL DEFAULT 1,
  coste REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  proveedor TEXT
);

CREATE TABLE IF NOT EXISTS partes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  iva REAL NOT NULL DEFAULT 21,
  fecha TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parte_trabajos (
  parte_id INTEGER NOT NULL REFERENCES partes(id) ON DELETE CASCADE,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  PRIMARY KEY (parte_id, trabajo_id)
);

CREATE TABLE IF NOT EXISTS parte_lineas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parte_id INTEGER NOT NULL REFERENCES partes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'fijo',
  descripcion TEXT NOT NULL,
  cantidad REAL NOT NULL DEFAULT 1,
  precio_unitario REAL NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  nif TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  poblacion TEXT,
  provincia TEXT,
  telefono TEXT,
  email TEXT,
  contacto TEXT,
  categoria TEXT,
  forma_pago TEXT,
  iban TEXT,
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS materiales_catalogo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL DEFAULT 'material',
  nombre TEXT NOT NULL,
  coste REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  proveedor TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipos_cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS establecimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nif TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  poblacion TEXT,
  provincia TEXT,
  persona_contacto TEXT,
  telefono TEXT,
  email TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  prioritaria INTEGER NOT NULL DEFAULT 0,
  completada INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  trabajo_id INTEGER REFERENCES trabajos(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL DEFAULT 'otro',
  nombre_original TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  mime_type TEXT,
  tamano INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// --- "nombre_comercial" lo añade normalmente el CRM (columna comercial), pero se garantiza
// también aquí de forma aditiva para que la búsqueda de clientes funcione aunque el CRM
// todavía no haya arrancado nunca contra esta base de datos ---
if (!columnExists("clientes", "nombre_comercial")) {
  db.exec("ALTER TABLE clientes ADD COLUMN nombre_comercial TEXT");
  db.exec("UPDATE clientes SET nombre_comercial = nombre WHERE nombre_comercial IS NULL");
}
if (!columnExists("clientes", "activo")) {
  db.exec("ALTER TABLE clientes ADD COLUMN activo INTEGER NOT NULL DEFAULT 1");
}

// --- Campos de proveedores añadidos desde el CRM, garantizados también aquí ---
for (const [columna, tipo] of Object.entries({
  codigo_postal: "TEXT",
  poblacion: "TEXT",
  provincia: "TEXT",
  forma_pago: "TEXT",
  iban: "TEXT",
})) {
  if (!columnExists("proveedores", columna)) {
    db.exec(`ALTER TABLE proveedores ADD COLUMN ${columna} ${tipo}`);
  }
}

// --- Migración: tipos de materiales_catalogo (fisico/licencia -> material/software, + servicio) ---
db.exec("UPDATE materiales_catalogo SET tipo = 'material' WHERE tipo = 'fisico'");
db.exec("UPDATE materiales_catalogo SET tipo = 'software' WHERE tipo = 'licencia'");

// --- Migración: proveedor (texto libre) -> proveedor_id (tabla proveedores real) ---
if (!columnExists("materiales_catalogo", "proveedor_id")) {
  db.exec("ALTER TABLE materiales_catalogo ADD COLUMN proveedor_id INTEGER REFERENCES proveedores(id)");

  const nombresProveedor = db
    .prepare("SELECT DISTINCT proveedor FROM materiales_catalogo WHERE proveedor IS NOT NULL AND trim(proveedor) != ''")
    .all()
    .map((r) => r.proveedor.trim());

  for (const nombre of nombresProveedor) {
    let proveedor = db.prepare("SELECT id FROM proveedores WHERE nombre = ?").get(nombre);
    if (!proveedor) {
      const info = db.prepare("INSERT INTO proveedores (nombre) VALUES (?)").run(nombre);
      proveedor = { id: info.lastInsertRowid };
    }
    db.prepare("UPDATE materiales_catalogo SET proveedor_id = ? WHERE trim(proveedor) = ?").run(proveedor.id, nombre);
  }
  if (nombresProveedor.length > 0) {
    console.log(`Migración: ${nombresProveedor.length} proveedor(es) de materiales convertidos a fichas de proveedor`);
  }
}

// Usuario admin por defecto (Fase 1: un único usuario)
const userCount = db.prepare("SELECT COUNT(*) AS n FROM usuarios").get().n;
if (userCount === 0) {
  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "importmoviles";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO usuarios (username, password_hash) VALUES (?, ?)").run(username, hash);
  console.log(`Usuario admin creado -> usuario: "${username}" contraseña: "${password}" (cámbiala en .env)`);
}

module.exports = db;

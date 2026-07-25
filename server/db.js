const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "panel.db"));
db.exec("PRAGMA foreign_keys = ON;");

// --- Migración: "factura" -> "parte de trabajo" (conserva todas las filas existentes) ---
function tableExists(name) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
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
  estado TEXT NOT NULL DEFAULT 'borrador',
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

CREATE TABLE IF NOT EXISTS materiales_catalogo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL DEFAULT 'fisico',
  nombre TEXT NOT NULL,
  coste REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  proveedor TEXT,
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

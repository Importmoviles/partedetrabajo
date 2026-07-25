const express = require("express");
const db = require("../db");

const router = express.Router();

const CATEGORIAS = [
  "Instalación de equipos",
  "Mantenimiento",
  "Soporte técnico",
  "Redes",
  "Servidores",
  "Software",
  "Reparación",
  "Otro",
];
const ESTADOS = ["presupuestado", "en_curso", "finalizado", "facturado"];

function withCliente(trabajo) {
  if (!trabajo) return trabajo;
  const cliente = db.prepare("SELECT id, nombre FROM clientes WHERE id = ?").get(trabajo.cliente_id);
  return { ...trabajo, cliente_nombre: cliente ? cliente.nombre : null };
}

router.get("/meta", (req, res) => {
  res.json({ categorias: CATEGORIAS, estados: ESTADOS });
});

router.get("/", (req, res) => {
  const { categoria, estado, cliente_id } = req.query;
  let sql = `SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
             JOIN clientes c ON c.id = t.cliente_id WHERE 1=1`;
  const params = [];
  if (categoria) {
    sql += " AND t.categoria = ?";
    params.push(categoria);
  }
  if (estado) {
    sql += " AND t.estado = ?";
    params.push(estado);
  }
  if (cliente_id) {
    sql += " AND t.cliente_id = ?";
    params.push(cliente_id);
  }
  sql += " ORDER BY t.id DESC";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const trabajo = db.prepare("SELECT * FROM trabajos WHERE id = ?").get(req.params.id);
  if (!trabajo) return res.status(404).json({ error: "Trabajo no encontrado" });

  const equipos = db.prepare("SELECT * FROM equipos_afectados WHERE trabajo_id = ?").all(req.params.id);
  const materiales = db.prepare("SELECT * FROM materiales WHERE trabajo_id = ?").all(req.params.id);
  const documentos = db.prepare("SELECT * FROM documentos WHERE trabajo_id = ? ORDER BY id DESC").all(req.params.id);

  res.json({ ...withCliente(trabajo), equipos, materiales, documentos });
});

router.post("/", (req, res) => {
  const { cliente_id, categoria, ubicacion, estado, fecha_inicio, fecha_fin, horas, notas_tecnicas, equipos } = req.body;

  if (!cliente_id) return res.status(400).json({ error: "El cliente es obligatorio" });
  if (!CATEGORIAS.includes(categoria)) return res.status(400).json({ error: "Categoría inválida" });

  const cliente = db.prepare("SELECT id FROM clientes WHERE id = ?").get(cliente_id);
  if (!cliente) return res.status(400).json({ error: "El cliente no existe" });

  const info = db
    .prepare(
      `INSERT INTO trabajos (cliente_id, categoria, ubicacion, estado, fecha_inicio, fecha_fin, horas, notas_tecnicas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      cliente_id,
      categoria,
      ubicacion || "oficina_cliente",
      ESTADOS.includes(estado) ? estado : "presupuestado",
      fecha_inicio || null,
      fecha_fin || null,
      horas || 0,
      notas_tecnicas || null
    );

  const trabajoId = info.lastInsertRowid;
  if (Array.isArray(equipos)) {
    const insertEquipo = db.prepare(
      "INSERT INTO equipos_afectados (trabajo_id, marca, modelo, numero_serie) VALUES (?, ?, ?, ?)"
    );
    for (const eq of equipos) {
      if (eq.marca || eq.modelo || eq.numero_serie) {
        insertEquipo.run(trabajoId, eq.marca || null, eq.modelo || null, eq.numero_serie || null);
      }
    }
  }

  const trabajo = db.prepare("SELECT * FROM trabajos WHERE id = ?").get(trabajoId);
  res.status(201).json(withCliente(trabajo));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM trabajos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Trabajo no encontrado" });

  const { cliente_id, categoria, ubicacion, estado, fecha_inicio, fecha_fin, horas, notas_tecnicas } = req.body;
  if (categoria && !CATEGORIAS.includes(categoria)) return res.status(400).json({ error: "Categoría inválida" });
  if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ error: "Estado inválido" });

  db.prepare(
    `UPDATE trabajos SET cliente_id = ?, categoria = ?, ubicacion = ?, estado = ?, fecha_inicio = ?, fecha_fin = ?, horas = ?, notas_tecnicas = ?
     WHERE id = ?`
  ).run(
    cliente_id || existing.cliente_id,
    categoria || existing.categoria,
    ubicacion || existing.ubicacion,
    estado || existing.estado,
    fecha_inicio !== undefined ? fecha_inicio : existing.fecha_inicio,
    fecha_fin !== undefined ? fecha_fin : existing.fecha_fin,
    horas !== undefined ? horas : existing.horas,
    notas_tecnicas !== undefined ? notas_tecnicas : existing.notas_tecnicas,
    req.params.id
  );

  res.json(withCliente(db.prepare("SELECT * FROM trabajos WHERE id = ?").get(req.params.id)));
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM trabajos WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Trabajo no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "No se puede borrar: el trabajo está incluido en un parte de trabajo" });
  }
});

// --- Equipos afectados ---
router.post("/:id/equipos", (req, res) => {
  const { marca, modelo, numero_serie } = req.body;
  const info = db
    .prepare("INSERT INTO equipos_afectados (trabajo_id, marca, modelo, numero_serie) VALUES (?, ?, ?, ?)")
    .run(req.params.id, marca || null, modelo || null, numero_serie || null);
  res.status(201).json(db.prepare("SELECT * FROM equipos_afectados WHERE id = ?").get(info.lastInsertRowid));
});

router.delete("/equipos/:equipoId", (req, res) => {
  db.prepare("DELETE FROM equipos_afectados WHERE id = ?").run(req.params.equipoId);
  res.json({ ok: true });
});

// --- Materiales ---
router.post("/:id/materiales", (req, res) => {
  const { tipo, nombre, cantidad, coste, precio_venta, proveedor } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre del material es obligatorio" });

  const info = db
    .prepare(
      `INSERT INTO materiales (trabajo_id, tipo, nombre, cantidad, coste, precio_venta, proveedor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.id, tipo || "fisico", nombre, cantidad || 1, coste || 0, precio_venta || 0, proveedor || null);

  res.status(201).json(db.prepare("SELECT * FROM materiales WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/materiales/:materialId", (req, res) => {
  const existing = db.prepare("SELECT * FROM materiales WHERE id = ?").get(req.params.materialId);
  if (!existing) return res.status(404).json({ error: "Material no encontrado" });

  const { tipo, nombre, cantidad, coste, precio_venta, proveedor } = req.body;
  db.prepare(
    `UPDATE materiales SET tipo = ?, nombre = ?, cantidad = ?, coste = ?, precio_venta = ?, proveedor = ? WHERE id = ?`
  ).run(
    tipo || existing.tipo,
    nombre || existing.nombre,
    cantidad !== undefined ? cantidad : existing.cantidad,
    coste !== undefined ? coste : existing.coste,
    precio_venta !== undefined ? precio_venta : existing.precio_venta,
    proveedor !== undefined ? proveedor : existing.proveedor,
    req.params.materialId
  );
  res.json(db.prepare("SELECT * FROM materiales WHERE id = ?").get(req.params.materialId));
});

router.delete("/materiales/:materialId", (req, res) => {
  db.prepare("DELETE FROM materiales WHERE id = ?").run(req.params.materialId);
  res.json({ ok: true });
});

module.exports = router;

const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const clientes = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM trabajos t WHERE t.cliente_id = c.id) AS num_trabajos
       FROM clientes c ORDER BY c.nombre COLLATE NOCASE`
    )
    .all();
  res.json(clientes);
});

router.get("/:id", (req, res) => {
  const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id);
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const trabajos = db
    .prepare("SELECT * FROM trabajos WHERE cliente_id = ? ORDER BY id DESC")
    .all(req.params.id);
  const documentos = db
    .prepare("SELECT * FROM documentos WHERE cliente_id = ? ORDER BY id DESC")
    .all(req.params.id);

  res.json({ ...cliente, trabajos, documentos });
});

router.post("/", (req, res) => {
  const { nombre, nif, direccion, telefono, email, tarifa_hora, notas, fecha_alta } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const info = db
    .prepare(
      `INSERT INTO clientes (nombre, nif, direccion, telefono, email, tarifa_hora, notas, fecha_alta)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')))`
    )
    .run(nombre, nif || null, direccion || null, telefono || null, email || null, tarifa_hora || 0, notas || null, fecha_alta || null);

  const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(cliente);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Cliente no encontrado" });

  const { nombre, nif, direccion, telefono, email, tarifa_hora, notas, fecha_alta } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  db.prepare(
    `UPDATE clientes SET nombre = ?, nif = ?, direccion = ?, telefono = ?, email = ?, tarifa_hora = ?, notas = ?, fecha_alta = ?
     WHERE id = ?`
  ).run(nombre, nif || null, direccion || null, telefono || null, email || null, tarifa_hora || 0, notas || null, fecha_alta || existing.fecha_alta, req.params.id);

  res.json(db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM clientes WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "No se puede borrar: el cliente tiene trabajos o facturas asociadas" });
  }
});

module.exports = router;

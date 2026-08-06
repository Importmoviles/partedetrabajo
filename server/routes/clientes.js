const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { activo } = req.query;
  let sql = `SELECT c.*, (SELECT COUNT(*) FROM trabajos t WHERE t.cliente_id = c.id) AS num_trabajos FROM clientes c`;
  const params = [];
  if (activo !== undefined) {
    sql += " WHERE c.activo = ?";
    params.push(activo === "1" || activo === "true" ? 1 : 0);
  }
  sql += " ORDER BY c.activo DESC, c.nombre COLLATE NOCASE";
  res.json(db.prepare(sql).all(...params));
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

  // nombre_comercial es una columna que suele gestionar el CRM, pero por defecto debe
  // coincidir con el nombre también cuando el cliente se crea desde aquí.
  db.prepare("UPDATE clientes SET nombre_comercial = ? WHERE id = ? AND nombre_comercial IS NULL").run(nombre, info.lastInsertRowid);

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

router.post("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Cliente no encontrado" });

  db.prepare("UPDATE clientes SET activo = ? WHERE id = ?").run(existing.activo ? 0 : 1, req.params.id);
  res.json(db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM clientes WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "No se puede borrar: el cliente tiene trabajos o partes de trabajo asociados" });
  }
});

module.exports = router;

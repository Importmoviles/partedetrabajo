const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { activo } = req.query;
  let sql = "SELECT * FROM proveedores";
  const params = [];
  if (activo !== undefined) {
    sql += " WHERE activo = ?";
    params.push(activo === "1" || activo === "true" ? 1 : 0);
  }
  sql += " ORDER BY activo DESC, nombre COLLATE NOCASE";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const proveedor = db.prepare("SELECT * FROM proveedores WHERE id = ?").get(req.params.id);
  if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });
  res.json(proveedor);
});

router.post("/", (req, res) => {
  const { nombre, nif, direccion, telefono, email, contacto, categoria, notas } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const info = db
    .prepare(
      `INSERT INTO proveedores (nombre, nif, direccion, telefono, email, contacto, categoria, notas, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .run(nombre, nif || null, direccion || null, telefono || null, email || null, contacto || null, categoria || null, notas || null);

  res.status(201).json(db.prepare("SELECT * FROM proveedores WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM proveedores WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Proveedor no encontrado" });

  const { nombre, nif, direccion, telefono, email, contacto, categoria, notas, activo } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  db.prepare(
    `UPDATE proveedores SET nombre = ?, nif = ?, direccion = ?, telefono = ?, email = ?, contacto = ?, categoria = ?, notas = ?, activo = ?
     WHERE id = ?`
  ).run(
    nombre,
    nif || null,
    direccion || null,
    telefono || null,
    email || null,
    contacto || null,
    categoria || null,
    notas || null,
    activo !== undefined ? (activo ? 1 : 0) : existing.activo,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM proveedores WHERE id = ?").get(req.params.id));
});

router.post("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM proveedores WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Proveedor no encontrado" });

  db.prepare("UPDATE proveedores SET activo = ? WHERE id = ?").run(existing.activo ? 0 : 1, req.params.id);
  res.json(db.prepare("SELECT * FROM proveedores WHERE id = ?").get(req.params.id));
});

module.exports = router;

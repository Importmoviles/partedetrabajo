const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { activo } = req.query;
  let sql = "SELECT * FROM materiales_catalogo";
  const params = [];
  if (activo !== undefined) {
    sql += " WHERE activo = ?";
    params.push(activo === "1" || activo === "true" ? 1 : 0);
  }
  sql += " ORDER BY activo DESC, nombre COLLATE NOCASE";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const item = db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "No encontrado" });
  res.json(item);
});

router.post("/", (req, res) => {
  const { tipo, nombre, coste, precio_venta, proveedor } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const info = db
    .prepare(
      `INSERT INTO materiales_catalogo (tipo, nombre, coste, precio_venta, proveedor, activo)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
    .run(tipo || "fisico", nombre, coste || 0, precio_venta || 0, proveedor || null);

  res.status(201).json(db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });

  const { tipo, nombre, coste, precio_venta, proveedor, activo } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  db.prepare(
    `UPDATE materiales_catalogo SET tipo = ?, nombre = ?, coste = ?, precio_venta = ?, proveedor = ?, activo = ? WHERE id = ?`
  ).run(
    tipo || existing.tipo,
    nombre,
    coste !== undefined ? coste : existing.coste,
    precio_venta !== undefined ? precio_venta : existing.precio_venta,
    proveedor !== undefined ? proveedor : existing.proveedor,
    activo !== undefined ? (activo ? 1 : 0) : existing.activo,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id));
});

router.post("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });

  db.prepare("UPDATE materiales_catalogo SET activo = ? WHERE id = ?").run(existing.activo ? 0 : 1, req.params.id);
  res.json(db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id));
});

module.exports = router;

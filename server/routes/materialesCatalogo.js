const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { activo } = req.query;
  let sql = `SELECT m.*, p.nombre AS proveedor_nombre FROM materiales_catalogo m
             LEFT JOIN proveedores p ON p.id = m.proveedor_id`;
  const params = [];
  if (activo !== undefined) {
    sql += " WHERE m.activo = ?";
    params.push(activo === "1" || activo === "true" ? 1 : 0);
  }
  sql += " ORDER BY m.activo DESC, m.nombre COLLATE NOCASE";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const item = db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "No encontrado" });
  res.json(item);
});

// El alta completa (editar, activar/desactivar) se gestiona desde el CRM (Maestros → Artículos).
// Se mantiene POST aquí porque el autocompletado de materiales en un parte de trabajo permite
// crear un artículo nuevo sobre la marcha sin salir de la app de Partes.
router.post("/", (req, res) => {
  const { tipo, nombre, coste, precio_venta, proveedor_id } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const info = db
    .prepare(
      `INSERT INTO materiales_catalogo (tipo, nombre, coste, precio_venta, proveedor_id, activo)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
    .run(tipo || "material", nombre, coste || 0, precio_venta || 0, proveedor_id || null);

  res.status(201).json(db.prepare("SELECT * FROM materiales_catalogo WHERE id = ?").get(info.lastInsertRowid));
});

module.exports = router;

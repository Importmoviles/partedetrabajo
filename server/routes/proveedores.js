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

// El alta/edición de proveedores se gestiona desde el CRM (Maestros → Proveedores).
// Aquí solo queda lectura, para el desplegable de proveedor en materiales y para la
// migración histórica de proveedor (texto libre) -> proveedor_id en db.js.

module.exports = router;

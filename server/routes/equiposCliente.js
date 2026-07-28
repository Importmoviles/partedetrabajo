const express = require("express");
const db = require("../db");

const router = express.Router();

// Solo lectura: el alta/edición completa de equipos vive en el CRM (Maestros → Equipos).
// Aquí se usa para el autocompletado al registrar equipos afectados en un parte de trabajo
// (el alta desde el propio parte se hace automáticamente, ver routes/trabajos.js).
router.get("/", (req, res) => {
  const { cliente_id, activo } = req.query;
  if (!cliente_id) return res.status(400).json({ error: "Falta cliente_id" });

  let sql = "SELECT * FROM equipos_cliente WHERE cliente_id = ?";
  const params = [cliente_id];
  if (activo !== undefined) {
    sql += " AND activo = ?";
    params.push(activo === "1" || activo === "true" ? 1 : 0);
  }
  sql += " ORDER BY marca COLLATE NOCASE, modelo COLLATE NOCASE";
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;

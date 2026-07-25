const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM tareas ORDER BY prioritaria DESC, id DESC").all());
});

router.post("/", (req, res) => {
  const { titulo } = req.body;
  if (!titulo || !titulo.trim()) return res.status(400).json({ error: "El título es obligatorio" });

  const info = db.prepare("INSERT INTO tareas (titulo) VALUES (?)").run(titulo.trim());
  res.status(201).json(db.prepare("SELECT * FROM tareas WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM tareas WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Tarea no encontrada" });

  const { titulo, prioritaria, completada } = req.body;
  if (titulo !== undefined && !titulo.trim()) return res.status(400).json({ error: "El título es obligatorio" });

  db.prepare("UPDATE tareas SET titulo = ?, prioritaria = ?, completada = ? WHERE id = ?").run(
    titulo !== undefined ? titulo.trim() : existing.titulo,
    prioritaria !== undefined ? (prioritaria ? 1 : 0) : existing.prioritaria,
    completada !== undefined ? (completada ? 1 : 0) : existing.completada,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM tareas WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tareas WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Tarea no encontrada" });
  res.json({ ok: true });
});

module.exports = router;

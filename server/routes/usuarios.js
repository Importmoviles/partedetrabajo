const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT id, username FROM usuarios ORDER BY username COLLATE NOCASE").all());
});

router.post("/", (req, res) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: "El usuario es obligatorio" });
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
  }

  const existe = db.prepare("SELECT id FROM usuarios WHERE username = ?").get(username.trim());
  if (existe) return res.status(400).json({ error: "Ya existe un usuario con ese nombre" });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare("INSERT INTO usuarios (username, password_hash) VALUES (?, ?)").run(username.trim(), hash);
  res.status(201).json({ id: info.lastInsertRowid, username: username.trim() });
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });

  const { username, password } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: "El usuario es obligatorio" });

  const duplicado = db.prepare("SELECT id FROM usuarios WHERE username = ? AND id != ?").get(username.trim(), req.params.id);
  if (duplicado) return res.status(400).json({ error: "Ya existe un usuario con ese nombre" });

  if (password) {
    if (password.length < 4) return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE usuarios SET username = ?, password_hash = ? WHERE id = ?").run(username.trim(), hash, req.params.id);
  } else {
    db.prepare("UPDATE usuarios SET username = ? WHERE id = ?").run(username.trim(), req.params.id);
  }

  res.json({ id: Number(req.params.id), username: username.trim() });
});

router.delete("/:id", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS n FROM usuarios").get().n;
  if (total <= 1) return res.status(400).json({ error: "No se puede borrar el único usuario que queda" });
  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: "No puedes borrar tu propio usuario mientras tienes la sesión abierta" });
  }

  const result = db.prepare("DELETE FROM usuarios WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ ok: true });
});

module.exports = router;

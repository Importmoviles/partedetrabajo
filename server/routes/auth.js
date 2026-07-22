const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  const user = db.prepare("SELECT * FROM usuarios WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
  const user = db.prepare("SELECT id, username FROM usuarios WHERE id = ?").get(req.session.userId);
  if (!user) return res.status(401).json({ error: "No autenticado" });
  res.json(user);
});

module.exports = router;

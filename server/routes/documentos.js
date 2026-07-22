const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const multer = require("multer");
const db = require("../db");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const CATEGORIAS = ["contrato", "foto", "certificado", "garantia", "otro"];

router.get("/", (req, res) => {
  const { cliente_id, trabajo_id } = req.query;
  let sql = "SELECT * FROM documentos WHERE 1=1";
  const params = [];
  if (cliente_id) {
    sql += " AND cliente_id = ?";
    params.push(cliente_id);
  }
  if (trabajo_id) {
    sql += " AND trabajo_id = ?";
    params.push(trabajo_id);
  }
  sql += " ORDER BY id DESC";
  res.json(db.prepare(sql).all(...params));
});

router.post("/", upload.single("archivo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

  const { cliente_id, trabajo_id, categoria } = req.body;
  if (!cliente_id && !trabajo_id) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "El documento debe vincularse a un cliente o a un trabajo" });
  }

  const info = db
    .prepare(
      `INSERT INTO documentos (cliente_id, trabajo_id, categoria, nombre_original, nombre_archivo, mime_type, tamano)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      cliente_id || null,
      trabajo_id || null,
      CATEGORIAS.includes(categoria) ? categoria : "otro",
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size
    );

  res.status(201).json(db.prepare("SELECT * FROM documentos WHERE id = ?").get(info.lastInsertRowid));
});

router.get("/:id/archivo", (req, res) => {
  const doc = db.prepare("SELECT * FROM documentos WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Documento no encontrado" });
  res.setHeader("Content-Disposition", `inline; filename="${doc.nombre_original}"`);
  res.sendFile(path.join(uploadsDir, doc.nombre_archivo));
});

router.delete("/:id", (req, res) => {
  const doc = db.prepare("SELECT * FROM documentos WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Documento no encontrado" });

  db.prepare("DELETE FROM documentos WHERE id = ?").run(req.params.id);
  fs.unlink(path.join(uploadsDir, doc.nombre_archivo), () => {});
  res.json({ ok: true });
});

module.exports = router;

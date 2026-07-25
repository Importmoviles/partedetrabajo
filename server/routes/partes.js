const express = require("express");
const PDFDocument = require("pdfkit");
const db = require("../db");

const router = express.Router();

const ESTADOS = ["borrador", "emitida", "pagada", "vencida"];

function nextNumero() {
  const last = db.prepare("SELECT numero FROM partes ORDER BY id DESC LIMIT 1").get();
  let n = 0;
  if (last && /PARTE-(\d+)/.test(last.numero)) {
    n = parseInt(last.numero.match(/PARTE-(\d+)/)[1], 10);
  }
  return `PARTE-${String(n + 1).padStart(4, "0")}`;
}

function computeTotals(parte, lineas) {
  const subtotal = lineas.reduce((sum, l) => sum + l.cantidad * l.precio_unitario, 0);
  const ivaImporte = subtotal * (parte.iva / 100);
  return { subtotal, ivaImporte, total: subtotal + ivaImporte };
}

function getParteCompleto(id) {
  const parte = db.prepare("SELECT * FROM partes WHERE id = ?").get(id);
  if (!parte) return null;
  const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(parte.cliente_id);
  const lineas = db.prepare("SELECT * FROM parte_lineas WHERE parte_id = ? ORDER BY orden, id").all(id);
  const trabajos = db
    .prepare(`SELECT t.* FROM trabajos t JOIN parte_trabajos pt ON pt.trabajo_id = t.id WHERE pt.parte_id = ?`)
    .all(id);
  const totals = computeTotals(parte, lineas);
  return { ...parte, cliente, lineas, trabajos, ...totals };
}

router.get("/", (req, res) => {
  const partes = db
    .prepare(`SELECT p.*, c.nombre AS cliente_nombre FROM partes p JOIN clientes c ON c.id = p.cliente_id ORDER BY p.id DESC`)
    .all();
  const withTotals = partes.map((p) => {
    const lineas = db.prepare("SELECT * FROM parte_lineas WHERE parte_id = ?").all(p.id);
    return { ...p, ...computeTotals(p, lineas) };
  });
  res.json(withTotals);
});

router.get("/:id", (req, res) => {
  const parte = getParteCompleto(req.params.id);
  if (!parte) return res.status(404).json({ error: "Parte de trabajo no encontrado" });
  res.json(parte);
});

router.post("/", (req, res) => {
  const { cliente_id, trabajo_ids, iva, fecha, lineas } = req.body;
  if (!cliente_id) return res.status(400).json({ error: "El cliente es obligatorio" });
  if (!Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: "El parte necesita al menos una línea" });
  }

  const numero = nextNumero();
  const info = db
    .prepare("INSERT INTO partes (numero, cliente_id, estado, iva, fecha) VALUES (?, ?, 'borrador', ?, COALESCE(?, date('now')))")
    .run(numero, cliente_id, iva !== undefined ? iva : 21, fecha || null);

  const parteId = info.lastInsertRowid;

  const insertLinea = db.prepare(
    "INSERT INTO parte_lineas (parte_id, tipo, descripcion, cantidad, precio_unitario, orden) VALUES (?, ?, ?, ?, ?, ?)"
  );
  lineas.forEach((l, idx) => {
    insertLinea.run(parteId, l.tipo || "fijo", l.descripcion, l.cantidad || 1, l.precio_unitario || 0, idx);
  });

  if (Array.isArray(trabajo_ids)) {
    const insertRel = db.prepare("INSERT OR IGNORE INTO parte_trabajos (parte_id, trabajo_id) VALUES (?, ?)");
    for (const tId of trabajo_ids) {
      insertRel.run(parteId, tId);
      db.prepare("UPDATE trabajos SET estado = 'facturado' WHERE id = ?").run(tId);
    }
  }

  res.status(201).json(getParteCompleto(parteId));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM partes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Parte de trabajo no encontrado" });

  const { estado, iva, fecha, lineas } = req.body;
  if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ error: "Estado inválido" });

  db.prepare("UPDATE partes SET estado = ?, iva = ?, fecha = ? WHERE id = ?").run(
    estado || existing.estado,
    iva !== undefined ? iva : existing.iva,
    fecha || existing.fecha,
    req.params.id
  );

  if (Array.isArray(lineas)) {
    db.prepare("DELETE FROM parte_lineas WHERE parte_id = ?").run(req.params.id);
    const insertLinea = db.prepare(
      "INSERT INTO parte_lineas (parte_id, tipo, descripcion, cantidad, precio_unitario, orden) VALUES (?, ?, ?, ?, ?, ?)"
    );
    lineas.forEach((l, idx) => {
      insertLinea.run(req.params.id, l.tipo || "fijo", l.descripcion, l.cantidad || 1, l.precio_unitario || 0, idx);
    });
  }

  res.json(getParteCompleto(req.params.id));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM partes WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Parte de trabajo no encontrado" });
  res.json({ ok: true });
});

router.get("/:id/pdf", (req, res) => {
  const parte = getParteCompleto(req.params.id);
  if (!parte) return res.status(404).json({ error: "Parte de trabajo no encontrado" });

  const ink = "#0A0A0A";
  const brand = "#33D633";
  const muted = "#767D77";
  const line = "#E3E6E3";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${parte.numero}.pdf"`);
  doc.pipe(res);

  // Cabecera
  doc.fillColor(ink).fontSize(20).font("Helvetica-Bold").text("Import", 50, 50, { continued: true });
  doc.fillColor(brand).text("Móviles");
  doc.fillColor(muted).fontSize(9).font("Helvetica").text("TECHNOLOGIES · PANEL DE GESTIÓN");

  doc.fillColor(ink).fontSize(16).font("Helvetica-Bold").text(parte.numero, 400, 50, { align: "right" });
  doc.fillColor(muted).fontSize(10).font("Helvetica").text(`Fecha: ${parte.fecha}`, 400, 72, { align: "right" });
  doc.text(`Estado: ${parte.estado}`, 400, 86, { align: "right" });

  doc.moveTo(50, 115).lineTo(545, 115).strokeColor(line).stroke();

  // Cliente
  doc.fillColor(muted).fontSize(9).text("CLIENTE", 50, 130);
  doc.fillColor(ink).fontSize(12).font("Helvetica-Bold").text(parte.cliente.nombre, 50, 144);
  doc.font("Helvetica").fontSize(10).fillColor(muted);
  if (parte.cliente.nif) doc.text(parte.cliente.nif, 50, 160);
  if (parte.cliente.direccion) doc.text(parte.cliente.direccion, 50, 174);
  if (parte.cliente.email) doc.text(parte.cliente.email, 50, 188);

  // Tabla de líneas
  let y = 230;
  doc.fillColor(muted).fontSize(9).font("Helvetica-Bold");
  doc.text("DESCRIPCIÓN", 50, y);
  doc.text("CANT.", 320, y, { width: 60, align: "right" });
  doc.text("PRECIO", 390, y, { width: 70, align: "right" });
  doc.text("IMPORTE", 470, y, { width: 75, align: "right" });
  y += 15;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(line).stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10).fillColor(ink);
  for (const l of parte.lineas) {
    const importe = l.cantidad * l.precio_unitario;
    doc.text(l.descripcion, 50, y, { width: 260 });
    doc.text(String(l.cantidad), 320, y, { width: 60, align: "right" });
    doc.text(`${l.precio_unitario.toFixed(2)}€`, 390, y, { width: 70, align: "right" });
    doc.text(`${importe.toFixed(2)}€`, 470, y, { width: 75, align: "right" });
    y += 20;
  }

  y += 10;
  doc.moveTo(320, y).lineTo(545, y).strokeColor(line).stroke();
  y += 12;

  doc.font("Helvetica").fontSize(10).fillColor(muted);
  doc.text("Subtotal", 390, y, { width: 70, align: "right" });
  doc.fillColor(ink).text(`${parte.subtotal.toFixed(2)}€`, 470, y, { width: 75, align: "right" });
  y += 16;
  doc.fillColor(muted).text(`IVA (${parte.iva}%)`, 390, y, { width: 70, align: "right" });
  doc.fillColor(ink).text(`${parte.ivaImporte.toFixed(2)}€`, 470, y, { width: 75, align: "right" });
  y += 20;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(ink);
  doc.text("TOTAL", 390, y, { width: 70, align: "right" });
  doc.fillColor(brand).text(`${parte.total.toFixed(2)}€`, 470, y, { width: 75, align: "right" });

  doc.end();
});

module.exports = router;

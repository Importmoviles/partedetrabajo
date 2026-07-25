const express = require("express");
const db = require("../db");

const router = express.Router();

function totalOf(p) {
  return p.subtotal * (1 + p.iva / 100);
}

function partesConSubtotal() {
  return db
    .prepare(
      `SELECT p.id, p.estado, p.iva, p.fecha, COALESCE(SUM(l.cantidad * l.precio_unitario), 0) AS subtotal
       FROM partes p LEFT JOIN parte_lineas l ON l.parte_id = p.id
       GROUP BY p.id`
    )
    .all();
}

router.get("/stats", (req, res) => {
  const trabajosActivos = db
    .prepare("SELECT COUNT(*) AS n FROM trabajos WHERE estado IN ('presupuestado', 'en_curso')")
    .get().n;

  // Pendiente de facturar: valor estimado de trabajos finalizados que aún no tienen parte de trabajo
  const trabajosSinParte = db
    .prepare(
      `SELECT t.id, t.horas, c.tarifa_hora,
              COALESCE((SELECT SUM(m.cantidad * m.precio_venta) FROM materiales m WHERE m.trabajo_id = t.id), 0) AS materiales_total
       FROM trabajos t JOIN clientes c ON c.id = t.cliente_id
       WHERE t.estado = 'finalizado'`
    )
    .all();
  const pendienteFacturar = trabajosSinParte.reduce(
    (sum, t) => sum + t.horas * t.tarifa_hora + t.materiales_total,
    0
  );

  const partes = partesConSubtotal();
  const mesActual = new Date().toISOString().slice(0, 7);
  const esteMes = partes
    .filter((p) => p.estado === "pagada" && p.fecha && p.fecha.slice(0, 7) === mesActual)
    .reduce((sum, p) => sum + totalOf(p), 0);

  res.json({
    trabajos_activos: trabajosActivos,
    pendiente_facturar: Math.round(pendienteFacturar * 100) / 100,
    este_mes: Math.round(esteMes * 100) / 100,
  });
});

router.get("/periodo", (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) return res.status(400).json({ error: "Indica 'desde' y 'hasta'" });

  const partes = partesConSubtotal();
  const total = partes
    .filter((p) => p.estado === "pagada" && p.fecha && p.fecha >= desde && p.fecha <= hasta)
    .reduce((sum, p) => sum + totalOf(p), 0);

  res.json({ desde, hasta, total: Math.round(total * 100) / 100 });
});

module.exports = router;

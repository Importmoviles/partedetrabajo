const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/stats", (req, res) => {
  const trabajosActivos = db
    .prepare("SELECT COUNT(*) AS n FROM trabajos WHERE estado IN ('presupuestado', 'en_curso')")
    .get().n;

  const facturas = db
    .prepare(
      `SELECT f.id, f.estado, f.iva, f.fecha, COALESCE(SUM(l.cantidad * l.precio_unitario), 0) AS subtotal
       FROM facturas f LEFT JOIN factura_lineas l ON l.factura_id = f.id
       GROUP BY f.id`
    )
    .all();

  const totalOf = (f) => f.subtotal * (1 + f.iva / 100);

  const pendienteCobro = facturas
    .filter((f) => f.estado === "emitida" || f.estado === "vencida")
    .reduce((sum, f) => sum + totalOf(f), 0);

  const mesActual = new Date().toISOString().slice(0, 7);
  const esteMes = facturas
    .filter((f) => f.estado === "pagada" && f.fecha && f.fecha.slice(0, 7) === mesActual)
    .reduce((sum, f) => sum + totalOf(f), 0);

  res.json({
    trabajos_activos: trabajosActivos,
    pendiente_cobro: Math.round(pendienteCobro * 100) / 100,
    este_mes: Math.round(esteMes * 100) / 100,
  });
});

module.exports = router;

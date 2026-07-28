const express = require("express");
const db = require("../db");

const router = express.Router();

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

  const mesActual = new Date().toISOString().slice(0, 7);
  const partesFacturadosMes = db
    .prepare("SELECT COUNT(*) AS n FROM partes WHERE estado = 'facturado' AND substr(fecha, 1, 7) = ?")
    .get(mesActual).n;

  res.json({
    trabajos_activos: trabajosActivos,
    pendiente_facturar: Math.round(pendienteFacturar * 100) / 100,
    partes_facturados_mes: partesFacturadosMes,
  });
});

module.exports = router;

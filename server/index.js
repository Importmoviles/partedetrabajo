require("dotenv").config();
const path = require("node:path");
const express = require("express");
const session = require("express-session");

require("./db"); // asegura que la BD y el usuario admin existen antes de arrancar

const { requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const clientesRoutes = require("./routes/clientes");
const trabajosRoutes = require("./routes/trabajos");
const partesRoutes = require("./routes/partes");
const documentosRoutes = require("./routes/documentos");
const dashboardRoutes = require("./routes/dashboard");
const materialesCatalogoRoutes = require("./routes/materialesCatalogo");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cambia-este-secreto-en-.env",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    },
  })
);

app.use("/api/auth", authRoutes);

app.use("/api/clientes", requireAuth, clientesRoutes);
app.use("/api/trabajos", requireAuth, trabajosRoutes);
app.use("/api/partes", requireAuth, partesRoutes);
app.use("/api/documentos", requireAuth, documentosRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/materiales-catalogo", requireAuth, materialesCatalogoRoutes);

// En producción, Express sirve el frontend ya compilado (npm run build en client/)
const clientDist = path.join(__dirname, "client-dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

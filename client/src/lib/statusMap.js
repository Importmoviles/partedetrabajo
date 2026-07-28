export const estadoTrabajoMap = {
  presupuestado: { label: "Presupuestado", color: "var(--color-slate)" },
  en_curso: { label: "En curso", color: "var(--color-amber)" },
  finalizado: { label: "Finalizado", color: "var(--color-teal)" },
  facturado: { label: "Con parte", color: "var(--color-indigo)" },
};

export const estadoParteMap = {
  pendiente: { label: "Pendiente", color: "var(--color-slate)" },
  facturado: { label: "Facturado", color: "var(--color-teal)" },
};

export const CATEGORIAS = [
  "Instalación de equipos",
  "Mantenimiento",
  "Soporte técnico",
  "Redes",
  "Servidores",
  "Software",
  "Reparación",
  "Otro",
];

export const CATEGORIAS_DOC = ["contrato", "foto", "certificado", "garantia", "otro"];

export function formatEUR(value) {
  return `${Number(value || 0).toFixed(2)}€`;
}

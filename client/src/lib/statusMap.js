export const statusMap = {
  presupuestado: { label: "Presupuestado", color: "var(--color-slate)" },
  en_curso: { label: "En curso", color: "var(--color-amber)" },
  finalizado: { label: "Finalizado", color: "var(--color-teal)" },
  facturado: { label: "Facturado", color: "var(--color-indigo)" },
  borrador: { label: "Borrador", color: "var(--color-slate)" },
  emitida: { label: "Emitida", color: "var(--color-amber)" },
  pagada: { label: "Pagada", color: "var(--color-teal)" },
  vencida: { label: "Vencida", color: "var(--color-danger)" },
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

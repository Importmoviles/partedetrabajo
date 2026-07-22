import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Stat, SectionLabel } from "../../components/ui";
import { InvoiceCard } from "../../components/cards";

export default function FacturasList() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/facturas")
      .then(setFacturas)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const emitidas = facturas.filter((f) => f.estado === "emitida").length;
  const pagadas = facturas.filter((f) => f.estado === "pagada").length;
  const vencidas = facturas.filter((f) => f.estado === "vencida").length;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Emitidas" value={emitidas} accent="var(--color-brand)" />
        <Stat label="Pagadas" value={pagadas} accent="var(--color-teal)" />
        <Stat label="Vencidas" value={vencidas} accent="var(--color-danger)" />
      </div>
      <SectionLabel>Todas las facturas</SectionLabel>
      {facturas.length === 0 && <p className="text-sm text-muted">Todavía no hay facturas.</p>}
      {facturas.map((i) => (
        <InvoiceCard key={i.id} inv={i} />
      ))}
    </>
  );
}

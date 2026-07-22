import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Stat, SectionLabel } from "../components/ui";
import { JobCard, InvoiceCard } from "../components/cards";

export default function Inicio() {
  const [stats, setStats] = useState(null);
  const [trabajos, setTrabajos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/trabajos"), api.get("/facturas")])
      .then(([s, t, f]) => {
        setStats(s);
        setTrabajos(t.slice(0, 3));
        setFacturas(f.filter((i) => i.estado === "emitida" || i.estado === "vencida").slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Trabajos activos" value={stats.trabajos_activos} accent="var(--color-brand)" />
        <Stat label="Pendiente cobro" value={`${stats.pendiente_cobro}€`} accent="var(--color-danger)" />
        <Stat label="Este mes" value={`${stats.este_mes}€`} accent="var(--color-teal)" />
      </div>

      <SectionLabel>Trabajos recientes</SectionLabel>
      {trabajos.length === 0 && <p className="text-sm text-muted">Todavía no hay trabajos.</p>}
      {trabajos.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}

      <SectionLabel>Facturas pendientes</SectionLabel>
      {facturas.length === 0 && <p className="text-sm text-muted">No hay facturas pendientes de cobro.</p>}
      {facturas.map((i) => (
        <InvoiceCard key={i.id} inv={i} />
      ))}
    </>
  );
}

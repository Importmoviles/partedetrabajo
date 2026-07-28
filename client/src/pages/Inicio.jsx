import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Stat, SectionLabel } from "../components/ui";
import { JobCard, ParteCard } from "../components/cards";
import { formatEUR } from "../lib/statusMap";

export default function Inicio() {
  const [stats, setStats] = useState(null);
  const [trabajos, setTrabajos] = useState([]);
  const [partes, setPartes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/trabajos"), api.get("/partes")])
      .then(([s, t, p]) => {
        setStats(s);
        setTrabajos(t.slice(0, 3));
        setPartes(p.filter((i) => i.estado === "pendiente").slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Trabajos activos" value={stats.trabajos_activos} accent="var(--color-brand)" />
        <Stat label="Pendiente de facturar" value={formatEUR(stats.pendiente_facturar)} accent="var(--color-danger)" />
        <Stat label="Partes facturados (mes)" value={stats.partes_facturados_mes} accent="var(--color-teal)" />
      </div>

      <SectionLabel>Trabajos recientes</SectionLabel>
      {trabajos.length === 0 && <p className="text-sm text-muted">Todavía no hay trabajos.</p>}
      {trabajos.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}

      <SectionLabel>Partes pendientes</SectionLabel>
      {partes.length === 0 && <p className="text-sm text-muted">No hay partes de trabajo pendientes.</p>}
      {partes.map((p) => (
        <ParteCard key={p.id} parte={p} />
      ))}
    </>
  );
}

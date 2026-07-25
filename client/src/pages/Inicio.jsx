import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Stat, SectionLabel, Input } from "../components/ui";
import { JobCard, ParteCard } from "../components/cards";
import { formatEUR } from "../lib/statusMap";

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function primerDiaMes() {
  const d = new Date();
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function ultimoDiaMes() {
  const d = new Date();
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function formatoCorto(fecha) {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}

export default function Inicio() {
  const [stats, setStats] = useState(null);
  const [trabajos, setTrabajos] = useState([]);
  const [partes, setPartes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rangoAbierto, setRangoAbierto] = useState(false);
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(ultimoDiaMes());
  const [totalPeriodo, setTotalPeriodo] = useState(null);
  const esMesActual = desde === primerDiaMes() && hasta === ultimoDiaMes();

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/trabajos"), api.get("/partes")])
      .then(([s, t, p]) => {
        setStats(s);
        setTrabajos(t.slice(0, 3));
        setPartes(p.filter((i) => i.estado === "emitida" || i.estado === "vencida").slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!rangoAbierto || esMesActual) return;
    api.get(`/dashboard/periodo?desde=${desde}&hasta=${hasta}`).then((r) => setTotalPeriodo(r.total));
  }, [rangoAbierto, desde, hasta]);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const valorPeriodo = esMesActual ? stats.este_mes : totalPeriodo ?? stats.este_mes;
  const etiquetaPeriodo = esMesActual ? "Este mes" : `${formatoCorto(desde)} – ${formatoCorto(hasta)}`;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Trabajos activos" value={stats.trabajos_activos} accent="var(--color-brand)" />
        <Stat label="Pendiente de facturar" value={formatEUR(stats.pendiente_facturar)} accent="var(--color-danger)" />
        <Stat
          label={etiquetaPeriodo}
          value={formatEUR(valorPeriodo)}
          accent="var(--color-teal)"
          active={rangoAbierto}
          onClick={() => setRangoAbierto((v) => !v)}
        />
      </div>

      {rangoAbierto && (
        <div className="flex items-center gap-2 mt-2 bg-surface border border-line rounded-xl p-2.5">
          <span className="text-xs text-muted shrink-0">Desde</span>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="!py-1.5 !text-xs" />
          <span className="text-xs text-muted shrink-0">Hasta</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="!py-1.5 !text-xs" />
        </div>
      )}

      <SectionLabel>Trabajos recientes</SectionLabel>
      {trabajos.length === 0 && <p className="text-sm text-muted">Todavía no hay trabajos.</p>}
      {trabajos.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}

      <SectionLabel>Partes pendientes</SectionLabel>
      {partes.length === 0 && <p className="text-sm text-muted">No hay partes de trabajo pendientes de cobro.</p>}
      {partes.map((p) => (
        <ParteCard key={p.id} parte={p} />
      ))}
    </>
  );
}

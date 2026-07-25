import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Stat, SectionLabel } from "../../components/ui";
import { ParteCard } from "../../components/cards";

export default function PartesList() {
  const [partes, setPartes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/partes")
      .then(setPartes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const emitidos = partes.filter((p) => p.estado === "emitida").length;
  const pagados = partes.filter((p) => p.estado === "pagada").length;
  const vencidos = partes.filter((p) => p.estado === "vencida").length;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Emitidos" value={emitidos} accent="var(--color-brand)" />
        <Stat label="Pagados" value={pagados} accent="var(--color-teal)" />
        <Stat label="Vencidos" value={vencidos} accent="var(--color-danger)" />
      </div>
      <SectionLabel>Todos los partes de trabajo</SectionLabel>
      {partes.length === 0 && <p className="text-sm text-muted">Todavía no hay partes de trabajo.</p>}
      {partes.map((p) => (
        <ParteCard key={p.id} parte={p} />
      ))}
    </>
  );
}

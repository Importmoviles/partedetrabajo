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

  const pendientes = partes.filter((p) => p.estado === "pendiente").length;
  const facturados = partes.filter((p) => p.estado === "facturado").length;

  return (
    <>
      <div className="flex gap-2.5 mt-2">
        <Stat label="Pendientes" value={pendientes} accent="var(--color-slate)" />
        <Stat label="Facturados" value={facturados} accent="var(--color-teal)" />
      </div>
      <SectionLabel>Todos los partes de trabajo</SectionLabel>
      {partes.length === 0 && <p className="text-sm text-muted">Todavía no hay partes de trabajo.</p>}
      {partes.map((p) => (
        <ParteCard key={p.id} parte={p} />
      ))}
    </>
  );
}

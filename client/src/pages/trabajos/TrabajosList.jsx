import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Chip, SectionLabel } from "../../components/ui";
import { JobCard } from "../../components/cards";
import { CATEGORIAS } from "../../lib/statusMap";

const cats = ["Todos", ...CATEGORIAS];

export default function TrabajosList() {
  const [trabajos, setTrabajos] = useState([]);
  const [catFilter, setCatFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trabajos")
      .then(setTrabajos)
      .finally(() => setLoading(false));
  }, []);

  const filtered = catFilter === "Todos" ? trabajos : trabajos.filter((t) => t.categoria === catFilter);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto mt-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {cats.map((c) => (
          <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <SectionLabel>{filtered.length} trabajos</SectionLabel>
      {filtered.length === 0 && <p className="text-sm text-muted">No hay trabajos en esta categoría.</p>}
      {filtered.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}
    </>
  );
}

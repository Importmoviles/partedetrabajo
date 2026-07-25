import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Circle, CheckCircle2, Star, Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Card, Chip, Input, SectionLabel } from "../../components/ui";

export default function TareasList() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("activas");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.get("/tareas").then(setTareas);
  }

  useEffect(() => {
    load();
    setLoading(false);
  }, []);

  async function toggleCompletada(t) {
    setError("");
    try {
      await api.put(`/tareas/${t.id}`, { completada: t.completada ? 0 : 1 });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePrioritaria(t) {
    setError("");
    try {
      await api.put(`/tareas/${t.id}`, { prioritaria: t.prioritaria ? 0 : 1 });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(t) {
    if (!confirm(`¿Borrar la tarea "${t.titulo}"?`)) return;
    setError("");
    try {
      await api.del(`/tareas/${t.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const q = busqueda.trim().toLowerCase();
  const filtradas = tareas
    .filter((t) => (filtro === "activas" ? !t.completada : t.completada))
    .filter((t) => !q || t.titulo.toLowerCase().includes(q));

  return (
    <>
      <div className="flex gap-1.5 mt-4">
        <Chip active={filtro === "activas"} onClick={() => setFiltro("activas")}>
          Activas
        </Chip>
        <Chip active={filtro === "completadas"} onClick={() => setFiltro("completadas")}>
          Completadas
        </Chip>
      </div>

      <div className="relative mt-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <Input
          placeholder="Buscar tareas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      <SectionLabel>{filtradas.length} tareas</SectionLabel>
      {error && <p className="text-danger text-sm mb-2">{error}</p>}
      {filtradas.length === 0 && (
        <p className="text-sm text-muted">
          {filtro === "activas" ? "No hay tareas activas." : "No hay tareas completadas."}
        </p>
      )}
      {filtradas.map((t) => (
        <Card key={t.id}>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleCompletada(t)} className="shrink-0 p-1.5 -ml-1.5" title="Marcar como completada">
              {t.completada ? (
                <CheckCircle2 size={20} className="text-teal" />
              ) : (
                <Circle size={20} className="text-muted" />
              )}
            </button>
            <span className={`flex-1 text-sm ${t.completada ? "text-muted line-through" : "text-ink"}`}>
              {t.titulo}
            </span>
            <button onClick={() => togglePrioritaria(t)} className="shrink-0 p-1.5" title="Marcar como prioritaria">
              <Star size={17} className={t.prioritaria ? "text-amber fill-amber" : "text-muted"} />
            </button>
            <button onClick={() => navigate(`/tareas/${t.id}/editar`)} className="text-muted shrink-0 p-1.5" title="Editar">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(t)} className="text-danger shrink-0 p-1.5" title="Borrar">
              <Trash2 size={16} />
            </button>
          </div>
        </Card>
      ))}
    </>
  );
}

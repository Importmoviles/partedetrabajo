import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Power } from "lucide-react";
import { api } from "../../lib/api";
import { Card, SectionLabel, StatusBadge } from "../../components/ui";

export default function ProveedoresList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get("/proveedores")
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(id) {
    await api.post(`/proveedores/${id}/toggle`);
    load();
  }

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const activos = items.filter((i) => i.activo);
  const inactivos = items.filter((i) => !i.activo);

  return (
    <>
      <SectionLabel>Proveedores ({activos.length} activos)</SectionLabel>
      {items.length === 0 && <p className="text-sm text-muted">Todavía no hay proveedores. Pulsa + para crear el primero.</p>}

      {activos.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-[15px] font-semibold text-ink">{p.nombre}</div>
              <div className="text-xs text-muted mt-0.5">
                {p.categoria} {p.contacto && `· ${p.contacto}`}
              </div>
              <div className="text-xs text-muted mt-0.5">{[p.telefono, p.email].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge label="Activo" color="var(--color-brand)" />
              <button onClick={() => navigate(`/maestros/proveedores/${p.id}/editar`)} className="text-muted p-1.5">
                <Pencil size={15} />
              </button>
              <button onClick={() => toggle(p.id)} className="text-brand p-1.5" title="Desactivar">
                <Power size={15} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {inactivos.length > 0 && (
        <>
          <SectionLabel>Desactivados ({inactivos.length})</SectionLabel>
          {inactivos.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between opacity-60">
                <div>
                  <div className="font-display text-[15px] font-semibold text-ink">{p.nombre}</div>
                  <div className="text-xs text-muted mt-0.5">{p.categoria}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge label="Inactivo" color="var(--color-danger)" />
                  <button onClick={() => toggle(p.id)} className="text-danger p-1.5" title="Reactivar">
                    <Power size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Power } from "lucide-react";
import { api } from "../../lib/api";
import { Card, SectionLabel, StatusBadge } from "../../components/ui";
import { formatEUR } from "../../lib/statusMap";

const tipoLabel = { fisico: "Físico", licencia: "Licencia/software" };

export default function MaterialesCatalogoList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get("/materiales-catalogo")
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(id) {
    await api.post(`/materiales-catalogo/${id}/toggle`);
    load();
  }

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const activos = items.filter((i) => i.activo);
  const inactivos = items.filter((i) => !i.activo);

  return (
    <>
      <SectionLabel>Materiales y componentes ({activos.length} activos)</SectionLabel>
      {items.length === 0 && <p className="text-sm text-muted">Todavía no hay materiales en el catálogo. Pulsa + para crear el primero.</p>}

      {activos.map((m) => (
        <Card key={m.id}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-[15px] font-semibold text-ink">{m.nombre}</div>
              <div className="text-xs text-muted mt-0.5">
                {tipoLabel[m.tipo]} {m.proveedor && `· ${m.proveedor}`}
              </div>
              <div className="font-mono text-xs text-muted mt-1">
                Coste {formatEUR(m.coste)} · Venta {formatEUR(m.precio_venta)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge label="Activo" color="var(--color-brand)" />
              <button onClick={() => navigate(`/maestros/materiales/${m.id}/editar`)} className="text-muted p-1.5">
                <Pencil size={15} />
              </button>
              <button onClick={() => toggle(m.id)} className="text-brand p-1.5" title="Desactivar">
                <Power size={15} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {inactivos.length > 0 && (
        <>
          <SectionLabel>Desactivados ({inactivos.length})</SectionLabel>
          {inactivos.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between opacity-60">
                <div>
                  <div className="font-display text-[15px] font-semibold text-ink">{m.nombre}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {tipoLabel[m.tipo]} {m.proveedor && `· ${m.proveedor}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge label="Inactivo" color="var(--color-danger)" />
                  <button onClick={() => toggle(m.id)} className="text-danger p-1.5" title="Reactivar">
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

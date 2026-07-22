import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Button, SectionLabel } from "../../components/ui";
import { JobCard } from "../../components/cards";
import DocumentosSection from "../../components/DocumentosSection";
import { formatEUR } from "../../lib/statusMap";

export default function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get(`/clientes/${id}`).then(setCliente);
  }

  useEffect(load, [id]);

  async function handleDelete() {
    if (!confirm(`¿Borrar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.del(`/clientes/${id}`);
      navigate("/clientes");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!cliente) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <div className="flex items-start justify-between mt-4">
        <div>
          <h1 className="font-display text-lg font-semibold">{cliente.nombre}</h1>
          {cliente.nif && <p className="text-xs text-muted mt-0.5">{cliente.nif}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/clientes/${id}/editar`)} className="text-muted p-1.5">
            <Pencil size={16} />
          </button>
          <button onClick={handleDelete} className="text-danger p-1.5">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && <p className="text-danger text-sm mt-2">{error}</p>}

      <div className="bg-surface border border-line rounded-2xl p-3.5 mt-3 text-sm space-y-1.5">
        {cliente.direccion && <p className="text-ink">{cliente.direccion}</p>}
        {cliente.telefono && <p className="text-muted">{cliente.telefono}</p>}
        {cliente.email && <p className="text-muted">{cliente.email}</p>}
        <p className="text-muted">Tarifa: {formatEUR(cliente.tarifa_hora)}/h</p>
        <p className="text-muted">Alta: {cliente.fecha_alta}</p>
        {cliente.notas && <p className="text-ink mt-2 whitespace-pre-wrap">{cliente.notas}</p>}
      </div>

      <SectionLabel
        action={
          <Button variant="ghost" className="!p-0 !bg-transparent text-xs" onClick={() => navigate("/trabajos/nuevo")}>
            + Nuevo trabajo
          </Button>
        }
      >
        Trabajos ({cliente.trabajos.length})
      </SectionLabel>
      {cliente.trabajos.length === 0 && <p className="text-sm text-muted">Sin trabajos todavía.</p>}
      {cliente.trabajos.map((t) => (
        <JobCard key={t.id} job={{ ...t, cliente_nombre: cliente.nombre }} />
      ))}

      <DocumentosSection clienteId={id} />
    </>
  );
}

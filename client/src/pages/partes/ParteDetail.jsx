import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Select, StatusBadge } from "../../components/ui";
import { statusMap, formatEUR } from "../../lib/statusMap";

export default function ParteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parte, setParte] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get(`/partes/${id}`).then(setParte);
  }

  useEffect(load, [id]);

  async function handleEstadoChange(e) {
    const estado = e.target.value;
    await api.put(`/partes/${id}`, { estado });
    load();
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el parte de trabajo ${parte.numero}?`)) return;
    try {
      await api.del(`/partes/${id}`);
      navigate("/partes");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!parte) return <p className="text-muted text-sm mt-6">Cargando...</p>;
  const s = statusMap[parte.estado] || statusMap.borrador;

  return (
    <>
      <div className="flex items-start justify-between mt-4">
        <div>
          <span className="font-mono text-xs text-muted">#{parte.numero}</span>
          <h1 className="font-display text-lg font-semibold mt-1">{parte.cliente.nombre}</h1>
          <StatusBadge label={s.label} color={s.color} />
        </div>
        <div className="flex gap-2">
          <a href={`/api/partes/${id}/pdf`} target="_blank" rel="noreferrer" className="text-muted p-1.5">
            <Download size={16} />
          </a>
          <button onClick={handleDelete} className="text-danger p-1.5">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && <p className="text-danger text-sm mt-2">{error}</p>}

      <div className="mt-3 mb-3">
        <label className="block text-xs font-medium text-muted mb-1">Estado</label>
        <Select value={parte.estado} onChange={handleEstadoChange} className="max-w-[180px]">
          <option value="borrador">Borrador</option>
          <option value="emitida">Emitida</option>
          <option value="pagada">Pagada</option>
          <option value="vencida">Vencida</option>
        </Select>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-3.5 text-sm">
        {parte.lineas.map((l) => (
          <div key={l.id} className="flex justify-between py-1.5 border-b border-line last:border-0">
            <span className="text-ink">
              {l.descripcion} <span className="text-muted">× {l.cantidad}</span>
            </span>
            <span className="font-mono text-ink">{formatEUR(l.cantidad * l.precio_unitario)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 text-muted">
          <span>Subtotal</span>
          <span className="font-mono">{formatEUR(parte.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>IVA ({parte.iva}%)</span>
          <span className="font-mono">{formatEUR(parte.ivaImporte)}</span>
        </div>
        <div className="flex justify-between font-semibold text-ink mt-1 text-base">
          <span>Total</span>
          <span className="font-mono">{formatEUR(parte.total)}</span>
        </div>
      </div>

      {parte.trabajos.length > 0 && (
        <p className="text-xs text-muted mt-3">
          Trabajos incluidos: {parte.trabajos.map((t) => `TRB-${String(t.id).padStart(4, "0")}`).join(", ")}
        </p>
      )}
    </>
  );
}

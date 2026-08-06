import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { api } from "../../lib/api";
import { Button, Field, Input, Select } from "../../components/ui";
import ClienteAutocomplete from "../../components/ClienteAutocomplete";
import { formatEUR } from "../../lib/statusMap";

const emptyLinea = { tipo: "fijo", descripcion: "", cantidad: 1, precio_unitario: "" };

export default function ParteForm() {
  const [searchParams] = useSearchParams();
  const trabajoId = searchParams.get("trabajo_id");
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteTexto, setClienteTexto] = useState("");
  const [iva, setIva] = useState(21);
  const [lineas, setLineas] = useState([{ ...emptyLinea }]);
  const [trabajoIds, setTrabajoIds] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get("/clientes").then(setClientes);
  }, []);

  useEffect(() => {
    if (trabajoId) {
      api.get(`/trabajos/${trabajoId}`).then((t) => {
        setClienteId(String(t.cliente_id));
        setClienteTexto(t.cliente_nombre || "");
        setTrabajoIds([t.id]);
        const nuevasLineas = [];
        if (t.horas > 0) {
          api.get(`/clientes/${t.cliente_id}`).then((c) => {
            nuevasLineas.push({
              tipo: "horas",
              descripcion: `Mano de obra — ${t.categoria}`,
              cantidad: t.horas,
              precio_unitario: c.tarifa_hora || 0,
            });
            t.materiales.forEach((m) => {
              nuevasLineas.push({
                tipo: "material",
                descripcion: m.nombre,
                cantidad: m.cantidad,
                precio_unitario: m.precio_venta,
              });
            });
            setLineas(nuevasLineas.length ? nuevasLineas : [{ ...emptyLinea }]);
            setLoaded(true);
          });
        } else {
          t.materiales.forEach((m) => {
            nuevasLineas.push({
              tipo: "material",
              descripcion: m.nombre,
              cantidad: m.cantidad,
              precio_unitario: m.precio_venta,
            });
          });
          setLineas(nuevasLineas.length ? nuevasLineas : [{ ...emptyLinea }]);
          setLoaded(true);
        }
      });
    } else {
      setLoaded(true);
    }
  }, [trabajoId]);

  function selectCliente(cliente) {
    setClienteId(String(cliente.id));
    setClienteTexto(cliente.nombre_comercial || cliente.nombre);
  }

  const clienteSeleccionado = clientes.find((c) => String(c.id) === String(clienteId));

  function updateLinea(idx, field, value) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function addLinea() {
    setLineas((prev) => [...prev, { ...emptyLinea }]);
  }

  function removeLinea(idx) {
    setLineas((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = lineas.reduce((sum, l) => sum + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0);
  const total = subtotal * (1 + Number(iva || 0) / 100);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!clienteId) return setError("Selecciona un cliente");
    const validLineas = lineas.filter((l) => l.descripcion.trim());
    if (validLineas.length === 0) return setError("Añade al menos una línea con descripción");

    setSaving(true);
    try {
      const parte = await api.post("/partes", {
        cliente_id: Number(clienteId),
        trabajo_ids: trabajoIds,
        iva: Number(iva),
        lineas: validLineas.map((l) => ({
          tipo: l.tipo,
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad) || 1,
          precio_unitario: Number(l.precio_unitario) || 0,
        })),
      });
      navigate(`/partes/${parte.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">Nuevo parte de trabajo</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Cliente *">
          <ClienteAutocomplete
            items={clientes.filter((c) => c.activo)}
            value={clienteTexto}
            selected={clienteSeleccionado}
            disabled={Boolean(trabajoId)}
            onChangeText={(texto) => {
              setClienteTexto(texto);
              setClienteId("");
            }}
            onSelect={selectCliente}
          />
        </Field>

        <div className="flex items-center justify-between mt-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Líneas</span>
          <button type="button" onClick={addLinea} className="text-brand text-xs font-medium flex items-center gap-1">
            <Plus size={12} /> Añadir línea
          </button>
        </div>

        {lineas.map((l, idx) => (
          <div key={idx} className="bg-surface border border-line rounded-xl p-3 mb-2">
            <div className="flex gap-2 mb-2">
              <Select value={l.tipo} onChange={(e) => updateLinea(idx, "tipo", e.target.value)} className="max-w-[110px]">
                <option value="horas">Horas</option>
                <option value="fijo">Precio fijo</option>
                <option value="material">Material</option>
              </Select>
              <Input
                placeholder="Descripción"
                value={l.descripcion}
                onChange={(e) => updateLinea(idx, "descripcion", e.target.value)}
              />
              <button type="button" onClick={() => removeLinea(idx)} className="text-muted shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Cantidad"
                value={l.cantidad}
                onChange={(e) => updateLinea(idx, "cantidad", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Precio unitario (€)"
                value={l.precio_unitario}
                onChange={(e) => updateLinea(idx, "precio_unitario", e.target.value)}
              />
            </div>
          </div>
        ))}

        <Field label="IVA (%)">
          <Input type="number" step="1" value={iva} onChange={(e) => setIva(e.target.value)} className="max-w-[100px]" />
        </Field>

        <div className="bg-surface border border-line rounded-xl p-3 mb-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-mono">{formatEUR(subtotal)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink mt-1">
            <span>Total</span>
            <span className="font-mono">{formatEUR(total)}</span>
          </div>
        </div>

        {error && <p className="text-danger text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear parte de trabajo"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}

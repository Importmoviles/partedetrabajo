import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2, Plus, X, ClipboardList } from "lucide-react";
import { api } from "../../lib/api";
import { Button, Input, SectionLabel, Select, StatusBadge, StatusDot } from "../../components/ui";
import { trabajoCodigo } from "../../components/cards";
import DocumentosSection from "../../components/DocumentosSection";
import MaterialAutocomplete from "../../components/MaterialAutocomplete";
import { estadoTrabajoMap, formatEUR } from "../../lib/statusMap";

const emptyEquipo = { marca: "", modelo: "", numero_serie: "" };
const emptyMaterial = { tipo: "fisico", nombre: "", cantidad: 1, coste: "", precio_venta: "", proveedor: "" };

export default function TrabajoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajo, setTrabajo] = useState(null);
  const [error, setError] = useState("");
  const [equipoForm, setEquipoForm] = useState(emptyEquipo);
  const [showEquipoForm, setShowEquipoForm] = useState(false);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [catalogo, setCatalogo] = useState([]);

  function load() {
    api.get(`/trabajos/${id}`).then(setTrabajo);
  }

  function loadCatalogo() {
    api.get("/materiales-catalogo?activo=1").then(setCatalogo);
  }

  useEffect(load, [id]);
  useEffect(loadCatalogo, []);

  async function handleDelete() {
    if (!confirm("¿Borrar este trabajo? Esta acción no se puede deshacer.")) return;
    try {
      await api.del(`/trabajos/${id}`);
      navigate("/trabajos");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addEquipo(e) {
    e.preventDefault();
    await api.post(`/trabajos/${id}/equipos`, equipoForm);
    setEquipoForm(emptyEquipo);
    setShowEquipoForm(false);
    load();
  }

  async function removeEquipo(equipoId) {
    await api.del(`/trabajos/equipos/${equipoId}`);
    load();
  }

  async function addMaterial(e) {
    e.preventDefault();
    await api.post(`/trabajos/${id}/materiales`, {
      ...materialForm,
      cantidad: Number(materialForm.cantidad) || 1,
      coste: Number(materialForm.coste) || 0,
      precio_venta: Number(materialForm.precio_venta) || 0,
    });
    setMaterialForm(emptyMaterial);
    setShowMaterialForm(false);
    load();
  }

  async function removeMaterial(materialId) {
    await api.del(`/trabajos/materiales/${materialId}`);
    load();
  }

  function selectCatalogItem(item) {
    setMaterialForm({
      tipo: item.tipo,
      nombre: item.nombre,
      cantidad: materialForm.cantidad || 1,
      coste: item.coste,
      precio_venta: item.precio_venta,
      proveedor: item.proveedor_nombre || "",
    });
  }

  async function createCatalogItem(nombre) {
    const nuevo = await api.post("/materiales-catalogo", {
      tipo: materialForm.tipo,
      nombre,
      coste: Number(materialForm.coste) || 0,
      precio_venta: Number(materialForm.precio_venta) || 0,
    });
    setCatalogo((prev) => [...prev, nuevo]);
    setMaterialForm({ ...materialForm, nombre: nuevo.nombre });
  }

  if (!trabajo) return <p className="text-muted text-sm mt-6">Cargando...</p>;
  const s = estadoTrabajoMap[trabajo.estado] || estadoTrabajoMap.presupuestado;

  return (
    <>
      <div className="flex items-start justify-between mt-4">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot color={s.color} pulse={trabajo.estado === "en_curso"} />
            <span className="font-mono text-xs text-muted">#{trabajoCodigo(trabajo.id)}</span>
            <StatusBadge label={s.label} color={s.color} />
          </div>
          <h1 className="font-display text-lg font-semibold mt-1">{trabajo.cliente_nombre}</h1>
          <p className="text-sm text-muted">{trabajo.categoria}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/trabajos/${id}/editar`)} className="text-muted p-1.5">
            <Pencil size={16} />
          </button>
          <button onClick={handleDelete} className="text-danger p-1.5">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && <p className="text-danger text-sm mt-2">{error}</p>}

      <div className="bg-surface border border-line rounded-2xl p-3.5 mt-3 text-sm space-y-1.5">
        <p className="text-muted">
          Ubicación: <span className="text-ink">{trabajo.ubicacion === "remoto" ? "Remoto" : "Oficina del cliente"}</span>
        </p>
        <p className="text-muted">
          Fechas: <span className="text-ink">{trabajo.fecha_inicio || "—"} → {trabajo.fecha_fin || "—"}</span>
        </p>
        <p className="text-muted">
          Horas: <span className="text-ink">{trabajo.horas || 0}h</span>
        </p>
        {trabajo.notas_tecnicas && <p className="text-ink mt-2 whitespace-pre-wrap">{trabajo.notas_tecnicas}</p>}
      </div>

      <Button className="mt-3 flex items-center gap-1.5" onClick={() => navigate(`/partes/nueva?trabajo_id=${trabajo.id}`)}>
        <ClipboardList size={15} /> Generar parte de trabajo
      </Button>

      <DocumentosSection trabajoId={id} />

      <SectionLabel
        action={
          <button className="text-brand text-xs font-medium flex items-center gap-1" onClick={() => setShowEquipoForm((v) => !v)}>
            <Plus size={12} /> Añadir
          </button>
        }
      >
        Equipos afectados
      </SectionLabel>
      {trabajo.equipos.length === 0 && !showEquipoForm && <p className="text-sm text-muted">Sin equipos registrados.</p>}
      {trabajo.equipos.map((eq) => (
        <div key={eq.id} className="flex items-center justify-between bg-surface border border-line rounded-xl px-3 py-2 mb-2 text-sm">
          <span>
            {[eq.marca, eq.modelo].filter(Boolean).join(" ") || "Equipo"}
            {eq.numero_serie && <span className="text-muted"> · S/N {eq.numero_serie}</span>}
          </span>
          <button onClick={() => removeEquipo(eq.id)} className="text-muted">
            <X size={14} />
          </button>
        </div>
      ))}
      {showEquipoForm && (
        <form onSubmit={addEquipo} className="bg-surface border border-line rounded-xl p-3 mb-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input placeholder="Marca" value={equipoForm.marca} onChange={(e) => setEquipoForm({ ...equipoForm, marca: e.target.value })} />
            <Input placeholder="Modelo" value={equipoForm.modelo} onChange={(e) => setEquipoForm({ ...equipoForm, modelo: e.target.value })} />
          </div>
          <Input
            placeholder="Nº de serie"
            value={equipoForm.numero_serie}
            onChange={(e) => setEquipoForm({ ...equipoForm, numero_serie: e.target.value })}
            className="mb-2"
          />
          <Button type="submit" className="text-xs !px-3 !py-1.5">
            Añadir equipo
          </Button>
        </form>
      )}

      <SectionLabel
        action={
          <button className="text-brand text-xs font-medium flex items-center gap-1" onClick={() => setShowMaterialForm((v) => !v)}>
            <Plus size={12} /> Añadir
          </button>
        }
      >
        Materiales / componentes
      </SectionLabel>
      {trabajo.materiales.length === 0 && !showMaterialForm && <p className="text-sm text-muted">Sin materiales registrados.</p>}
      {trabajo.materiales.map((m) => (
        <div key={m.id} className="flex items-center justify-between bg-surface border border-line rounded-xl px-3 py-2 mb-2 text-sm">
          <div>
            <span className="text-ink">{m.nombre}</span>
            <span className="text-muted"> · {m.cantidad} × {formatEUR(m.precio_venta)}</span>
          </div>
          <button onClick={() => removeMaterial(m.id)} className="text-muted">
            <X size={14} />
          </button>
        </div>
      ))}
      {showMaterialForm && (
        <form onSubmit={addMaterial} className="bg-surface border border-line rounded-xl p-3 mb-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Select value={materialForm.tipo} onChange={(e) => setMaterialForm({ ...materialForm, tipo: e.target.value })}>
              <option value="fisico">Físico</option>
              <option value="licencia">Licencia/software</option>
            </Select>
            <Input placeholder="Proveedor" value={materialForm.proveedor} onChange={(e) => setMaterialForm({ ...materialForm, proveedor: e.target.value })} />
          </div>
          <div className="mb-2">
            <MaterialAutocomplete
              items={catalogo}
              value={materialForm.nombre}
              onChangeText={(v) => setMaterialForm({ ...materialForm, nombre: v })}
              onSelect={selectCatalogItem}
              onCreate={createCatalogItem}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Cantidad"
              value={materialForm.cantidad}
              onChange={(e) => setMaterialForm({ ...materialForm, cantidad: e.target.value })}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Coste (€)"
              value={materialForm.coste}
              onChange={(e) => setMaterialForm({ ...materialForm, coste: e.target.value })}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Precio venta (€)"
              value={materialForm.precio_venta}
              onChange={(e) => setMaterialForm({ ...materialForm, precio_venta: e.target.value })}
            />
          </div>
          <Button type="submit" className="text-xs !px-3 !py-1.5">
            Añadir material
          </Button>
        </form>
      )}
    </>
  );
}

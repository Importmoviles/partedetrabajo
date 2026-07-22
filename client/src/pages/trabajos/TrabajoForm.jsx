import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input, Select, Textarea } from "../../components/ui";
import { CATEGORIAS } from "../../lib/statusMap";

const empty = {
  cliente_id: "",
  categoria: CATEGORIAS[0],
  ubicacion: "oficina_cliente",
  estado: "presupuestado",
  fecha_inicio: "",
  fecha_fin: "",
  horas: "",
  notas_tecnicas: "",
};

export default function TrabajoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...empty, cliente_id: searchParams.get("cliente_id") || "" });
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/clientes").then(setClientes);
  }, []);

  useEffect(() => {
    if (editing) {
      api.get(`/trabajos/${id}`).then((t) =>
        setForm({
          cliente_id: t.cliente_id,
          categoria: t.categoria,
          ubicacion: t.ubicacion,
          estado: t.estado,
          fecha_inicio: t.fecha_inicio || "",
          fecha_fin: t.fecha_fin || "",
          horas: t.horas ?? "",
          notas_tecnicas: t.notas_tecnicas || "",
        })
      );
    }
  }, [id, editing]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.cliente_id) {
      setError("Selecciona un cliente");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, horas: form.horas === "" ? 0 : Number(form.horas) };
      const trabajo = editing ? await api.put(`/trabajos/${id}`, payload) : await api.post("/trabajos", payload);
      navigate(`/trabajos/${trabajo.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">{editing ? "Editar trabajo" : "Nuevo trabajo"}</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Cliente *">
          <Select value={form.cliente_id} onChange={set("cliente_id")} required>
            <option value="">Selecciona un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Categoría *">
          <Select value={form.categoria} onChange={set("categoria")}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ubicación">
            <Select value={form.ubicacion} onChange={set("ubicacion")}>
              <option value="oficina_cliente">Oficina del cliente</option>
              <option value="remoto">Remoto</option>
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={set("estado")}>
              <option value="presupuestado">Presupuestado</option>
              <option value="en_curso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="facturado">Facturado</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio">
            <Input type="date" value={form.fecha_inicio} onChange={set("fecha_inicio")} />
          </Field>
          <Field label="Fecha fin">
            <Input type="date" value={form.fecha_fin} onChange={set("fecha_fin")} />
          </Field>
        </div>

        <Field label="Horas trabajadas">
          <Input type="number" step="0.25" min="0" value={form.horas} onChange={set("horas")} />
        </Field>

        <Field label="Notas técnicas">
          <Textarea rows={3} value={form.notas_tecnicas} onChange={set("notas_tecnicas")} />
        </Field>

        {!editing && (
          <p className="text-xs text-muted mb-3">
            Podrás adjuntar fotos y documentos justo después de guardar.
          </p>
        )}

        {error && <p className="text-danger text-sm mb-3">{error}</p>}

        <div className="flex gap-2 mt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}

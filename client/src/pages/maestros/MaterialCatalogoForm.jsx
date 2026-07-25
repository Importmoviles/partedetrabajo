import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input, Select } from "../../components/ui";

const empty = { tipo: "fisico", nombre: "", coste: "", precio_venta: "", proveedor: "" };

export default function MaterialCatalogoForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/materiales-catalogo/${id}`).then((m) =>
        setForm({
          tipo: m.tipo,
          nombre: m.nombre,
          coste: m.coste ?? "",
          precio_venta: m.precio_venta ?? "",
          proveedor: m.proveedor || "",
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
    setSaving(true);
    try {
      const payload = {
        ...form,
        coste: form.coste === "" ? 0 : Number(form.coste),
        precio_venta: form.precio_venta === "" ? 0 : Number(form.precio_venta),
      };
      if (editing) await api.put(`/materiales-catalogo/${id}`, payload);
      else await api.post("/materiales-catalogo", payload);
      navigate("/maestros");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">
        {editing ? "Editar material" : "Nuevo material o componente"}
      </h1>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={set("nombre")} required autoFocus />
        </Field>
        <Field label="Tipo">
          <Select value={form.tipo} onChange={set("tipo")}>
            <option value="fisico">Físico</option>
            <option value="licencia">Licencia/software</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coste (€)">
            <Input type="number" step="0.01" min="0" value={form.coste} onChange={set("coste")} />
          </Field>
          <Field label="Precio de venta (€)">
            <Input type="number" step="0.01" min="0" value={form.precio_venta} onChange={set("precio_venta")} />
          </Field>
        </div>
        <Field label="Proveedor (opcional)">
          <Input value={form.proveedor} onChange={set("proveedor")} />
        </Field>

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

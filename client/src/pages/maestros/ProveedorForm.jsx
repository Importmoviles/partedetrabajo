import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input, Select, Textarea } from "../../components/ui";

const empty = { nombre: "", nif: "", direccion: "", telefono: "", email: "", contacto: "", categoria: "", notas: "" };
const CATEGORIAS = ["Hardware", "Software", "Servicios", "Suministros", "Otro"];

export default function ProveedorForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/proveedores/${id}`).then((p) =>
        setForm({
          nombre: p.nombre,
          nif: p.nif || "",
          direccion: p.direccion || "",
          telefono: p.telefono || "",
          email: p.email || "",
          contacto: p.contacto || "",
          categoria: p.categoria || "",
          notas: p.notas || "",
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
      if (editing) await api.put(`/proveedores/${id}`, form);
      else await api.post("/proveedores", form);
      navigate("/maestros/proveedores");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">{editing ? "Editar proveedor" : "Nuevo proveedor"}</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={set("nombre")} required autoFocus />
        </Field>
        <Field label="Categoría">
          <Select value={form.categoria} onChange={set("categoria")}>
            <option value="">Sin especificar</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="NIF/CIF">
          <Input value={form.nif} onChange={set("nif")} />
        </Field>
        <Field label="Dirección">
          <Input value={form.direccion} onChange={set("direccion")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={set("telefono")} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} />
          </Field>
        </div>
        <Field label="Persona de contacto">
          <Input value={form.contacto} onChange={set("contacto")} />
        </Field>
        <Field label="Notas">
          <Textarea rows={2} value={form.notas} onChange={set("notas")} />
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

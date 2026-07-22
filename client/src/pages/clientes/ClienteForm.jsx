import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input, Textarea } from "../../components/ui";

const empty = { nombre: "", nif: "", direccion: "", telefono: "", email: "", tarifa_hora: "", notas: "" };

export default function ClienteForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/clientes/${id}`).then((c) =>
        setForm({
          nombre: c.nombre,
          nif: c.nif || "",
          direccion: c.direccion || "",
          telefono: c.telefono || "",
          email: c.email || "",
          tarifa_hora: c.tarifa_hora ?? "",
          notas: c.notas || "",
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
      const payload = { ...form, tarifa_hora: form.tarifa_hora === "" ? 0 : Number(form.tarifa_hora) };
      const cliente = editing ? await api.put(`/clientes/${id}`, payload) : await api.post("/clientes", payload);
      navigate(`/clientes/${cliente.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">{editing ? "Editar cliente" : "Nuevo cliente"}</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre / Razón social *">
          <Input value={form.nombre} onChange={set("nombre")} required autoFocus />
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
        <Field label="Tarifa/hora por defecto (€)">
          <Input type="number" step="0.01" min="0" value={form.tarifa_hora} onChange={set("tarifa_hora")} />
        </Field>
        <Field label="Notas internas">
          <Textarea rows={3} value={form.notas} onChange={set("notas")} />
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

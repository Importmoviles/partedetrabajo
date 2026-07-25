import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input } from "../../components/ui";

export default function TareaForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get("/tareas").then((tareas) => {
        const t = tareas.find((x) => x.id === Number(id));
        if (t) setTitulo(t.titulo);
      });
    }
  }, [id, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) await api.put(`/tareas/${id}`, { titulo });
      else await api.post("/tareas", { titulo });
      navigate("/tareas");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">{editing ? "Editar tarea" : "Nueva tarea"}</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Título *">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
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

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Button, Field, Input } from "../../components/ui";

export default function UsuarioForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get("/usuarios").then((usuarios) => {
        const u = usuarios.find((x) => x.id === Number(id));
        if (u) setUsername(u.username);
      });
    }
  }, [id, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        const payload = { username };
        if (password) payload.password = password;
        await api.put(`/usuarios/${id}`, payload);
      } else {
        await api.post("/usuarios", { username, password });
      }
      navigate("/maestros/usuarios");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-lg font-semibold mt-4 mb-4">{editing ? "Editar usuario" : "Nuevo usuario"}</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Usuario *">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </Field>
        <Field label={editing ? "Nueva contraseña (déjalo en blanco para no cambiarla)" : "Contraseña *"}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editing}
            minLength={4}
          />
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

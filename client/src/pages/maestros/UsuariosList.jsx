import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Card, SectionLabel } from "../../components/ui";

export default function UsuariosList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");

  function load() {
    api.get("/usuarios").then(setUsuarios);
  }

  useEffect(load, []);

  async function handleDelete(u) {
    if (!confirm(`¿Borrar el usuario "${u.username}"?`)) return;
    setError("");
    try {
      await api.del(`/usuarios/${u.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <SectionLabel>{usuarios.length} usuarios</SectionLabel>
      {error && <p className="text-danger text-sm mb-2">{error}</p>}
      {usuarios.map((u) => (
        <Card key={u.id}>
          <div className="flex items-center justify-between">
            <span className="font-display text-[15px] font-semibold text-ink">
              {u.username}
              {u.id === user.id && <span className="text-muted text-xs font-normal"> (tú)</span>}
            </span>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => navigate(`/maestros/usuarios/${u.id}/editar`)} className="text-muted p-1.5">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(u)} className="text-danger p-1.5">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

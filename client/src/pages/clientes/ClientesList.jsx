import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { SectionLabel } from "../../components/ui";
import { ClientCard } from "../../components/cards";

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get("/clientes")
      .then(setClientes)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(id) {
    await api.post(`/clientes/${id}/toggle`);
    load();
  }

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  const activos = clientes.filter((c) => c.activo);
  const inactivos = clientes.filter((c) => !c.activo);

  return (
    <>
      <SectionLabel>{activos.length} clientes</SectionLabel>
      {clientes.length === 0 && <p className="text-sm text-muted">Todavía no hay clientes. Pulsa + para añadir uno.</p>}
      {activos.map((c) => (
        <ClientCard key={c.id} c={c} onToggle={toggle} />
      ))}

      {inactivos.length > 0 && (
        <>
          <SectionLabel>Dados de baja ({inactivos.length})</SectionLabel>
          {inactivos.map((c) => (
            <ClientCard key={c.id} c={c} onToggle={toggle} />
          ))}
        </>
      )}
    </>
  );
}

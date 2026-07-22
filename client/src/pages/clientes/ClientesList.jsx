import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { SectionLabel } from "../../components/ui";
import { ClientCard } from "../../components/cards";

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/clientes")
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm mt-6">Cargando...</p>;

  return (
    <>
      <SectionLabel>{clientes.length} clientes</SectionLabel>
      {clientes.length === 0 && <p className="text-sm text-muted">Todavía no hay clientes. Pulsa + para añadir uno.</p>}
      {clientes.map((c) => (
        <ClientCard key={c.id} c={c} />
      ))}
    </>
  );
}

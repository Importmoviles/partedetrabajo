import { useNavigate } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";
import { Card, SectionLabel } from "../../components/ui";

const secciones = [
  { to: "/maestros/usuarios", label: "Usuarios", desc: "Altas, bajas y contraseñas de acceso al panel", icon: Users },
];

export default function MaestrosHome() {
  const navigate = useNavigate();

  return (
    <>
      <SectionLabel>Maestros</SectionLabel>
      <p className="text-xs text-muted mb-3">
        El alta de clientes, proveedores, artículos y equipos se gestiona ahora desde el CRM.
      </p>
      {secciones.map((s) => (
        <Card key={s.to} onClick={() => navigate(s.to)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <s.icon size={18} className="text-muted shrink-0" />
              <div>
                <div className="font-display text-[15px] font-semibold text-ink">{s.label}</div>
                <div className="text-xs text-muted mt-0.5">{s.desc}</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-muted)" />
          </div>
        </Card>
      ))}
    </>
  );
}

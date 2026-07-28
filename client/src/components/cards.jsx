import { Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, StatusDot, StatusBadge } from "./ui";
import { estadoTrabajoMap, estadoParteMap, formatEUR } from "../lib/statusMap";

export function trabajoCodigo(id) {
  return `TRB-${String(id).padStart(4, "0")}`;
}

export function JobCard({ job }) {
  const navigate = useNavigate();
  const s = estadoTrabajoMap[job.estado] || estadoTrabajoMap.presupuestado;
  return (
    <Card onClick={() => navigate(`/trabajos/${job.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <StatusDot color={s.color} pulse={job.estado === "en_curso"} />
          <span className="font-mono text-[11px] text-muted">#{trabajoCodigo(job.id)}</span>
        </div>
        <StatusBadge label={s.label} color={s.color} />
      </div>
      <div className="mt-1.5 font-display text-[15px] font-semibold text-ink">{job.cliente_nombre}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[12.5px] text-muted">{job.categoria}</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
          <Clock size={11} /> {job.horas || 0}h · {job.fecha_inicio || "—"}
        </span>
      </div>
    </Card>
  );
}

export function ParteCard({ parte }) {
  const navigate = useNavigate();
  const s = estadoParteMap[parte.estado] || estadoParteMap.pendiente;
  return (
    <Card onClick={() => navigate(`/partes/${parte.id}`)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot color={s.color} />
          <span className="font-mono text-[11px] text-muted">#{parte.numero}</span>
        </div>
        <StatusBadge label={s.label} color={s.color} />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-display text-[15px] font-semibold text-ink">{parte.cliente_nombre}</span>
        <span className="font-mono text-sm font-semibold text-ink">{formatEUR(parte.total)}</span>
      </div>
      <div className="text-xs text-muted">{parte.fecha}</div>
    </Card>
  );
}

export function ClientCard({ c }) {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate(`/clientes/${c.id}`)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[15px] font-semibold text-ink">{c.nombre}</div>
          <div className="text-xs text-muted mt-0.5">
            {c.num_trabajos} trabajo{c.num_trabajos === 1 ? "" : "s"} · {formatEUR(c.tarifa_hora)}/h
          </div>
        </div>
        <ChevronRight size={16} color="var(--color-muted)" />
      </div>
    </Card>
  );
}

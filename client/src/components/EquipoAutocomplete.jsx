import { useState } from "react";
import { Input } from "./ui";

function etiqueta(item) {
  return [item.marca, item.modelo].filter(Boolean).join(" ") || item.numero_serie || "Equipo";
}

export default function EquipoAutocomplete({ items, onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const texto = q.trim().toLowerCase();
  const matches = texto
    ? items.filter((i) => `${i.marca || ""} ${i.modelo || ""} ${i.numero_serie || ""}`.toLowerCase().includes(texto)).slice(0, 8)
    : [];

  if (items.length === 0) return null;

  return (
    <div className="relative mb-2">
      <Input
        placeholder="Buscar un equipo ya registrado de este cliente..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => {
                onSelect(item);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-paper border-b border-line last:border-0"
            >
              <span className="text-ink truncate">{etiqueta(item)}</span>
              {item.numero_serie && <span className="font-mono text-xs text-muted shrink-0 ml-2">{item.numero_serie}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

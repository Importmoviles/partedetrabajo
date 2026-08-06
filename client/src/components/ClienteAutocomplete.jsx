import { useState } from "react";
import { Input } from "./ui";

function tieneNombreFiscalDistinto(cliente) {
  return cliente.nombre_comercial && cliente.nombre_comercial !== cliente.nombre;
}

export default function ClienteAutocomplete({
  items,
  value,
  onChangeText,
  onSelect,
  disabled,
  placeholder = "Buscar cliente...",
  selected,
}) {
  const [open, setOpen] = useState(false);
  const texto = value.trim().toLowerCase();
  const matches = texto
    ? items.filter((c) => `${c.nombre} ${c.nombre_comercial || ""}`.toLowerCase().includes(texto)).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChangeText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {selected && tieneNombreFiscalDistinto(selected) && (
        <p className="text-xs text-muted mt-1">{selected.nombre}</p>
      )}
      {open && texto && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {matches.length === 0 && <p className="px-3 py-2 text-sm text-muted">Sin resultados</p>}
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => {
                onSelect(c);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper border-b border-line last:border-0 block"
            >
              <div className="text-ink truncate">{c.nombre_comercial || c.nombre}</div>
              {tieneNombreFiscalDistinto(c) && <div className="text-xs text-muted truncate">{c.nombre}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

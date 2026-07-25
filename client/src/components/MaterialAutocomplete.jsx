import { useState } from "react";
import { Input } from "./ui";
import { formatEUR } from "../lib/statusMap";

export default function MaterialAutocomplete({ items, value, onChangeText, onSelect, onCreate, ...props }) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = q ? items.filter((i) => i.nombre.toLowerCase().includes(q)).slice(0, 8) : [];
  const hayCoincidenciaExacta = items.some((i) => i.nombre.toLowerCase() === q);

  return (
    <div className="relative">
      <Input
        {...props}
        placeholder="Nombre *"
        value={value}
        onChange={(e) => {
          onChangeText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        required
      />
      {open && q && (matches.length > 0 || !hayCoincidenciaExacta) && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => {
                onSelect(item);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-paper border-b border-line last:border-0"
            >
              <span className="text-ink truncate">{item.nombre}</span>
              <span className="font-mono text-xs text-muted shrink-0 ml-2">{formatEUR(item.precio_venta)}</span>
            </button>
          ))}
          {!hayCoincidenciaExacta && (
            <button
              type="button"
              onMouseDown={() => {
                onCreate(value.trim());
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-brand font-medium"
            >
              + Crear "{value.trim()}" en el catálogo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

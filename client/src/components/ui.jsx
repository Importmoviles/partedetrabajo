export function Card({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-3.5 mb-2.5 bg-surface border border-line ${onClick ? "cursor-pointer active:opacity-80" : ""}`}
    >
      {children}
    </div>
  );
}

export function StatusDot({ color, pulse }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: color, boxShadow: pulse ? `0 0 0 3px ${color}22` : "none" }}
    />
  );
}

export function StatusBadge({ label, color }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

export function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border font-sans ${
        active ? "bg-brand border-brand" : "bg-surface border-line text-muted"
      }`}
      style={active ? { color: "#08210A" } : undefined}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, accent, onClick, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex-1 rounded-2xl p-3 bg-surface border text-left ${active ? "border-brand" : "border-line"}`}
    >
      <div className="font-mono text-xl font-semibold" style={{ color: accent || "var(--color-ink)" }}>
        {value}
      </div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </Tag>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div className="mb-2 mt-4 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</span>
      {action}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "rounded-xl px-4 py-2.5 text-sm font-medium transition active:opacity-80 disabled:opacity-50";
  const variants = {
    primary: "bg-brand",
    secondary: "bg-surface border border-line text-ink",
    danger: "bg-danger text-white",
    ghost: "text-muted",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={variant === "primary" ? { color: "#08210A" } : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand ${props.className || ""}`}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand ${props.className || ""}`}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand ${props.className || ""}`}
    />
  );
}

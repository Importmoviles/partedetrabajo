import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Wrench, Users, ClipboardList, Boxes, Plus, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/trabajos", label: "Trabajos", icon: Wrench },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/partes", label: "Partes", icon: ClipboardList },
  { to: "/maestros", label: "Maestros", icon: Boxes },
];

const fabTarget = {
  "/": "/trabajos/nuevo",
  "/trabajos": "/trabajos/nuevo",
  "/clientes": "/clientes/nuevo",
  "/partes": "/partes/nueva",
  "/maestros": "/maestros/nuevo",
};

function TabButton({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2">
      {({ isActive }) => (
        <>
          <Icon size={19} color={isActive ? "#33D633" : "#B4BABF"} strokeWidth={isActive ? 2.4 : 2} />
          <span className={`text-[10px] ${isActive ? "text-ink font-semibold" : "text-[#B4BABF] font-medium"}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const fab = fabTarget[basePath];

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="px-4 pt-5 pb-4 bg-ink sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <img src="/logo-importmoviles.png" alt="ImportMóviles Technologies" className="h-7 w-auto" />
          <button onClick={logout} aria-label="Cerrar sesión" className="text-[#8A938A]">
            <LogOut size={17} />
          </button>
        </div>
        <div className="text-[9.5px] text-[#8A938A] mt-1.5 tracking-[0.18em] uppercase">panel de gestión</div>
        <div className="text-[11.5px] text-[#6E756E] mt-1.5 capitalize">{today}</div>
      </div>

      <div className="flex-1 px-4 pb-24 pt-2 max-w-2xl w-full mx-auto">
        <Outlet />
      </div>

      {fab && (
        <button
          onClick={() => navigate(fab)}
          className="fixed rounded-full flex items-center justify-center bg-brand shadow-lg"
          style={{ right: "max(16px, calc(50% - 320px))", bottom: 74, width: 46, height: 46, boxShadow: "0 8px 16px rgba(51,214,51,0.4)" }}
        >
          <Plus size={22} color="#08210A" />
        </button>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex bg-surface border-t border-line max-w-2xl mx-auto w-full">
        {tabs.map((t) => (
          <TabButton key={t.to} {...t} />
        ))}
      </div>
    </div>
  );
}

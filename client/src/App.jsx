import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import ClientesList from "./pages/clientes/ClientesList";
import ClienteForm from "./pages/clientes/ClienteForm";
import ClienteDetail from "./pages/clientes/ClienteDetail";
import TrabajosList from "./pages/trabajos/TrabajosList";
import TrabajoForm from "./pages/trabajos/TrabajoForm";
import TrabajoDetail from "./pages/trabajos/TrabajoDetail";
import FacturasList from "./pages/facturas/FacturasList";
import FacturaForm from "./pages/facturas/FacturaForm";
import FacturaDetail from "./pages/facturas/FacturaDetail";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Inicio />} />

        <Route path="clientes" element={<ClientesList />} />
        <Route path="clientes/nuevo" element={<ClienteForm />} />
        <Route path="clientes/:id" element={<ClienteDetail />} />
        <Route path="clientes/:id/editar" element={<ClienteForm />} />

        <Route path="trabajos" element={<TrabajosList />} />
        <Route path="trabajos/nuevo" element={<TrabajoForm />} />
        <Route path="trabajos/:id" element={<TrabajoDetail />} />
        <Route path="trabajos/:id/editar" element={<TrabajoForm />} />

        <Route path="facturas" element={<FacturasList />} />
        <Route path="facturas/nueva" element={<FacturaForm />} />
        <Route path="facturas/:id" element={<FacturaDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

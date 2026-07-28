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
import PartesList from "./pages/partes/PartesList";
import ParteForm from "./pages/partes/ParteForm";
import ParteDetail from "./pages/partes/ParteDetail";
import MaestrosHome from "./pages/maestros/MaestrosHome";
import MaterialesCatalogoList from "./pages/maestros/MaterialesCatalogoList";
import MaterialCatalogoForm from "./pages/maestros/MaterialCatalogoForm";
import UsuariosList from "./pages/maestros/UsuariosList";
import UsuarioForm from "./pages/maestros/UsuarioForm";
import ProveedoresList from "./pages/maestros/ProveedoresList";
import ProveedorForm from "./pages/maestros/ProveedorForm";
import TareasList from "./pages/tareas/TareasList";
import TareaForm from "./pages/tareas/TareaForm";

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

        <Route path="partes" element={<PartesList />} />
        <Route path="partes/nueva" element={<ParteForm />} />
        <Route path="partes/:id" element={<ParteDetail />} />

        <Route path="tareas" element={<TareasList />} />
        <Route path="tareas/nueva" element={<TareaForm />} />
        <Route path="tareas/:id/editar" element={<TareaForm />} />

        <Route path="maestros" element={<MaestrosHome />} />
        <Route path="maestros/materiales" element={<MaterialesCatalogoList />} />
        <Route path="maestros/materiales/nuevo" element={<MaterialCatalogoForm />} />
        <Route path="maestros/materiales/:id/editar" element={<MaterialCatalogoForm />} />
        <Route path="maestros/usuarios" element={<UsuariosList />} />
        <Route path="maestros/usuarios/nuevo" element={<UsuarioForm />} />
        <Route path="maestros/usuarios/:id/editar" element={<UsuarioForm />} />
        <Route path="maestros/proveedores" element={<ProveedoresList />} />
        <Route path="maestros/proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="maestros/proveedores/:id/editar" element={<ProveedorForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';

import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Movimientos from './pages/Movimientos';
import Accesos from './pages/Accesos';
import Cobranza from './pages/Cobranza';
import Clientes from './pages/admin/Clientes';
import Operadores from './pages/admin/Operadores';
import Localidades from './pages/admin/Localidades';
import Unidades from './pages/admin/Unidades';
import Cajas from './pages/admin/Cajas';
import UsuariosAdmin from './pages/admin/Usuarios';
import ConcentradoPrecios from './pages/admin/ConcentradoPrecios';
import Peajes from './pages/admin/Peajes';
import Alertas from './pages/admin/Alertas';
import TiposMovimientoAdmin from './pages/admin/Movimientos';
import Login from './pages/Login';

// Nuevos Reportes
import ReportesClientes from './pages/reportes/ReportesClientes';
import ReportesOperadores from './pages/reportes/ReportesOperadores';
import ReportesCajas from './pages/reportes/ReportesCajas';
import ReportesFacturacion from './pages/reportes/ReportesFacturacion';
import ReportesFolio from './pages/reportes/ReportesFolio';
import ReportesPrefacturacion from './pages/reportes/ReportesPrefacturacion';

// Simple Route Guard to prevent infinite reload loops
function ProtectedRoute({ children }) {
  const user = sessionStorage.getItem('cif_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/accesos" element={<Accesos />} />
            
            {/* Submódulos de Reportes */}
            <Route path="/reportes" element={<Navigate to="/reportes/clientes" replace />} />
            <Route path="/reportes/clientes" element={<ReportesClientes />} />
            <Route path="/reportes/operadores" element={<ReportesOperadores />} />
            <Route path="/reportes/cajas" element={<ReportesCajas />} />
            <Route path="/reportes/facturacion" element={<ReportesFacturacion />} />
            <Route path="/reportes/prefacturacion" element={<ReportesPrefacturacion />} />
            <Route path="/reportes/folio" element={<ReportesFolio />} />

            {/* Submódulos de Administración */}
            <Route path="/admin/alertas" element={<Alertas />} />
            <Route path="/admin/cobranza" element={<Cobranza />} />
            <Route path="/admin/clientes" element={<Clientes />} />
            <Route path="/admin/operadores" element={<Operadores />} />
            <Route path="/admin/localidades" element={<Localidades />} />
            <Route path="/admin/unidades" element={<Unidades />} />
            <Route path="/admin/cajas" element={<Cajas />} />
            <Route path="/admin/movimientos" element={<TiposMovimientoAdmin />} />
            <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
            <Route path="/admin/precios" element={<ConcentradoPrecios />} />
            <Route path="/admin/peajes" element={<Peajes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

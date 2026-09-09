import { useMemo } from 'react';
import { SignOut, User, Bell, Sun, Moon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { operadores, unidades, alertas } = useData();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Calcular alertas críticas activas (vencimientos <= 30 días)
  const alertasCount = useMemo(() => {
    if (!operadores && !unidades) return 0;
    const nowTime = now.getTime();
    let count = 0;

    const isExpiring = (fechaDoc) => {
      if (!fechaDoc) return false;
      const diffTime = new Date(fechaDoc).getTime() - nowTime;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    };

    (operadores || []).forEach(op => {
      if (op.activo === false || op.activo === 0 || op.activo === '0') return;
      if (isExpiring(op.licencia_mx_vencimiento || op.vigenciaLicencia)) count++;
      if (isExpiring(op.visa_vencimiento || op.vigenciaVisa || op.licencia_usa_vencimiento)) count++;
    });

    (unidades || []).forEach(un => {
      if (un.activo === false || un.activo === 0 || un.activo === '0') return;
      if (isExpiring(un.vencimiento_sct || un.vigenciaSCT)) count++;
      if (isExpiring(un.vencimiento_poliza_mx || un.vigenciaSeguro)) count++;
    });

    return count;
  }, [operadores, unidades]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch(e) {}
    sessionStorage.removeItem('cif_user');
    window.location.href = '/login';
  };

  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('cif_user')) || {};
    } catch {
      return {};
    }
  })();

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left: page context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-label text-[10.5px] uppercase tracking-wider text-outline font-semibold capitalize">{fecha}</span>
          </div>
        </div>

        {/* Right: user info */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button 
            onClick={() => navigate('/admin/alertas')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container/60 border border-outline-variant text-outline hover:text-primary hover:border-primary/40 hover:bg-surface-container-high transition-all shadow-xs"
            title={alertasCount > 0 ? `${alertasCount} alertas críticas del sistema` : "Sin alertas pendientes (Centro de Alertas)"}
          >
            <Bell size={18} weight={alertasCount > 0 ? "bold" : "regular"} className={alertasCount > 0 ? "text-primary" : ""} />
            {alertasCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-xs animate-pulse">
                {alertasCount > 99 ? '99+' : alertasCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container/60 border border-outline-variant text-outline hover:text-primary hover:border-primary/40 hover:bg-surface-container-high transition-all shadow-xs"
          >
            {isDark ? <Sun size={18} weight="regular" /> : <Moon size={18} weight="regular" />}
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/60">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-body text-on-surface font-semibold">{currentUser.nombre || 'USUARIO'}</div>
              <div className="text-[10px] font-label text-primary uppercase tracking-wider">{currentUser.rol || 'ADMIN'}</div>
            </div>
            <div className="w-9 h-9 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-center shadow-xs">
              <User size={18} weight="regular" className="text-primary" />
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-[10.5px] font-label uppercase tracking-wider text-outline hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all border border-outline-variant px-3.5 py-2 font-bold rounded-xl shadow-xs">
            <SignOut size={16} weight="regular" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

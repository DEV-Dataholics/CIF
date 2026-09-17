import { useMemo, useState, useEffect, useRef } from 'react';
import { SignOut, User, Bell, Sun, Moon, WarningCircle, Warning, Check, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { operadores, unidades } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cif_dismissed_notifs') || '[]');
    } catch {
      return [];
    }
  });
  const notifRef = useRef(null);

  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular alertas críticas y lista detallada
  const { notificacionesList, alertasCount } = useMemo(() => {
    const nowTime = now.getTime();
    const items = [];

    const getDiffDays = (fechaDoc) => {
      if (!fechaDoc) return null;
      const diffTime = new Date(fechaDoc).getTime() - nowTime;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    (operadores || []).forEach(op => {
      if (op.activo === false || op.activo === 0 || op.activo === '0') return;
      const opNombre = op.nombre_completo || op.nombreCompleto || `Operador #${op.id}`;
      
      const lic = op.licencia_mx_vencimiento || op.vigenciaLicencia;
      const dLic = getDiffDays(lic);
      if (dLic !== null && dLic <= 60) {
        items.push({
          id: `op-lic-${op.id}`,
          title: 'Licencia Federal MX',
          entity: opNombre,
          days: dLic,
          date: lic,
          severity: dLic <= 15 ? 'critico' : (dLic <= 30 ? 'advertencia' : 'info'),
          link: '/admin/operadores'
        });
      }

      const visa = op.visa_vencimiento || op.vigenciaVisa || op.licencia_usa_vencimiento;
      const dVisa = getDiffDays(visa);
      if (dVisa !== null && dVisa <= 60) {
        items.push({
          id: `op-visa-${op.id}`,
          title: 'Visa / FAST (USA)',
          entity: opNombre,
          days: dVisa,
          date: visa,
          severity: dVisa <= 15 ? 'critico' : (dVisa <= 30 ? 'advertencia' : 'info'),
          link: '/admin/operadores'
        });
      }
    });

    (unidades || []).forEach(un => {
      if (un.activo === false || un.activo === 0 || un.activo === '0') return;
      const eco = un.numero_economico || un.numeroEconomico || `Tracto #${un.id}`;
      
      const sct = un.vencimiento_sct || un.vigenciaSCT;
      const dSct = getDiffDays(sct);
      if (dSct !== null && dSct <= 60) {
        items.push({
          id: `tr-sct-${un.id}`,
          title: 'Permiso SCT',
          entity: `Tracto ${eco}`,
          days: dSct,
          date: sct,
          severity: dSct <= 15 ? 'critico' : (dSct <= 30 ? 'advertencia' : 'info'),
          link: '/admin/unidades'
        });
      }

      const seg = un.vencimiento_poliza_mx || un.vigenciaSeguro;
      const dSeg = getDiffDays(seg);
      if (dSeg !== null && dSeg <= 60) {
        items.push({
          id: `tr-seg-${un.id}`,
          title: 'Póliza Seguro MX',
          entity: `Tracto ${eco}`,
          days: dSeg,
          date: seg,
          severity: dSeg <= 15 ? 'critico' : (dSeg <= 30 ? 'advertencia' : 'info'),
          link: '/admin/unidades'
        });
      }
    });

    items.sort((a, b) => a.days - b.days);

    // Contar alertas críticas activas (<= 30 días)
    const count = items.filter(i => i.days <= 30).length;

    return { notificacionesList: items, alertasCount: count };
  }, [operadores, unidades]);

  const activeNotifs = notificacionesList.filter(n => !dismissedIds.includes(n.id));

  const markAllAsRead = () => {
    const allIds = notificacionesList.map(n => n.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem('cif_dismissed_notifs', JSON.stringify(allIds));
    } catch {}
  };

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
          {/* Notifications Dropdown Anchor */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(prev => !prev)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all shadow-xs ${
                showNotifications
                  ? 'bg-surface-container-high border-primary/50 text-primary'
                  : 'bg-surface-container/60 border-outline-variant text-outline hover:text-primary hover:border-primary/40 hover:bg-surface-container-high'
              }`}
              title={alertasCount > 0 ? `${alertasCount} alertas críticas del sistema` : "Sin alertas pendientes (Centro de Alertas)"}
            >
              <Bell size={18} weight={alertasCount > 0 ? "bold" : "regular"} className={alertasCount > 0 ? "text-primary" : ""} />
              {alertasCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-xs animate-pulse">
                  {alertasCount > 99 ? '99+' : alertasCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden z-50 animate-in">
                <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-container/60">
                  <div className="flex items-center gap-2">
                    <Bell size={16} weight="bold" className="text-primary" />
                    <span className="font-headline font-bold text-xs text-on-surface">Notificaciones del Sistema</span>
                    {alertasCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger/15 text-danger border border-danger/20">
                        {alertasCount} críticas
                      </span>
                    )}
                  </div>
                  {activeNotifs.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-label uppercase tracking-wider text-outline hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Check size={12} weight="bold" /> Marcar leídas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30">
                  {activeNotifs.length === 0 ? (
                    <div className="p-6 text-center text-outline">
                      <p className="text-xs font-medium">No hay notificaciones pendientes</p>
                      <p className="text-[10px] opacity-70 mt-1">Todos los documentos están vigentes.</p>
                    </div>
                  ) : (
                    activeNotifs.slice(0, 8).map(n => {
                      const isCritical = n.days <= 15;
                      const isWarning = n.days > 15 && n.days <= 30;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(n.link);
                          }}
                          className="p-3 hover:bg-surface-container/70 cursor-pointer transition-colors flex items-start gap-3"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCritical
                              ? 'bg-danger/15 text-danger border border-danger/30'
                              : isWarning
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : 'bg-primary/15 text-primary border border-primary/30'
                          }`}>
                            {isCritical ? <WarningCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-on-surface truncate">{n.title}</h4>
                              <span className={`text-[10px] font-mono font-bold shrink-0 ${
                                isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-outline'
                              }`}>
                                {n.days <= 0 ? '¡VENCIDO!' : `${n.days}d`}
                              </span>
                            </div>
                            <p className="text-[11px] text-outline truncate">{n.entity}</p>
                            <p className="text-[9.5px] text-outline/80 mt-0.5">Vence: {n.date}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-surface-container/40 border-t border-outline-variant text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/admin/alertas');
                    }}
                    className="w-full text-center text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5 py-1"
                  >
                    Ver todas en Centro de Alertas <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>

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

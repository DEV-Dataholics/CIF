import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChartLineUp, ArrowsLeftRight, GearSix, DoorOpen,
  CurrencyCircleDollar, FileText, CaretDown, CaretRight,
  List, X, Users, MapPin, Truck, Package,
  UserCircleGear, Money, RoadHorizon, Warning
} from '@phosphor-icons/react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: ChartLineUp, path: '/' },
  { label: 'Nuevo Traslado', icon: ArrowsLeftRight, path: '/movimientos', isCTA: true },
  {
    label: 'Administración', icon: GearSix, children: [
      { label: 'Alertas', icon: Warning, path: '/admin/alertas' },
      { label: 'Clientes', icon: Users, path: '/admin/clientes' },
      { label: 'Operadores', icon: UserCircleGear, path: '/admin/operadores' },
      { label: 'Localidades', icon: MapPin, path: '/admin/localidades' },
      { label: 'Unidades', icon: Truck, path: '/admin/unidades' },
      { label: 'Cajas', icon: Package, path: '/admin/cajas' },
      { label: 'Movimientos', icon: ArrowsLeftRight, path: '/admin/movimientos' },
      { label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
      { label: 'Auditoría', icon: FileText, path: '/admin/auditoria' },
      { label: 'Concentrado Precios', icon: Money, path: '/admin/precios' },
      { label: 'Peajes', icon: RoadHorizon, path: '/admin/peajes' },
      { label: 'Cobranza', icon: CurrencyCircleDollar, path: '/admin/cobranza' },
    ]
  },
  { label: 'Accesos', icon: DoorOpen, path: '/accesos' },
  {
    label: 'Reportes', icon: FileText, children: [
      { label: 'Pre-Facturación', icon: FileText, path: '/reportes/prefacturacion' },
    ]
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-expand sections if any child is active
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setExpandedSections(prev => ({ ...prev, 'Administración': true }));
    }
    if (location.pathname.startsWith('/reportes')) {
      setExpandedSections(prev => ({ ...prev, 'Reportes': true }));
    }
  }, [location.pathname]);

  const toggleSection = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const linkClasses = (isActive) =>
    `flex items-center gap-3 mx-2 px-3.5 py-2.5 text-xs font-label uppercase tracking-wider font-bold rounded-xl transition-all duration-200
     ${isActive
      ? 'text-primary bg-primary/10 border border-primary/25 shadow-xs shadow-primary/10'
      : 'text-outline hover:text-on-surface hover:bg-surface-container-high/40 border border-transparent'}`;

  const renderItem = (item) => {
    if (item.isCTA) {
      return (
        <div key={item.path} className="px-2 py-2">
          <NavLink
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-center gap-2 w-full py-2.5 text-xs font-label uppercase tracking-widest font-bold rounded-xl transition-all duration-200
              ${collapsed ? 'px-0' : 'px-4'}
              bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] hover:brightness-105 shadow-md shadow-[#d1a14e]/15 active:scale-[0.99]`}
            style={{ minHeight: '40px' }}
          >
            <item.icon size={18} weight="bold" className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        </div>
      );
    }

    if (item.children) {
      const isExpanded = expandedSections[item.label];
      const hasActiveChild = item.children.some(c => location.pathname === c.path);
      return (
        <div key={item.label} className="px-2 py-0.5">
          <button
            onClick={() => toggleSection(item.label)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-label uppercase tracking-wider font-bold rounded-xl transition-all
              ${hasActiveChild ? 'text-primary bg-primary/5' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/30'}`}
          >
            <item.icon size={18} weight="regular" className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
              </>
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 pl-2 my-1 border-l border-outline-variant/60 space-y-0.5">
              {item.children.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-[10.5px] font-label uppercase tracking-wider font-semibold rounded-lg transition-all
                     ${isActive ? 'text-primary bg-primary/10 font-bold' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/30'}`
                  }
                >
                  <child.icon size={14} weight="regular" />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.path} className="py-0.5">
        <NavLink
          to={item.path}
          end={item.path === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => linkClasses(isActive)}
        >
          <item.icon size={18} weight="regular" className="flex-shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile hamburger */}
      <button
        className="fixed top-5 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center bg-surface-container-high border border-outline-variant rounded-xl text-primary shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-surface-container-lowest border-r border-outline-variant z-40 flex flex-col sidebar-transition
          ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`border-b border-outline-variant flex items-center justify-center transition-all duration-300 ${collapsed ? 'px-2 py-4' : 'px-5 py-6'}`}>
          <img
            src="/assets/LOGOCIF.png"
            alt="CIF Logística"
            width={collapsed ? 36 : 190}
            className={`object-contain transition-all duration-300 ${collapsed ? 'h-7 w-auto' : 'w-full max-w-[190px] h-auto max-h-20'}`}
            style={{ maxWidth: collapsed ? '36px' : '190px', width: '100%', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(209,161,78,0.25))' }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {NAV_ITEMS.map(renderItem)}
        </nav>

        {/* Version footer */}
        {!collapsed && (
          <div className="px-4 py-3.5 border-t border-outline-variant">
            <div className="flex items-center justify-between text-xs text-outline font-medium">
              <span>CIF Logística</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-primary">v2.0</span>
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-outline-variant text-outline hover:text-primary transition-colors"
        >
          <CaretRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>
    </>
  );
}

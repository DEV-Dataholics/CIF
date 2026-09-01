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
    `flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-widest font-bold transition-all duration-200
     ${isActive
      ? 'text-primary bg-primary/10 border-l-2 border-primary'
      : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50 border-l-2 border-transparent'}`;

  const renderItem = (item) => {
    if (item.isCTA) {
      return (
        <div key={item.path} className="px-4 py-3">
          <NavLink
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-center gap-2 w-full py-2.5 text-xs font-label uppercase tracking-widest font-bold rounded-lg transition-all
              ${collapsed ? 'px-0' : 'px-4'}
              bg-primary text-on-primary hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg`}
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
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-widest font-bold transition-all
              ${hasActiveChild ? 'text-primary' : 'text-outline hover:text-on-surface'}`}
          >
            <item.icon size={18} weight="light" className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
              </>
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 border-l border-outline-variant/20 space-y-0.5">
              {item.children.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 pl-5 pr-4 py-2.5 text-[10px] font-label uppercase tracking-widest font-semibold transition-all
                     ${isActive ? 'text-primary bg-primary/5' : 'text-outline hover:text-on-surface-variant'}`
                  }
                >
                  <child.icon size={14} weight="light" />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) => linkClasses(isActive)}
      >
        <item.icon size={18} weight="light" className="flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
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
        className="fixed top-5 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center bg-surface-container-high border border-outline-variant/20 text-primary"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-surface-container-lowest border-r border-outline-variant/10 z-40 flex flex-col sidebar-transition
          ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-4 py-6 border-b border-outline-variant/10 flex items-center justify-center">
          <img
            src="/assets/LOGOCIF.png"
            alt="CIF Logística"
            className={`object-contain transition-all duration-300 ${collapsed ? 'h-8' : 'h-16'}`}
            style={{ filter: 'drop-shadow(0 0 8px rgba(209,161,78,0.2))' }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {NAV_ITEMS.map(renderItem)}
        </nav>

        {/* Version footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-body font-bold text-on-surface">v2.0</span>
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-outline-variant/10 text-outline hover:text-primary transition-colors"
        >
          <CaretRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>
    </>
  );
}

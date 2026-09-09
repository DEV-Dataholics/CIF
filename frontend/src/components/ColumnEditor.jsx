import { useState, useRef, useEffect } from 'react';
import { GearSix, ArrowCounterClockwise, X, Eye, EyeSlash } from '@phosphor-icons/react';

export default function ColumnEditor({ columns, visibleColumns, onChange, storageKey }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = (key) => {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter(k => k !== key)
      : [...visibleColumns, key];
    onChange(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const resetDefaults = () => {
    const defaults = columns.map(c => c.key);
    onChange(defaults);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface-container border border-outline-variant hover:border-primary/50 text-xs font-label font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl text-outline hover:text-primary transition-all shadow-sm"
      >
        <GearSix size={16} weight="light" />
        Columnas
        <span className="text-primary ml-1 font-mono font-bold">{visibleCount}/{totalCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container border border-outline-variant rounded-2xl shadow-2xl z-50 max-h-[60vh] flex flex-col overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-high">
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
              Configurar Columnas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDefaults}
                className="text-outline hover:text-primary p-1 rounded-lg hover:bg-surface-container transition-colors"
                title="Restaurar predeterminadas"
              >
                <ArrowCounterClockwise size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Column list */}
          <div className="overflow-y-auto flex-1 py-2 divide-y divide-outline-variant/30">
            {columns.map(col => {
              const isVisible = visibleColumns.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-surface-container-high/60
                    ${isVisible ? 'text-on-surface' : 'text-outline/50'}`}
                >
                  {isVisible
                    ? <Eye size={16} className="text-primary flex-shrink-0" />
                    : <EyeSlash size={16} className="flex-shrink-0" />
                  }
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold">{col.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-outline-variant bg-surface-container-high/50">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline">
              {visibleCount} de {totalCount} visibles · Guardado en navegador
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

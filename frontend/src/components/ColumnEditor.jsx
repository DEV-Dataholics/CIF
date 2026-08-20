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
        className="flex items-center gap-2 bg-surface border border-outline-variant/30 hover:border-primary text-[10px] font-label font-bold uppercase tracking-widest px-4 py-2.5 text-outline hover:text-primary transition-all"
      >
        <GearSix size={14} weight="light" />
        Columnas
        <span className="text-primary ml-1">{visibleCount}/{totalCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container-low border border-outline-variant/30 shadow-2xl z-50 max-h-[60vh] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
              Configurar Columnas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDefaults}
                className="text-outline hover:text-primary transition-colors"
                title="Restaurar predeterminadas"
              >
                <ArrowCounterClockwise size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-outline hover:text-on-surface transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Column list */}
          <div className="overflow-y-auto flex-1 py-2">
            {columns.map(col => {
              const isVisible = visibleColumns.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-surface-container-high/50
                    ${isVisible ? 'text-on-surface' : 'text-outline/50'}`}
                >
                  {isVisible
                    ? <Eye size={14} className="text-primary flex-shrink-0" />
                    : <EyeSlash size={14} className="flex-shrink-0" />
                  }
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold">{col.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-outline-variant/20">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline">
              {visibleCount} de {totalCount} visibles · Guardado en navegador
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

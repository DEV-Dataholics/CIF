import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass, Plus, PencilSimple, Trash, X } from '@phosphor-icons/react';

export default function AdminCrud({ title, subtitle, icon: Icon, columns, data, setData, tableName, crud }) {
  const [search, setSearch] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(c => {
        const v = row[c.key];
        return v && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const handleDelete = async (id) => {
    if (crud && tableName) {
      try {
        await crud.remove(tableName, id);
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    } else if (setData) {
      setData(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEdit = (row) => {
    setEditRow(row);
    setFormData(row);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditRow(null);
    setFormData({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (crud && tableName) {
      try {
        if (editRow) {
          await crud.update(tableName, editRow.id, formData);
        } else {
          // Garantizar activo:true por defecto al crear
          await crud.insert(tableName, { activo: true, ...formData });
        }
      } catch (err) {
        alert("Error al guardar: " + err.message);
      }
    } else if (setData) {
      if (editRow) {
        setData(prev => prev.map(r => r.id === editRow.id ? { ...r, ...formData } : r));
      } else {
        const newId = data.length > 0 ? Math.max(...data.map(d => typeof d.id === 'number' ? d.id : 0)) + 1 : 1;
        setData(prev => [{ id: newId, activo: true, ...formData }, ...prev]);
      }
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Administración</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            {Icon && <Icon size={32} weight="light" className="text-primary" />}
            {title}
          </h1>
          {subtitle && <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">{subtitle}</p>}
        </div>
          <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 transition-all"
        >
          <Plus size={14} weight="bold" /> Agregar
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain px-5 py-3 flex items-center gap-3">
        <MagnifyingGlass size={16} className="text-outline" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 bg-transparent text-sm font-body text-on-surface placeholder:text-outline/50 outline-none"
        />
        <span className="font-label text-[9px] uppercase tracking-widest text-outline">{filtered.length} registros</span>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain overflow-x-auto">
        <table className="cif-table">
          <thead>
            <tr>
              {columns.filter(c => !c.hideInTable).map(c => <th key={c.key}>{c.label}</th>)}
              <th className="w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.filter(c => !c.hideInTable).length + 1} className="text-center py-16 text-outline font-label uppercase tracking-widest opacity-50">Sin resultados</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                {columns.filter(c => !c.hideInTable).map(c => (
                  <td key={c.key} className="whitespace-nowrap">
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
                <td>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEdit(row)} className="w-7 h-7 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all">
                      <PencilSimple size={12} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="w-7 h-7 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-danger hover:border-danger/40 transition-all">
                      <Trash size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container border border-outline-variant/30 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-headline font-bold text-base">{editRow ? 'Editar' : 'Agregar'} {title}</h3>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-primary"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {columns.filter(c => c.key !== 'id' && !c.hideInForm).map(c => (
                <div key={c.key}>
                  <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">{c.label}</label>
                  
                  {c.formType === 'select' ? (
                    <select
                      value={formData[c.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
                    >
                      <option value="">— Seleccionar —</option>
                      {c.options?.map(opt => (
                        <option key={opt.value || opt} value={opt.value || opt}>
                          {opt.label || opt}
                        </option>
                      ))}
                    </select>
                  ) : c.formType === 'boolean' ? (
                    <select
                      value={formData[c.key] !== undefined ? String(formData[c.key]) : 'true'}
                      onChange={e => setFormData(prev => ({ ...prev, [c.key]: e.target.value === 'true' }))}
                      className="w-full bg-surface border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Inactivo)</option>
                    </select>
                  ) : (
                    <input
                      type={c.formType || 'text'}
                      value={formData[c.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={handleSave}
                className="w-full bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest py-3 hover:brightness-110 transition-all mt-4"
              >
                {editRow ? 'Guardar Cambios' : 'Crear Registro'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

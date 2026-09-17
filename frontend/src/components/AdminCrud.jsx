import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass, Plus, PencilSimple, Trash, X } from '@phosphor-icons/react';

export default function AdminCrud({ title, subtitle, icon: Icon, columns, data, setData, tableName, crud, readOnly = false }) {
  const [search, setSearch] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
    if (!window.confirm('¿Confirmas que deseas eliminar este registro?')) return;
    try {
      if (crud && tableName) {
        await crud.remove(tableName, id);
      }
      if (setData) {
        setData(prev => prev.filter(r => r.id !== id));
      }
      showToast('Registro eliminado con éxito.', 'success');
    } catch (err) {
      // 409 = foreign key conflict: record has associated data, offer to deactivate instead
      if (err.status === 409) {
        const deactivate = window.confirm(
          'No se puede eliminar porque este registro tiene datos asociados (viajes, bitácora, etc.).\n\n' +
          '¿Deseas marcarlo como INACTIVO en su lugar?'
        );
        if (deactivate && crud && tableName) {
          try {
            await crud.update(tableName, id, { activo: false });
            if (setData) {
              setData(prev => prev.map(r => r.id === id ? { ...r, activo: false } : r));
            }
            showToast('Registro marcado como inactivo.', 'success');
          } catch (err2) {
            showToast('Error al desactivar: ' + err2.message, 'error');
          }
        }
      } else {
        showToast('Error al eliminar: ' + err.message, 'error');
      }
    }
  };

  const handleEdit = (row) => {
    setModalError('');
    setEditRow(row);
    setFormData(row);
    setShowModal(true);
  };

  const handleAdd = () => {
    setModalError('');
    setEditRow(null);
    setFormData({});
    setShowModal(true);
  };

  const handleSave = async () => {
    setModalError('');
    setIsSaving(true);
    try {
      if (crud && tableName) {
        if (editRow) {
          const res = await crud.update(tableName, editRow.id, formData);
          const resData = (res && typeof res === 'object' && res.data) ? res.data : (res || {});
          const updatedRow = { ...editRow, ...formData, ...resData };
          if (setData) {
            setData(prev => prev.map(r => r.id === editRow.id ? updatedRow : r));
          }
          showToast('Registro actualizado con éxito.', 'success');
        } else {
          const res = await crud.insert(tableName, { activo: true, ...formData });
          const resData = (res && typeof res === 'object' && res.data) ? res.data : (res || {});
          const newId = resData.id || res.id || (data && data.length > 0 ? Math.max(...data.map(d => typeof d.id === 'number' ? d.id : 0)) + 1 : 1);
          const createdRow = { activo: true, ...formData, ...resData, id: newId };
          if (setData) {
            setData(prev => [createdRow, ...prev]);
          }
          showToast('Registro creado con éxito.', 'success');
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error al guardar:", err);
      setModalError(err.message || "Error al guardar el registro.");
      showToast(err.message || "Error al guardar.", 'error');
    } finally {
      setIsSaving(false);
    }
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
        {!readOnly && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-label text-[10.5px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:brightness-105 transition-all shadow-md shadow-[#d1a14e]/15 active:scale-[0.99]"
          >
            <Plus size={16} weight="bold" /> Agregar
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xs">
        <MagnifyingGlass size={16} className="text-outline" weight="bold" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 bg-transparent text-sm font-body text-on-surface placeholder:text-outline/50 outline-none"
        />
        <span className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold">{filtered.length} registros</span>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="cif-table">
            <thead className="bg-surface-container/40">
              <tr>
                {columns.filter(c => !c.hideInTable).map(c => <th key={c.key}>{c.label}</th>)}
                {!readOnly && <th className="w-24 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.filter(c => !c.hideInTable).length + 1} className="text-center py-16 text-outline font-label uppercase tracking-widest opacity-60">Sin resultados</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-surface-container/50 transition-colors">
                  {columns.filter(c => !c.hideInTable).map(c => (
                    <td key={c.key} className="whitespace-nowrap">
                      {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                  {!readOnly && (
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(row)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-all shadow-xs" title="Editar">
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all shadow-xs" title="Eliminar">
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container/40">
              <h3 className="font-headline font-bold text-base text-on-surface">{editRow ? 'Editar' : 'Agregar'} {title}</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"><X size={16} weight="bold" /></button>
            </div>
            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-body flex items-start gap-2 animate-in">
                  <span className="font-bold">⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}
              {columns.filter(c => c.key !== 'id' && !c.hideInForm).map(c => (
                <div key={c.key} className="space-y-1.5">
                  <label className="block font-label text-[10.5px] uppercase tracking-wider text-outline font-semibold">{c.label}</label>
                  
                  {c.formType === 'select' ? (
                    <select
                      value={formData[c.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant text-on-surface p-3 text-sm font-body rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
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
                      className="w-full bg-surface border border-outline-variant text-on-surface p-3 text-sm font-body rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Inactivo)</option>
                    </select>
                  ) : (
                    <input
                      type={c.formType || 'text'}
                      value={formData[c.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant text-on-surface p-3 text-sm font-body rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-label text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl hover:brightness-105 transition-all mt-4 shadow-md shadow-[#d1a14e]/15 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSaving ? 'Guardando...' : (editRow ? 'Guardar Cambios' : 'Crear Registro')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-in backdrop-blur-md ${
          toast.type === 'error'
            ? 'bg-danger/95 text-white border-danger/40'
            : 'bg-surface-container-high/95 text-on-surface border-primary/40 text-primary'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

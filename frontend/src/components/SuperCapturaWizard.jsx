import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ArrowRight, ArrowLeft, Plus, Trash, PencilSimple,
  UserCircle, Truck, Package, Path, CheckCircle,
  ShoppingCart, Warning, Sparkle
} from '@phosphor-icons/react';
import { useData } from '../context/DataContext';
import SearchableSelect from './SearchableSelect';
import { db } from '../services/db';

// ─── Unique ID generator ────────────────────────────────────
let _tid = 0;
const nextTempId = () => `tmp-${++_tid}-${Date.now()}`;

// ─── Helper: Formatear fecha para despliegue ───────────────
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

// ─── 24H Time Input Component ───────────────────────────────
function TimeInput24({ value, onChange, className }) {
  const handleChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    if (val.length === 2 && !val.includes(':') && (value || '').length < 3) {
      val += ':';
    }
    if (val.length > 5) val = val.slice(0, 5);
    onChange(val);
  };
  
  const handleBlur = () => {
    if (value && value.length === 5) {
      const [h, m] = value.split(':');
      if (parseInt(h) > 23 || parseInt(m) > 59) {
        onChange('');
      }
    } else if (value && value.length > 0 && value.length < 5) {
      onChange('');
    }
  };

  return (
    <input 
      type="text" 
      value={value || ''} 
      onChange={handleChange} 
      onBlur={handleBlur}
      placeholder="HH:MM" 
      maxLength={5}
      className={className} 
    />
  );
}

// ─── Inline Editable Field ────────────────────────────────────
function InlineEditableField({ value, onChange, type = 'text', options = [], className = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => setTempValue(value), [value]);

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue !== value) onChange(tempValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === 'select') {
      return (
        <select 
          autoFocus 
          value={tempValue} 
          onChange={e => setTempValue(e.target.value)} 
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`bg-background border border-primary text-on-surface px-1 py-0.5 text-xs outline-none ${className}`}
        >
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input 
        autoFocus 
        type="text" 
        value={tempValue} 
        onChange={e => setTempValue(e.target.value)} 
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-background border border-primary text-on-surface px-1 py-0.5 text-xs outline-none min-w-[80px] w-full ${className}`}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={`cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors border border-transparent hover:border-primary/30 block w-full truncate ${className}`}
      title="Clic para editar"
    >
      {value || <span className="text-outline/50 italic">—</span>}
    </span>
  );
}

// ─── Step indicator component ───────────────────────────────
function Stepper({ step }) {
  const steps = [
    { num: 1, label: 'Operador', icon: UserCircle },
    { num: 2, label: 'Rutas', icon: Path },
    { num: 3, label: 'Confirmar', icon: CheckCircle },
  ];
  return (
    <div className="flex items-center justify-center gap-0 py-6 select-none">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = step === s.num;
        const isDone = step > s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
              isActive ? 'bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] shadow-md shadow-[#d1a14e]/20 scale-105' :
              isDone ? 'bg-primary/20 text-primary' :
              'bg-surface-container-highest text-outline'
            }`}>
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              <span className="font-label text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-[2px] mx-1 transition-colors duration-300 ${
                isDone ? 'bg-primary' : 'bg-outline-variant/30'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Route card is deprecated, using Editable Table inline ────

// ─── Main Wizard Component ──────────────────────────────────
export default function SuperCapturaWizard({ open, onClose }) {
  const {
    movimientos, setMovimientos,
    operadores, unidades, cajas: cajasData,
    clientes: clientesData, localitiesData, // Note: localidadesData is read, but lets map the context variable correctly
    localidades: localidadesData,
    precios, tiposMovimiento, refreshData, crud
  } = useData();

  // ── Wizard state ──────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch latest data on mount to ensure fresh catalogs if updated in another tab
  useEffect(() => {
    if (refreshData) refreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1: Operator data ─────────────────────────────────
  const [operador, setOperador] = useState('');
  const [tractor, setTractor] = useState('');
  const [caja, setCaja] = useState('');
  const [cliente, setCliente] = useState('');
  const [fechaBloque, setFechaBloque] = useState(new Date().toISOString().split('T')[0]);

  // ── Step 2: Route form + cart ──────────────────────────────
  const [routeForm, setRouteForm] = useState({
    origen: '', destino: '', tipoMov: '', caja: '',
    horaSalida: '', valeFisico: '', puente: ''
  });
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Quick Add Modal State & Handlers ──────────────────────
  const [quickAdd, setQuickAdd] = useState({
    open: false,
    title: '',
    label: '',
    placeholder: '',
    field: '',
    table: '',
    value: '',
    loading: false,
    error: ''
  });

  const openQuickAdd = (field, table, title, label, placeholder = '') => {
    setQuickAdd({
      open: true,
      title,
      label,
      placeholder: placeholder || `Escribe el valor para ${label.toLowerCase()}...`,
      field,
      table,
      value: '',
      loading: false,
      error: ''
    });
  };

  const handleSaveQuickAdd = async (e) => {
    if (e) e.preventDefault();
    const val = quickAdd.value.trim();
    if (!val) {
      setQuickAdd(prev => ({ ...prev, error: `El campo es requerido.` }));
      return;
    }

    setQuickAdd(prev => ({ ...prev, loading: true, error: '' }));
    try {
      if (quickAdd.table === 'localidades') {
        await crud.insert('localidades', { nombre: val, tipo: 'ciudad', ciudad: 'Juárez' });
        if (quickAdd.field === 'origen') {
          setRouteForm(p => ({ ...p, origen: val }));
        } else if (quickAdd.field === 'destino') {
          setRouteForm(p => ({ ...p, destino: val }));
        }
      } else if (quickAdd.table === 'operadores') {
        const res = await fetch('/api/operadores/rapido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nombre_completo: val })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Error al crear operador');
        if (refreshData) await refreshData();
        handleOperadorChange(val);
      } else if (quickAdd.table === 'cajas') {
        await crud.insert('cajas', { numero_economico: val, estatus: 'disponible' });
        setCaja(val);
      } else if (quickAdd.table === 'clientes') {
        await crud.insert('clientes', { razon_social: val, activo: 1 });
        setCliente(val);
      }

      setQuickAdd({ open: false, title: '', label: '', placeholder: '', field: '', table: '', value: '', loading: false, error: '' });
    } catch (err) {
      setQuickAdd(prev => ({ ...prev, loading: false, error: err.message || 'Error al guardar registro.' }));
    }
  };

  // ── LocalStorage Draft Persistence ────────────────────────
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem('cif_supercaptura_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setStep(parsed.step || 1);
          setOperador(parsed.operador || '');
          setTractor(parsed.tractor || '');
          setCaja(parsed.caja || '');
          setCliente(parsed.cliente || '');
          setFechaBloque(parsed.fechaBloque || new Date().toISOString().split('T')[0]);
          setRouteForm(parsed.routeForm || { origen: '', destino: '', tipoMov: '', caja: '', horaSalida: '', valeFisico: '', puente: '' });
          setRoutes(parsed.routes || []);
          setEditingId(parsed.editingId || null);
        } catch (e) {
          console.error("Error loading draft", e);
        }
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && !showSuccess) {
      const draft = { step, operador, tractor, caja, cliente, fechaBloque, routeForm, routes, editingId };
      localStorage.setItem('cif_supercaptura_draft', JSON.stringify(draft));
    }
  }, [step, operador, tractor, caja, cliente, fechaBloque, routeForm, routes, editingId, open, showSuccess]);

  // ── Derived lists ─────────────────────────────────────────
  const operadoresList = useMemo(() =>
    operadores.filter(o => o.activo || o.estatus === 'Activo' || o.estatus === 'activo')
      .map(o => o.nombreCompleto ?? o.nombre_completo).filter(Boolean), [operadores]);

  const unidadesList = useMemo(() =>
    unidades.map(u => u.numeroEconomico ?? u.numero_economico).filter(Boolean), [unidades]);

  const cajasList = useMemo(() =>
    cajasData.map(c => c.numeroCaja ?? c.numero_caja).filter(Boolean), [cajasData]);

  const clientesList = useMemo(() =>
    [...new Set(
      clientesData
        .filter(c => c.activo || c.activo !== 0)
        .map(c => c.razonSocial ?? c.razon_social)
        .filter(Boolean)
    )], [clientesData]);

  const localidadesList = useMemo(() =>
    localidadesData.map(l => l.nombre).filter(Boolean), [localidadesData]);

  const filteredTiposMovimiento = useMemo(() => {
    if (!tiposMovimiento || tiposMovimiento.length === 0) return [];
    const getTypeName = t => typeof t === 'object' && t !== null ? (t.nombre ?? t.tipo_movimiento ?? t.nombreTipo ?? '') : String(t);
    const rawList = tiposMovimiento.map(getTypeName).filter(Boolean);
    if (!cliente) return [...new Set(rawList)];
    const clientUpper = cliente.trim().toUpperCase();
    
    // Show types specific to this client OR marked as general (NA/TODOS)
    const filtered = tiposMovimiento.filter(t => {
      const associated = (typeof t === 'object' ? (t.clienteAsociado || t.cliente_asociado || '') : '').trim().toUpperCase();
      return associated === clientUpper || associated === 'NA' || associated === 'TODOS' || associated === '';
    }).map(getTypeName).filter(Boolean);
    
    // If no client-specific types, fall back to showing ALL types
    return filtered.length > 0 ? [...new Set(filtered)] : [...new Set(rawList)];
  }, [tiposMovimiento, cliente]);

  // ── Auto-suggest when operator changes ────────────────────
  const handleOperadorChange = useCallback((name) => {
    setOperador(name);
    if (!name) { setTractor(''); setCaja(''); setCliente(''); return; }

    // Support snake_case (API) and camelCase (legacy)
    const opInfo = operadores.find(o =>
      (o.nombreCompleto ?? o.nombre_completo) === name
    );
    let autoTractor = opInfo?.tractorAsignado || opInfo?.tractor_asignado || '';
    let autoCaja = opInfo?.cajaAsignada || opInfo?.caja_asignada || '';

    // Build fuzzy matcher: split name into words, match if all words exist in operador field
    const nameWords = name.replace(/\(.*?\)/g, '').trim().toUpperCase().split(/\s+/);
    const matchesOperador = (opField) => {
      if (!opField) return false;
      const upper = opField.toUpperCase();
      return nameWords.every(w => upper.includes(w));
    };

    // Fallback: last trip (using fuzzy match)
    if (!autoTractor || !autoCaja) {
      const last = [...movimientos].reverse().find(m => matchesOperador(m.operador));
      if (last) {
        if (!autoTractor) autoTractor = last.tractor || '';
        if (!autoCaja) autoCaja = last.caja || '';
      }
    }

    // Most frequent client from trips (using fuzzy match)
    const recentTrips = movimientos.filter(m => matchesOperador(m.operador)).slice(-30);
    if (recentTrips.length > 0) {
      const freq = {};
      recentTrips.forEach(t => { if (t.cliente) freq[t.cliente] = (freq[t.cliente] || 0) + 1; });
      const topClient = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      if (topClient) setCliente(topClient[0]);
    }

    setTractor(autoTractor);
    setCaja(autoCaja);
  }, [operadores, movimientos]);

  // ── Add route to cart ─────────────────────────────────────
  const handleAddRoute = () => {
    if (!routeForm.origen || !routeForm.destino || !routeForm.tipoMov) {
      setRouteError('Origen, Destino y Tipo de Movimiento son obligatorios.');
      return;
    }
    setRouteError('');

    if (editingId) {
      // Update existing route
      setRoutes(prev => prev.map(r =>
        r.tempId === editingId ? { ...routeForm, tempId: editingId } : r
      ));
      setEditingId(null);
    } else {
      // Add new route
      setRoutes(prev => [...prev, { ...routeForm, tempId: nextTempId() }]);
    }

    // TR-001: Reseteo parcial de campos dejando caja intacta
    setRouteForm(prev => ({
      origen: '',
      destino: '',
      tipoMov: '',
      caja: prev.caja,
      horaSalida: '',
      valeFisico: '',
      puente: ''
    }));
  };

  // ── Edit route from cart ──────────────────────────────────
  const handleEditRoute = (route) => {
    setEditingId(route.tempId);
    setRouteForm({
      origen: route.origen,
      destino: route.destino,
      tipoMov: route.tipoMov,
      caja: route.caja || '',
      horaSalida: route.horaSalida,
      valeFisico: route.valeFisico,
      puente: route.puente || ''
    });
  };

  const handleInlineSave = (updatedRoute) => {
    setRoutes(prev => prev.map(r => r.tempId === updatedRoute.tempId ? updatedRoute : r));
  };

  // ── Delete route from cart ────────────────────────────────
  const handleDeleteRoute = (tempId) => {
    setRoutes(prev => prev.filter(r => r.tempId !== tempId));
    if (editingId === tempId) {
      setEditingId(null);
      setRouteForm(prev => ({ ...prev, valeFisico: '' }));
    }
  };

  // ── Final confirmation ────────────────────────────────────
  const handleConfirm = async () => {
    // Helper: return int ID or null if we only have the display string
    const toId = (val) => {
      const n = parseInt(val, 10);
      return Number.isFinite(n) ? n : null;
    };

    try {
      for (let i = 0; i < routes.length; i++) {
        const r = routes[i];
        const selectedCaja = r.caja || caja;

        // The API may return snake_case (razon_social) OR camelCase (razonSocial)
        const clienteObj = clientesData.find(c =>
          (c.razonSocial ?? c.razon_social) === cliente
        );
        const operadorObj = operadores.find(o =>
          (o.nombreCompleto ?? o.nombre_completo) === operador
        );
        const tractorObj = unidades.find(u =>
          (u.numeroEconomico ?? u.numero_economico) === tractor
        );
        const cajaObj = cajasData.find(c =>
          (c.numeroCaja ?? c.numero_caja) === selectedCaja
        );

        const clienteId  = clienteObj?.id  ? parseInt(clienteObj.id, 10)  : null;
        const operadorId = operadorObj?.id  ? parseInt(operadorObj.id, 10) : toId(operador);
        const tractorId  = tractorObj?.id   ? parseInt(tractorObj.id, 10)  : toId(tractor);
        const cajaId     = cajaObj?.id      ? parseInt(cajaObj.id, 10)     : null;

        // tipo_movimiento: guardar el nombre exacto del catálogo
        const tipoMovVal = r.tipoMov || 'local_cargado';

        const payload = {
          cliente_id: clienteId,
          operador_id: operadorId,
          tractocamion_id: tractorId,
          tipo_movimiento: tipoMovVal,
          caja_id: cajaId,
          origen: r.origen,
          destino: r.destino,
          via_cruce: r.puente || '',
          folio_boleta: r.valeFisico,
          fecha_salida: `${fechaBloque} ${r.horaSalida || '00:00'}:00`,
          estatus: 'asignado'
        };

        // Guardar viaje asíncronamente
        await db.insert('movimientos', payload);
      }

      await refreshData();
      localStorage.removeItem('cif_supercaptura_draft');
      setShowSuccess(true);
    } catch (err) {
      alert("Error al guardar viajes: " + err.message);
    }
  };

  // ── Reset wizard ──────────────────────────────────────────
  const resetWizard = (keepOpen = false) => {
    localStorage.removeItem('cif_supercaptura_draft');
    setStep(1);
    setOperador(''); setTractor(''); setCaja(''); setCliente('');
    setRouteForm({ origen: '', destino: '', tipoMov: '', caja: '', horaSalida: '', valeFisico: '', puente: '' });
    setRoutes([]);
    setEditingId(null);
    setRouteError('');
    setShowSuccess(false);
    if (!keepOpen) onClose();
  };

  const handleConfirmClear = () => {
    resetWizard(true);
    setShowClearConfirm(false);
  };

  if (!open) return null;

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return createPortal(
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-in">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkle size={20} weight="fill" />
          </div>
          <h2 className="font-headline text-lg font-bold tracking-tight text-on-surface">Súper Captura</h2>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full font-bold">
            Wizard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setShowClearConfirm(true)} 
            className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-outline hover:text-danger border border-outline-variant hover:border-danger/30 px-4 py-2 rounded-xl transition-all shadow-sm bg-surface hover:bg-danger/5"
            title="Borrar borrador e iniciar de cero"
          >
            <Trash size={16} /> Limpiar Captura
          </button>
          <button onClick={() => onClose()} className="p-2 text-outline hover:text-danger hover:bg-danger/10 rounded-xl transition-colors" title="Guardar borrador y cerrar">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Stepper ──────────────────────────────────────── */}
      <Stepper step={step} />

      {/* ── Content area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="max-w-4xl mx-auto">

          {/* ════════════════════════════════════════════════ */}
          {/*  STEP 1: OPERATOR                               */}
          {/* ════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-8 animate-in">
              <div className="text-center mb-8">
                <h3 className="font-headline text-2xl font-bold text-on-surface">¿Quién opera?</h3>
                <p className="font-body text-sm text-outline mt-2">
                  Selecciona al operador. El sistema sugerirá su equipo y cliente habitual.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 space-y-6 shadow-sm">
                {/* Operador y Fecha de Trabajo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                      <UserCircle size={14} className="inline mr-1 -mt-0.5" /> Operador
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          options={operadoresList}
                          value={operador}
                          onChange={handleOperadorChange}
                          placeholder="Escribe o selecciona un operador..."
                          className="text-base font-body rounded-xl border-outline-variant"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => openQuickAdd('operador', 'operadores', 'Nuevo Operador', 'Nombre Completo', 'Ej. Juan Pérez')}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors p-3.5 border border-primary/30 rounded-xl font-bold" title="Nuevo Operador">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                      Fecha de Trabajo (Aplica a todos los viajes)
                    </label>
                    <input 
                      type="date"
                      value={fechaBloque}
                      onChange={e => {
                        setFechaBloque(e.target.value);
                        setRouteForm(p => ({...p, fecha: e.target.value}));
                      }}
                      className="w-full bg-surface border border-outline-variant text-on-surface p-3.5 text-base font-body rounded-xl outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Auto-filled row */}
                {operador && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 animate-in">
                    <div>
                      <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                        <Truck size={14} className="inline mr-1 -mt-0.5" /> Tractor
                        <span className="text-primary ml-1">(sugerido)</span>
                      </label>
                      <SearchableSelect
                        options={unidadesList}
                        value={tractor}
                        onChange={setTractor}
                        placeholder="— Seleccionar —"
                        className="p-3 text-sm font-body border"
                      />
                    </div>
                    <div>
                      <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                        <Package size={14} className="inline mr-1 -mt-0.5" /> Caja
                        <span className="text-primary ml-1">(sugerida)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={cajasList}
                            value={caja}
                            onChange={setCaja}
                            allowFreeText={true}
                            placeholder="Número de Caja"
                            className="p-3 text-sm font-body border"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => openQuickAdd('caja', 'cajas', 'Nueva Caja', 'Número Económico de Caja', 'Ej. CX-101')}
                          className="bg-surface text-outline hover:text-primary hover:border-primary/40 transition-colors p-3 border border-outline-variant rounded-xl" title="Nueva Caja">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                        Cliente
                        <span className="text-primary ml-1">(sugerido)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={clientesList}
                            value={cliente}
                            onChange={setCliente}
                            placeholder="Cliente..."
                            className="p-3 text-sm font-body border"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => openQuickAdd('cliente', 'clientes', 'Nuevo Cliente', 'Razón Social del Cliente', 'Ej. Lear Corporation')}
                          className="bg-surface text-outline hover:text-primary hover:border-primary/40 transition-colors p-3 border border-outline-variant rounded-xl" title="Nuevo Cliente">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Next button */}
              <div className="flex justify-end pt-4">
                <button
                  disabled={!operador || !tractor || !cliente}
                  onClick={() => {
                    setRouteForm(p => ({ ...p, caja: caja }));
                    setStep(2);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-label text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:brightness-105 transition-all shadow-md shadow-[#d1a14e]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  Siguiente: Capturar Rutas <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/*  STEP 2: ROUTES (CART)                           */}
          {/* ════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in">

              {/* Operator summary chip */}
              <div className="flex items-center gap-4 bg-surface-container-low border border-primary/30 rounded-2xl p-4 shadow-md">
                <UserCircle size={24} className="text-primary" />
                <div className="flex-1">
                  <span className="font-bold text-sm text-on-surface">{operador}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="font-mono text-xs text-primary">{tractor}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="font-mono text-xs text-outline">{caja}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="text-xs font-bold text-on-surface">{cliente}</span>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-label font-bold uppercase text-primary hover:underline">
                  Cambiar
                </button>
              </div>

              {/* Mini-form */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 space-y-4 shadow-md">
                <h4 className="font-label text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  {editingId ? '✏️ Editando Ruta' : '➕ Nueva Ruta'}
                </h4>

                {routeError && (
                  <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 text-danger font-body text-sm font-bold">
                    <Warning size={16} /> {routeError}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Origen */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Origen</label>
                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <SearchableSelect 
                          options={localidadesList}
                          value={routeForm.origen}
                          onChange={val => setRouteForm(p => ({...p, origen: val}))}
                          allowFreeText={true}
                          placeholder="—"
                          className="text-sm font-body border border-outline-variant rounded-xl px-3 h-[42px]"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => openQuickAdd('origen', 'localidades', 'Nueva Ubicación (Origen)', 'Nombre de Ubicación / Planta', 'Ej. Planta 1, Parque Juárez...')}
                        className="bg-surface text-outline hover:text-primary hover:border-primary/40 transition-colors border border-outline-variant rounded-xl shrink-0 flex items-center justify-center w-[42px] h-[42px]" title="Nueva Ubicación">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Destino */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Destino</label>
                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <SearchableSelect 
                          options={localidadesList}
                          value={routeForm.destino}
                          onChange={val => setRouteForm(p => ({...p, destino: val}))}
                          allowFreeText={true}
                          placeholder="—"
                          className="text-sm font-body border border-outline-variant rounded-xl px-3 h-[42px]"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => openQuickAdd('destino', 'localidades', 'Nueva Ubicación (Destino)', 'Nombre de Ubicación / Destino', 'Ej. Bodega El Paso, Cruce Córdova...')}
                        className="bg-surface text-outline hover:text-primary hover:border-primary/40 transition-colors border border-outline-variant rounded-xl shrink-0 flex items-center justify-center w-[42px] h-[42px]" title="Nueva Ubicación">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Tipo Movimiento */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Tipo Movimiento</label>
                    <SearchableSelect 
                      options={filteredTiposMovimiento}
                      value={routeForm.tipoMov}
                      onChange={val => setRouteForm(p => ({
                        ...p, 
                        tipoMov: val,
                        puente: ['IMPO', 'EXPO'].includes(val) ? p.puente : ''
                      }))}
                      placeholder="Seleccionar tipo..."
                      className="text-sm font-body border border-outline-variant rounded-xl px-3 h-[42px]"
                    />
                  </div>
                  {/* Vale Físico */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Folio / Vale Físico</label>
                    <input 
                      type="text" 
                      value={routeForm.valeFisico} 
                      onChange={e => setRouteForm(p => ({...p, valeFisico: e.target.value}))}
                      placeholder="Ej. 12345"
                      className="w-full bg-surface border border-outline-variant rounded-xl text-on-surface px-3 h-[42px] text-sm font-mono outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {/* Caja */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Caja</label>
                    <SearchableSelect 
                      options={cajasList}
                      value={routeForm.caja}
                      onChange={val => setRouteForm(p => ({...p, caja: val}))}
                      placeholder={caja || "—"}
                      className="text-sm font-body border border-outline-variant rounded-xl px-3 h-[42px]"
                    />
                  </div>
                  {/* Hora Salida */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Hora Salida</label>
                    <TimeInput24 
                      value={routeForm.horaSalida} 
                      onChange={val => setRouteForm(p => ({...p, horaSalida: val}))}
                      className="w-full bg-surface border border-outline-variant rounded-xl text-on-surface px-3 h-[42px] text-sm font-mono outline-none focus:border-primary"
                    />
                  </div>
                  {/* Puente */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Puente</label>
                    <select 
                      value={routeForm.puente} 
                      onChange={e => setRouteForm(p => ({...p, puente: e.target.value}))}
                      disabled={!['IMPO', 'EXPO'].includes(routeForm.tipoMov)}
                      className="w-full bg-surface border border-outline-variant rounded-xl text-on-surface px-3 h-[42px] text-sm outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="">— Ninguno —</option>
                      <option value="Zaragoza">Zaragoza</option>
                      <option value="Córdova">Córdova</option>
                      <option value="Santa Teresa">Santa Teresa</option>
                      <option value="Stanton">Stanton</option>
                    </select>
                  </div>
                </div>

                {/* Add button */}
                <div className="flex justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={handleAddRoute}
                    className={`flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md ${
                      editingId
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] hover:brightness-105'
                    }`}
                  >
                    {editingId ? (
                      <><PencilSimple size={16} /> Actualizar Ruta</>
                    ) : (
                      <><Plus size={16} weight="bold" /> Agregar Ruta</>
                    )}
                  </button>
                </div>
              </div>

              {/* Cart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary">
                    <ShoppingCart size={18} weight="bold" />
                    <h4 className="font-label text-xs font-bold uppercase tracking-widest">
                      Rutas Capturadas
                    </h4>
                  </div>
                  {routes.length > 0 && (
                    <span className="bg-primary text-on-primary font-mono text-xs font-bold px-3 py-1 rounded-full">
                      {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}
                    </span>
                  )}
                </div>

                {routes.length === 0 ? (
                  <div className="border-2 border-dashed border-outline-variant rounded-2xl p-12 text-center text-outline">
                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-body text-sm">Aún no has agregado rutas.</p>
                    <p className="font-label text-[10px] uppercase tracking-widest mt-1">
                      Usa el formulario de arriba para empezar.
                    </p>
                  </div>
                ) : (
                  <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface-container-low shadow-md">
                    <table className="w-full text-left font-body text-xs">
                      <thead>
                        <tr className="bg-surface-container-high border-b border-outline-variant">
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">#</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Fecha</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Tipo</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Origen</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Destino</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Folio</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Caja</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Hora</th>
                          <th className="py-3 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Puente</th>
                          <th className="py-3 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {routes.map((r, i) => (
                          <tr key={r.tempId} className="hover:bg-surface-container-high/60 transition-colors group">
                            <td className="py-2 px-3 font-mono text-outline">{i + 1}</td>
                            <td className="py-2 px-3 font-mono text-primary font-bold">{formatDateDisplay(fechaBloque)}</td>
                            <td className="py-2 px-3 font-bold text-primary">{r.tipoMov}</td>
                            <td className="py-2 px-3">
                              <InlineEditableField value={r.origen} onChange={val => handleInlineSave({...r, origen: val})} />
                            </td>
                            <td className="py-2 px-3">
                              <InlineEditableField value={r.destino} onChange={val => handleInlineSave({...r, destino: val})} />
                            </td>
                            <td className="py-2 px-3 font-mono">
                              <InlineEditableField value={r.valeFisico} onChange={val => handleInlineSave({...r, valeFisico: val})} />
                            </td>
                            <td className="py-2 px-3 font-mono">
                              <InlineEditableField value={r.caja} onChange={val => handleInlineSave({...r, caja: val})} />
                            </td>
                            <td className="py-2 px-3 font-mono text-primary">
                              <InlineEditableField value={r.horaSalida} onChange={val => handleInlineSave({...r, horaSalida: val})} />
                            </td>
                            <td className="py-2 px-3 font-bold text-amber-500">
                              <InlineEditableField value={r.puente} onChange={val => handleInlineSave({...r, puente: val})} type="select" options={['Zaragoza','Córdova','Santa Teresa','Stanton']} />
                            </td>
                            <td className="py-2 px-3">
                              <button onClick={() => handleDeleteRoute(r.tempId)} className="text-outline hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-outline hover:text-primary px-4 py-2.5 rounded-xl transition-colors">
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button
                  disabled={routes.length === 0}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Revisar y Confirmar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/*  STEP 3: REVIEW & CONFIRM                       */}
          {/* ════════════════════════════════════════════════ */}
          {step === 3 && !showSuccess && (
            <div className="space-y-6 animate-in">
              <div className="text-center mb-6">
                <h3 className="font-headline text-2xl font-bold text-on-surface">Resumen de Captura</h3>
                <p className="font-body text-sm text-outline mt-2">
                  Revisa toda la información antes de confirmar.
                </p>
              </div>

              {/* Operator summary */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-md">
                <h4 className="font-label text-xs font-bold uppercase tracking-widest text-primary mb-4">Datos del Operador</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Operador</div>
                    <div className="font-bold text-sm text-on-surface">{operador}</div>
                  </div>
                  <div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Tractor</div>
                    <div className="font-mono font-bold text-sm text-primary">{tractor}</div>
                  </div>
                  <div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Caja</div>
                    <div className="font-mono text-sm text-on-surface">{caja}</div>
                  </div>
                  <div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Cliente</div>
                    <div className="font-bold text-sm text-on-surface">{cliente}</div>
                  </div>
                </div>
              </div>

              {/* Routes table */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-high">
                  <h4 className="font-label text-xs font-bold uppercase tracking-widest text-primary">
                    Rutas a Registrar
                  </h4>
                  <span className="bg-primary text-on-primary font-mono text-xs font-bold px-3 py-1 rounded-full">
                    {routes.length} viajes
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-sm">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-outline-variant">
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">#</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Tipo</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Origen</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Destino</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Folio</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Caja</th>
                        <th className="py-3 px-4 font-label text-[10px] uppercase tracking-widest text-outline">Hora</th>
                        <th className="py-3 px-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {routes.map((r, i) => (
                        <tr key={r.tempId} className="hover:bg-surface-container-high/60 transition-colors group">
                          <td className="py-2.5 px-4 font-mono text-xs text-outline">{i + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-primary text-xs">{r.tipoMov}</td>
                          <td className="py-2.5 px-4">
                            <InlineEditableField value={r.origen} onChange={val => handleInlineSave({...r, origen: val})} />
                          </td>
                          <td className="py-2.5 px-4">
                            <InlineEditableField value={r.destino} onChange={val => handleInlineSave({...r, destino: val})} />
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold">
                            <InlineEditableField value={r.valeFisico} onChange={val => handleInlineSave({...r, valeFisico: val})} />
                          </td>
                          <td className="py-2.5 px-4 font-mono">
                            <InlineEditableField value={r.caja || caja} onChange={val => handleInlineSave({...r, caja: val})} />
                          </td>
                          <td className="py-1 px-4 font-mono text-primary">
                            <InlineEditableField value={r.horaSalida} onChange={val => handleInlineSave({...r, horaSalida: val})} />
                          </td>
                          <td className="py-1 px-4">
                            <button onClick={() => handleDeleteRoute(r.tempId)} className="text-outline hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-outline hover:text-primary px-4 py-2.5 rounded-xl transition-colors">
                  <ArrowLeft size={16} /> Volver a Editar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-label text-sm font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-green-600/20"
                >
                  <CheckCircle size={20} weight="fill" />
                  Confirmar Super Carga ({routes.length} viajes)
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/*  SUCCESS OVERLAY                                 */}
          {/* ════════════════════════════════════════════════ */}
          {showSuccess && (
            <div className="max-w-xl mx-auto my-auto bg-surface-container-low border border-outline-variant rounded-2xl p-10 shadow-2xl flex flex-col items-center justify-center text-center animate-in">
              <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={56} weight="fill" className="text-green-500" />
              </div>
              <h3 className="font-headline text-3xl font-bold text-green-600 mb-2">¡Captura Exitosa!</h3>
              <p className="font-body text-base text-outline mb-2">
                Se registraron <strong className="text-on-surface">{routes.length} viajes</strong> para <strong className="text-primary">{operador}</strong>.
              </p>
              <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-10">
                Cliente: {cliente} · Tractor: {tractor} · Caja: {caja}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => resetWizard(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-label text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg"
                >
                  <UserCircle size={16} /> Nuevo Operador
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('cif_supercaptura_draft');
                    resetWizard(false);
                  }}
                  className="flex items-center gap-2 bg-surface border border-outline-variant text-outline font-label text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:text-primary hover:border-primary transition-all"
                >
                  <X size={16} /> Cerrar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Quick Add Modal ──────────────────────────────── */}
      {quickAdd.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[70] flex items-center justify-center p-4 animate-in" onClick={() => setQuickAdd(prev => ({ ...prev, open: false }))}>
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-headline font-bold text-base text-on-surface">{quickAdd.title}</h3>
              <button 
                type="button"
                onClick={() => setQuickAdd(prev => ({ ...prev, open: false }))} 
                className="p-1.5 text-outline hover:text-on-surface rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {quickAdd.error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-bold flex items-center gap-2">
                <Warning size={16} /> {quickAdd.error}
              </div>
            )}

            <form onSubmit={handleSaveQuickAdd} className="space-y-4">
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                  {quickAdd.label}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={quickAdd.value}
                  onChange={e => setQuickAdd(prev => ({ ...prev, value: e.target.value, error: '' }))}
                  placeholder={quickAdd.placeholder}
                  className="w-full bg-surface border border-outline-variant rounded-xl text-on-surface px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={quickAdd.loading}
                  onClick={() => setQuickAdd(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 text-xs font-label uppercase tracking-widest text-outline hover:text-on-surface rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickAdd.loading || !quickAdd.value.trim()}
                  className="bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-label text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl hover:brightness-105 transition-all shadow-md shadow-[#d1a14e]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {quickAdd.loading ? 'Guardando...' : 'Guardar y Seleccionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Clear Modal ──────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[80] flex items-center justify-center p-4 animate-in" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mx-auto">
              <Trash size={24} weight="bold" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">¿Limpiar captura actual?</h3>
              <p className="font-body text-sm text-outline">
                Se borrarán el operador, vehículo, cliente y todas las rutas capturadas en este borrador. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 text-xs font-label uppercase tracking-widest text-outline hover:text-on-surface rounded-xl border border-outline-variant hover:bg-surface transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-label text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                <Trash size={16} /> Sí, Limpiar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

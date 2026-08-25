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
              isActive ? 'bg-primary text-on-primary shadow-lg scale-105' :
              isDone ? 'bg-primary/20 text-primary' :
              'bg-surface-variant/40 text-outline'
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
    if (!cliente) return tiposMovimiento;
    const clientUpper = cliente.trim().toUpperCase();
    
    // Show types specific to this client OR marked as general (NA/TODOS)
    const filtered = tiposMovimiento.filter(t => {
      const associated = (t.clienteAsociado || '').trim().toUpperCase();
      return associated === clientUpper || associated === 'NA' || associated === 'TODOS' || associated === '';
    });
    // If no client-specific types, fall back to showing ALL types
    return filtered.length > 0 ? filtered : tiposMovimiento;
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

        // tipo_movimiento: send the slug (snake_case), not the display label
        const tipoMovSlug = r.tipoMov
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_');

        const payload = {
          cliente_id: clienteId,
          operador_id: operadorId,
          tractocamion_id: tractorId,
          tipo_movimiento: tipoMovSlug,
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
    setStep(1);
    setOperador(''); setTractor(''); setCaja(''); setCliente('');
    setRouteForm({ origen: '', destino: '', tipoMov: '', caja: '', horaSalida: '', valeFisico: '', puente: '' });
    setRoutes([]);
    setEditingId(null);
    setRouteError('');
    setShowSuccess(false);
    if (!keepOpen) onClose();
  };

  if (!open) return null;

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return createPortal(
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md flex flex-col animate-in">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant/20 bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Sparkle size={22} weight="fill" className="text-primary" />
          <h2 className="font-headline text-lg font-bold tracking-tight">Súper Captura</h2>
          <span className="font-label text-[9px] uppercase tracking-widest text-outline bg-surface-variant/50 px-3 py-1 rounded-full">
            Wizard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (window.confirm('¿Estás seguro de limpiar la captura? Se perderá todo el progreso no guardado.')) {
                localStorage.removeItem('cif_supercaptura_draft');
                resetWizard(true);
              }
            }} 
            className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-outline hover:text-danger border border-transparent hover:border-danger/30 px-3 py-1.5 transition-colors shadow-sm bg-surface"
            title="Borrar borrador e iniciar de cero"
          >
            <Trash size={16} /> Limpiar Captura
          </button>
          <button onClick={() => onClose()} className="p-2 text-outline hover:text-danger hover:bg-danger/10 rounded transition-colors" title="Guardar borrador y cerrar">
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
                <h3 className="font-headline text-2xl font-bold">¿Quién opera?</h3>
                <p className="font-body text-sm text-outline mt-2">
                  Selecciona al operador. El sistema sugerirá su equipo y cliente habitual.
                </p>
              </div>

              <div className="bg-surface border border-outline-variant/20 p-8 space-y-6 shadow-sm">
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
                          className="text-base font-body"
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          const nuevo = window.prompt("Nombre del nuevo operador:");
                          if(nuevo && nuevo.trim() !== '') {
                            try {
                              const res = await fetch('/api/operadores/rapido', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ nombre_completo: nuevo.trim() })
                              });
                              const result = await res.json();
                              if (!res.ok) throw new Error(result.error || 'Error al crear operador');
                              if (refreshData) await refreshData();
                              handleOperadorChange(nuevo.trim());
                            } catch (e) {
                              alert("Error al guardar operador: " + e.message);
                            }
                          }
                        }}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors p-4 border-2 border-primary/20 rounded font-bold" title="Nuevo Operador">
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
                      className="w-full bg-background border-2 border-outline-variant/30 text-on-surface p-4 text-base font-body outline-none focus:border-primary transition-colors"
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
                          onClick={() => {
                            const nueva = window.prompt("Número de caja nueva (Alta Rápida):");
                            if(nueva && nueva.trim() !== '') {
                              // Esto generará algo de deuda técnica sin placa/año, pero agiliza la captura
                              crud.insert('cajas', { numero_caja: nueva.trim(), estatus: 'disponible', tipo_caja: 'Seca' });
                              setCaja(nueva.trim());
                            }
                          }}
                          className="bg-surface-variant text-outline hover:text-primary transition-colors p-3 border border-outline-variant/30 rounded" title="Nueva Caja">
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
                          onClick={async () => {
                          const nuevo = window.prompt("Nombre del nuevo cliente:");
                          if(nuevo && nuevo.trim() !== '') {
                            try {
                              await crud.insert('clientes', { razon_social: nuevo.trim(), activo: 1 });
                              setCliente(nuevo.trim());
                            } catch (e) {
                              alert("Error al guardar cliente: " + e.message);
                            }
                          }
                        }}
                          className="bg-surface-variant text-outline hover:text-primary transition-colors p-3 border border-outline-variant/30 rounded" title="Nuevo Cliente">
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
                  className="flex items-center gap-2 bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
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
              <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4">
                <UserCircle size={24} className="text-primary" />
                <div className="flex-1">
                  <span className="font-bold text-sm">{operador}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="font-mono text-xs text-primary">{tractor}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="font-mono text-xs text-outline">{caja}</span>
                  <span className="mx-2 text-outline">·</span>
                  <span className="text-xs font-bold">{cliente}</span>
                </div>
                <button onClick={() => setStep(1)} className="text-[10px] font-label font-bold uppercase text-primary hover:underline">
                  Cambiar
                </button>
              </div>

              {/* Mini-form */}
              <div className="bg-surface border border-outline-variant/20 p-6 shadow-sm">
                <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
                  {editingId ? '✏️ Editando Ruta' : '➕ Nueva Ruta'}
                </h4>

                {routeError && (
                  <div className="flex items-center gap-2 bg-danger/10 border-l-4 border-danger p-3 mb-4 text-danger font-body text-sm font-bold">
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
                          placeholder="—"
                          className="text-sm font-body border border-outline-variant/30 px-3 h-[42px]"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={async () => {
                          const nuevo = window.prompt("Nueva ubicación (Origen):");
                          if(nuevo && nuevo.trim() !== '') {
                            try {
                              await crud.insert('localidades', { nombre: nuevo.trim(), tipo: 'ciudad', ciudad: 'Juárez' });
                              setRouteForm(p => ({...p, origen: nuevo.trim()}));
                            } catch (e) {
                              alert("Error al guardar localidad: " + e.message);
                            }
                          }
                        }}
                        className="bg-surface-variant text-outline hover:text-primary transition-colors border border-outline-variant/30 shrink-0 flex items-center justify-center w-[42px] h-[42px]" title="Nueva Ubicación">
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
                          placeholder="—"
                          className="text-sm font-body border border-outline-variant/30 px-3 h-[42px]"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={async () => {
                          const nuevo = window.prompt("Nueva ubicación (Destino):");
                          if(nuevo && nuevo.trim() !== '') {
                            try {
                              await crud.insert('localidades', { nombre: nuevo.trim(), tipo: 'ciudad', ciudad: 'Juárez' });
                              setRouteForm(p => ({...p, destino: nuevo.trim()}));
                            } catch (e) {
                              alert("Error al guardar localidad: " + e.message);
                            }
                          }
                        }}
                        className="bg-surface-variant text-outline hover:text-primary transition-colors border border-outline-variant/30 shrink-0 flex items-center justify-center w-[42px] h-[42px]" title="Nueva Ubicación">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Tipo Movimiento */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Tipo Movimiento</label>
                    <select value={routeForm.tipoMov} 
                      onChange={e => setRouteForm(p => ({
                        ...p, 
                        tipoMov: e.target.value,
                        puente: ['IMPO', 'EXPO'].includes(e.target.value) ? p.puente : ''
                      }))}
                      className="w-full bg-background border border-outline-variant/30 text-on-surface px-3 h-[42px] text-sm outline-none focus:border-primary">
                      <option value="">— Seleccionar —</option>
                      {filteredTiposMovimiento.map(t => (
                        <option key={t.id} value={t.nombre}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {/* Vale Físico */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Vale Físico</label>
                    <input type="text" value={routeForm.valeFisico}
                      onChange={e => setRouteForm(p => ({...p, valeFisico: e.target.value}))}
                      placeholder="Folio (Opcional)"
                      className="w-full bg-background border border-outline-variant/30 text-on-surface px-3 h-[42px] text-sm font-mono outline-none focus:border-primary"
                    />
                  </div>
                  {/* Caja */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Caja (Por ruta)</label>
                    <SearchableSelect
                      options={cajasList}
                      value={routeForm.caja}
                      onChange={val => setRouteForm(p => ({...p, caja: val}))}
                      allowFreeText={true}
                      placeholder="Caja..."
                      className="text-sm font-mono border border-outline-variant/30 px-3 h-[42px]"
                    />
                  </div>
                  {/* Hora Salida */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Hora Salida</label>
                    <TimeInput24 value={routeForm.horaSalida}
                      onChange={val => setRouteForm(p => ({...p, horaSalida: val}))}
                      className="w-full bg-background border border-outline-variant/30 text-on-surface px-3 h-[42px] text-sm font-mono outline-none focus:border-primary"
                    />
                  </div>
                  
                  {/* Puente */}
                  <div>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Puente</label>
                    <select 
                      value={routeForm.puente} 
                      onChange={e => setRouteForm(p => ({...p, puente: e.target.value}))}
                      disabled={!['IMPO', 'EXPO'].includes(routeForm.tipoMov)}
                      className="w-full bg-background border border-outline-variant/30 text-on-surface px-3 h-[42px] text-sm outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-variant/30">
                      <option value="">—</option>
                      {['Zaragoza','Córdova','Santa Teresa','Stanton'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {/* Add/Update button */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-outline-variant/20">
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setRouteForm(p => ({...p, valeFisico: ''})); }}
                      className="text-[10px] font-label font-bold uppercase tracking-widest text-outline hover:text-danger transition-colors">
                      Cancelar edición
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddRoute}
                    className={`ml-auto flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-widest px-6 py-3 transition-all shadow-sm ${
                      editingId
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-primary text-on-primary hover:brightness-110'
                    }`}
                  >
                    {editingId ? (
                      <><PencilSimple size={14} /> Actualizar Ruta</>
                    ) : (
                      <><Plus size={14} weight="bold" /> Agregar Ruta</>
                    )}
                  </button>
                </div>
              </div>

              {/* Cart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary">
                    <ShoppingCart size={18} weight="bold" />
                    <h4 className="font-label text-[10px] font-bold uppercase tracking-widest">
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
                  <div className="border-2 border-dashed border-outline-variant/30 p-12 text-center text-outline">
                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-body text-sm">Aún no has agregado rutas.</p>
                    <p className="font-label text-[10px] uppercase tracking-widest mt-1">
                      Usa el formulario de arriba para empezar.
                    </p>
                  </div>
                ) : (
                  <div className="border border-outline-variant/20 rounded overflow-x-auto">
                    <table className="w-full text-left font-body text-xs">
                      <thead>
                        <tr className="bg-surface-variant/30 border-b border-outline-variant/20">
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">#</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Fecha</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Tipo</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Origen</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Destino</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Folio</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Caja</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Hora</th>
                          <th className="py-2 px-3 font-label text-[9px] uppercase tracking-widest text-outline">Puente</th>
                          <th className="py-2 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((r, i) => (
                          <tr key={r.tempId} className="border-b border-outline-variant/10 hover:bg-surface-variant/10 transition-colors group">
                            <td className="py-1 px-3 font-mono text-outline">{i + 1}</td>
                            <td className="py-1 px-3 font-mono text-primary font-bold">{formatDateDisplay(fechaBloque)}</td>
                            <td className="py-1 px-3 font-bold text-primary">{r.tipoMov}</td>
                            <td className="py-1 px-3">
                              <InlineEditableField value={r.origen} onChange={val => handleInlineSave({...r, origen: val})} />
                            </td>
                            <td className="py-1 px-3">
                              <InlineEditableField value={r.destino} onChange={val => handleInlineSave({...r, destino: val})} />
                            </td>
                            <td className="py-1 px-3 font-mono">
                              <InlineEditableField value={r.valeFisico} onChange={val => handleInlineSave({...r, valeFisico: val})} />
                            </td>
                            <td className="py-1 px-3 font-mono">
                              <InlineEditableField value={r.caja} onChange={val => handleInlineSave({...r, caja: val})} />
                            </td>
                            <td className="py-1 px-3 font-mono text-primary">
                              <InlineEditableField value={r.horaSalida} onChange={val => handleInlineSave({...r, horaSalida: val})} />
                            </td>
                            <td className="py-1 px-3 font-bold text-amber-600">
                              <InlineEditableField value={r.puente} onChange={val => handleInlineSave({...r, puente: val})} type="select" options={['Zaragoza','Córdova','Santa Teresa','Stanton']} />
                            </td>
                            <td className="py-1 px-3">
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
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary px-4 py-3 transition-colors">
                  <ArrowLeft size={14} /> Atrás
                </button>
                <button
                  disabled={routes.length === 0}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
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
                <h3 className="font-headline text-2xl font-bold">Resumen de Captura</h3>
                <p className="font-body text-sm text-outline mt-2">
                  Revisa toda la información antes de confirmar.
                </p>
              </div>

              {/* Operator summary */}
              <div className="bg-surface border border-outline-variant/20 p-6 shadow-sm">
                <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Datos del Operador</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Operador</div>
                    <div className="font-bold text-sm">{operador}</div>
                  </div>
                  <div>
                    <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Tractor</div>
                    <div className="font-mono font-bold text-sm text-primary">{tractor}</div>
                  </div>
                  <div>
                    <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Caja</div>
                    <div className="font-mono text-sm">{caja}</div>
                  </div>
                  <div>
                    <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Cliente</div>
                    <div className="font-bold text-sm">{cliente}</div>
                  </div>
                </div>
              </div>

              {/* Routes table */}
              <div className="bg-surface border border-outline-variant/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                  <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">
                    Rutas a Registrar
                  </h4>
                  <span className="bg-primary text-on-primary font-mono text-xs font-bold px-3 py-1 rounded-full">
                    {routes.length} viajes
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-sm">
                    <thead>
                      <tr className="bg-surface-variant/30">
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">#</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Tipo</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Origen</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Destino</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Folio</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Caja</th>
                        <th className="py-2 px-4 font-label text-[9px] uppercase tracking-widest text-outline">Hora</th>
                        <th className="py-2 px-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((r, i) => (
                        <tr key={r.tempId} className="border-b border-outline-variant/10 hover:bg-surface-variant/10 group">
                          <td className="py-1 px-4 font-mono text-xs text-outline">{i + 1}</td>
                          <td className="py-1 px-4 font-bold text-primary text-xs">{r.tipoMov}</td>
                          <td className="py-1 px-4">
                            <InlineEditableField value={r.origen} onChange={val => handleInlineSave({...r, origen: val})} />
                          </td>
                          <td className="py-1 px-4">
                            <InlineEditableField value={r.destino} onChange={val => handleInlineSave({...r, destino: val})} />
                          </td>
                          <td className="py-1 px-4 font-mono font-bold">
                            <InlineEditableField value={r.valeFisico} onChange={val => handleInlineSave({...r, valeFisico: val})} />
                          </td>
                          <td className="py-1 px-4 font-mono">
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
                  className="flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary px-4 py-3 transition-colors">
                  <ArrowLeft size={14} /> Volver a Editar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-3 bg-green-600 text-white font-label text-sm font-bold uppercase tracking-widest px-10 py-4 hover:bg-green-700 transition-all shadow-xl"
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
            <div className="flex flex-col items-center justify-center py-20 animate-in">
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
                  className="flex items-center gap-2 bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all shadow-lg"
                >
                  <UserCircle size={16} /> Nuevo Operador
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('cif_supercaptura_draft');
                    resetWizard(false);
                  }}
                  className="flex items-center gap-2 bg-surface border border-outline-variant/30 text-outline font-label text-xs font-bold uppercase tracking-widest px-8 py-4 hover:text-primary hover:border-primary transition-all"
                >
                  <X size={16} /> Cerrar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import { DoorOpen, ClipboardText, ChartBar, Camera, CheckCircle, WarningCircle, MicrosoftExcelLogo, CornersOut, CornersIn, Clock } from '@phosphor-icons/react';
import { useData } from '../context/DataContext';
import SearchableSelect from '../components/SearchableSelect';
import * as XLSX from 'xlsx';

export default function Accesos() {
  const { 
    movimientos: movData, 
    cajas: cajasData, 
    unidades: unidadesData, 
    localidades: localidadesData, 
    operadores: operadoresData,
    tiposMovimiento,
    clientes,
    crud
  } = useData();

  const fullscreenRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form State
  const [selectedOperador, setSelectedOperador] = useState('');
  const [selectedTractor, setSelectedTractor] = useState('');
  const [selectedCaja, setSelectedCaja] = useState('');
  const [estadoCarga, setEstadoCarga] = useState('');
  const [destinoOrigen, setDestinoOrigen] = useState('');
  
  const [fotoSubida, setFotoSubida] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (fullscreenRef.current?.requestFullscreen) {
        await fullscreenRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const today = '2026-06-12';
  const [filtroFecha, setFiltroFecha] = useState(today);
  const [tipo, setTipo] = useState('entrada');

  const bitacora = useMemo(() =>
    movData.filter(m => m.fecha === filtroFecha).sort((a, b) => (b.hora || '').localeCompare(a.hora || '')),
    [movData, filtroFecha]
  );

  const entradas = bitacora.filter(b => b.tipoMov === 'ENTRADA').length;
  const salidas = bitacora.filter(b => b.tipoMov === 'SALIDA').length;

  const unidadesFiltradas = useMemo(() => unidadesData, [unidadesData, tipo]);
  const cajasFiltradas = useMemo(() => cajasData, [cajasData, tipo]);
  const localidadesList = useMemo(() => localidadesData.map(l => l.nombre), [localidadesData]);
  const operadoresList = useMemo(() => operadoresData.filter(o => o.activo).map(o => o.nombreCompleto), [operadoresData]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(bitacora);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accesos');
    XLSX.writeFile(wb, `CIF_Accesos_${filtroFecha}.xlsx`);
  };

  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatLocalTime = (date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleFotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFotoSubida(true);
    }
  };

  const handleConfirmar = (e) => {
    e.preventDefault();

    if (!selectedOperador) {
      alert('Por favor selecciona un operador.');
      return;
    }
    if (!selectedTractor) {
      alert('Por favor selecciona un tractor.');
      return;
    }
    if (!estadoCarga) {
      alert('Por favor selecciona el estado de carga.');
      return;
    }
    if (!destinoOrigen) {
      alert('Por favor selecciona el destino u origen.');
      return;
    }

    const operadorObj = operadoresData.find(o => o.nombreCompleto === selectedOperador);
    const tractorObj = unidadesData.find(u => u.numeroEconomico === selectedTractor);
    const cajaObj = cajasData.find(c => c.numeroCaja === selectedCaja);

    const tipoMovimientoNombre = tipo.toUpperCase();
    const tipoMovObj = tiposMovimiento.find(tm => tm.nombre?.toUpperCase() === tipoMovimientoNombre);
    const defaultCliente = clientes.length > 0 ? clientes[0] : null;

    const newMov = {
      fecha: filtroFecha || formatLocalDate(currentTime),
      hora: formatLocalTime(currentTime),
      usuario: 'MIRIAM',
      cliente: defaultCliente ? defaultCliente.razonSocial : 'DANHIL',
      clienteId: defaultCliente ? defaultCliente.id : 1,
      tipoMov: tipoMovimientoNombre,
      tipoMovId: tipoMovObj ? tipoMovObj.id : tipoMovimientoNombre,
      origen: tipoMovimientoNombre === 'ENTRADA' ? destinoOrigen : 'Caseta Principal',
      destino: tipoMovimientoNombre === 'SALIDA' ? destinoOrigen : 'Caseta Principal',
      operador: selectedOperador,
      operadorId: operadorObj ? operadorObj.id : selectedOperador,
      tractor: selectedTractor,
      tractorId: tractorObj ? tractorObj.id : selectedTractor,
      caja: selectedCaja,
      cajaId: cajaObj ? cajaObj.id : selectedCaja,
      
      estatus: 'Completo',
      salioOrigen: formatLocalTime(currentTime),
      valeFisico: String(Math.floor(10000 + Math.random() * 90000)),
      foto: fotoSubida ? 'captura_caseta.png' : ''
    };

    try {
      crud.insert('movimientos', newMov);
      alert(`¡${tipo.toUpperCase()} registrada y guardada exitosamente!`);
      
      // Limpiar el formulario
      setSelectedOperador('');
      setSelectedTractor('');
      setSelectedCaja('');
      setEstadoCarga('');
      setDestinoOrigen('');
      
      setFotoSubida(false);
    } catch (err) {
      console.error(err);
      alert('Error al registrar el acceso: ' + err.message);
    }
  };

  return (
    <div ref={fullscreenRef} className={`flex flex-col h-full bg-surface text-on-surface animate-in ${isFullscreen ? 'p-6 overflow-y-auto' : 'space-y-6'}`}>
      
      {/* Header Nativo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-1 block">Módulo de Caseta</span>
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <DoorOpen size={36} weight="light" className="text-primary" />
            Control de Accesos
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-surface-container-high border border-outline-variant/30 px-5 py-3 rounded-lg shadow-md">
            <Clock size={24} className="text-primary" />
            <div className="flex flex-col">
              <span className="font-mono text-xl font-bold text-on-surface leading-none">
                {currentTime.toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <span className="font-label text-[10px] uppercase tracking-widest text-outline">Hora Actual</span>
            </div>
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-surface border border-outline-variant/30 hover:border-primary px-4 py-3 rounded-lg text-xs font-label font-bold uppercase tracking-widest text-outline hover:text-primary transition-all h-full shadow-md"
          >
            {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
            {isFullscreen ? 'Salir' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="xl:col-span-7 bg-surface-container-low border border-outline-variant/20 rounded-xl flex flex-col shadow-lg">
          <div className={`p-4 text-center font-headline font-bold text-lg uppercase tracking-widest transition-colors rounded-t-xl ${tipo === 'entrada' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
            Registro Rápido de {tipo}
          </div>
          
          <form onSubmit={handleConfirmar} className="p-6 md:p-8 space-y-8 flex-1 flex flex-col overflow-y-auto">
            {/* Toggle Gigante */}
            <div className="flex bg-surface-container-highest p-1.5 rounded-xl">
              {['entrada', 'salida'].map(t => (
                <button 
                  type="button"
                  key={t} 
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-4 text-base font-bold uppercase tracking-[0.2em] rounded-lg transition-all
                    ${tipo === t 
                      ? (t === 'entrada' ? 'bg-success text-on-success shadow-md' : 'bg-danger text-on-danger shadow-md') 
                      : 'text-on-surface hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block font-label text-[11px] uppercase tracking-widest text-outline font-bold mb-3 pl-1">Operador *</label>
                  <SearchableSelect 
                    options={operadoresList}
                    value={selectedOperador}
                    onChange={setSelectedOperador}
                    placeholder="Escribe o selecciona..."
                    className="w-full bg-surface-container-high border-2 border-outline-variant/30 text-on-surface text-base md:text-lg p-4 rounded-xl outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-label text-[11px] uppercase tracking-widest text-outline font-bold mb-3 pl-1">Tracto *</label>
                  <SearchableSelect 
                    options={unidadesFiltradas.map(u => u.numeroEconomico)}
                    value={selectedTractor}
                    onChange={setSelectedTractor}
                    placeholder="Buscar tracto..."
                    className="w-full bg-surface-container-high border-2 border-outline-variant/30 text-primary font-mono text-base md:text-lg font-bold p-4 rounded-xl outline-none focus:border-primary transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block font-label text-[11px] uppercase tracking-widest text-outline font-bold mb-3 pl-1">Caja</label>
                  <SearchableSelect 
                    options={cajasFiltradas.map(c => c.numeroCaja)}
                    value={selectedCaja}
                    onChange={setSelectedCaja}
                    placeholder="Buscar caja..."
                    className="w-full bg-surface-container-high border-2 border-outline-variant/30 text-on-surface text-base md:text-lg font-mono p-4 rounded-xl outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-label text-[11px] uppercase tracking-widest text-outline font-bold mb-3 pl-1">Estado de Carga *</label>
                  <select 
                    value={estadoCarga}
                    onChange={e => setEstadoCarga(e.target.value)}
                    className="w-full bg-surface-container-high border-2 border-outline-variant/30 text-on-surface text-base md:text-lg p-4 rounded-xl outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="">-- Estado --</option>
                    <option value="Vacío">Vacío</option>
                    <option value="Cargado">Cargado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label text-[11px] uppercase tracking-widest text-outline font-bold mb-3 pl-1">Destino / Origen *</label>
                  <SearchableSelect 
                    options={localidadesList}
                    value={destinoOrigen}
                    onChange={setDestinoOrigen}
                    placeholder="Escribe ubicación..."
                    className="w-full bg-surface-container-high border-2 border-outline-variant/30 text-on-surface text-base md:text-lg p-4 rounded-xl outline-none focus:border-primary transition-colors"
                  />
                </div>
                
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Foto y Boton */}
            <div className="flex flex-col gap-4 pt-6 border-t border-outline-variant/20 mt-6">
              <label className={`flex items-center justify-center gap-4 cursor-pointer border-2 border-dashed rounded-xl p-5 transition-colors shadow-inner
                ${fotoSubida 
                  ? 'border-success/60 bg-success/10 text-success' 
                  : 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'}`}
              >
                <Camera size={32} className={fotoSubida ? 'text-success' : 'text-primary'} />
                <span className="font-label text-sm uppercase tracking-widest font-bold">
                  {fotoSubida ? '¡Fotografía Capturada!' : 'Tomar Fotografía'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
              </label>

              <button 
                type="submit"
                className={`w-full font-headline text-xl font-bold uppercase tracking-widest py-6 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg ${tipo === 'entrada' ? 'bg-success text-on-success' : 'bg-danger text-on-danger'}`}
              >
                <CheckCircle size={28} weight="bold" /> 
                Confirmar {tipo}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: BITACORA */}
        <div className="xl:col-span-5 flex flex-col gap-6">
        {/* COLUMNA DERECHA: BITACORA EN VIVO */}
        <div className="xl:col-span-5 flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl shadow-lg">
              <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Entradas Hoy</span>
              <div className="font-headline text-4xl font-bold text-success mt-1">{stats.entradas}</div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl shadow-lg">
              <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Salidas Hoy</span>
              <div className="font-headline text-4xl font-bold text-danger mt-1">{stats.salidas}</div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl flex-1 flex flex-col overflow-hidden shadow-lg">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container">
              <h2 className="font-headline font-bold text-lg text-on-surface">Bitácora en Vivo</h2>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={filtroFecha} 
                  onChange={e => setFiltroFecha(e.target.value)}
                  className="bg-surface text-on-surface border border-outline-variant/30 rounded px-2 py-1 text-sm outline-none"
                />
                <button onClick={exportExcel} className="bg-surface border border-outline-variant/30 p-1.5 rounded hover:border-primary transition-colors text-primary" title="Exportar a Excel">
                  <MicrosoftExcelLogo size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
              {bitacora.length === 0 ? (
                <div className="h-full flex items-center justify-center text-outline font-label uppercase tracking-widest text-xs">Sin registros</div>
              ) : bitacora.map(b => (
                <div 
                  key={b.id} 
                  className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-lg flex flex-col gap-3 shadow-sm hover:brightness-110 transition-all cursor-default border-l-4"
                  style={{ borderLeftColor: b.tipoMov === 'ENTRADA' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${b.tipoMov === 'ENTRADA' ? 'bg-success text-on-success' : 'bg-danger text-on-danger'}`}>
                        {b.tipoMov}
                      </span>
                      <span className="font-mono text-sm text-outline">{b.hora}</span>
                    </div>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm border border-primary/20">{b.tractor}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-label text-[13px] uppercase tracking-wider text-on-surface font-bold truncate">{b.operador}</span>
                    <span className="text-xs text-outline flex gap-2 mt-1">
                      <span>Caja: <strong className="text-on-surface">{b.caja || 'N/A'}</strong></span>
                    </span>
                  </div>
                  <div className="text-xs font-bold text-outline-variant bg-surface-container-highest/30 px-3 py-2 rounded-md truncate mt-1 flex items-center gap-2">
                    {b.destino}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

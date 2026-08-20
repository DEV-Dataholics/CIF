import { useState, useMemo, useEffect } from 'react';
import { 
  ChartLineUp, CurrencyDollar, CalendarBlank, MapPin, CaretDown, CaretUp,
  Truck, ArrowsLeftRight, Trash, FileText, Money
} from '@phosphor-icons/react';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { movimientos, clientes, precios, resetDemo } = useData();
  
  // -- ESTADO FILTROS --
  const [fechaInicio, setFechaInicio] = useState('2026-06-01');
  const [fechaFin, setFechaFin] = useState('2026-06-30');
  
  const clientesList = useMemo(() => [...new Set(clientes.filter(c => c.activo).map(c => c.razonSocial))], [clientes]);
  const [clienteSel, setClienteSel] = useState('DANHIL');
  
  const [tipoCambio, setTipoCambio] = useState(17.2023);
  const [isOperacionesOpen, setIsOperacionesOpen] = useState(false);

  useEffect(() => {
    if (clientesList.length > 0 && !clientesList.includes(clienteSel) && clienteSel !== 'TODOS') {
      setClienteSel(clientesList[0]);
    }
  }, [clientesList, clienteSel]);

  // -- DATOS FILTRADOS PREFACTURACION --
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      const matchCliente = clienteSel === 'TODOS' || m.cliente === clienteSel;
      const matchInicio = !fechaInicio || m.fecha >= fechaInicio;
      const matchFin = !fechaFin || m.fecha <= fechaFin;
      return matchCliente && matchInicio && matchFin;
    });
  }, [movimientos, clienteSel, fechaInicio, fechaFin]);

  const resumenPrefacturacion = useMemo(() => {
    const grupos = {};
    movimientosFiltrados.forEach(m => {
      const t = m.tipoMovimiento || m.tipoMov;
      if (!t) return;
      if (!grupos[t]) grupos[t] = { tipo: t, cantidad: 0, usd: 0, mxn: 0, pu_usd: 0, pu_mxn: 0 };
      grupos[t].cantidad++;
    });

    Object.keys(grupos).forEach(t => {
      let puUSD = 0;
      if (clienteSel !== 'TODOS') {
        const tarifa = precios.find(p => p.cliente === clienteSel && p.tipoMovimiento === t);
        puUSD = tarifa?.dolares || 0;
      }
      
      grupos[t].pu_usd = puUSD;
      grupos[t].pu_mxn = puUSD * tipoCambio;
      grupos[t].usd = grupos[t].cantidad * puUSD;
      grupos[t].mxn = grupos[t].usd * tipoCambio;
    });

    return Object.values(grupos).sort((a,b) => b.cantidad - a.cantidad);
  }, [movimientosFiltrados, clienteSel, precios, tipoCambio]);

  const totales = useMemo(() => {
    return resumenPrefacturacion.reduce((acc, curr) => ({
      cantidad: acc.cantidad + curr.cantidad,
      usd: acc.usd + curr.usd,
      mxn: acc.mxn + curr.mxn
    }), { cantidad: 0, usd: 0, mxn: 0 });
  }, [resumenPrefacturacion]);

  const promedioUSD = totales.cantidad > 0 ? totales.usd / totales.cantidad : 0;

  // -- DATOS OPERATIVOS (ANÁLISIS) --
  const topOperadores = useMemo(() => {
    const ops = {};
    movimientosFiltrados.forEach(m => {
      if (!m.operador) return;
      ops[m.operador] = (ops[m.operador] || 0) + 1;
    });
    return Object.entries(ops)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [movimientosFiltrados]);

  const topRutas = useMemo(() => {
    const rutas = {};
    movimientosFiltrados.forEach(m => {
      if (!m.origen || !m.destino) return;
      const key = `${m.origen} ➔ ${m.destino}`;
      rutas[key] = (rutas[key] || 0) + 1;
    });
    return Object.entries(rutas).sort((a,b)=>b[1]-a[1]).slice(0, 4).map(([name, count]) => ({ name, count }));
  }, [movimientosFiltrados]);

  const topTractores = useMemo(() => {
    const tr = {};
    movimientosFiltrados.forEach(m => {
      if (!m.tractor) return;
      tr[m.tractor] = (tr[m.tractor] || 0) + 1;
    });
    return Object.entries(tr).sort((a,b)=>b[1]-a[1]).slice(0, 4).map(([name, count]) => ({ name, count }));
  }, [movimientosFiltrados]);

  const horasPico = useMemo(() => {
    const horas = Array.from({ length: 24 }, (_, i) => ({ hora: i, total: 0 }));
    movimientosFiltrados.forEach(m => {
      if (!m.hora) return;
      const h = parseInt(m.hora.split(':')[0]);
      if (!isNaN(h) && h >= 0 && h < 24) horas[h].total++;
    });
    return horas;
  }, [movimientosFiltrados]);
  const maxHora = Math.max(1, ...horasPico.map(h => h.total));

  const ultimos = [...movimientosFiltrados].sort((a, b) => {
    const da = new Date(`${a.fecha}T${a.hora || '00:00'}`).getTime();
    const db = new Date(`${b.fecha}T${b.hora || '00:00'}`).getTime();
    return db - da;
  }).slice(0, 5);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatMXN = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-6 animate-in">
      {/* Header & Filters */}
      <div className="bg-surface-container border border-outline-variant/20 p-4 matte-grain flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-1 block">Panel Ejecutivo</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <Money size={32} weight="light" className="text-primary" />
            Dashboard Principal
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end bg-surface-container-low p-3 rounded border border-outline-variant/10">
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
              <CalendarBlank size={12} /> Desde
            </label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-surface border border-outline-variant/50 text-on-surface px-4 py-2.5 rounded focus:border-primary focus:outline-none transition-colors text-sm w-[150px] shadow-sm font-mono" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
              <CalendarBlank size={12} /> Hasta
            </label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-surface border border-outline-variant/50 text-on-surface px-4 py-2.5 rounded focus:border-primary focus:outline-none transition-colors text-sm w-[150px] shadow-sm font-mono" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
              <MapPin size={12} /> Cliente
            </label>
            <select value={clienteSel} onChange={e => setClienteSel(e.target.value)} className="bg-surface border border-outline-variant/50 text-on-surface px-4 py-2.5 rounded focus:border-primary focus:outline-none transition-colors text-sm font-bold shadow-sm">
              <option value="TODOS">-- TODOS --</option>
              {clientesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-[130px]">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
              TC (MXN)
            </label>
            <input type="number" step="0.0001" value={tipoCambio} onChange={e => setTipoCambio(parseFloat(e.target.value)||0)} className="bg-surface border border-outline-variant/50 text-primary font-bold px-4 py-2.5 rounded focus:border-primary focus:outline-none transition-colors text-sm font-mono shadow-sm" />
          </div>
          <button 
            onClick={resetDemo}
            className="flex items-center gap-2 bg-surface-container-highest border border-danger/40 text-danger hover:bg-danger/10 px-3 py-1.5 text-[10px] font-label font-bold uppercase tracking-widest transition-colors shadow-sm ml-auto h-[38px]"
            title="Eliminar todos los movimientos para iniciar el demo en 0"
          >
            <Trash size={16} /> Reset
          </button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Total Movimientos</span>
            <ArrowsLeftRight size={20} className="text-primary" />
          </div>
          <div className="text-3xl font-headline font-bold text-on-surface">{totales.cantidad}</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/20 p-5 shadow-sm border-l-4 border-l-success">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Facturación USD</span>
            <CurrencyDollar size={20} className="text-success" />
          </div>
          <div className="text-3xl font-headline font-bold text-success">{formatCurrency(totales.usd)}</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/20 p-5 shadow-sm border-l-4 border-l-info">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Facturación MXN</span>
            <span className="text-info font-bold text-xs">MX$</span>
          </div>
          <div className="text-3xl font-headline font-bold text-info">{formatMXN(totales.mxn)}</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Promedio USD/Mov</span>
            <ChartLineUp size={20} className="text-warning" />
          </div>
          <div className="text-3xl font-headline font-bold text-warning">{formatCurrency(promedioUSD)}</div>
        </div>
      </div>

      {/* Tabla Detalle Pre-Facturación */}
      <div className="bg-surface-container-low border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Resumen por Tipo de Movimiento
          </h3>
          <span className="badge badge-primary">{clienteSel}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-highest/30">
              <tr>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline">Tipo Movimiento</th>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline text-center">Cantidad</th>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline text-right">P.U. (USD)</th>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline text-right">Total (USD)</th>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline text-right">P.U. (MXN)</th>
                <th className="px-5 py-3 font-label uppercase tracking-widest text-[10px] text-outline text-right">Total (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {resumenPrefacturacion.length > 0 ? resumenPrefacturacion.map(r => (
                <tr key={r.tipo} className="hover:bg-surface-container-high/30 transition-colors">
                  <td className="px-5 py-3 font-bold text-primary">{r.tipo}</td>
                  <td className="px-5 py-3 font-mono text-center">{r.cantidad}</td>
                  <td className="px-5 py-3 font-mono text-right text-outline">{formatCurrency(r.pu_usd)}</td>
                  <td className="px-5 py-3 font-mono text-right text-success font-bold">{formatCurrency(r.usd)}</td>
                  <td className="px-5 py-3 font-mono text-right text-outline">{formatMXN(r.pu_mxn)}</td>
                  <td className="px-5 py-3 font-mono text-right text-info font-bold">{formatMXN(r.mxn)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-outline italic">No hay movimientos facturables en este periodo.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-surface-container-highest/50 border-t-2 border-outline-variant/30">
              <tr>
                <td className="px-5 py-3 font-label uppercase tracking-widest font-bold text-on-surface">TOTALES</td>
                <td className="px-5 py-3 font-mono text-center font-bold">{totales.cantidad}</td>
                <td className="px-5 py-3"></td>
                <td className="px-5 py-3 font-mono text-right text-success font-bold text-base">{formatCurrency(totales.usd)}</td>
                <td className="px-5 py-3"></td>
                <td className="px-5 py-3 font-mono text-right text-info font-bold text-base">{formatMXN(totales.mxn)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Toggle Flujo Operativo */}
      <div className="pt-4 border-t border-outline-variant/20">
        <button 
          onClick={() => setIsOperacionesOpen(!isOperacionesOpen)}
          className="w-full flex items-center justify-between bg-surface-container border border-outline-variant/20 px-5 py-4 hover:bg-surface-container-high transition-colors"
        >
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-outline" />
            <h3 className="font-label uppercase tracking-widest font-bold text-on-surface text-sm">Desglose Operativo en Planta</h3>
            <span className="badge badge-outline">{movimientosFiltrados.length} Registros</span>
          </div>
          {isOperacionesOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
        </button>

        {isOperacionesOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            
            {/* IZQUIERDA: Afluencia + Rutas + Tractores */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Horas Pico Mejorado */}
              <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-base flex items-center gap-2">
                      <ChartLineUp size={18} className="text-primary" /> Análisis de Afluencia
                    </h3>
                    <p className="font-label text-[9px] uppercase tracking-widest text-outline mt-1">Volumen de actividad por hora (24h)</p>
                  </div>
                  <span className="badge badge-outline">{totales.cantidad} Movimientos</span>
                </div>
                
                <div className="relative flex-1 min-h-[250px] w-full pt-8 pb-8 pl-10 pr-4 mt-2 bg-surface-container-lowest/50 rounded border border-outline-variant/10">
                  {/* Grid Lines Y-axis */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-8 pl-10 pr-4">
                    {[1, 0.75, 0.5, 0.25, 0].map(pct => {
                      const val = Math.round(maxHora * pct);
                      return (
                        <div key={pct} className="w-full border-t border-outline-variant/10 flex items-center h-0 relative">
                          <span className="absolute -left-8 text-[10px] font-mono text-outline/50 -mt-2 w-6 text-right">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Barras (Contenedor Flex alineado al fondo) */}
                  <div className="absolute inset-0 pb-8 pt-8 pl-10 pr-4 flex items-end gap-1.5 md:gap-2">
                    {horasPico.map(h => {
                      const heightPct = h.total > 0 ? Math.max((h.total / maxHora) * 100, 2) : 0;
                      return (
                      <div key={h.hora} className="flex flex-col items-center flex-1 group cursor-default relative z-10 h-full justify-end">
                        <div className="w-full relative flex flex-col items-center justify-end h-full">
                          {/* Tooltip Hover */}
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[11px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 translate-y-2 group-hover:translate-y-0 shadow-lg">
                            {h.total} movs
                          </div>
                          {/* Barra */}
                          <div
                            className="w-full rounded-t-sm transition-all duration-300 ease-out group-hover:opacity-80 group-hover:brightness-110 border border-black/10"
                            style={{
                              height: `${heightPct}%`,
                              background: h.total === 0 ? 'transparent' : h.total >= maxHora * 0.7 ? '#ffb4ab' : h.total >= maxHora * 0.4 ? '#D1A14E' : '#c3cc8c',
                            }}
                          />
                        </div>
                        <div className="font-mono text-[9px] text-outline mt-3 absolute -bottom-6">
                          {String(h.hora).padStart(2, '0')}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </div>

              {/* Rutas y Tractores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-5">
                  <h3 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-info" /> Top Rutas (Origen ➔ Destino)
                  </h3>
                  <div className="space-y-4">
                    {topRutas.map((r) => (
                      <div key={r.name} className="relative group cursor-default">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-on-surface text-[11px]">{r.name}</span>
                          <span className="font-mono text-info font-bold">{r.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-info/80 group-hover:bg-info transition-colors" style={{ width: `${(r.count / Math.max(1, topRutas[0]?.count)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {topRutas.length === 0 && <span className="text-xs text-outline italic">Sin datos</span>}
                  </div>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-5">
                  <h3 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Top Tractores Utilizados
                  </h3>
                  <div className="space-y-4">
                    {topTractores.map((t) => (
                      <div key={t.name} className="relative group cursor-default">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold font-mono text-on-surface text-[11px]">{t.name}</span>
                          <span className="font-mono text-warning font-bold">{t.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-warning/80 group-hover:bg-warning transition-colors" style={{ width: `${(t.count / Math.max(1, topTractores[0]?.count)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {topTractores.length === 0 && <span className="text-xs text-outline italic">Sin datos</span>}
                  </div>
                </div>
              </div>

            </div>

            {/* DERECHA: Operadores + Ultimos */}
            <div className="flex flex-col gap-6">
              
              {/* Top Operadores */}
              <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-6">
                <h3 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Top Operadores (Viajes)
                </h3>
                <div className="space-y-5">
                  {topOperadores.map((o, idx) => (
                    <div key={o.name} className="relative group cursor-default">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-outline">0{idx + 1}</span>
                          <span className="font-label text-[11px] uppercase text-on-surface truncate max-w-[150px]" title={o.name}>{o.name}</span>
                        </div>
                        <span className="font-headline text-sm font-bold text-primary">{o.count}</span>
                      </div>
                      <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 group-hover:bg-primary transition-colors" style={{ width: `${(o.count / Math.max(1, topOperadores[0]?.count)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {topOperadores.length === 0 && <div className="text-xs text-outline italic">Sin datos</div>}
                </div>
              </div>

              {/* Ultimos Registros */}
              <div className="bg-surface-container-low border border-outline-variant/20 matte-grain overflow-hidden flex-1 flex flex-col">
                <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-lowest">
                  <h3 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Últimos Registros</h3>
                </div>
                <div className="divide-y divide-outline-variant/10 flex-1 overflow-y-auto">
                  {ultimos.map((m, idx) => (
                    <div key={`${m.id || idx}`} className="px-5 py-3 flex flex-col gap-1.5 hover:bg-surface-container-high/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-label text-[9px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{m.tipoMovimiento || m.tipoMov}</span>
                        <span className="font-mono text-[9px] text-outline">{m.fecha.slice(5)} {m.hora}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-outline">
                        <span className="truncate max-w-[140px] text-[11px] text-on-surface">{m.operador}</span>
                        <span className="font-mono font-bold text-[10px]">{m.tractor}</span>
                      </div>
                    </div>
                  ))}
                  {ultimos.length === 0 && (
                    <div className="px-5 py-6 text-center text-outline text-xs italic">Sin registros</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}

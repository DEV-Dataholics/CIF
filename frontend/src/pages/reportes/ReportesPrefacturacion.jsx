import { useState, useMemo } from 'react';
import { FileText, Funnel, MicrosoftExcelLogo, Printer, CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import DataTable from '../../components/DataTable';
import ColumnEditor from '../../components/ColumnEditor';
import { useData } from '../../context/DataContext';
import * as XLSX from 'xlsx';

const ALL_COLUMNS = [
  { key: 'origen', label: 'Origen' },
  { key: 'destino', label: 'Destino' },
  { key: 'tipoMov', label: 'Movimiento', render: v => <span className="font-bold text-primary">{v}</span> },
  { key: 'caja', label: 'Caja', render: v => <span className="font-mono">{v}</span> },
  { key: 'tractor', label: 'Tractor', render: v => <span className="font-mono">{v}</span> },
  { key: 'operador', label: 'Operador' },
  { key: 'cliente', label: 'Cliente', render: v => <span className="uppercase font-bold">{v}</span> },
  { key: 'fecha', label: 'Fecha' },
  { key: 'valeFisico', label: 'Folio', render: (v, item) => <span className="font-mono font-bold">{v || item.id}</span> },
  { key: 'hora', label: 'Hora', render: v => <span className="font-mono text-primary font-bold">{v}</span> },
  { key: 'usuario', label: 'Usuario' },
  { key: 'costo', label: 'Monto Movimiento (USD)', render: v => <span className="text-success font-mono font-bold">{formatUSD(v)}</span> },
];

const DEFAULT_VISIBLE = ['origen','destino','caja','tractor','operador','cliente','fecha','valeFisico','hora','costo'];
const STORAGE_KEY = 'cif_columns_prefact_v4';

function formatUSD(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
}
function formatMXN(val) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
}

// ── Badge colors per movement type (Con distintivos visuales para pantalla e impresión TR-004) ──
const TIPO_COLORS = {
  'INTERPLANTA': 'bg-blue-500/15 text-blue-600 border-blue-500/40 print:bg-blue-100 print:text-blue-800 print:border-blue-500 font-bold',
  'L/C JRZ': 'bg-purple-500/15 text-purple-600 border-purple-500/40 print:bg-purple-100 print:text-purple-800 print:border-purple-500 font-bold',
  'RAMPA': 'bg-amber-500/15 text-amber-700 border-amber-500/40 print:bg-amber-100 print:text-amber-800 print:border-amber-500 font-bold',
  'RECOLECCION': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-500 font-bold',
  'REPARTO': 'bg-rose-500/15 text-rose-600 border-rose-500/40 print:bg-rose-100 print:text-rose-800 print:border-rose-500 font-bold',
  'ENTRADA': 'bg-teal-500/15 text-teal-600 border-teal-500/40 print:bg-teal-100 print:text-teal-800 print:border-teal-500 font-bold',
  'SALIDA': 'bg-orange-500/15 text-orange-600 border-orange-500/40 print:bg-orange-100 print:text-orange-800 print:border-orange-500 font-bold',
};

export default function ReportesPrefacturacion() {
  const { movimientos, clientes, precios } = useData();
  
  // ── Filters ────────────────────────────────────────────────
  const [fi, setFi] = useState('2026-06-01');
  const [ff, setFf] = useState('2026-06-30');
  const [cli, setCli] = useState('DANHIL');
  const [filtroOperador, setFiltroOperador] = useState('');
  const [filtroTipoMov, setFiltroTipoMov] = useState('');
  const [tipoCambio, setTipoCambio] = useState(17.20);
  const [busqueda, setBusqueda] = useState('');

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    fi: '2026-06-01', ff: '2026-06-30', cli: 'DANHIL', filtroOperador: '', filtroTipoMov: '', busqueda: ''
  });

  // ── Column visibility ─────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE;
  });

  // ── Collapsible groups ────────────────────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (tipo) => {
    setCollapsedGroups(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  // ── Derived lists ─────────────────────────────────────────
  const clientesList = useMemo(() =>
    [...new Set(clientes.filter(c => c.activo).map(c => c.razonSocial))], [clientes]);

  // ── Filter pipeline ───────────────────────────────────────
  const filteredMovimientos = useMemo(() => {
    const { fi: aFi, ff: aFf, cli: aCli, filtroOperador: aOp, filtroTipoMov: aTm, busqueda: aQ } = filtrosAplicados;
    return movimientos.filter(r => {
      if (aFi && r.fecha < aFi) return false;
      if (aFf && r.fecha > aFf) return false;
      if (aCli && r.cliente !== aCli) return false;
      if (aOp && r.operador !== aOp) return false;
      if (aTm && r.tipoMov !== aTm) return false;
      if (aQ) {
        const q = aQ.toUpperCase();
        const searchable = `${r.origen} ${r.destino} ${r.operador} ${r.caja} ${r.tractor} ${r.valeFisico} ${r.sello}`.toUpperCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [movimientos, filtrosAplicados]);

  // ── Dynamic filter options ────────────────────────────────
  const operadoresList = useMemo(() => {
    const { fi: aFi, ff: aFf, cli: aCli } = filtrosAplicados;
    const baseFiltered = movimientos.filter(r => {
      if (aFi && r.fecha < aFi) return false;
      if (aFf && r.fecha > aFf) return false;
      if (aCli && r.cliente !== aCli) return false;
      return true;
    });
    return [...new Set(baseFiltered.map(m => m.operador).filter(Boolean))].sort();
  }, [movimientos, filtrosAplicados.fi, filtrosAplicados.ff, filtrosAplicados.cli]);

  const tiposMovList = useMemo(() => {
    const { fi: aFi, ff: aFf, cli: aCli } = filtrosAplicados;
    const baseFiltered = movimientos.filter(r => {
      if (aFi && r.fecha < aFi) return false;
      if (aFf && r.fecha > aFf) return false;
      if (aCli && r.cliente !== aCli) return false;
      return true;
    });
    return [...new Set(baseFiltered.map(m => m.tipoMov).filter(Boolean))].sort();
  }, [movimientos, filtrosAplicados.fi, filtrosAplicados.ff, filtrosAplicados.cli]);

  // ── Price-enriched movements ──────────────────────────────
  const movimientosConPrecio = useMemo(() => {
    return filteredMovimientos.map(m => {
      const tarifa = precios.find(p => {
        const pCliente = (p.cliente || '').trim().toLowerCase();
        const mCliente = (m.cliente || '').trim().toLowerCase();
        
        const pTipo = (p.tipoMovimiento || '').trim().toLowerCase().replace(/ /g, '_');
        const mTipo = (m.tipoMov || '').trim().toLowerCase().replace(/ /g, '_');
        
        return pCliente === mCliente && pTipo === mTipo;
      });
      
      let costo = 0;
      if (tarifa) {
        // tarifa.precio = DB column name; tarifa.dolares = legacy static JSON fallback
        const valorTarifa = tarifa.precio ?? tarifa.dolares ?? tarifa.pesos;
        if (valorTarifa !== null && valorTarifa !== undefined) {
          costo = Number(valorTarifa);
        }
      }
      return { ...m, costo };
    });
  }, [filteredMovimientos, precios, tipoCambio]);

  // ── Group by Tipo de Movimiento ───────────────────────────
  const grupos = useMemo(() => {
    const map = {};
    movimientosConPrecio.forEach(m => {
      if (!map[m.tipoMov]) map[m.tipoMov] = [];
      map[m.tipoMov].push(m);
    });
    return map;
  }, [movimientosConPrecio]);

  const tiposOrdenados = useMemo(() => Object.keys(grupos).sort(), [grupos]);

  // ── Summary totals ────────────────────────────────────────
  const resumen = useMemo(() => {
    const resumenFilas = tiposOrdenados.map(tipo => {
      const viajes = grupos[tipo];
      const cantidad = viajes.length;
      const unitario = viajes.length > 0 ? viajes[0].costo : 0;
      const totalUSD = cantidad * unitario;
      return { tipoMovimiento: tipo, cantidad, precioUnitario: unitario, totalUSD };
    });
    const granTotalViajes = resumenFilas.reduce((acc, r) => acc + r.cantidad, 0);
    const granTotalUSD = resumenFilas.reduce((acc, r) => acc + r.totalUSD, 0);
    const granTotalMXN = granTotalUSD * tipoCambio;
    return { filas: resumenFilas, granTotalViajes, granTotalUSD, granTotalMXN };
  }, [grupos, tiposOrdenados, tipoCambio]);

  // ── Excel Export con orden estricto de columnas (TR-004) ────
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    const columnsToExport = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));
    const excelHeaders = columnsToExport.map(c => c.label);

    wsData.push(['CIF - REPORTE DE PRE-FACTURACIÓN Y MOVIMIENTOS']);
    wsData.push([`Cliente: ${filtrosAplicados.cli || 'TODOS'}`]);
    wsData.push([`Periodo: ${filtrosAplicados.fi} al ${filtrosAplicados.ff}`]);
    if (filtrosAplicados.filtroOperador) wsData.push([`Operador: ${filtrosAplicados.filtroOperador}`]);
    if (filtrosAplicados.filtroTipoMov) wsData.push([`Tipo Movimiento: ${filtrosAplicados.filtroTipoMov}`]);
    wsData.push([`MONTO TOTAL ACUMULADO: ${formatUSD(resumen.granTotalUSD)} USD (${formatMXN(resumen.granTotalMXN)} MXN)`]);
    wsData.push([]);

    tiposOrdenados.forEach(tipo => {
      wsData.push([`${tipo}`]);
      wsData.push(excelHeaders);

      grupos[tipo].forEach(m => {
        const rowData = columnsToExport.map(col => {
          if (col.key === 'valeFisico') return m.valeFisico || m.id || '';
          return m[col.key] !== undefined && m[col.key] !== null ? m[col.key] : '';
        });
        wsData.push(rowData);
      });

      // Subtotal row per group
      const subtotal = grupos[tipo].reduce((acc, m) => acc + (m.costo || 0), 0);
      const costoIdx = columnsToExport.findIndex(c => c.key === 'costo');
      const subtotalRow = new Array(columnsToExport.length).fill('');
      subtotalRow[0] = `Subtotal ${tipo}`;
      if (costoIdx !== -1) {
        subtotalRow[costoIdx] = subtotal;
      }
      wsData.push(subtotalRow);
      wsData.push([]);
    });

    // Final Summary
    wsData.push([]);
    wsData.push(['RESUMEN DE TOTALES']);
    wsData.push(['Tipo Movimiento', 'Cantidad Viajes', 'Precio Unitario (USD)', 'Precio Total (USD)', 'Precio Total (MXN)']);
    resumen.filas.forEach(r => {
      wsData.push([r.tipoMovimiento, r.cantidad, r.precioUnitario, r.totalUSD, r.totalUSD * tipoCambio]);
    });
    wsData.push(['TOTALES GENERALES', resumen.granTotalViajes, '', resumen.granTotalUSD, resumen.granTotalMXN]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Dynamic widths based on column count
    ws['!cols'] = columnsToExport.map(c => ({ wch: c.label.length + 5 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Pre-Facturación');
    XLSX.writeFile(wb, `CIF_Reporte_PreFacturacion_${cli || 'TODOS'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleColChange = (next) => {
    setVisibleColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearFilters = () => {
    setFiltroOperador('');
    setFiltroTipoMov('');
    setBusqueda('');
  };

  const hasExtraFilters = filtroOperador || filtroTipoMov || busqueda;

  return (
    <div className="space-y-6 animate-in">
      <style>{`
        @media print {
          @page { size: landscape; margin: 6mm; }
          
          /* Reset heights and overflows that break printing */
          html, body, #root, .min-h-screen, main, div, section {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important; 
            color: #0f172a !important; 
          }

          .print\\:hidden { display: none !important; }
          .print-slide { break-after: page; page-break-after: always; }
          
          .print-group-card {
            margin-bottom: 16px !important;
            background: white !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VISTA EN PANTALLA (WEB VIEW)                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="print:hidden space-y-6">
        {/* ── Screen Header ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Pre-Facturación</span>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText size={32} weight="light" className="text-primary" />
              Reporte Operativo
            </h1>
            <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">
              {movimientosConPrecio.length} movimientos procesados · {tiposOrdenados.length} tipos · <strong className="text-primary">{formatUSD(resumen.granTotalUSD)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ColumnEditor
              columns={ALL_COLUMNS}
              visibleColumns={visibleColumns}
              onChange={handleColChange}
              storageKey={STORAGE_KEY}
            />
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-surface border border-outline-variant/30 hover:border-primary text-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 shadow-sm transition-all">
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button onClick={exportarExcel}
              className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 shadow-md transition-all">
              <MicrosoftExcelLogo size={16} weight="bold" /> Exportar Excel
            </button>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="bg-surface-container-low border border-outline-variant/20 p-6">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Funnel size={18} weight="bold" />
            <h3 className="font-label font-bold text-xs uppercase tracking-widest">Filtros y Parámetros</h3>
          </div>

          {/* Row 1: Date + Client + TC */}
          <div className="flex flex-wrap items-end gap-5 mb-4">
            <div className="flex items-center gap-3 bg-surface border border-outline-variant/30 p-1">
              <div className="flex items-center gap-2 px-3 py-1">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">De:</label>
                <input type="date" value={fi} onChange={e => setFi(e.target.value)}
                  className="bg-transparent text-sm font-bold text-primary outline-none" />
              </div>
              <div className="w-[1px] h-6 bg-outline-variant/30" />
              <div className="flex items-center gap-2 px-3 py-1">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Hasta:</label>
                <input type="date" value={ff} onChange={e => setFf(e.target.value)}
                  className="bg-transparent text-sm font-bold text-primary outline-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Cliente:</label>
              <select value={cli} onChange={e => setCli(e.target.value)}
                className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm outline-none focus:border-primary min-w-[180px]">
                <option value="">TODOS</option>
                {clientesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">TC (MXN):</label>
              <input type="number" step="0.01" value={tipoCambio} onChange={e => setTipoCambio(parseFloat(e.target.value) || 0)}
                className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm font-mono outline-none focus:border-primary w-[100px]" />
            </div>
          </div>

          {/* Row 2: Operator + TipoMov + Search */}
          <div className="flex flex-wrap items-end gap-5 pt-3 border-t border-outline-variant/15">
            <div className="flex flex-col gap-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Operador:</label>
              <select value={filtroOperador} onChange={e => setFiltroOperador(e.target.value)}
                className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm outline-none focus:border-primary min-w-[200px]">
                <option value="">TODOS</option>
                {operadoresList.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Tipo Movimiento:</label>
              <select value={filtroTipoMov} onChange={e => setFiltroTipoMov(e.target.value)}
                className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm outline-none focus:border-primary min-w-[160px]">
                <option value="">TODOS</option>
                {tiposMovList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Buscar:</label>
              <div className="flex items-center gap-2 bg-surface border border-outline-variant/40 px-3 py-2">
                <MagnifyingGlass size={14} className="text-outline shrink-0" />
                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setFiltrosAplicados({fi, ff, cli, filtroOperador, filtroTipoMov, busqueda})}
                  placeholder="Origen, destino, caja, folio..."
                  className="bg-transparent text-sm outline-none flex-1 text-on-surface placeholder:text-outline/50" />
              </div>
            </div>

            <div className="flex items-end pb-0.5">
              <button 
                onClick={() => setFiltrosAplicados({fi, ff, cli, filtroOperador, filtroTipoMov, busqueda})}
                className="bg-primary text-on-primary px-5 py-2 text-xs font-bold uppercase tracking-widest hover:brightness-110 flex items-center gap-2 h-[38px] shadow-sm">
                <MagnifyingGlass size={16} weight="bold" />
                Buscar
              </button>
            </div>

            {hasExtraFilters && (
              <button onClick={clearFilters}
                className="font-label text-[10px] uppercase tracking-widest text-danger hover:text-on-surface transition-colors font-bold underline pb-2">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* ── Grouped Tables (Web) ───────────────────────────── */}
        <div className="space-y-4">
          {tiposOrdenados.length === 0 ? (
            <div className="p-12 text-center text-outline font-body bg-surface border border-outline-variant/20">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay información para mostrar con los filtros actuales.</p>
            </div>
          ) : (
            tiposOrdenados.map(tipo => {
              const isCollapsed = collapsedGroups[tipo];
              const count = grupos[tipo].length;
              const subtotal = grupos[tipo].reduce((acc, m) => acc + (m.costo || 0), 0);
              const badgeClass = TIPO_COLORS[tipo] || 'bg-surface-variant/40 text-outline border-outline-variant/30';

              return (
                <div key={tipo} className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(tipo)}
                    className="w-full bg-surface-variant/20 border-b border-outline-variant/30 px-5 py-3.5 flex items-center justify-between hover:bg-surface-variant/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        {isCollapsed
                          ? <CaretRight size={16} className="text-primary" />
                          : <CaretDown size={16} className="text-primary" />
                        }
                      </div>
                      <h3 className="font-display font-bold text-base text-on-surface">{tipo}</h3>
                      <span className={`px-3 py-0.5 text-[9px] font-label font-bold uppercase tracking-widest border rounded-full ${badgeClass}`}>
                        {getTipoDescription(tipo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-success font-bold">{formatUSD(subtotal)}</span>
                      <span className="font-label text-[10px] uppercase tracking-widest text-outline bg-background px-3 py-1 rounded-full border border-outline-variant/20">
                        {count} {count === 1 ? 'viaje' : 'viajes'}
                      </span>
                    </div>
                  </button>

                  <div className={isCollapsed ? 'hidden' : 'block'}>
                    <DataTable
                      columns={ALL_COLUMNS}
                      data={grupos[tipo]}
                      visibleColumns={visibleColumns}
                      pageSize={20}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Summary Table (Web) ────────────────────────────── */}
        {resumen.filas.length > 0 && (
          <div className="bg-surface border border-primary/20 shadow-lg mt-8">
            <div className="bg-primary/5 px-6 py-4 border-b border-primary/20">
              <h3 className="font-headline font-bold text-xl text-primary flex items-center gap-2">
                Resumen de Operación
                <span className="text-sm font-normal text-on-surface-variant font-body ml-2">({cli || 'TODOS'})</span>
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr>
                    <th className="py-3 px-4 font-label uppercase tracking-widest text-[10px] text-outline font-bold border-b border-outline-variant/30">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-right font-label uppercase tracking-widest text-[10px] text-outline font-bold border-b border-outline-variant/30">Cantidad</th>
                    <th className="py-3 px-4 text-right font-label uppercase tracking-widest text-[10px] text-outline font-bold border-b border-outline-variant/30">Precio Unit. (USD)</th>
                    <th className="py-3 px-4 text-right font-label uppercase tracking-widest text-[10px] text-primary font-bold border-b border-outline-variant/30">Precio Total (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.filas.map(r => (
                    <tr key={r.tipoMovimiento} className="border-b border-outline-variant/10 hover:bg-surface-variant/20">
                      <td className="py-3 px-4 font-bold">{r.tipoMovimiento}</td>
                      <td className="py-3 px-4 text-right font-mono">{r.cantidad}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatUSD(r.precioUnitario)}</td>
                      <td className="py-3 px-4 text-right font-mono text-success font-bold">{formatUSD(r.totalUSD)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td className="py-4 px-4 font-bold text-primary text-right uppercase tracking-widest text-xs">Totales</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-lg">{resumen.granTotalViajes}</td>
                    <td className="py-4 px-4" />
                    <td className="py-4 px-4 text-right font-mono font-bold text-xl text-success">{formatUSD(resumen.granTotalUSD)}</td>
                  </tr>
                  <tr className="bg-surface-variant/40">
                    <td colSpan="3" className="py-4 px-4 font-bold text-on-surface text-right uppercase tracking-widest text-xs">
                      Total Equivalente en Pesos (TC: {tipoCambio})
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-2xl text-primary">{formatMXN(resumen.granTotalMXN)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VISTA DE IMPRESIÓN Y PDF POR SLIDES / DASHBOARD EJECUTIVO  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden print:block font-body text-slate-900 bg-white">

        {/* ── SLIDE 1: DASHBOARD CON RESUMEN GENERAL DE OPERACIÓN ── */}
        <div className="print-slide p-2">
          {/* Cabecera Oficial CIF */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
            <div className="flex items-center gap-4">
              <img src="/assets/LOGOCIF.png" alt="CIF Logo" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold font-headline text-slate-900 uppercase tracking-tight">
                  CIF - CORPORATIVO DE SERVICIOS E INSUMOS
                </h1>
                <p className="text-xs text-slate-600 font-label uppercase tracking-widest">
                  REPORTE DE PRE-FACTURACIÓN Y TRASLADOS OPERATIVOS
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-800 leading-snug">
              <div><strong>Cliente:</strong> {cli || 'TODOS'}</div>
              <div><strong>Periodo:</strong> {fi} al {ff}</div>
              <div className="text-sm font-bold text-amber-800 mt-1">
                Total: {formatUSD(resumen.granTotalUSD)} USD ({formatMXN(resumen.granTotalMXN)} MXN)
              </div>
            </div>
          </div>

          {/* Tabla de Resumen de Operación (Diseño Elegante y Limpio) */}
          <div className="border-2 border-slate-900 rounded overflow-hidden mb-6">
            <div className="bg-slate-100 px-5 py-3 border-b-2 border-slate-900 flex items-center justify-between">
              <h2 className="font-headline font-bold text-base text-slate-900">
                Resumen de Operación <span className="font-normal text-slate-600">({cli || 'TODOS'})</span>
              </h2>
              <span className="font-mono text-xs font-bold text-slate-700">Tipo de Cambio: ${tipoCambio} MXN</span>
            </div>
            <table className="w-full text-left font-body text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-900 font-label font-bold text-slate-800 uppercase text-[9pt]">
                  <th className="py-2.5 px-4">Tipo Movimiento</th>
                  <th className="py-2.5 px-4 text-center">Cantidad</th>
                  <th className="py-2.5 px-4 text-right">Precio Unit. (USD)</th>
                  <th className="py-2.5 px-4 text-right">Precio Total (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resumen.filas.map(r => (
                  <tr key={r.tipoMovimiento} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.tipoMovimiento}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800">{r.cantidad}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">{formatUSD(r.precioUnitario)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatUSD(r.totalUSD)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900">
                  <td className="py-3 px-4 font-bold text-slate-900 text-right uppercase tracking-wider text-xs">TOTALES</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-base text-slate-900">{resumen.granTotalViajes}</td>
                  <td className="py-3 px-4" />
                  <td className="py-3 px-4 text-right font-mono font-bold text-base text-slate-900">{formatUSD(resumen.granTotalUSD)}</td>
                </tr>
                <tr className="bg-slate-200 border-t border-slate-400">
                  <td colSpan="3" className="py-3 px-4 font-bold text-slate-900 text-right uppercase tracking-wider text-xs">
                    TOTAL EQUIVALENTE EN PESOS (TC: {tipoCambio})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-lg text-slate-900">{formatMXN(resumen.granTotalMXN)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pie de Slide 1 */}
          <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[8.5pt] font-mono text-slate-700">
            <div><strong>CIF Logistics System</strong> · Slide 1 (Resumen General de Operación)</div>
            <div className="font-bold">Total Acumulado: {formatUSD(resumen.granTotalUSD)} USD</div>
          </div>
        </div>

        {/* ── SLIDES 2 EN ADELANTE: DETALLE OPERATIVO DE TRASLADOS (UN SLIDE POR TIPO DE MOVIMIENTO) ─── */}
        {tiposOrdenados.map((tipo, idxSlide) => {
          const viajesGroup = grupos[tipo];
          const subtotalGroup = resumen.filas.find(r => r.tipoMovimiento === tipo)?.totalUSD || 0;

          return (
            <div key={tipo} className="print-slide p-2 pt-3">
              {/* Cabecera Oficial por Defecto en Cada Página / Slide */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center gap-3">
                  <img src="/assets/LOGOCIF.png" alt="CIF Logo" className="h-8 w-auto object-contain" />
                  <div>
                    <h2 className="font-headline text-sm font-bold text-slate-900 uppercase tracking-tight">
                      DETALLE OPERATIVO DE TRASLADOS POR TIPO DE MOVIMIENTO
                    </h2>
                    <span className="text-[8.5pt] text-slate-600 font-label uppercase tracking-wider">
                      Cliente: {cli || 'TODOS'} · Período: {fi} al {ff}
                    </span>
                  </div>
                </div>
                <span className="text-[8.5pt] font-mono text-slate-800 font-bold bg-slate-100 px-3 py-1 border border-slate-300 rounded">
                  {resumen.granTotalViajes} viajes en total
                </span>
              </div>

              {/* Encabezado del Grupo de Movimiento */}
              <div className="flex items-center justify-between bg-slate-100 border-2 border-slate-900 px-3 py-2 rounded mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{tipo}</span>
                  <span className="text-xs text-slate-600">({getTipoDescription(tipo)})</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span><strong>{viajesGroup.length}</strong> viajes</span>
                  <span>Subtotal: <strong>{formatUSD(subtotalGroup)}</strong></span>
                </div>
              </div>

              {/* Tabla de Viajes del Movimiento */}
              <table className="w-full text-left text-[9pt] leading-tight border-collapse table-auto mb-4">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-400 font-label font-bold text-slate-700 uppercase tracking-wider text-[8pt] whitespace-nowrap">
                    <th className="py-1 px-1.5 w-6">#</th>
                    {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'tipoMov').map(col => (
                      <th key={col.key} className="py-1 px-1.5">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viajesGroup.map((m, idx) => (
                    <tr key={m.id || idx} className="whitespace-nowrap">
                      <td className="py-1 px-1.5 font-mono text-slate-500">{idx + 1}</td>
                      {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'tipoMov').map(col => {
                        let val = m[col.key] || '—';
                        if (col.key === 'costo') val = formatUSD(val);

                        return (
                          <td key={col.key} className={`py-1 px-1.5 whitespace-nowrap ${
                            ['fecha','hora','caja','tractor','valeFisico','costo'].includes(col.key) ? 'font-mono' : ''
                          } ${['costo','cliente','valeFisico'].includes(col.key) ? 'font-bold' : ''}`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pie de Página del Slide */}
              <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[8.5pt] font-mono text-slate-700 mt-auto">
                <div><strong>CIF Logistics Management System</strong> · Slide {idxSlide + 2} ({tipo})</div>
                <div className="font-bold">Subtotal {tipo}: {formatUSD(subtotalGroup)} USD</div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}

// ── Helper: movement type descriptions ──────────────────────
function getTipoDescription(tipo) {
  const descs = {
    'INTERPLANTA': 'Movimiento entre plantas',
    'L/C JRZ': 'Local cargado en Juárez',
    'RAMPA': 'Movimiento de rampa',
    'RECOLECCION': 'Recolección de carga',
    'REPARTO': 'Reparto a destino',
    'ENTRADA': 'Entrada a planta',
    'SALIDA': 'Salida de planta',
  };
  return descs[tipo] || tipo;
}

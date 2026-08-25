import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsLeftRight, Plus, MicrosoftExcelLogo, Funnel, PencilSimple, Printer } from '@phosphor-icons/react';
import DataTable from '../components/DataTable';
import ColumnEditor from '../components/ColumnEditor';
import SuperCapturaWizard from '../components/SuperCapturaWizard';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

export default function Movimientos() {
  const { movimientos: movData, clientes, operadores, cajas, unidades, tiposMovimiento, crud } = useData();
  const STORAGE_KEY = 'cif_columns_movimientos';

  // ── Helper: Formatear fecha para despliegue ───────────────
  function formatDateDisplay(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  }

  const ALL_COLUMNS = [
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditRow({ ...row });
        }}
        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
        title="Editar viaje"
      >
        <PencilSimple size={16} weight="bold" />
      </button>
    )},
    { key: 'id', label: '#' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'hora', label: 'Hora', render: (v) => <span className="font-mono text-primary font-bold">{v}</span> },
    { key: 'usuario', label: 'Usuario' },
    { key: 'cliente', label: 'Cliente', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'tipoMov', label: 'Tipo Mov', render: (v) => (
      <span className={`badge ${v === 'ENTRADA' ? 'badge-success' : 'badge-danger'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v === 'ENTRADA' ? 'bg-success' : 'bg-danger'}`} />
        {v}
      </span>
    )},
    { key: 'origen', label: 'Origen' },
    { key: 'destino', label: 'Destino' },
    { key: 'clasificacion', label: 'Clasif.', render: (v) => <span className="font-bold text-outline">{v}</span> },
    { key: 'operador', label: 'Operador' },
    { key: 'tractor', label: 'Tractor', render: (v) => <span className="font-mono font-bold text-on-surface">{v}</span> },
    { key: 'caja', label: '#Caja', render: (v) => <span className="font-mono text-outline">{v}</span> },
    { key: 'facPedimento', label: 'Folio (Vale Físico)', render: (v, row) => <span className="font-mono text-xs font-bold">{row.valeFisico || v || '—'}</span> },
    { key: 'puente', label: 'Puente' },
    { key: 'numVoucher', label: 'Num. Voucher', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'peaje', label: 'Peaje' },
    { key: 'sello', label: 'Sello', render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: 'salioOrigen', label: 'Salió Origen' },
    { key: 'puntoRevision', label: 'Punto Revisión' },
    { key: 'entradaMX', label: 'Entrada MX' },
    { key: 'salidaMX', label: 'Salida MX' },
    { key: 'entradaAM', label: 'Entrada AM' },
    { key: 'salidaAM', label: 'Salida AM' },
    { key: 'horaEntrega', label: 'Hora Entrega' },
    { key: 'estatus', label: 'Estatus', render: (v) => {
      const cls = v === 'Completo' ? 'badge-success' : v === 'En Ruta' ? 'badge-warning' : 'badge-muted';
      return <span className={`badge ${cls}`}>{v}</span>;
    }},
    { key: 'cmt', label: 'CMT' },
    { key: 'factura', label: 'Factura' },
  ];

  const DEFAULT_VISIBLE = ['acciones','fecha','hora','cliente','tipoMov','origen','destino','operador','tractor','caja','facPedimento','sello','estatus','factura'];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE;
  });

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [busquedaRapida, setBusquedaRapida] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const filteredData = useMemo(() => {
    return movData.filter(row => {
      if (fechaInicio && (row.fecha || '') < fechaInicio) return false;
      if (fechaFin && (row.fecha || '') > fechaFin) return false;
      if (filtroEstatus && row.estatus !== filtroEstatus) return false;
      if (busquedaRapida) {
        const q = busquedaRapida.trim().toUpperCase();
        const folioStr = String(row.valeFisico || row.facPedimento || row.id || '').toUpperCase();
        const fechaStr = String(row.fecha || '').toUpperCase();
        const opStr = String(row.operador || '').toUpperCase();
        const cliStr = String(row.cliente || '').toUpperCase();
        const cajaStr = String(row.caja || '').toUpperCase();
        const matches = folioStr.includes(q) || fechaStr.includes(q) || opStr.includes(q) || cliStr.includes(q) || cajaStr.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [movData, fechaInicio, fechaFin, filtroEstatus, busquedaRapida]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = a.fecha || '';
      const dateB = b.fecha || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const opA = a.operador || '';
      const opB = b.operador || '';
      return opA.localeCompare(opB);
    });
  }, [filteredData]);

  const printStats = useMemo(() => {
    const totalViajes = sortedData.length;
    const clientesUnicos = new Set(sortedData.map(m => m.cliente).filter(Boolean)).size;
    const operadoresUnicos = new Set(sortedData.map(m => m.operador).filter(Boolean)).size;
    const cajasUnicas = new Set(sortedData.map(m => m.caja).filter(Boolean)).size;

    const tiposBreakdown = {};
    const clientesFreq = {};
    const puentesBreakdown = {};

    sortedData.forEach(m => {
      if (m.tipoMov) tiposBreakdown[m.tipoMov] = (tiposBreakdown[m.tipoMov] || 0) + 1;
      if (m.cliente) clientesFreq[m.cliente] = (clientesFreq[m.cliente] || 0) + 1;
      if (m.puente) puentesBreakdown[m.puente] = (puentesBreakdown[m.puente] || 0) + 1;
    });

    const topClientes = Object.entries(clientesFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalViajes, clientesUnicos, operadoresUnicos, cajasUnicas, tiposBreakdown, puentesBreakdown, topClientes };
  }, [sortedData]);

  const exportExcel = () => {
    const columnsToExport = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'acciones');
    const dataToExport = sortedData.map(row => {
      const obj = {};
      columnsToExport.forEach(c => obj[c.label] = row[c.key] || '');
      return obj;
    });
    
    const totalsRow = {};
    columnsToExport.forEach((c, i) => {
      if (i === 0) totalsRow[c.label] = 'TOTALES';
      else if (i === 1) totalsRow[c.label] = `${dataToExport.length} viajes`;
      else totalsRow[c.label] = '';
    });
    dataToExport.push(totalsRow);

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    XLSX.writeFile(wb, `CIF_Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleColChange = (next) => {
    setVisibleColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleResetEditKeepCaja = () => {
    if (!editRow) return;
    setEditRow(prev => ({
      ...prev,
      origen: '',
      destino: '',
      tipoMov: '',
      hora: '',
      valeFisico: '',
      facPedimento: '',
      puente: '',
      numVoucher: '',
      peaje: '',
      sello: '',
    }));
  };

  return (
    <div className="space-y-6 animate-in">
      <style>{`
        @media print {
          @page { size: landscape; margin: 6mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; color: #0f172a !important; }
          .print\\:hidden { display: none !important; }
          .print-slide { break-after: page; page-break-after: always; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VISTA EN PANTALLA (WEB VIEW)                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Módulo Principal</span>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowsLeftRight size={32} weight="light" className="text-primary" />
              Movimientos
            </h1>
            <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">
              Registro y seguimiento de traslados · {sortedData.length} movimientos
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 transition-all shadow-md"
            >
              <Plus size={14} weight="bold" />
              Súper Captura
            </button>
            <ColumnEditor
              columns={ALL_COLUMNS}
              visibleColumns={visibleColumns}
              onChange={handleColChange}
              storageKey={STORAGE_KEY}
            />
          </div>
        </div>

        {/* Filters & Buscador por Folio/Fecha */}
        <div className="bg-surface-container-low border border-outline-variant/20 matte-grain px-5 py-4 flex flex-wrap items-center gap-4">
          <Funnel size={16} className="text-primary" />

          <div className="flex items-center gap-2 bg-surface border border-outline-variant/40 px-3 py-1.5 focus-within:border-primary">
            <label className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Buscar Folio/Fecha:</label>
            <input
              type="text"
              value={busquedaRapida}
              onChange={e => setBusquedaRapida(e.target.value)}
              placeholder="Escribe folio, fecha..."
              className="bg-transparent text-xs font-mono font-bold text-primary outline-none w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-label text-[9px] uppercase tracking-widest text-outline">Desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="bg-surface border border-outline-variant/30 text-xs font-label font-bold px-3 py-2 text-primary outline-none focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-label text-[9px] uppercase tracking-widest text-outline">Hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              className="bg-surface border border-outline-variant/30 text-xs font-label font-bold px-3 py-2 text-primary outline-none focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-label text-[9px] uppercase tracking-widest text-outline">Estatus</label>
            <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}
              className="bg-surface border border-outline-variant/30 text-xs font-label font-bold px-3 py-2 text-on-surface outline-none focus:border-primary">
              <option value="">Todos</option>
              <option value="Completo">Completo</option>
              <option value="En Ruta">En Ruta</option>
              <option value="Incompleto">Incompleto</option>
            </select>
          </div>
          {(fechaInicio || fechaFin || filtroEstatus || busquedaRapida) && (
            <button
              onClick={() => { setFechaInicio(''); setFechaFin(''); setFiltroEstatus(''); setBusquedaRapida(''); }}
              className="font-label text-[10px] uppercase tracking-widest text-danger hover:text-on-surface transition-colors font-bold underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table */}
        <DataTable
          columns={ALL_COLUMNS}
          data={sortedData}
          visibleColumns={visibleColumns}
          pageSize={15}
          onRowClick={(row) => setEditRow({ ...row })}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VISTA DASHBOARD SLIDES EXCLUSIVA DE IMPRESIÓN Y PDF        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden print:block font-body text-slate-900 bg-white">
        
        {/* SLIDE 1: DASHBOARD RESUMEN EJECUTIVO */}
        <div className="print-slide p-2">
          {/* Cabecera Oficial CIF */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-4">
              <img src="/assets/LOGOCIF.png" alt="CIF Logo" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="font-headline font-bold text-base text-slate-900 tracking-tight">
                  COMERCIALIZADORA E IMPORTADORA DEL FRONTERIZO
                </h1>
                <h2 className="font-label text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  Dashboard Ejecutivo de Traslados Logísticos
                </h2>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-600 font-mono leading-snug">
              <div><strong>Fecha Emisión:</strong> {formatDateDisplay(new Date().toISOString().split('T')[0])}</div>
              <div><strong>Total Registros:</strong> {printStats.totalViajes} traslados</div>
              {fechaInicio && <div><strong>Período:</strong> {formatDateDisplay(fechaInicio)} al {formatDateDisplay(fechaFin || new Date().toISOString().split('T')[0])}</div>}
            </div>
          </div>

          {/* Tarjetas de KPIs Principales */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-100 border border-slate-300 p-3 rounded text-center">
              <span className="text-[8.5pt] font-label uppercase tracking-wider text-slate-600 font-bold block mb-1">Total Traslados</span>
              <span className="text-2xl font-bold font-mono text-slate-900">{printStats.totalViajes}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
              <span className="text-[8.5pt] font-label uppercase tracking-wider text-blue-700 font-bold block mb-1">Clientes Atendidos</span>
              <span className="text-2xl font-bold font-mono text-blue-900">{printStats.clientesUnicos}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded text-center">
              <span className="text-[8.5pt] font-label uppercase tracking-wider text-purple-700 font-bold block mb-1">Operadores Asignados</span>
              <span className="text-2xl font-bold font-mono text-purple-900">{printStats.operadoresUnicos}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-center">
              <span className="text-[8.5pt] font-label uppercase tracking-wider text-emerald-700 font-bold block mb-1">Cajas Operativas</span>
              <span className="text-2xl font-bold font-mono text-emerald-900">{printStats.cajasUnicas}</span>
            </div>
          </div>

          {/* Desgloses Visuales por Tipo de Movimiento y Clientes */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Proporción por Tipo de Movimiento */}
            <div className="bg-white border border-slate-300 rounded p-4">
              <h3 className="font-label text-[9pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-3">
                Proporción por Tipo de Movimiento
              </h3>
              <div className="space-y-3">
                {Object.entries(printStats.tiposBreakdown).map(([tipo, count]) => {
                  const pct = printStats.totalViajes ? Math.round((count / printStats.totalViajes) * 100) : 0;
                  return (
                    <div key={tipo} className="text-[9pt]">
                      <div className="flex justify-between font-bold text-slate-700 mb-1">
                        <span>{tipo}</span>
                        <span>{count} viajes ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-slate-800 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Clientes y Puentes */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-300 rounded p-4">
                <h3 className="font-label text-[9pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-3">
                  Top Clientes por Volumen
                </h3>
                <div className="space-y-2">
                  {printStats.topClientes.map(([cli, count]) => (
                    <div key={cli} className="flex items-center justify-between text-[9pt]">
                      <span className="truncate max-w-[220px] font-bold text-slate-800">{cli}</span>
                      <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-800 font-bold">{count} viajes</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(printStats.puentesBreakdown).length > 0 && (
                <div className="bg-white border border-slate-300 rounded p-3">
                  <h3 className="font-label text-[9pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
                    Cruces por Puente Internacional
                  </h3>
                  <div className="flex flex-wrap gap-2 text-[8.5pt]">
                    {Object.entries(printStats.puentesBreakdown).map(([p, count]) => (
                      <span key={p} className="bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold px-2 py-1 rounded">
                        {p}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pie de Slide 1 */}
          <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[8.5pt] font-mono text-slate-700">
            <div><strong>CIF Logistics System</strong> · Resumen Ejecutivo (Slide 1)</div>
            <div className="font-bold">Total General: {printStats.totalViajes} Traslados</div>
          </div>
        </div>

        {/* SLIDE 2 EN ADELANTE: TABLA DETALLADA DE TRASLADOS */}
        <div className="print-slide p-2 pt-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
            <div className="flex items-center gap-3">
              <img src="/assets/LOGOCIF.png" alt="CIF Logo" className="h-8 w-auto object-contain" />
              <div>
                <h2 className="font-label text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Detalle Operativo de Traslados
                </h2>
                <span className="text-[9pt] text-slate-600">Registro detallado de viajes correspondientes al período reportado</span>
              </div>
            </div>
            <span className="text-[9pt] font-mono text-slate-800 font-bold bg-slate-100 px-3 py-1 border border-slate-300 rounded">
              {sortedData.length} registros
            </span>
          </div>

          <table className="w-full text-left text-[9.5pt] leading-tight border-collapse table-auto">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-900 font-label font-bold text-slate-800 uppercase tracking-wider text-[8.5pt] whitespace-nowrap">
                <th className="py-1 px-2 w-8">#</th>
                {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'acciones' && c.key !== 'id').map(col => (
                  <th key={col.key} className="py-1 px-2">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50 whitespace-nowrap">
                  <td className="py-[2px] px-2 font-mono text-slate-500">{idx + 1}</td>
                  {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'acciones' && c.key !== 'id').map(col => {
                    let val = row[col.key] || '—';
                    if (col.key === 'fecha') val = formatDateDisplay(val);
                    if (col.key === 'facPedimento') val = row.valeFisico || row.facPedimento || '—';

                    if (col.key === 'tipoMov') {
                      return (
                        <td key={col.key} className="py-[2px] px-2 font-bold uppercase whitespace-nowrap">
                          <span className={`px-1.5 py-[1px] rounded text-[8.5pt] font-bold inline-block leading-none ${
                            String(val).includes('INTERPLANTA') ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            String(val).includes('IMPO') ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                            String(val).includes('EXPO') ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            String(val).includes('L/C') ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}>
                            {val}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} className={`py-[2px] px-2 whitespace-nowrap ${
                        ['fecha','hora','caja','tractor','facPedimento','valeFisico'].includes(col.key) ? 'font-mono' : ''
                      } ${['fecha','cliente','caja','facPedimento'].includes(col.key) ? 'font-bold' : ''}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pie de página oficial del desglose */}
          <div className="mt-4 pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[8.5pt] font-mono text-slate-700">
            <div>
              <strong>CIF Logistics Management System</strong> · Documento de Control Operativo
            </div>
            <div className="font-bold">
              Total Registros: {sortedData.length}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Modal (TR-001 & TR-003) */}
      {editRow && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setEditRow(null)}>
          <div className="bg-surface-container border border-outline-variant/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface-container z-10">
              <h3 className="font-headline font-bold text-base flex items-center gap-2">
                <PencilSimple size={18} className="text-primary" /> Editar Movimiento #{editRow.id}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetEditKeepCaja}
                  className="font-label text-[10px] uppercase tracking-widest font-bold text-amber-500 hover:text-amber-600 border border-amber-500/30 px-3 py-1 bg-amber-500/10"
                  title="Resetea todos los campos excepto la caja"
                >
                  Limpiar campos (Mantener caja)
                </button>
                <button onClick={() => setEditRow(null)} className="text-outline hover:text-primary text-xl">×</button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {ALL_COLUMNS.filter(c => c.key !== 'id' && c.key !== 'acciones').map(col => {
                const isImpoExpoType = (tipoMov) => {
                  if (!tipoMov) return false;
                  const upper = String(tipoMov).trim().toUpperCase();
                  return upper.includes('IMPO') || upper.includes('EXPO');
                };

                if (col.key === 'puente') {
                  const allowed = isImpoExpoType(editRow.tipoMov);
                  return (
                    <div key={col.key}>
                      <label className="block font-label text-[9px] uppercase tracking-widest text-outline mb-1 font-bold">
                        {col.label} {!allowed && <span className="text-danger font-normal">(Solo IMPO/EXPO)</span>}
                      </label>
                      <select
                        value={allowed ? (editRow.puente || '') : ''}
                        disabled={!allowed}
                        onChange={e => setEditRow(prev => ({ ...prev, puente: e.target.value }))}
                        className={`w-full border p-2 text-sm outline-none ${!allowed ? 'bg-surface-variant/40 text-outline cursor-not-allowed opacity-60' : 'bg-background border-outline-variant/30 text-on-surface focus:border-primary font-bold text-amber-500'}`}
                      >
                        <option value="">— {!allowed ? 'N/A (Solo IMPO/EXPO)' : 'Seleccionar'} —</option>
                        {['Zaragoza','Córdova','Santa Teresa','Stanton'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={col.key}>
                    <label className="block font-label text-[9px] uppercase tracking-widest text-outline mb-1 font-bold">{col.label}</label>
                    {['cliente', 'operador', 'tractor', 'caja', 'tipoMov', 'estatus'].includes(col.key) ? (
                      <select
                        value={editRow[col.key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setEditRow(prev => {
                            const nextObj = { ...prev, [col.key]: val };
                            if (col.key === 'tipoMov' && !isImpoExpoType(val)) {
                              nextObj.puente = '';
                            }
                            return nextObj;
                          });
                        }}
                        className={`w-full border p-2 text-sm outline-none focus:border-primary ${col.key === 'caja' ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 font-bold font-mono' : 'bg-background border-outline-variant/30 text-on-surface'}`}
                      >
                        <option value="">— Seleccionar —</option>
                        {col.key === 'cliente' && clientes.map(c => <option key={c.id} value={c.razonSocial || c.razon_social}>{c.razonSocial || c.razon_social}</option>)}
                        {col.key === 'operador' && operadores.map(o => <option key={o.id} value={o.nombreCompleto || o.nombre_completo}>{o.nombreCompleto || o.nombre_completo}</option>)}
                        {col.key === 'tractor' && unidades.map(u => <option key={u.id} value={u.numeroEconomico || u.numero_economico}>{u.numeroEconomico || u.numero_economico}</option>)}
                        {col.key === 'caja' && cajas.map(c => <option key={c.id} value={c.numeroCaja || c.numero_caja}>{c.numeroCaja || c.numero_caja}</option>)}
                        {col.key === 'tipoMov' && tiposMovimiento.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                        {col.key === 'estatus' && ['solicitado', 'asignado', 'en_transito', 'en_aduana', 'entregado', 'documentado', 'facturado', 'Completo', 'En Ruta', 'Incompleto'].map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={col.key === 'fecha' ? 'date' : col.key.toLowerCase().includes('hora') ? 'time' : 'text'}
                        value={editRow[col.key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setEditRow(prev => {
                            const nextObj = { ...prev, [col.key]: val };
                            if (col.key === 'tipoMov' && !isImpoExpoType(val)) {
                              nextObj.puente = '';
                            }
                            return nextObj;
                          });
                        }}
                        className={`w-full border p-2 text-sm outline-none focus:border-primary ${col.key === 'caja' ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 font-bold font-mono' : 'bg-background border-outline-variant/30 text-on-surface'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 sticky bottom-0 bg-surface-container z-10">
              <button 
                onClick={async () => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar esta captura? Esta acción no se puede deshacer.')) {
                    try {
                      await crud.remove('movimientos', editRow.id);
                      setEditRow(null);
                    } catch (err) {
                      alert("Error al eliminar: " + err.message);
                    }
                  }
                }}
                className="font-label text-xs uppercase tracking-widest font-bold text-danger hover:text-white hover:bg-danger px-4 py-2 mr-auto"
              >
                Eliminar Captura
              </button>
              <button onClick={() => setEditRow(null)} className="font-label text-xs uppercase tracking-widest font-bold text-outline hover:text-on-surface px-4 py-2">
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  // Resolve foreign keys
                  const cId = clientes.find(c => (c.razonSocial || c.razon_social) === editRow.cliente)?.id || editRow.cliente_id;
                  const oId = operadores.find(o => (o.nombreCompleto || o.nombre_completo) === editRow.operador)?.id || editRow.operador_id;
                  const tId = unidades.find(u => (u.numeroEconomico || u.numero_economico) === editRow.tractor)?.id || editRow.tractocamion_id;
                  const cjId = cajas.find(c => (c.numeroCaja || c.numero_caja) === editRow.caja)?.id || editRow.caja_id;
                  const tmId = tiposMovimiento.find(t => t.nombre === editRow.tipoMov)?.id || editRow.tipo_mov_id;
                  
                  // Map camelCase/hydrated keys to backend snake_case keys if modified
                  const payload = {
                    cliente_id: cId,
                    operador_id: oId,
                    tractocamion_id: tId,
                    caja_id: cjId,
                    tipo_movimiento: editRow.tipoMov ? editRow.tipoMov.toLowerCase().replace(' ', '_') : editRow.tipo_movimiento,
                    origen: editRow.origen,
                    destino: editRow.destino,
                    via_cruce: editRow.puente || '',
                    folio_boleta: editRow.valeFisico || editRow.facPedimento || '',
                    estatus: editRow.estatus,
                    notas: editRow.clasificacion || '',
                    peaje: editRow.peaje || '',
                    sello: editRow.sello || '',
                    salio_origen: editRow.salioOrigen || '',
                    punto_revision: editRow.puntoRevision || '',
                    entrada_mx: editRow.entradaMX || '',
                    salida_mx: editRow.salidaMX || '',
                    entrada_am: editRow.entradaAM || '',
                    salida_am: editRow.salidaAM || '',
                    hora_entrega: editRow.horaEntrega || '',
                    cmt: editRow.cmt || '',
                    factura: editRow.factura || ''
                  };
                  
                  // Handle date and time
                  if (editRow.fecha || editRow.hora) {
                    const datePart = editRow.fecha || (editRow.fecha_salida ? editRow.fecha_salida.split(' ')[0] : '0000-00-00');
                    const timePart = editRow.hora || (editRow.fecha_salida ? editRow.fecha_salida.split(' ')[1] : '00:00:00');
                    payload.fecha_salida = `${datePart} ${timePart.length === 5 ? timePart + ':00' : timePart}`;
                  }
                  
                  try {
                    await crud.update('movimientos', editRow.id, payload);
                    setEditRow(null);
                  } catch (err) {
                    alert("Error al actualizar: " + err.message);
                  }
                }}
                className="bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-bold px-6 py-2 shadow-md hover:brightness-110"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Super Captura Wizard */}
      <SuperCapturaWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}

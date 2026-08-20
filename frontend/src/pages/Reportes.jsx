import { useState, useMemo } from 'react';
import { FileText, MicrosoftExcelLogo, Funnel } from '@phosphor-icons/react';
import DataTable from '../components/DataTable';
import ColumnEditor from '../components/ColumnEditor';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

const COLS = [
  { key: 'id', label: 'FOLIO', render: (v) => <span className="font-mono text-primary">{v}</span> },
  { key: 'usuario', label: 'USUARIO' },
  { key: 'estatus', label: 'ESTATUS', render: (v) => {
    const cls = v === 'Completo' ? 'badge-success' : v === 'En Ruta' ? 'badge-warning' : 'badge-muted';
    return <span className={`badge ${cls}`}>{v}</span>;
  }},
  { key: 'cmt', label: 'CMT' },
  { key: 'origen', label: 'ORIGEN' },
  { key: 'destino', label: 'DESTINO' },
  { key: 'tipoMov', label: 'TIPO DE MOVI.', render: (v) => <span className="font-bold">{v}</span> },
  { key: 'puente', label: 'PUENTE' },
  { key: 'peaje', label: 'PEAJE' },
  { key: 'caja', label: '#CAJA', render: (v) => <span className="font-mono">{v}</span> },
  { key: 'tractor', label: '#TRACTOR', render: (v) => <span className="font-mono font-bold">{v}</span> },
  { key: 'operador', label: 'OPERADOR' },
  { key: 'numVoucher', label: 'NUMERO VOUCHER' },
  { key: 'facPedimento', label: 'FACT / PEDIMENTO' },
  { key: 'sello', label: 'SELLO' },
  { key: 'cliente', label: 'CLIENTE', render: (v) => <span className="font-semibold uppercase">{v}</span> },
  { key: 'fecha', label: 'FECHA REQUERIDA' },
  { key: 'llegoOrigen', label: 'LLEGO ORIGEN' },
  { key: 'salioOrigen', label: 'SALIO ORIGEN' },
  { key: 'entradaMX', label: 'ENTRADA MX' },
  { key: 'salidaMX', label: 'SALIDA MX' },
  { key: 'entradaAM', label: 'ENTRADA AM' },
  { key: 'salidaAM', label: 'SALIDA AM' },
  { key: 'horaEntrega', label: 'HORA DE ENTREGA' }
];

const DEFAULT_VIS = [
  'id','usuario','estatus','cmt','origen','destino','tipoMov',
  'caja','tractor','operador','facPedimento','cliente','fecha','salidaMX'
];
const SK = 'cif_columns_reportes_v2';

export default function Reportes() {
  const { movimientos: movData, clientes: clientesData } = useData();
  
  const [vis, setVis] = useState(() => {
    const s = localStorage.getItem(SK);
    return s ? JSON.parse(s) : DEFAULT_VIS;
  });
  const [fi, setFi] = useState('');
  const [ff, setFf] = useState('');
  const [est, setEst] = useState('');
  const [cli, setCli] = useState('');

  const clientesList = useMemo(() => [...new Set(clientesData.filter(c => c.activo).map(c => c.razonSocial))], [clientesData]);

  const filtered = useMemo(() => {
    return movData.filter(r => {
      if (fi && r.fecha < fi) return false;
      if (ff && r.fecha > ff) return false;
      if (est && r.estatus !== est) return false;
      if (cli && r.cliente !== cli) return false;
      return true;
    });
  }, [movData, fi, ff, est, cli]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');
    XLSX.writeFile(wb, `CIF_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Consultas</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText size={32} weight="light" className="text-primary" />
            Reporte de Clientes
          </h1>
          <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">{filtered.length} registros encontrados</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 transition-all shadow-md">
            <MicrosoftExcelLogo size={14} weight="bold" /> Exportar a Excel
          </button>
          <ColumnEditor columns={COLS} visibleColumns={vis} onChange={v => { setVis(v); localStorage.setItem(SK, JSON.stringify(v)); }} storageKey={SK} />
        </div>
      </div>

      {/* Contenedor de Filtros estilo Legacy Homologado */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <Funnel size={18} weight="bold" />
          <h3 className="font-label font-bold text-xs uppercase tracking-widest">Filtros de Reporte</h3>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          {/* Rango de Fechas */}
          <div className="flex items-center gap-3 bg-surface border border-outline-variant/30 p-1">
            <div className="flex items-center gap-2 px-3 py-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">De:</label>
              <input type="date" value={fi} onChange={e => setFi(e.target.value)} className="bg-transparent text-sm font-bold text-primary outline-none" />
            </div>
            <div className="w-[1px] h-6 bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 px-3 py-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Hasta:</label>
              <input type="date" value={ff} onChange={e => setFf(e.target.value)} className="bg-transparent text-sm font-bold text-primary outline-none" />
            </div>
          </div>

          {/* Selector de Cliente */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">CLIENTE:</label>
            <select value={cli} onChange={e => setCli(e.target.value)} className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm font-body outline-none focus:border-primary min-w-[200px]">
              <option value="">-- SELECCIONAR --</option>
              {clientesList.map((c, i) => <option key={`${c}-${i}`} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Selector de Estatus (Opcional extra para el nuevo sistema) */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">ESTATUS:</label>
            <select value={est} onChange={e => setEst(e.target.value)} className="bg-surface border border-outline-variant/40 text-on-surface px-4 py-2 text-sm font-body outline-none focus:border-primary min-w-[150px]">
              <option value="">TODOS</option>
              <option value="Completo">COMPLETO</option>
              <option value="En Ruta">EN RUTA</option>
              <option value="Incompleto">INCOMPLETO</option>
            </select>
          </div>

          {/* Botones de acción del filtro */}
          <div className="flex items-center gap-3">
            <button className="bg-surface border border-outline/30 hover:border-primary text-primary font-label text-[10px] font-bold uppercase tracking-widest px-6 py-2 transition-colors shadow-sm">
              Generar Reporte
            </button>
            {(fi || ff || est || cli) && (
              <button onClick={() => { setFi(''); setFf(''); setEst(''); setCli(''); }} className="font-label text-[10px] uppercase tracking-widest text-danger hover:text-red-400 font-bold underline">
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <DataTable columns={COLS} data={filtered} visibleColumns={vis} pageSize={20} />
    </div>
  );
}

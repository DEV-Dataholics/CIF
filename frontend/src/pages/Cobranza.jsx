import { useState, useMemo } from 'react';
import {
  CurrencyCircleDollar,
  CheckCircle,
  WarningCircle,
  Clock,
  Receipt,
  Download,
  FilePdf,
  MagnifyingGlass,
  Trash,
  List,
  SquaresFour,
  Eye,
  PencilSimple,
  X,
  Printer,
  CaretLeft,
  CaretRight,
  FileText
} from '@phosphor-icons/react';
import { useData } from '../context/DataContext';

export default function Cobranza() {
  const dataContext = useData() || {};
  const facturas = dataContext.facturas || [];
  const addFacturaYCliente = dataContext.addFacturaYCliente;
  const updateFacturaEstatus = dataContext.updateFacturaEstatus;
  const crud = dataContext.crud;
  const refreshData = dataContext.refreshData;

  // Estados de filtrado y búsqueda
  const [filtro, setFiltro] = useState('todos');
  const [atrasoRango, setAtrasoRango] = useState('todos');
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selección y vistas
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  // Modales
  const [fichaFactura, setFichaFactura] = useState(null);
  const [editFactura, setEditFactura] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [copiadoUuid, setCopiadoUuid] = useState(false);

  // Drag & Drop para XML
  const [isDragging, setIsDragging] = useState(false);

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

  // Helpers de semáforo
  const semaforoColor = (dias) => {
    if (dias <= 30) return 'text-success';
    if (dias <= 60) return 'text-warning';
    return 'text-danger';
  };

  const semaforoBg = (dias) => {
    if (dias <= 30) return 'bg-success/10 border-success/20';
    if (dias <= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-danger/10 border-danger/20';
  };

  // Lista única de clientes
  const clientesConFacturas = useMemo(() => {
    const nombres = facturas.map(f => f.cliente).filter(Boolean);
    return ['todos', ...new Set(nombres)].sort((a, b) => {
      if (a === 'todos') return -1;
      if (b === 'todos') return 1;
      return a.localeCompare(b);
    });
  }, [facturas]);

  // Manejo de filtros con reinicio de página
  const handleFiltroChange = (nuevoFiltro) => {
    setFiltro(nuevoFiltro);
    setCurrentPage(1);
  };

  const handleAtrasoChange = (nuevoRango) => {
    setAtrasoRango(nuevoRango);
    setCurrentPage(1);
  };

  const handleBuscarChange = (val) => {
    setBuscarCliente(val);
    setCurrentPage(1);
  };

  const handleClienteChange = (val) => {
    setClienteSeleccionado(val);
    setCurrentPage(1);
  };

  // Filtrado de facturas
  const filtered = useMemo(() => {
    return facturas.filter(f => {
      // 1. Estatus
      if (filtro !== 'todos' && f.estatus !== filtro) return false;

      // 2. Días de atraso / antigüedad
      const dias = f.diasAntiguedad ?? f.dias_antiguedad ?? 0;
      if (atrasoRango !== 'todos') {
        if (atrasoRango === '30' && (dias < 0 || dias > 30)) return false;
        if (atrasoRango === '60' && (dias <= 30 || dias > 60)) return false;
        if (atrasoRango === '90' && (dias <= 60 || dias > 90)) return false;
        if (atrasoRango === '90mas' && dias <= 90) return false;
      }

      // 3. Cliente seleccionado
      if (clienteSeleccionado !== 'todos' && f.cliente !== clienteSeleccionado) return false;

      // 4. Búsqueda por texto (folio o cliente)
      if (buscarCliente.trim()) {
        const q = buscarCliente.toLowerCase().trim();
        const folioStr = String(f.folio || '').toLowerCase();
        const clienteStr = String(f.cliente || '').toLowerCase();
        return folioStr.includes(q) || clienteStr.includes(q);
      }

      return true;
    });
  }, [facturas, filtro, atrasoRango, clienteSeleccionado, buscarCliente]);

  // Paginación calculada
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFacturas = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  // Selección individual y masiva
  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const currentPageIds = paginatedFacturas.map(f => f.id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  // Eliminación masiva e individual
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar las ${selectedIds.length} facturas seleccionadas?`)) {
      try {
        if (crud?.remove) {
          for (const id of selectedIds) {
            await crud.remove('facturas', id);
          }
        }
        if (refreshData) await refreshData();
        setSelectedIds([]);
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleDeleteSingle = async (id) => {
    if (window.confirm('¿Deseas eliminar permanentemente esta factura?')) {
      try {
        if (crud?.remove) {
          await crud.remove('facturas', id);
        }
        if (refreshData) await refreshData();
        if (fichaFactura?.id === id) setFichaFactura(null);
        if (editFactura?.id === id) setEditFactura(null);
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  // Marcar como pagada
  const marcarPagada = async (id) => {
    try {
      if (updateFacturaEstatus) {
        await updateFacturaEstatus(id, 'pagada');
      } else if (crud?.update) {
        await crud.update('facturas', id, { estatus: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] });
      }
      if (refreshData) await refreshData();
      if (fichaFactura?.id === id) {
        setFichaFactura(prev => prev ? { ...prev, estatus: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] } : null);
      }
    } catch (err) {
      alert('Error al actualizar estatus: ' + err.message);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (f) => {
    setEditFactura(f);
    setEditError('');
    setEditForm({
      folio: f.folio || '',
      uuid: f.uuid || '',
      cliente: f.cliente || '',
      monto: f.monto || 0,
      subtotal: f.subtotal ?? f.monto ?? 0,
      moneda: f.moneda || 'MXN',
      fecha_emision: f.fecha_emision || f.fechaEmision || '',
      fecha_vencimiento: f.fecha_vencimiento || '',
      fecha_pago: f.fecha_pago || '',
      estatus: f.estatus || 'pendiente',
      concepto: f.concepto || '',
      notas: f.notas || ''
    });
  };

  // Guardar edición
  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editFactura) return;
    if (!editForm.folio || !editForm.cliente || !editForm.fecha_emision) {
      setEditError('Folio, Cliente y Fecha de Emisión son requeridos.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const payload = {
        ...editForm,
        monto: parseFloat(editForm.monto) || 0,
        subtotal: parseFloat(editForm.subtotal) || 0
      };

      if (crud?.update) {
        await crud.update('facturas', editFactura.id, payload);
      }
      if (refreshData) await refreshData();

      // Si la ficha técnica estaba abierta con esta factura, actualizarla
      if (fichaFactura?.id === editFactura.id) {
        setFichaFactura(prev => ({ ...prev, ...payload }));
      }

      setEditFactura(null);
    } catch (err) {
      setEditError(err.message || 'Error al guardar los cambios.');
    } finally {
      setEditSaving(false);
    }
  };

  // KPIs de cartera
  const stats = useMemo(() => ({
    total: facturas.reduce((s, f) => s + (parseFloat(f.monto) || 0), 0),
    pendiente: facturas.filter(f => f.estatus === 'pendiente').reduce((s, f) => s + (parseFloat(f.monto) || 0), 0),
    vencida: facturas.filter(f => f.estatus === 'vencida').reduce((s, f) => s + (parseFloat(f.monto) || 0), 0),
    pagada: facturas.filter(f => f.estatus === 'pagada').reduce((s, f) => s + (parseFloat(f.monto) || 0), 0),
    countPendiente: facturas.filter(f => f.estatus === 'pendiente').length,
    countVencida: facturas.filter(f => f.estatus === 'vencida').length,
    countPagada: facturas.filter(f => f.estatus === 'pagada').length,
  }), [facturas]);

  // Resumen tabular de morosidad agrupado por cliente
  const resumenMorosidadClientes = useMemo(() => {
    const map = {};
    facturas.forEach(f => {
      const clienteName = f.cliente || 'Sin Cliente';
      if (!map[clienteName]) {
        map[clienteName] = {
          cliente: clienteName,
          totalFacturas: 0,
          alCorriente: 0,
          atraso31_60: 0,
          atraso61_90: 0,
          atrasoMas90: 0,
          totalAdeudo: 0,
          granTotal: 0
        };
      }

      const item = map[clienteName];
      const monto = parseFloat(f.monto) || 0;
      const dias = f.diasAntiguedad ?? f.dias_antiguedad ?? 0;

      item.totalFacturas++;
      item.granTotal += monto;

      if (f.estatus === 'pagada') {
        item.alCorriente += monto;
      } else {
        item.totalAdeudo += monto;
        if (dias <= 30) {
          item.alCorriente += monto;
        } else if (dias <= 60) {
          item.atraso31_60 += monto;
        } else if (dias <= 90) {
          item.atraso61_90 += monto;
        } else {
          item.atrasoMas90 += monto;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.atrasoMas90 - a.atrasoMas90 || b.totalAdeudo - a.totalAdeudo);
  }, [facturas]);

  // Totales generales para la tabla de morosidad
  const totalesMorosidad = useMemo(() => {
    return resumenMorosidadClientes.reduce((acc, c) => ({
      totalFacturas: acc.totalFacturas + c.totalFacturas,
      alCorriente: acc.alCorriente + c.alCorriente,
      atraso31_60: acc.atraso31_60 + c.atraso31_60,
      atraso61_90: acc.atraso61_90 + c.atraso61_90,
      atrasoMas90: acc.atrasoMas90 + c.atrasoMas90,
      totalAdeudo: acc.totalAdeudo + c.totalAdeudo,
    }), { totalFacturas: 0, alCorriente: 0, atraso31_60: 0, atraso61_90: 0, atrasoMas90: 0, totalAdeudo: 0 });
  }, [resumenMorosidadClientes]);

  // Procesamiento de archivos XML
  const processXmlFiles = async (files) => {
    if (!files || files.length === 0) return;

    let procesadas = 0;
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xml')) continue;

      try {
        const xmlString = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        const getTag = (name) => xmlDoc.getElementsByTagName(`cfdi:${name}`)[0] || xmlDoc.getElementsByTagName(name)[0];
        const getTimbreTag = () => xmlDoc.getElementsByTagName('tfd:TimbreFiscalDigital')[0] || xmlDoc.getElementsByTagName('TimbreFiscalDigital')[0];

        const comprobante = getTag('Comprobante');
        const receptor = getTag('Receptor');
        const emisor = getTag('Emisor');
        const timbre = getTimbreTag();

        if (!comprobante) {
          alert(`❌ El archivo ${file.name} no parece ser un CFDI de factura válido.`);
          continue;
        }

        const serie = comprobante.getAttribute('Serie') || '';
        const folioStr = comprobante.getAttribute('Folio') || Math.floor(Math.random() * 10000).toString();
        const fechaFull = comprobante.getAttribute('Fecha');
        const fechaEmision = fechaFull ? fechaFull.split('T')[0] : new Date().toISOString().split('T')[0];
        const total = parseFloat(comprobante.getAttribute('Total') || 0);
        const subtotal = parseFloat(comprobante.getAttribute('SubTotal') || total);
        const moneda = comprobante.getAttribute('Moneda') || 'MXN';

        const nombreCliente = receptor ? (receptor.getAttribute('Nombre') || receptor.getAttribute('Rfc') || 'Cliente Desconocido') : 'Cliente Desconocido';
        const rfcReceptor = receptor ? receptor.getAttribute('Rfc') : null;
        const rfcEmisor = emisor ? emisor.getAttribute('Rfc') : null;
        const nombreEmisor = emisor ? emisor.getAttribute('Nombre') : null;
        const uuid = timbre ? timbre.getAttribute('UUID') : null;

        const hoy = new Date();
        const diffTime = hoy.getTime() - new Date(fechaEmision).getTime();
        const diasAntiguedad = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        const newFactura = {
          folio: `${serie}${folioStr}`.trim() || `XML-${Date.now()}`,
          uuid: uuid,
          cliente: nombreCliente,
          monto: total,
          subtotal: subtotal,
          moneda: moneda,
          rfc_emisor: rfcEmisor,
          rfc_receptor: rfcReceptor,
          nombre_emisor: nombreEmisor,
          fecha_emision: fechaEmision,
          fechaEmision: fechaEmision,
          diasAntiguedad: diasAntiguedad,
          estatus: diasAntiguedad > 60 ? 'vencida' : 'pendiente'
        };

        if (addFacturaYCliente) {
          await addFacturaYCliente(newFactura, nombreCliente);
        } else if (crud?.create) {
          await crud.create('facturas', newFactura);
        }
        procesadas++;
      } catch (err) {
        console.error('Error procesando XML:', err);
      }
    }

    if (refreshData) await refreshData();
    if (procesadas > 0) {
      alert(`✅ Se procesaron e importaron con éxito ${procesadas} factura(s) CFDI.`);
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No hay facturas en la vista actual para exportar.');
      return;
    }

    const headers = ['Folio', 'Cliente', 'Monto', 'Subtotal', 'Moneda', 'Fecha Emision', 'Dias Antiguedad', 'Estatus'];
    const rows = filtered.map(f => [
      f.folio,
      `"${(f.cliente || '').replace(/"/g, '""')}"`,
      f.monto,
      f.subtotal ?? f.monto,
      f.moneda || 'MXN',
      f.fechaEmision || f.fecha_emision,
      f.diasAntiguedad ?? f.dias_antiguedad ?? 0,
      f.estatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_cxc_${filtro}_${atrasoRango}dias.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    if (filtered.length === 0) {
      alert('No hay facturas en la vista actual para exportar.');
      return;
    }

    const loadScript = (url) => new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const runPDFGen = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('CRUCES INTERNACIONALES FRONTERIZOS', 14, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Reporte Ejecutivo de Cobranza y Cuentas por Cobrar (CxC)', 14, 26);
      doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-MX')}`, 14, 32);

      const columnsHeaders = ['Folio', 'Cliente', 'Monto (MXN)', 'Fecha Emisión', 'Días Atraso', 'Estatus'];
      const rowsData = filtered.map(f => [
        f.folio,
        f.cliente,
        fmt(f.monto),
        f.fechaEmision || f.fecha_emision,
        `${f.diasAntiguedad ?? f.dias_antiguedad ?? 0} días`,
        (f.estatus || '').toUpperCase()
      ]);

      doc.autoTable({
        startY: 38,
        head: [columnsHeaders],
        body: rowsData,
        theme: 'striped',
        headStyles: { fillColor: [184, 134, 11] },
        margin: { top: 38 },
      });

      doc.save(`reporte_cxc_${Date.now()}.pdf`);
    };

    if (!window.jspdf) {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(() => {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js').then(() => {
          runPDFGen();
        });
      });
    } else {
      runPDFGen();
    }
  };

  // Copiar UUID
  const handleCopyUuid = (uuid) => {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    setCopiadoUuid(true);
    setTimeout(() => setCopiadoUuid(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Encabezado General */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Finanzas</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <CurrencyCircleDollar size={32} weight="light" className="text-primary" />
            Cobranza y Cuentas por Cobrar
          </h1>
          <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">
            Rastreo de morosidad · Semáforo de antigüedad · Gestión CFDI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md"
          >
            <FilePdf size={14} weight="bold" /> Exportar PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-primary text-primary font-label text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-primary/10 transition-all"
          >
            <Download size={14} weight="bold" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* 1. Zona de Carga Rápida XML Superior */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); processXmlFiles(e.dataTransfer.files); }}
        className={`bg-surface-container-low border-2 border-dashed rounded-2xl p-5 transition-all shadow-xs ${
          isDragging ? 'border-primary bg-primary/10 scale-[1.005]' : 'border-outline-variant/60 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              <Receipt size={28} weight="duotone" />
            </div>
            <div>
              <div className="font-label text-xs uppercase tracking-wider text-primary font-bold">
                Carga Rápida de Facturas XML (CFDI 3.3 / 4.0)
              </div>
              <p className="text-xs text-outline mt-0.5">
                Arrastra aquí tus archivos XML o seleccionalos para procesar folios, UUID, cliente, impuestos y montos automáticamente.
              </p>
            </div>
          </div>
          <label className="cursor-pointer shrink-0 flex items-center gap-2 bg-primary/15 text-primary hover:bg-primary hover:text-black border border-primary/30 px-5 py-2.5 rounded-xl font-label text-xs uppercase tracking-wider font-bold transition-all shadow-xs">
            <Receipt size={16} weight="bold" /> Seleccionar XML
            <input
              type="file"
              accept=".xml"
              multiple
              className="hidden"
              onChange={(e) => { processXmlFiles(e.target.files); e.target.value = ''; }}
            />
          </label>
        </div>
      </div>

      {/* 2. Tarjetas de KPIs e Indicadores de Cartera */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs hover:border-primary/40 transition-all">
          <div className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold mb-2">Total CxC</div>
          <div className="text-2xl font-headline font-bold text-primary">{fmt(stats.total)}</div>
          <div className="font-label text-[10px] text-outline mt-1">{facturas.length} facturas</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs hover:border-success/40 transition-all">
          <div className="font-label text-[10px] uppercase tracking-wider text-success font-semibold mb-2">Pagadas</div>
          <div className="text-2xl font-headline font-bold text-success">{fmt(stats.pagada)}</div>
          <div className="font-label text-[10px] text-outline mt-1">{stats.countPagada} facturas</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs hover:border-warning/40 transition-all">
          <div className="font-label text-[10px] uppercase tracking-wider text-warning font-semibold mb-2">Pendientes</div>
          <div className="text-2xl font-headline font-bold text-warning">{fmt(stats.pendiente)}</div>
          <div className="font-label text-[10px] text-outline mt-1">{stats.countPendiente} facturas</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs hover:border-danger/40 transition-all">
          <div className="font-label text-[10px] uppercase tracking-wider text-danger font-semibold mb-2">Vencidas (+60 días)</div>
          <div className="text-2xl font-headline font-bold text-danger">{fmt(stats.vencida)}</div>
          <div className="font-label text-[10px] text-outline mt-1">{stats.countVencida} facturas</div>
        </div>
      </div>

      {/* 3. Barra Unificada de Filtros y Búsqueda */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filtro por estatus */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold">Estatus:</span>
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'vencida', label: 'Vencidas' },
              { id: 'pagada', label: 'Pagadas' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleFiltroChange(item.id)}
                className={`font-label text-[10px] uppercase tracking-wider font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
                  filtro === item.id
                    ? 'border-primary text-primary bg-primary/10 shadow-xs'
                    : 'border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filtro por días de atraso */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold">Días de atraso:</span>
            {[
              { value: 'todos', label: 'Todos' },
              { value: '30', label: '≤ 30 días' },
              { value: '60', label: '31 - 60 días' },
              { value: '90', label: '61 - 90 días' },
              { value: '90mas', label: '> 90 días' }
            ].map(r => (
              <button
                key={r.value}
                onClick={() => handleAtrasoChange(r.value)}
                className={`font-label text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  atrasoRango === r.value
                    ? 'border-primary text-primary bg-primary/10 shadow-xs'
                    : 'border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador y Dropdown de Clientes */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-3.5 border-t border-outline-variant">
          <div className="w-full sm:w-80 flex items-center gap-2.5 bg-surface border border-outline-variant px-3.5 py-2 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <MagnifyingGlass size={16} className="text-outline" weight="bold" />
            <input
              type="text"
              placeholder="Buscar por cliente o folio..."
              value={buscarCliente}
              onChange={e => handleBuscarChange(e.target.value)}
              className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline/50 outline-none"
            />
            {buscarCliente && (
              <button onClick={() => handleBuscarChange('')} className="text-outline hover:text-danger">
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3 sm:ml-auto">
            <span className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold shrink-0">Filtrar Cliente:</span>
            <select
              value={clienteSeleccionado}
              onChange={e => handleClienteChange(e.target.value)}
              className="bg-surface border border-outline-variant text-on-surface px-4 py-2 text-xs rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-w-xs uppercase font-bold transition-all shadow-xs"
            >
              <option value="todos">Todos los Clientes</option>
              {clientesConFacturas.filter(c => c !== 'todos').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {clienteSeleccionado !== 'todos' && (
              <button
                onClick={() => handleClienteChange('todos')}
                className="text-[10px] font-label uppercase tracking-wider text-danger font-bold hover:underline px-2.5 py-1 rounded-lg hover:bg-danger/10"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Acciones de Tabla (Selección masiva, Vistas, etc.) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-danger/30 transition-all shadow-xs"
            >
              <Trash size={15} weight="bold" /> Eliminar ({selectedIds.length})
            </button>
          )}
          <span className="text-xs text-outline">
            Mostrando <span className="font-bold text-on-surface">{filtered.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-bold text-on-surface">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-on-surface">{filtered.length}</span> facturas
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de tamaño de página */}
          <div className="flex items-center gap-2 text-xs text-outline">
            <span className="hidden sm:inline font-label text-[10px] uppercase tracking-wider font-semibold">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-surface-container-low border border-outline-variant text-on-surface px-2.5 py-1.5 rounded-xl text-xs outline-none focus:border-primary font-bold shadow-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Toggle Vista Lista / Tarjetas */}
          <div className="flex gap-1 border border-outline-variant rounded-xl p-1 bg-surface-container-low shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black font-bold shadow-xs' : 'text-outline hover:text-on-surface'}`}
              title="Vista de Lista"
            >
              <List size={16} weight="bold" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-primary text-black font-bold shadow-xs' : 'text-outline hover:text-on-surface'}`}
              title="Vista de Tarjetas"
            >
              <SquaresFour size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabla Principal de Facturas (con Paginación) */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="cif-table w-full">
              <thead>
                <tr>
                  <th className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedFacturas.length > 0 && paginatedFacturas.every(f => selectedIds.includes(f.id))}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>F. Emisión</th>
                  <th>Antigüedad</th>
                  <th>Estatus</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFacturas.map(f => {
                  const dias = f.diasAntiguedad ?? f.dias_antiguedad ?? 0;
                  return (
                    <tr key={f.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(f.id)}
                          onChange={() => toggleSelection(f.id)}
                        />
                      </td>
                      <td className="font-mono font-bold text-primary">{f.folio}</td>
                      <td className="font-semibold text-on-surface">{f.cliente}</td>
                      <td className="font-mono font-bold">{fmt(f.monto)}</td>
                      <td className="text-xs text-outline">{f.fechaEmision || f.fecha_emision}</td>
                      <td>
                        <span className={`badge border ${semaforoBg(dias)} ${semaforoColor(dias)}`}>
                          <Clock size={10} /> {dias} días
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          f.estatus === 'pagada'
                            ? 'badge-success'
                            : f.estatus === 'vencida'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}>
                          {f.estatus === 'pagada' && <CheckCircle size={10} />}
                          {f.estatus === 'vencida' && <WarningCircle size={10} />}
                          {f.estatus}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ficha técnica */}
                          <button
                            onClick={() => setFichaFactura(f)}
                            className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Ver Ficha Técnica Ejecutiva"
                          >
                            <Eye size={16} weight="bold" />
                          </button>

                          {/* Edición completa */}
                          <button
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar Factura"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>

                          {/* Marcar pagada */}
                          {f.estatus !== 'pagada' && (
                            <button
                              onClick={() => marcarPagada(f.id)}
                              className="flex items-center gap-1 text-[9px] font-label uppercase tracking-widest font-bold text-success hover:bg-success/15 px-2 py-1 rounded-lg border border-success/30 transition-all"
                              title="Marcar como Pagada"
                            >
                              <CheckCircle size={12} weight="bold" /> Pagada
                            </button>
                          )}

                          {/* Eliminar individual */}
                          <button
                            onClick={() => handleDeleteSingle(f.id)}
                            className="p-1.5 text-outline hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                            title="Eliminar Factura"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-outline font-label uppercase tracking-widest font-semibold">
                      No se encontraron facturas con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Vista Tarjetas (Cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {paginatedFacturas.map(f => {
              const dias = f.diasAntiguedad ?? f.dias_antiguedad ?? 0;
              return (
                <div
                  key={f.id}
                  className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs hover:border-primary/40 transition-all relative flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-mono text-lg font-bold text-primary">{f.folio}</div>
                      <div className="font-semibold text-sm text-on-surface mt-0.5">{f.cliente}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(f.id)}
                      onChange={() => toggleSelection(f.id)}
                      className="mt-1"
                    />
                  </div>

                  <div className="my-3">
                    <div className="text-2xl font-headline font-bold text-on-surface">{fmt(f.monto)}</div>
                    <div className="text-xs text-outline mt-1">Emitida: {f.fechaEmision || f.fecha_emision}</div>
                  </div>

                  <div className="pt-3 border-t border-outline-variant flex items-center justify-between gap-2">
                    <span className={`badge border ${semaforoBg(dias)} ${semaforoColor(dias)}`}>
                      <Clock size={10} /> {dias} días
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFichaFactura(f)}
                        className="p-1.5 text-outline hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="Ver Ficha Técnica"
                      >
                        <Eye size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-1.5 text-outline hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="Editar Factura"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>
                      {f.estatus !== 'pagada' && (
                        <button
                          onClick={() => marcarPagada(f.id)}
                          className="text-[10px] bg-success text-on-success px-2.5 py-1 rounded-lg hover:brightness-110 uppercase font-bold"
                        >
                          Pagar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSingle(f.id)}
                        className="p-1.5 text-outline hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-outline font-label uppercase tracking-widest font-semibold">
                No se encontraron facturas con los filtros seleccionados
              </div>
            )}
          </div>
        )}

        {/* Paginador numérico */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-outline-variant flex items-center justify-between gap-4 bg-surface-container-lowest">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-label uppercase tracking-wider font-bold transition-all ${
                safePage <= 1
                  ? 'border-outline-variant/40 text-outline/40 cursor-not-allowed'
                  : 'border-outline-variant text-outline hover:text-on-surface hover:border-primary/40'
              }`}
            >
              <CaretLeft size={14} weight="bold" /> Anterior
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                // Mostrar solo páginas relevantes si hay muchas
                if (totalPages > 7) {
                  if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - safePage) > 2) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="text-outline px-1">...</span>;
                    }
                    return null;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                      safePage === pageNum
                        ? 'bg-primary text-black shadow-xs font-extrabold'
                        : 'text-outline hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-label uppercase tracking-wider font-bold transition-all ${
                safePage >= totalPages
                  ? 'border-outline-variant/40 text-outline/40 cursor-not-allowed'
                  : 'border-outline-variant text-outline hover:text-on-surface hover:border-primary/40'
              }`}
            >
              Siguiente <CaretRight size={14} weight="bold" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Nueva Tabla Tabular de Resumen de Morosidad por Cliente */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline text-lg font-bold flex items-center gap-2 text-on-surface">
              <Clock size={20} className="text-primary" weight="bold" />
              Resumen de Morosidad por Cliente
            </h3>
            <p className="text-xs text-outline mt-0.5">
              Haz clic en cualquier cliente para filtrar inmediatamente la tabla de facturas superior.
            </p>
          </div>
          {clienteSeleccionado !== 'todos' && (
            <button
              onClick={() => handleClienteChange('todos')}
              className="self-start sm:self-auto text-xs font-label uppercase tracking-wider text-danger font-bold hover:underline px-3 py-1 rounded-xl hover:bg-danger/10"
            >
              Quitar filtro: <span className="underline">{clienteSeleccionado}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant">
          <table className="cif-table w-full">
            <thead>
              <tr className="bg-surface-container">
                <th className="text-left font-label text-[10px] uppercase tracking-wider">Cliente</th>
                <th className="text-center font-label text-[10px] uppercase tracking-wider">Total Facturas</th>
                <th className="text-right font-label text-[10px] uppercase tracking-wider text-success">Al Corriente (≤30d)</th>
                <th className="text-right font-label text-[10px] uppercase tracking-wider text-warning">Atraso 31-60d</th>
                <th className="text-right font-label text-[10px] uppercase tracking-wider text-warning">Atraso 61-90d</th>
                <th className="text-right font-label text-[10px] uppercase tracking-wider text-danger">Morosidad Crítica (&gt;90d)</th>
                <th className="text-right font-label text-[10px] uppercase tracking-wider text-primary">Total Adeudo</th>
              </tr>
            </thead>
            <tbody>
              {resumenMorosidadClientes.map((c, idx) => {
                const isSelected = clienteSeleccionado === c.cliente;
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        handleClienteChange('todos');
                      } else {
                        handleClienteChange(c.cliente);
                      }
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/15 font-bold border-l-4 border-l-primary'
                        : 'hover:bg-surface-container-high/60'
                    }`}
                  >
                    <td className="font-bold text-on-surface uppercase text-xs">
                      {c.cliente}
                      {isSelected && <span className="ml-2 text-[10px] text-primary">(Filtrado)</span>}
                    </td>
                    <td className="text-center font-mono text-xs">{c.totalFacturas}</td>
                    <td className="text-right font-mono text-xs text-success font-semibold">{fmt(c.alCorriente)}</td>
                    <td className="text-right font-mono text-xs text-warning font-semibold">{fmt(c.atraso31_60)}</td>
                    <td className="text-right font-mono text-xs text-warning font-semibold">{fmt(c.atraso61_90)}</td>
                    <td className="text-right font-mono text-xs text-danger font-bold">{fmt(c.atrasoMas90)}</td>
                    <td className="text-right font-mono text-xs font-bold text-primary">{fmt(c.totalAdeudo)}</td>
                  </tr>
                );
              })}

              {resumenMorosidadClientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-outline font-label uppercase tracking-widest text-xs">
                    No hay registros de morosidad disponibles
                  </td>
                </tr>
              )}
            </tbody>
            {resumenMorosidadClientes.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container-high font-bold border-t-2 border-outline-variant">
                  <td className="text-left font-label text-xs uppercase tracking-wider text-on-surface">Totales Generales</td>
                  <td className="text-center font-mono text-xs">{totalesMorosidad.totalFacturas}</td>
                  <td className="text-right font-mono text-xs text-success">{fmt(totalesMorosidad.alCorriente)}</td>
                  <td className="text-right font-mono text-xs text-warning">{fmt(totalesMorosidad.atraso31_60)}</td>
                  <td className="text-right font-mono text-xs text-warning">{fmt(totalesMorosidad.atraso61_90)}</td>
                  <td className="text-right font-mono text-xs text-danger">{fmt(totalesMorosidad.atrasoMas90)}</td>
                  <td className="text-right font-mono text-xs text-primary font-black">{fmt(totalesMorosidad.totalAdeudo)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: Ficha Técnica Ejecutiva */}
      {fichaFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in">
          <div className="bg-surface border border-outline-variant w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <FileText size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">Ficha Técnica Ejecutiva</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-primary">{fichaFactura.folio}</span>
                    <span className={`badge text-[10px] ${
                      fichaFactura.estatus === 'pagada'
                        ? 'badge-success'
                        : fichaFactura.estatus === 'vencida'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }`}>
                      {fichaFactura.estatus}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFichaFactura(null)}
                className="p-2 text-outline hover:text-danger rounded-xl hover:bg-danger/10 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Contenido Ficha */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* UUID SAT */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold block">Folio Fiscal Digital (UUID)</span>
                  <span className="font-mono text-xs text-on-surface font-semibold truncate block mt-0.5 select-all">
                    {fichaFactura.uuid || 'Sin UUID registrado (Factura Interna o Manual)'}
                  </span>
                </div>
                {fichaFactura.uuid && (
                  <button
                    onClick={() => handleCopyUuid(fichaFactura.uuid)}
                    className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1 font-label uppercase tracking-wider font-bold"
                  >
                    {copiadoUuid ? '¡Copiado!' : 'Copiar'}
                  </button>
                )}
              </div>

              {/* Partes Fiscales (Emisor / Receptor) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
                  <span className="font-label text-[10px] uppercase tracking-wider text-primary font-bold block">Emisor (Proveedor)</span>
                  <div className="font-bold text-sm text-on-surface">{fichaFactura.nombre_emisor || 'Cruces Internacionales Fronterizos S.A. de C.V.'}</div>
                  <div className="font-mono text-xs text-outline">RFC: {fichaFactura.rfc_emisor || 'CIF890101XYZ'}</div>
                </div>
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
                  <span className="font-label text-[10px] uppercase tracking-wider text-primary font-bold block">Receptor (Cliente)</span>
                  <div className="font-bold text-sm text-on-surface">{fichaFactura.cliente}</div>
                  <div className="font-mono text-xs text-outline">RFC: {fichaFactura.rfc_receptor || 'XAXX010101000'}</div>
                </div>
              </div>

              {/* Bloque Financiero */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3">
                <div className="font-label text-[10px] uppercase tracking-wider text-outline font-semibold">Desglose Financiero</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-outline uppercase block">Subtotal</span>
                    <span className="font-mono text-base font-bold text-on-surface">{fmt(fichaFactura.subtotal ?? fichaFactura.monto)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase block">Moneda</span>
                    <span className="font-mono text-base font-bold text-on-surface">{fichaFactura.moneda || 'MXN'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase block">Monto Total</span>
                    <span className="font-mono text-xl font-extrabold text-primary">{fmt(fichaFactura.monto)}</span>
                  </div>
                </div>
              </div>

              {/* Bloque Fechas y Antigüedad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="font-label text-[10px] uppercase tracking-wider text-outline block">F. Emisión</span>
                  <span className="font-mono text-xs font-bold text-on-surface mt-1 block">
                    {fichaFactura.fecha_emision || fichaFactura.fechaEmision || 'N/D'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="font-label text-[10px] uppercase tracking-wider text-outline block">F. Vencimiento</span>
                  <span className="font-mono text-xs font-bold text-on-surface mt-1 block">
                    {fichaFactura.fecha_vencimiento || '30 días estándar'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="font-label text-[10px] uppercase tracking-wider text-outline block">Antigüedad</span>
                  <span className={`font-bold text-xs mt-1 block ${semaforoColor(fichaFactura.diasAntiguedad ?? fichaFactura.dias_antiguedad ?? 0)}`}>
                    {fichaFactura.diasAntiguedad ?? fichaFactura.dias_antiguedad ?? 0} días
                  </span>
                </div>
              </div>

              {/* Concepto / Notas */}
              {(fichaFactura.concepto || fichaFactura.notas) && (
                <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest space-y-1">
                  <span className="font-label text-[10px] uppercase tracking-wider text-outline block">Notas y Concepto</span>
                  <p className="text-xs text-on-surface whitespace-pre-wrap">{fichaFactura.concepto || fichaFactura.notas}</p>
                </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-outline-variant text-outline hover:text-on-surface px-4 py-2 rounded-xl text-xs font-label uppercase tracking-wider font-bold transition-all"
              >
                <Printer size={16} weight="bold" /> Imprimir Ficha
              </button>

              <div className="flex items-center gap-3">
                {fichaFactura.estatus !== 'pagada' && (
                  <button
                    onClick={() => marcarPagada(fichaFactura.id)}
                    className="flex items-center gap-2 bg-success text-on-success px-4 py-2 rounded-xl text-xs font-label uppercase tracking-wider font-bold hover:brightness-110 transition-all shadow-xs"
                  >
                    <CheckCircle size={16} weight="bold" /> Marcar Pagada
                  </button>
                )}
                <button
                  onClick={() => setFichaFactura(null)}
                  className="bg-primary text-black px-5 py-2 rounded-xl text-xs font-label uppercase tracking-wider font-bold hover:brightness-110 transition-all shadow-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edición Completa de Factura */}
      {editFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in">
          <div className="bg-surface border border-outline-variant w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <PencilSimple size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">Editar Factura</h3>
                  <p className="text-xs text-outline mt-0.5">Modificación de registro #{editFactura.id} ({editFactura.folio})</p>
                </div>
              </div>
              <button
                onClick={() => setEditFactura(null)}
                className="p-2 text-outline hover:text-danger rounded-xl hover:bg-danger/10 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              {editError && (
                <div className="p-3.5 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs font-semibold">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Folio *</label>
                  <input
                    type="text"
                    required
                    value={editForm.folio || ''}
                    onChange={e => setEditForm({ ...editForm, folio: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Cliente *</label>
                  <input
                    type="text"
                    required
                    value={editForm.cliente || ''}
                    onChange={e => setEditForm({ ...editForm, cliente: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Monto Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.monto ?? 0}
                    onChange={e => setEditForm({ ...editForm, monto: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.subtotal ?? 0}
                    onChange={e => setEditForm({ ...editForm, subtotal: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Moneda</label>
                  <select
                    value={editForm.moneda || 'MXN'}
                    onChange={e => setEditForm({ ...editForm, moneda: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-bold"
                  >
                    <option value="MXN">MXN (Pesos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">F. Emisión *</label>
                  <input
                    type="date"
                    required
                    value={editForm.fecha_emision || ''}
                    onChange={e => setEditForm({ ...editForm, fecha_emision: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">F. Vencimiento</label>
                  <input
                    type="date"
                    value={editForm.fecha_vencimiento || ''}
                    onChange={e => setEditForm({ ...editForm, fecha_vencimiento: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">F. Pago</label>
                  <input
                    type="date"
                    value={editForm.fecha_pago || ''}
                    onChange={e => setEditForm({ ...editForm, fecha_pago: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Estatus</label>
                  <select
                    value={editForm.estatus || 'pendiente'}
                    onChange={e => setEditForm({ ...editForm, estatus: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-bold"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="vencida">Vencida</option>
                    <option value="pagada">Pagada</option>
                  </select>
                </div>

                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">UUID Fiscal</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={editForm.uuid || ''}
                    onChange={e => setEditForm({ ...editForm, uuid: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1">Notas / Observaciones</label>
                <textarea
                  rows={3}
                  value={editForm.notas || ''}
                  onChange={e => setEditForm({ ...editForm, notas: e.target.value })}
                  placeholder="Observaciones de cobranza..."
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface p-3 rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditFactura(null)}
                  className="px-4 py-2 border border-outline-variant text-outline hover:text-on-surface rounded-xl text-xs font-label uppercase tracking-wider font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-primary text-black px-6 py-2 rounded-xl text-xs font-label uppercase tracking-wider font-bold hover:brightness-110 transition-all shadow-xs disabled:opacity-50"
                >
                  {editSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

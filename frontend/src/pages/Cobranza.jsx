import { useState, useMemo } from 'react';
import { CurrencyCircleDollar, CheckCircle, WarningCircle, Clock, Receipt, Download, FilePdf, MagnifyingGlass } from '@phosphor-icons/react';
import { useData } from '../context/DataContext';

export default function Cobranza() {
  const { facturas, addFacturaYCliente, updateFacturaEstatus } = useData();
  const [filtro, setFiltro] = useState('todos');
  const [atrasoRango, setAtrasoRango] = useState('todos');
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('todos');

  // Obtener lista única de clientes con facturas
  const clientesConFacturas = useMemo(() => {
    const nombres = facturas.map(f => f.cliente);
    return ['todos', ...new Set(nombres)].sort((a, b) => {
      if (a === 'todos') return -1;
      if (b === 'todos') return 1;
      return a.localeCompare(b);
    });
  }, [facturas]);

  const filtered = useMemo(() => {
    return facturas.filter(f => {
      // 1. Filtrar por estatus
      if (filtro !== 'todos' && f.estatus !== filtro) return false;

      // 2. Filtrar por rangos de días de atraso
      if (atrasoRango !== 'todos') {
        const dias = f.diasAntiguedad || 0;
        if (atrasoRango === '30' && (dias < 0 || dias > 30)) return false;
        if (atrasoRango === '60' && (dias <= 30 || dias > 60)) return false;
        if (atrasoRango === '90' && (dias <= 60 || dias > 90)) return false;
        if (atrasoRango === '90mas' && dias <= 90) return false;
      }

      // 3. Filtrar por cliente seleccionado
      if (clienteSeleccionado !== 'todos' && f.cliente !== clienteSeleccionado) return false;

      // 4. Filtrar por búsqueda rápida
      if (buscarCliente.trim()) {
        const q = buscarCliente.toLowerCase().trim();
        return f.cliente.toLowerCase().includes(q) || f.folio.toLowerCase().includes(q);
      }

      return true;
    });
  }, [facturas, filtro, atrasoRango, clienteSeleccionado, buscarCliente]);

  // Resumen de morosidad agrupado por cliente
  const resumenClientes = useMemo(() => {
    const map = {};
    facturas.forEach(f => {
      if (!map[f.cliente]) {
        map[f.cliente] = { cliente: f.cliente, total: 0, alCorriente: 0, atraso30: 0, atraso60: 0, atrasoMas90: 0, count: 0 };
      }
      const item = map[f.cliente];
      item.total += f.monto;
      item.count++;
      
      const dias = f.diasAntiguedad || 0;
      if (f.estatus === 'pagada') {
        item.alCorriente += f.monto;
      } else {
        if (dias <= 30) item.atraso30 += f.monto;
        else if (dias <= 90) item.atraso60 += f.monto;
        else item.atrasoMas90 += f.monto;
      }
    });
    return Object.values(map).sort((a, b) => b.atrasoMas90 - a.atrasoMas90 || b.total - a.total);
  }, [facturas]);

  const stats = useMemo(() => ({
    total: facturas.reduce((s, f) => s + f.monto, 0),
    pendiente: facturas.filter(f => f.estatus === 'pendiente').reduce((s, f) => s + f.monto, 0),
    vencida: facturas.filter(f => f.estatus === 'vencida').reduce((s, f) => s + f.monto, 0),
    pagada: facturas.filter(f => f.estatus === 'pagada').reduce((s, f) => s + f.monto, 0),
    countPendiente: facturas.filter(f => f.estatus === 'pendiente').length,
    countVencida: facturas.filter(f => f.estatus === 'vencida').length,
    countPagada: facturas.filter(f => f.estatus === 'pagada').length,
  }), [facturas]);

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const marcarPagada = async (id) => {
    await updateFacturaEstatus(id, 'pagada');
  };

  const semaforoColor = (dias) => {
    if (dias <= 30) return 'text-success';
    if (dias <= 90) return 'text-warning';
    return 'text-danger';
  };
  const semaforoBg = (dias) => {
    if (dias <= 30) return 'bg-success/10 border-success/20';
    if (dias <= 90) return 'bg-warning/10 border-warning/20';
    return 'bg-danger/10 border-danger/20';
  };

  // Exportar vista pre-filtrada a CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No hay facturas en la vista actual para exportar.");
      return;
    }

    const headers = ["Folio", "Cliente", "Monto", "Fecha Emision", "Dias Antiguedad", "Estatus"];
    const rows = filtered.map(f => [
      f.folio,
      `"${f.cliente.replace(/"/g, '""')}"`,
      f.monto,
      f.fechaEmision || f.fecha_emision,
      f.diasAntiguedad,
      f.estatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_cxc_${filtro}_${atrasoRango}dias.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar reporte PDF usando jsPDF y AutoTable vía inyección dinámica de CDN
  const handleExportPDF = () => {
    if (filtered.length === 0) {
      alert("No hay facturas en la vista actual para exportar.");
      return;
    }

    const loadScript = (url) => new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const runPDFGen = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Cabecera del PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CRUCES INTERNACIONALES FRONTERIZOS", 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Reporte de Morosidad y Cuentas por Cobrar (CxC)", 14, 26);
      doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-MX')}`, 14, 32);

      // Tabla de contenido
      const columnsHeaders = ["Folio", "Cliente", "Monto (MXN)", "Fecha Emision", "Dias Atraso", "Estatus"];
      const rowsData = filtered.map(f => [
        f.folio,
        f.cliente,
        fmt(f.monto),
        f.fechaEmision || f.fecha_emision,
        `${f.diasAntiguedad} días`,
        f.estatus.toUpperCase()
      ]);

      doc.autoTable({
        startY: 38,
        head: [columnsHeaders],
        body: rowsData,
        theme: 'striped',
        headStyles: { fillColor: [184, 134, 11] }, // Estilo dorado CIF
        margin: { top: 38 },
      });

      doc.save(`reporte_morosidad_cxc_${Date.now()}.pdf`);
    };

    if (!window.jspdf) {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then(() => {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js").then(() => {
          runPDFGen();
        });
      });
    } else {
      runPDFGen();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlString = event.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Parseo flexible CFDI v3.3 y v4.0
        const getTag = (name) => xmlDoc.getElementsByTagName(`cfdi:${name}`)[0] || xmlDoc.getElementsByTagName(name)[0];
        const getTimbreTag = () => xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0] || xmlDoc.getElementsByTagName("TimbreFiscalDigital")[0];
        
        const comprobante = getTag("Comprobante");
        const receptor = getTag("Receptor");
        const emisor = getTag("Emisor");
        const timbre = getTimbreTag();

        if (!comprobante) {
          alert("❌ El archivo no parece ser un CFDI de factura válido.");
          return;
        }

        const serie = comprobante.getAttribute("Serie") || "";
        const folioStr = comprobante.getAttribute("Folio") || Math.floor(Math.random() * 10000).toString();
        const fechaFull = comprobante.getAttribute("Fecha");
        const fechaEmision = fechaFull ? fechaFull.split('T')[0] : new Date().toISOString().split('T')[0];
        const total = parseFloat(comprobante.getAttribute("Total") || 0);
        const subtotal = parseFloat(comprobante.getAttribute("SubTotal") || total);
        const moneda = comprobante.getAttribute("Moneda") || "MXN";
        
        const nombreCliente = receptor ? (receptor.getAttribute("Nombre") || receptor.getAttribute("Rfc") || "Cliente Desconocido") : "Cliente Desconocido";
        const rfcReceptor = receptor ? receptor.getAttribute("Rfc") : null;
        const rfcEmisor = emisor ? emisor.getAttribute("Rfc") : null;
        const nombreEmisor = emisor ? emisor.getAttribute("Nombre") : null;
        const uuid = timbre ? timbre.getAttribute("UUID") : null;

        const today = new Date('2026-06-15');
        const diffTime = today.getTime() - new Date(fechaEmision).getTime();
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

        // Esperar inserción
        await addFacturaYCliente(newFactura, nombreCliente);
        alert(`✅ CFDI procesado correctamente:\nFolio: ${newFactura.folio}\nCliente: ${newFactura.cliente}\nMonto: ${fmt(newFactura.monto)}`);
      } catch (error) {
        console.error("Error procesando XML:", error);
        alert("Hubo un error al intentar leer el archivo XML.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // resetear input
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">Finanzas</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <CurrencyCircleDollar size={32} weight="light" className="text-primary" />
            Cobranza y Cuentas por Cobrar
          </h1>
          <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">Rastreo de morosidad · Semáforo de antigüedad</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 transition-all shadow-md"
          >
            <FilePdf size={14} weight="bold" /> Exportar PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-primary text-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-primary/10 transition-all"
          >
            <Download size={14} weight="bold" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Resumen por Cliente (Cards de Morosidad) */}
      <div className="space-y-3">
        <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">Resumen Morosidad por Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumenClientes.map((c, idx) => (
            <div key={idx} onClick={() => setClienteSeleccionado(c.cliente)} className={`cursor-pointer p-4 border transition-all ${clienteSeleccionado === c.cliente ? 'border-primary bg-primary/5 shadow-md' : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-on-surface uppercase text-sm truncate max-w-[180px]">{c.cliente}</span>
                <span className="text-[10px] font-mono font-bold text-outline">{c.count} facturas</span>
              </div>
              <div className="text-lg font-headline font-bold text-on-surface mb-3">{fmt(c.total)}</div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/10 text-center">
                <div>
                  <span className="text-[8px] font-label uppercase text-success block">≤30 Días</span>
                  <span className="text-xs font-mono font-bold text-success">{fmt(c.atraso30)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-label uppercase text-warning block">31-90 Días</span>
                  <span className="text-xs font-mono font-bold text-warning">{fmt(c.atraso60)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-label uppercase text-danger block">&gt;90 Días</span>
                  <span className="text-xs font-mono font-bold text-danger">{fmt(c.atrasoMas90)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-5">
          <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-2">Total CxC</div>
          <div className="text-2xl font-headline font-bold text-primary">{fmt(stats.total)}</div>
          <div className="font-label text-[9px] text-outline mt-1">{facturas.length} facturas</div>
        </div>
        <div className="bg-success/5 border border-success/20 p-5">
          <div className="font-label text-[9px] uppercase tracking-widest text-success mb-2">Pagadas</div>
          <div className="text-2xl font-headline font-bold text-success">{fmt(stats.pagada)}</div>
          <div className="font-label text-[9px] text-outline mt-1">{stats.countPagada} facturas</div>
        </div>
        <div className="bg-warning/5 border border-warning/20 p-5">
          <div className="font-label text-[9px] uppercase tracking-widest text-warning mb-2">Pendientes</div>
          <div className="text-2xl font-headline font-bold text-warning">{fmt(stats.pendiente)}</div>
          <div className="font-label text-[9px] text-outline mt-1">{stats.countPendiente} facturas</div>
        </div>
        <div className="bg-danger/5 border border-danger/20 p-5">
          <div className="font-label text-[9px] uppercase tracking-widest text-danger mb-2">Vencidas (+60 días)</div>
          <div className="text-2xl font-headline font-bold text-danger">{fmt(stats.vencida)}</div>
          <div className="font-label text-[9px] text-outline mt-1">{stats.countVencida} facturas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline">Estatus:</span>
            {['todos','pendiente','vencida','pagada'].map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`font-label text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 border transition-all
                  ${filtro === f ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant/30 text-outline hover:text-on-surface'}`}>
                {f === 'todos' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline">Días de atraso:</span>
            {[
              { value: 'todos', label: 'Todos' },
              { value: '30', label: '≤ 30 días' },
              { value: '60', label: '31 - 60 días' },
              { value: '90', label: '61 - 90 días' },
              { value: '90mas', label: '> 90 días' }
            ].map(r => (
              <button key={r.value} onClick={() => setAtrasoRango(r.value)}
                className={`font-label text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 border transition-all
                  ${atrasoRango === r.value ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant/30 text-outline hover:text-on-surface'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtrado y Búsqueda por Cliente */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 border-t border-outline-variant/10">
          <div className="w-full sm:w-72 flex items-center gap-2 bg-background border border-outline-variant/20 px-3 py-2">
            <MagnifyingGlass size={16} className="text-outline" />
            <input
              type="text"
              placeholder="Buscar por cliente o folio..."
              value={buscarCliente}
              onChange={e => setBuscarCliente(e.target.value)}
              className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline/50 outline-none"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3 ml-auto">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline shrink-0">Filtrar Cliente:</span>
            <select
              value={clienteSeleccionado}
              onChange={e => setClienteSeleccionado(e.target.value)}
              className="bg-background border border-outline-variant/20 text-on-surface px-4 py-2 text-xs outline-none focus:border-primary max-w-xs uppercase font-bold"
            >
              <option value="todos">Todos los Clientes</option>
              {clientesConFacturas.filter(c => c !== 'todos').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {clienteSeleccionado !== 'todos' && (
              <button onClick={() => setClienteSeleccionado('todos')} className="text-[10px] font-label uppercase text-danger font-bold hover:underline">Limpiar</button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain">
        <div className="overflow-x-auto">
          <table className="cif-table">
            <thead>
              <tr>
                <th>Folio</th><th>Cliente</th><th>Monto</th><th>F. Emisión</th><th>Antigüedad</th><th>Estatus</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-white/[0.02]">
                  <td className="font-mono font-bold text-primary">{f.folio}</td>
                  <td className="font-semibold">{f.cliente}</td>
                  <td className="font-mono font-bold">{fmt(f.monto)}</td>
                  <td className="text-xs text-outline">{f.fechaEmision || f.fecha_emision}</td>
                  <td>
                    <span className={`badge border ${semaforoBg(f.diasAntiguedad)} ${semaforoColor(f.diasAntiguedad)}`}>
                      <Clock size={10} /> {f.diasAntiguedad} días
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.estatus === 'pagada' ? 'badge-success' : f.estatus === 'vencida' ? 'badge-danger' : 'badge-warning'}`}>
                      {f.estatus === 'pagada' && <CheckCircle size={10} />}
                      {f.estatus === 'vencida' && <WarningCircle size={10} />}
                      {f.estatus}
                    </span>
                  </td>
                  <td>
                    {f.estatus !== 'pagada' && (
                      <button onClick={() => marcarPagada(f.id)}
                        className="flex items-center gap-1.5 text-[9px] font-label uppercase tracking-widest font-bold text-success hover:bg-success/10 px-3 py-1.5 border border-success/20 transition-all">
                        <CheckCircle size={12} weight="bold" /> Pagada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-outline font-label uppercase tracking-widest opacity-50">
                    No se encontraron facturas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* XML Upload hint */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-6 flex items-center gap-4">
        <Receipt size={24} className="text-primary flex-shrink-0" />
        <div>
          <div className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Carga de Facturas XML</div>
          <p className="text-xs text-outline">Arrastra archivos XML del SAT aquí para extraer automáticamente la Fecha de Emisión, UUID, Receptor, Emisor y el Monto.</p>
        </div>
        <label className="ml-auto cursor-pointer border border-dashed border-primary/40 px-5 py-3 font-label text-[10px] uppercase tracking-widest text-primary font-bold hover:bg-primary/10 transition-all">
          Subir XML
          <input type="file" accept=".xml" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
    </div>
  );
}

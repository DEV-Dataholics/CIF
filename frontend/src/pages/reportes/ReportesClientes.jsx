import React, { useState, useMemo } from 'react';
import { Users, FileText, MicrosoftExcelLogo, Funnel, CurrencyDollar, Calculator } from '@phosphor-icons/react';
import { useData } from '../../context/DataContext';
import preciosData from '../../data/precios.json';
import * as XLSX from 'xlsx';

export default function ReportesClientes() {
  const { clientes: clientesData, movimientos: movimientosData } = useData();
  const [selectedCliente, setSelectedCliente] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const TIPO_CAMBIO = 17.2023; // Fijo para pruebas UAT

  const clientesList = useMemo(() => {
    return [...new Set(clientesData.filter(c => c.activo).map(c => c.razonSocial))];
  }, [clientesData]);

  // 1. Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    if (!selectedCliente) return []; // Es obligatorio el cliente para pre-facturar
    return movimientosData.filter(m => {
      if (m.cliente !== selectedCliente) return false;
      if (fechaInicio && m.fecha < fechaInicio) return false;
      if (fechaFin && m.fecha > fechaFin) return false;
      return true;
    });
  }, [movimientosData, selectedCliente, fechaInicio, fechaFin]);

  // 2. Enriquecer con Tarifas USD
  const movimientosConTarifa = useMemo(() => {
    return movimientosFiltrados.map(mov => {
      // Buscar la tarifa aplicable
      const tarifaAplicable = preciosData.find(
        p => p.cliente === mov.cliente && p.tipoMovimiento === mov.tipoMov
      );
      return {
        ...mov,
        tarifaUSD: tarifaAplicable && tarifaAplicable.dolares ? tarifaAplicable.dolares : 0
      };
    });
  }, [movimientosFiltrados]);

  // 3. Agrupamiento Dual: Operador -> Tipo de Movimiento
  const groupedData = useMemo(() => {
    const grupos = {};
    movimientosConTarifa.forEach(mov => {
      const op = mov.operador || 'SIN OPERADOR';
      const tipo = mov.tipoMov || 'INDEFINIDO';
      if (!grupos[op]) grupos[op] = {};
      if (!grupos[op][tipo]) grupos[op][tipo] = { viajes: [], tarifaUSD: mov.tarifaUSD };
      grupos[op][tipo].viajes.push(mov);
      // Mantener la tarifa USD en el grupo (se asume que es la misma para el mismo tipo y cliente)
      if (mov.tarifaUSD > 0) grupos[op][tipo].tarifaUSD = mov.tarifaUSD;
    });

    // Ordenar operadores alfabéticamente
    return Object.keys(grupos).sort().reduce((acc, key) => {
      acc[key] = grupos[key];
      return acc;
    }, {});
  }, [movimientosConTarifa]);

  // 4. Resumen Consolidado Final
  const resumen = useMemo(() => {
    const totalesPorTipo = {};
    let totalGlobalUSD = 0;
    let totalViajesGlobal = 0;

    movimientosConTarifa.forEach(mov => {
      const tipo = mov.tipoMov || 'INDEFINIDO';
      if (!totalesPorTipo[tipo]) {
        totalesPorTipo[tipo] = {
          cantidad: 0,
          precioUnitario: mov.tarifaUSD,
          precioTotal: 0
        };
      }
      totalesPorTipo[tipo].cantidad += 1;
      // Actualizar unitario si lo encontramos
      if (mov.tarifaUSD > 0) totalesPorTipo[tipo].precioUnitario = mov.tarifaUSD;
    });

    // Calcular totales
    Object.keys(totalesPorTipo).forEach(tipo => {
      totalesPorTipo[tipo].precioTotal = totalesPorTipo[tipo].cantidad * totalesPorTipo[tipo].precioUnitario;
      totalGlobalUSD += totalesPorTipo[tipo].precioTotal;
      totalViajesGlobal += totalesPorTipo[tipo].cantidad;
    });

    return {
      desglose: totalesPorTipo,
      totalGlobalUSD,
      totalGlobalMXN: totalGlobalUSD * TIPO_CAMBIO,
      totalViajesGlobal
    };
  }, [movimientosConTarifa]);

  const exportExcel = () => {
    // Generar un exporte plano pero con tarifas
    const ws = XLSX.utils.json_to_sheet(movimientosConTarifa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pre-Facturacion');
    XLSX.writeFile(wb, `Pre_Factura_${selectedCliente || 'Todos'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Explicación del Reporte */}
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-display font-bold text-on-surface mb-2 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Reporte de Pre-Facturación Operativa
            </h1>
            <p className="text-sm text-on-surface-variant font-body">
              Documento de conciliación semanal. Cruza viajes físicos con el tabulador de dólares. Obligatorio seleccionar Cliente para pre-facturar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportExcel} 
              disabled={!selectedCliente}
              className="flex items-center gap-2 bg-surface border border-outline-variant/30 text-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-surface-variant transition-all disabled:opacity-50"
            >
              <MicrosoftExcelLogo size={14} weight="bold" /> Exportar Excel
            </button>
            <button className="flex items-center gap-2 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest px-5 py-3 hover:brightness-110 transition-all shadow-md">
              Imprimir Reporte (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-low border border-outline-variant/20 matte-grain p-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <Funnel size={18} weight="bold" />
          <h3 className="font-label font-bold text-xs uppercase tracking-widest">Filtros (Obligatorio Cliente)</h3>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">CLIENTE *</label>
            <select value={selectedCliente} onChange={e => setSelectedCliente(e.target.value)} className="bg-surface border border-primary/40 text-on-surface px-4 py-2 text-sm font-body outline-none focus:border-primary min-w-[200px]">
              <option value="">-- SELECCIONAR CLIENTE --</option>
              {clientesList.map((c, i) => <option key={`${c}-${i}`} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-surface border border-outline-variant/30 p-1">
            <div className="flex items-center gap-2 px-3 py-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">De:</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-transparent text-sm font-bold text-primary outline-none" />
            </div>
            <div className="w-[1px] h-6 bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 px-3 py-1">
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Hasta:</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-transparent text-sm font-bold text-primary outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(fechaInicio || fechaFin || selectedCliente) && (
              <button onClick={() => { setFechaInicio(''); setFechaFin(''); setSelectedCliente(''); }} className="font-label text-[10px] uppercase tracking-widest text-danger hover:text-red-400 font-bold underline">
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visor de Pre-Facturación */}
      {selectedCliente ? (
        <div className="space-y-6">
          
          {/* Listado Agrupado Dual */}
          <div className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/20 flex justify-between items-center">
              <h2 className="font-display font-bold text-lg text-on-surface">Detalle Operativo</h2>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">Total Viajes: {resumen.totalViajesGlobal}</span>
            </div>
            
            <div className="p-6 space-y-8 h-[500px] overflow-y-auto">
              {Object.keys(groupedData).length === 0 ? (
                <div className="text-center text-outline font-body py-10">No hay movimientos registrados para estos filtros.</div>
              ) : (
                Object.keys(groupedData).map(operador => (
                  <div key={operador} className="border border-outline-variant/20 rounded-md overflow-hidden">
                    {/* Header Operador */}
                    <div className="bg-surface-container border-b border-outline-variant/20 p-3 px-4 flex items-center gap-3">
                      <Users size={18} className="text-primary" />
                      <h3 className="font-bold text-sm text-on-surface uppercase">{operador}</h3>
                    </div>
                    
                    {/* Body Tipos de Movimiento */}
                    <div className="p-4 space-y-6 bg-background">
                      {Object.keys(groupedData[operador]).sort().map(tipo => {
                        const grupoTipo = groupedData[operador][tipo];
                        return (
                          <div key={tipo} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-label text-xs uppercase tracking-widest font-bold text-primary pl-2 border-l-2 border-primary">
                                {tipo}
                              </h4>
                              <span className="font-mono text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">
                                Tarifa: ${grupoTipo.tarifaUSD.toFixed(2)} USD
                              </span>
                            </div>
                            
                            <table className="w-full text-left text-xs font-body border border-outline-variant/20">
                              <thead className="bg-surface">
                                <tr>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Fecha</th>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Tractor</th>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Caja</th>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Vale Físico</th>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Sello</th>
                                  <th className="p-2 border-b border-outline-variant/20 font-bold">Origen / Destino</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grupoTipo.viajes.map((mov, i) => (
                                  <tr key={i} className="hover:bg-surface-variant/20 transition-colors">
                                    <td className="p-2 border-b border-outline-variant/10 font-mono">{mov.fecha} {mov.hora}</td>
                                    <td className="p-2 border-b border-outline-variant/10 font-mono">{mov.tractor}</td>
                                    <td className="p-2 border-b border-outline-variant/10 font-mono">{mov.caja}</td>
                                    <td className="p-2 border-b border-outline-variant/10 font-mono">{mov.facPedimento || mov.numVoucher}</td>
                                    <td className="p-2 border-b border-outline-variant/10">{mov.sello}</td>
                                    <td className="p-2 border-b border-outline-variant/10 truncate max-w-[200px]" title={`${mov.origen} -> ${mov.destino}`}>
                                      {mov.origen} &rarr; {mov.destino}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cuadro de Resumen Final */}
          {Object.keys(groupedData).length > 0 && (
            <div className="bg-surface border border-outline-variant/30 shadow-md">
              <div className="p-4 border-b border-outline-variant/30 flex items-center gap-2">
                <Calculator size={20} className="text-primary" />
                <h2 className="font-display font-bold text-lg text-on-surface">Resumen de Pre-Facturación</h2>
              </div>
              <div className="p-6">
                <table className="w-full text-left text-sm font-body mb-6">
                  <thead className="bg-surface-container">
                    <tr>
                      <th className="p-3 font-label uppercase tracking-widest text-xs font-bold border-b border-outline-variant/20">Tipo de Movimiento</th>
                      <th className="p-3 font-label uppercase tracking-widest text-xs font-bold border-b border-outline-variant/20 text-center">Cantidad de Viajes</th>
                      <th className="p-3 font-label uppercase tracking-widest text-xs font-bold border-b border-outline-variant/20 text-right">Costo Unitario (USD)</th>
                      <th className="p-3 font-label uppercase tracking-widest text-xs font-bold border-b border-outline-variant/20 text-right">Costo Total (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(resumen.desglose).sort().map(tipo => {
                      const data = resumen.desglose[tipo];
                      return (
                        <tr key={tipo} className="border-b border-outline-variant/10">
                          <td className="p-3 font-bold">{tipo}</td>
                          <td className="p-3 text-center font-mono">{data.cantidad}</td>
                          <td className="p-3 text-right font-mono">${data.precioUnitario.toFixed(2)} USD</td>
                          <td className="p-3 text-right font-mono font-bold text-primary">${data.precioTotal.toFixed(2)} USD</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Tarjetas de Totales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-background border border-outline-variant/20 p-4 flex flex-col justify-center items-center">
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Total de Movimientos</span>
                    <span className="text-3xl font-display font-bold">{resumen.totalViajesGlobal} <span className="text-sm font-body text-outline font-normal">Viajes</span></span>
                  </div>
                  <div className="bg-surface-variant/30 border border-primary/30 p-4 flex flex-col justify-center items-center">
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1">
                      <CurrencyDollar size={14} /> Monto Total General (USD)
                    </span>
                    <span className="text-3xl font-display font-bold text-primary">${resumen.totalGlobalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="bg-surface-container-high border border-outline-variant/20 p-4 flex flex-col justify-center items-center">
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Monto de Equivalencia (MXN)</span>
                    <span className="text-2xl font-display font-bold text-on-surface">${resumen.totalGlobalMXN.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-xs text-outline mt-1 font-mono">T.C. de Referencia: {TIPO_CAMBIO} MXN/USD</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant/40 rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <Funnel size={48} className="text-outline-variant mb-4" />
          <h3 className="font-display text-xl font-bold text-on-surface mb-2">Seleccione un Cliente</h3>
          <p className="text-on-surface-variant font-body max-w-md">
            El reporteador de pre-facturación requiere que seleccione un cliente específico para cruzar las tarifas operativas vigentes.
          </p>
        </div>
      )}

    </div>
  );
}

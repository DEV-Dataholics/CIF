import React, { useState, useMemo } from 'react';
import { CurrencyDollar, Receipt, WarningCircle } from '@phosphor-icons/react';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';

export default function ReportesFacturacion() {
  const { facturas: facturasData, clientes: clientesData } = useData();
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedEstatus, setSelectedEstatus] = useState('');

  const clientesList = useMemo(() => clientesData.filter(c => c.activo).map(c => c.razonSocial), [clientesData]);

  const filteredFacturas = useMemo(() => {
    return facturasData.filter(f => {
      if (selectedCliente && f.cliente !== selectedCliente) return false;
      if (selectedEstatus && f.estatus !== selectedEstatus) return false;
      return true;
    });
  }, [facturasData, selectedCliente, selectedEstatus]);

  const stats = useMemo(() => {
    let facturado = 0;
    let pagado = 0;
    let pendiente = 0;

    filteredFacturas.forEach(f => {
      facturado += f.monto;
      if (f.estatus === 'pagada') pagado += f.monto;
      if (f.estatus === 'pendiente' || f.estatus === 'vencida') pendiente += f.monto;
    });

    return { facturado, pagado, pendiente };
  }, [filteredFacturas]); // El gran total siempre muestra la salud global de la empresa

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const COLUMNS = [
    { key: 'folio', label: 'FOLIO FACTURA' },
    { key: 'cliente', label: 'CLIENTE' },
    { key: 'fechaEmision', label: 'FECHA EMISIÓN' },
    { key: 'diasAntiguedad', label: 'DÍAS ANTIGÜEDAD' },
    { key: 'monto', label: 'MONTO', render: (val) => formatCurrency(val) },
    { 
      key: 'estatus', 
      label: 'ESTATUS',
      render: (val) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
          val === 'pagada' ? 'bg-green-500/20 text-green-500' :
          val === 'vencida' ? 'bg-red-500/20 text-red-500' :
          'bg-orange-500/20 text-orange-500'
        }`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <h1 className="text-xl font-display font-bold text-on-surface mb-2 flex items-center gap-2">
          <CurrencyDollar size={24} className="text-primary" />
          Reporte de Facturación y Cobranza
        </h1>
        <p className="text-sm text-on-surface-variant font-body">
          Monitorea el estado financiero de los traslados. Visualiza cuánto se ha facturado a nivel global, cuánto ya está pagado y la cartera vencida o pendiente por cobrar.
        </p>
      </div>

      {/* Tarjetas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border-l-4 border-l-blue-500 border border-outline-variant/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Receipt size={24} className="text-blue-500" />
            <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Total Facturado (Histórico)</h3>
          </div>
          <p className="text-4xl font-display font-bold text-on-surface">{formatCurrency(stats.facturado)}</p>
        </div>
        
        <div className="bg-surface border-l-4 border-l-green-500 border border-outline-variant/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyDollar size={24} className="text-green-500" />
            <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Total Pagado</h3>
          </div>
          <p className="text-4xl font-display font-bold text-on-surface">{formatCurrency(stats.pagado)}</p>
        </div>
        
        <div className="bg-surface border-l-4 border-l-red-500 border border-outline-variant/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <WarningCircle size={24} className="text-red-500" />
            <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Por Cobrar (Pendiente / Vencido)</h3>
          </div>
          <p className="text-4xl font-display font-bold text-on-surface text-red-500">{formatCurrency(stats.pendiente)}</p>
        </div>
      </div>

      {/* Filtros para la tabla */}
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Filtrar por Cliente</label>
          <input 
            type="text"
            value={selectedCliente} 
            onChange={e => setSelectedCliente(e.target.value)}
            placeholder="— Todos los Clientes —"
            list="clientes-fact-list"
            className="w-full bg-background border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
          />
          <datalist id="clientes-fact-list">
            {clientesList.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="flex-1">
          <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Filtrar por Estatus</label>
          <select 
            value={selectedEstatus} 
            onChange={e => setSelectedEstatus(e.target.value)}
            className="w-full bg-background border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
          >
            <option value="">— Todos los Estatus —</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
          <h2 className="font-display font-bold text-lg text-on-surface">Detalle de Facturas</h2>
        </div>
        <DataTable 
          columns={COLUMNS} 
          data={filteredFacturas} 
        />
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Package, Clock, ChartBar } from '@phosphor-icons/react';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';

export default function ReportesCajas() {
  const { cajas: cajasData, movimientos: movData } = useData();
  const [selectedCaja, setSelectedCaja] = useState('');

  const cajasList = useMemo(() => cajasData.map(c => c.numeroCaja), [cajasData]);

  const datosCaja = useMemo(() => {
    return cajasData.find(c => c.numeroCaja === selectedCaja) || null;
  }, [selectedCaja, cajasData]);

  const movimientosCaja = useMemo(() => {
    if (!selectedCaja) return [];
    return movData.filter(m => m.caja === selectedCaja);
  }, [selectedCaja, movData]);

  const stats = useMemo(() => {
    const totalViajes = movimientosCaja.length;
    const estatus = datosCaja ? datosCaja.estatus : 'N/A';
    // Determinar color de estatus
    const isDisponible = estatus === 'disponible';
    return { totalViajes, estatus, isDisponible };
  }, [movimientosCaja, datosCaja]);

  const COLUMNS = [
    { key: 'fecha', label: 'FECHA' },
    { key: 'numVoucher', label: 'FOLIO' },
    { key: 'cliente', label: 'CLIENTE' },
    { key: 'tipoMov', label: 'TIPO' },
    { key: 'origen', label: 'ORIGEN' },
    { key: 'destino', label: 'DESTINO' }
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="bg-surface-container/60 border border-outline-variant p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-display font-bold text-on-surface mb-2 flex items-center gap-2">
          <Package size={24} className="text-primary" />
          Reporte de Cajas (Uso y Tiempos Muertos)
        </h1>
        <p className="text-sm text-on-surface-variant font-body">
          Analiza el historial de uso de cada caja para identificar tiempos muertos, optimizar la rotación de la flota y detectar cajas inactivas. Selecciona una caja para ver su historial y estatus actual.
        </p>
      </div>

      <div className="bg-surface-container/60 border border-outline-variant p-6 rounded-2xl shadow-sm">
        <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Seleccionar Caja</label>
        <input 
          type="text"
          value={selectedCaja} 
          onChange={e => setSelectedCaja(e.target.value)}
          placeholder="— Buscar o Seleccionar —"
          list="cajas-list"
          className="w-full md:w-1/3 bg-surface-container border border-outline-variant text-on-surface p-3 text-sm font-body rounded-xl outline-none focus:border-primary shadow-sm"
        />
        <datalist id="cajas-list">
          {cajasList.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      {selectedCaja && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container/60 border border-outline-variant rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stats.isDisponible ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <ChartBar size={22} />
                </div>
                <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Estatus Actual</h3>
              </div>
              <p className="text-4xl font-display font-bold text-on-surface capitalize">
                {stats.estatus.replace('_', ' ')}
              </p>
            </div>
            
            <div className="bg-surface-container/60 border border-outline-variant rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock size={22} />
                </div>
                <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Viajes Históricos</h3>
              </div>
              <p className="text-4xl font-display font-bold text-on-surface">{stats.totalViajes}</p>
            </div>
          </div>

          <div className="bg-surface-container/60 border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high">
              <h2 className="font-display font-bold text-lg text-on-surface">Historial de Movimientos de la Caja {selectedCaja}</h2>
            </div>
            <DataTable 
              columns={COLUMNS} 
              data={movimientosCaja} 
            />
          </div>
        </>
      )}
    </div>
  );
}

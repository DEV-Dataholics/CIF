import React, { useState, useMemo } from 'react';
import { SteeringWheel, Checks, Truck } from '@phosphor-icons/react';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';

export default function ReportesOperadores() {
  const { operadores: operadoresData, movimientos: movData } = useData();
  const [selectedOperador, setSelectedOperador] = useState('');

  const operadoresList = useMemo(() => operadoresData.map(o => o.nombreCompleto), [operadoresData]);

  const movimientosOperador = useMemo(() => {
    if (!selectedOperador) return [];
    return movData.filter(m => m.operador === selectedOperador);
  }, [movData, selectedOperador]);

  const stats = useMemo(() => {
    const totalViajes = movimientosOperador.length;
    const completados = movimientosOperador.filter(m => m.estatus === 'Completo').length;
    const enRuta = movimientosOperador.filter(m => m.estatus === 'En Ruta').length;
    return { totalViajes, completados, enRuta };
  }, [movimientosOperador]);

  const COLUMNS = [
    { key: 'fecha', label: 'FECHA' },
    { key: 'numVoucher', label: 'FOLIO' },
    { key: 'cliente', label: 'CLIENTE' },
    { key: 'tipoMov', label: 'TIPO' },
    { key: 'origen', label: 'ORIGEN' },
    { key: 'destino', label: 'DESTINO' },
    { key: 'estatus', label: 'ESTATUS' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <h1 className="text-xl font-display font-bold text-on-surface mb-2 flex items-center gap-2">
          <SteeringWheel size={24} className="text-primary" />
          Reporte de Operadores
        </h1>
        <p className="text-sm text-on-surface-variant font-body">
          Este reporte segmenta los viajes realizados por cada operador para facilitar el cálculo de nómina y evaluar el rendimiento individual. Selecciona un operador de la lista para ver su historial.
        </p>
      </div>

      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Seleccionar Operador</label>
        <input 
          type="text"
          value={selectedOperador} 
          onChange={e => setSelectedOperador(e.target.value)}
          placeholder="— Buscar o Seleccionar —"
          list="operadores-list"
          className="w-full md:w-1/3 bg-background border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
        />
        <datalist id="operadores-list">
          {operadoresList.map(o => <option key={o} value={o} />)}
        </datalist>
      </div>

      {selectedOperador && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border-l-4 border-l-primary border border-outline-variant/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <SteeringWheel size={24} className="text-primary" />
                <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Total de Viajes</h3>
              </div>
              <p className="text-4xl font-display font-bold text-on-surface">{stats.totalViajes}</p>
            </div>
            
            <div className="bg-surface border-l-4 border-l-green-500 border border-outline-variant/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Checks size={24} className="text-green-500" />
                <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">Viajes Completos</h3>
              </div>
              <p className="text-4xl font-display font-bold text-on-surface">{stats.completados}</p>
            </div>
            
            <div className="bg-surface border-l-4 border-l-orange-500 border border-outline-variant/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Truck size={24} className="text-orange-500" />
                <h3 className="font-label text-xs uppercase tracking-wider text-outline font-bold">En Ruta Actual</h3>
              </div>
              <p className="text-4xl font-display font-bold text-on-surface">{stats.enRuta}</p>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30">
              <h2 className="font-display font-bold text-lg text-on-surface">Historial del Operador</h2>
            </div>
            <DataTable 
              columns={COLUMNS} 
              data={movimientosOperador} 
            />
          </div>
        </>
      )}
    </div>
  );
}

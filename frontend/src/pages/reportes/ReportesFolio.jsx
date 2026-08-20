import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, Receipt, Info, MapPinLine, Clock, MapPin, FlagCheckered } from '@phosphor-icons/react';
import { useData } from '../../context/DataContext';

export default function ReportesFolios() {
  const { movimientos: movData, facturas: facturasData } = useData();
  const [searchFolio, setSearchFolio] = useState('');
  const [searchedFolio, setSearchedFolio] = useState('');

  const viaje = useMemo(() => {
    if (!searchedFolio) return null;
    return movData.find(m => m.numVoucher === searchedFolio || m.id.toString() === searchedFolio) || null;
  }, [searchedFolio, movData]);

  const facturaRelacionada = useMemo(() => {
    if (!viaje || !viaje.factura) return null;
    return facturasData.find(f => f.folio === viaje.factura) || null;
  }, [viaje]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchedFolio(searchFolio);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <h1 className="text-xl font-display font-bold text-on-surface mb-2 flex items-center gap-2">
          <MagnifyingGlass size={24} className="text-primary" />
          Reporte de Folios (Auditoría)
        </h1>
        <p className="text-sm text-on-surface-variant font-body">
          Busca un folio de viaje específico para auditar su trazabilidad completa. Revisa sus tiempos de cruce, ubicaciones, personal involucrado y un resumen financiero individual del traslado.
        </p>
      </div>

      <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Ingresar Folio (Ej. V-10234 o ID 1)</label>
            <input 
              type="text" 
              value={searchFolio}
              onChange={e => setSearchFolio(e.target.value)}
              placeholder="V-10234..."
              list="folios-list"
              className="w-full bg-background border border-outline-variant/40 text-on-surface p-3 text-sm font-body outline-none focus:border-primary"
            />
            <datalist id="folios-list">
              {movData.map(m => (
                <option key={m.id} value={m.numVoucher} />
              ))}
            </datalist>
          </div>
          <button type="submit" className="bg-primary text-on-primary font-label font-bold text-xs tracking-wider uppercase px-6 py-4 rounded-sm hover:bg-primary/90 transition-colors">
            Buscar
          </button>
        </form>
      </div>

      {searchedFolio && !viaje && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 text-center text-red-500">
          No se encontró ningún viaje con el folio: {searchedFolio}
        </div>
      )}

      {viaje && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalles Generales e Ingresos/Egresos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm shadow-sm">
              <h2 className="font-display font-bold text-lg text-on-surface border-b border-outline-variant/30 pb-3 mb-4 flex items-center gap-2">
                <Info size={20} className="text-primary"/> Información General
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Cliente</span>
                  <span className="text-on-surface text-right">{viaje.cliente}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Operador</span>
                  <span className="text-on-surface text-right">{viaje.operador}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Tractor</span>
                  <span className="text-on-surface text-right">{viaje.tractor}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Caja</span>
                  <span className="text-on-surface text-right">{viaje.caja}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Tipo Mov.</span>
                  <span className="text-on-surface text-right">{viaje.tipoMov}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-on-surface-variant font-bold">Fac/Pedimento</span>
                  <span className="text-on-surface text-right">{viaje.facPedimento}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant/30 p-6 rounded-sm shadow-sm">
              <h2 className="font-display font-bold text-lg text-on-surface border-b border-outline-variant/30 pb-3 mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-green-500"/> Finanzas del Viaje
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold text-sm">Costo Peaje:</span>
                  <span className="text-red-400 font-bold">{viaje.peaje}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold text-sm">Facturado:</span>
                  {facturaRelacionada ? (
                    <div className="text-right">
                      <span className="text-green-400 font-bold block">{formatCurrency(facturaRelacionada.monto)}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded mt-1 inline-block ${
                        facturaRelacionada.estatus === 'pagada' ? 'bg-green-500/20 text-green-500' :
                        facturaRelacionada.estatus === 'vencida' ? 'bg-red-500/20 text-red-500' :
                        'bg-orange-500/20 text-orange-500'
                      }`}>
                        {facturaRelacionada.estatus}
                      </span>
                    </div>
                  ) : (
                    <span className="text-on-surface text-sm italic">No facturado ({viaje.factura})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant/30 p-6 rounded-sm shadow-sm">
            <h2 className="font-display font-bold text-lg text-on-surface border-b border-outline-variant/30 pb-3 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-primary"/> Línea de Tiempo
            </h2>
            
            <div className="relative border-l-2 border-outline-variant ml-4 md:ml-6 space-y-8 pb-4">
              {/* Origen */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <h3 className="font-bold text-on-surface text-sm">Salida de Origen ({viaje.origen})</h3>
                <p className="text-xs text-on-surface-variant mt-1">{viaje.fecha} • {viaje.salioOrigen || 'Pendiente'}</p>
              </div>

              {/* Punto Revision */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface border-2 border-outline flex items-center justify-center">
                  {viaje.puntoRevision ? <div className="w-2 h-2 rounded-full bg-outline"></div> : null}
                </div>
                <h3 className="font-bold text-on-surface text-sm">Punto de Revisión</h3>
                <p className="text-xs text-on-surface-variant mt-1">{viaje.puntoRevision || 'Pendiente'}</p>
              </div>

              {/* Aduana MX */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface border-2 border-outline flex items-center justify-center">
                  {(viaje.entradaMX || viaje.salidaMX) ? <div className="w-2 h-2 rounded-full bg-outline"></div> : null}
                </div>
                <h3 className="font-bold text-on-surface text-sm">Cruce Aduana MX ({viaje.puente})</h3>
                <div className="text-xs text-on-surface-variant mt-1 space-y-1">
                  <p>Entrada: {viaje.entradaMX || '--:--'}</p>
                  <p>Salida: {viaje.salidaMX || '--:--'}</p>
                </div>
              </div>

              {/* Aduana AM */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface border-2 border-outline flex items-center justify-center">
                  {(viaje.entradaAM || viaje.salidaAM) ? <div className="w-2 h-2 rounded-full bg-outline"></div> : null}
                </div>
                <h3 className="font-bold text-on-surface text-sm">Cruce Aduana Americana</h3>
                <div className="text-xs text-on-surface-variant mt-1 space-y-1">
                  <p>Entrada: {viaje.entradaAM || '--:--'}</p>
                  <p>Salida: {viaje.salidaAM || '--:--'}</p>
                </div>
              </div>

              {/* Destino */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface border-2 border-green-500 flex items-center justify-center">
                  {viaje.horaEntrega ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : null}
                </div>
                <h3 className="font-bold text-on-surface text-sm">Llegada a Destino ({viaje.destino})</h3>
                <p className="text-xs text-on-surface-variant mt-1">{viaje.horaEntrega || 'Pendiente'}</p>
                {viaje.estatus === 'Completo' && (
                  <span className="inline-block mt-2 bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    Viaje Completado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from 'react';
import { Warning, WarningCircle, CheckCircle, SteeringWheel, Truck, Info, Package } from '@phosphor-icons/react';
import { useData } from '../../context/DataContext';

export default function Alertas() {
  const { operadores: operadoresData, unidades: unidadesData, cajas: cajasData } = useData();
  const today = new Date('2026-06-15');

  const checkVigencia = (fecha) => {
    if (!fecha) return null;
    const diffTime = new Date(fecha).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return { status: 'rojo', days: diffDays };
    if (diffDays <= 60) return { status: 'amarillo', days: diffDays };
    if (diffDays <= 90) return { status: 'verde', days: diffDays };
    return { status: 'ok', days: diffDays };
  };

  const alertas = useMemo(() => {
    const list = [];
    
    // Escanear operadores
    operadoresData.forEach(op => {
      if (!op.activo) return;
      
      const licFecha = op.licencia_mx_vencimiento || op.vigenciaLicencia;
      const lic = checkVigencia(licFecha);
      if (lic && lic.status !== 'ok') {
        list.push({ type: 'operador', name: op.nombre_completo || op.nombreCompleto, item: 'Licencia MX', date: licFecha, ...lic });
      }
      
      const visaFecha = op.visa_vencimiento || op.vigenciaVisa;
      const visa = checkVigencia(visaFecha);
      if (visa && visa.status !== 'ok') {
        list.push({ type: 'operador', name: op.nombre_completo || op.nombreCompleto, item: 'Visa/FAST', date: visaFecha, ...visa });
      }
    });

    // Escanear tractos
    unidadesData.forEach(un => {
      const sctFecha = un.vencimiento_sct || un.vigenciaSCT;
      const sct = checkVigencia(sctFecha);
      if (sct && sct.status !== 'ok') {
        list.push({ type: 'tracto', name: un.numero_economico || un.numeroEconomico, item: 'Permiso SCT', date: sctFecha, ...sct });
      }
      
      const seguroFecha = un.vencimiento_poliza_mx || un.vigenciaSeguro;
      const seguro = checkVigencia(seguroFecha);
      if (seguro && seguro.status !== 'ok') {
        list.push({ type: 'tracto', name: un.numero_economico || un.numeroEconomico, item: 'Seguro MX', date: seguroFecha, ...seguro });
      }
    });

    return list.sort((a, b) => a.days - b.days);
  }, [operadoresData, unidadesData, cajasData]);

  const rojos = alertas.filter(a => a.status === 'rojo');
  const amarillos = alertas.filter(a => a.status === 'amarillo');
  const verdes = alertas.filter(a => a.status === 'verde');

  const IconoAlerta = ({ type, className }) => {
    if (type === 'operador') return <SteeringWheel size={24} className={className} />;
    if (type === 'caja') return <Package size={24} className={className} />;
    return <Truck size={24} className={className} />;
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label text-primary text-[11px] uppercase tracking-[0.3em] mb-2 block">AdministraciÃ³n</span>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <Warning size={32} weight="fill" className="text-danger" />
            Centro de Alertas
          </h1>
          <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">
            SemÃ¡foro preventivo de vencimientos en Operadores y Flota (30, 60 y 90 dÃ­as)
          </p>
        </div>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant/30 p-12 text-center rounded-sm">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-on-surface">Todo en orden</h2>
          <p className="text-on-surface-variant font-body">No hay documentos que venzan en los prÃ³ximos 90 dÃ­as.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Roja (Vencidos o < 30 dÃ­as) */}
          <div className="space-y-4">
            <h2 className="font-label text-[10px] font-bold uppercase tracking-widest text-danger flex items-center gap-2 border-b border-danger/20 pb-2">
              <WarningCircle size={16} /> CrÃ­tico (Vencido o &le; 30 dÃ­as) ({rojos.length})
            </h2>
            {rojos.map((a, i) => (
              <div key={i} className="bg-danger/10 border-l-4 border-l-danger border-y border-r border-outline-variant/20 p-4 flex items-start gap-4">
                <div className="mt-1">
                  <IconoAlerta type={a.type} className="text-danger" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-on-surface text-sm">{a.item}</h3>
                  <p className="text-xs font-bold text-danger my-1">{a.name}</p>
                  <span className="text-[10px] text-on-surface-variant font-normal">
                    {a.days < 0 ? `VenciÃ³ hace ${Math.abs(a.days)} dÃ­as` : `Vence en ${a.days} dÃ­as`} ({a.date})
                  </span>
                </div>
              </div>
            ))}
            {rojos.length === 0 && <p className="text-xs text-outline italic">No hay alertas crÃ­ticas.</p>}
          </div>

          {/* Columna Amarilla (31 a 60 dÃ­as) */}
          <div className="space-y-4">
            <h2 className="font-label text-[10px] font-bold uppercase tracking-widest text-warning flex items-center gap-2 border-b border-warning/20 pb-2">
              <Warning size={16} /> Preventivo (&le; 60 dÃ­as) ({amarillos.length})
            </h2>
            {amarillos.map((a, i) => (
              <div key={i} className="bg-warning/10 border-l-4 border-l-warning border-y border-r border-outline-variant/20 p-4 flex items-start gap-4">
                <div className="mt-1">
                  <IconoAlerta type={a.type} className="text-warning" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-on-surface text-sm">{a.item}</h3>
                  <p className="text-xs font-bold text-warning my-1">{a.name}</p>
                  <span className="text-[10px] text-on-surface-variant font-normal">Vence en {a.days} dÃ­as ({a.date})</span>
                </div>
              </div>
            ))}
            {amarillos.length === 0 && <p className="text-xs text-outline italic">No hay alertas en esta etapa.</p>}
          </div>

          {/* Columna Verde (61 a 90 dÃ­as) */}
          <div className="space-y-4">
            <h2 className="font-label text-[10px] font-bold uppercase tracking-widest text-success flex items-center gap-2 border-b border-success/20 pb-2">
              <Info size={16} /> Informativo (&le; 90 dÃ­as) ({verdes.length})
            </h2>
            {verdes.map((a, i) => (
              <div key={i} className="bg-success/10 border-l-4 border-l-success border-y border-r border-outline-variant/20 p-4 flex items-start gap-4">
                <div className="mt-1">
                  <IconoAlerta type={a.type} className="text-success" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-on-surface text-sm">{a.item}</h3>
                  <p className="text-xs font-bold text-success my-1">{a.name}</p>
                  <span className="text-[10px] text-on-surface-variant font-normal">Vence en {a.days} dÃ­as ({a.date})</span>
                </div>
              </div>
            ))}
            {verdes.length === 0 && <p className="text-xs text-outline italic">No hay alertas en esta etapa.</p>}
          </div>

        </div>
      )}
    </div>
  );
}

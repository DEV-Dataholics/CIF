import React, { useMemo, useState, useRef } from 'react';
import { Money, CaretDown, CaretUp, MicrosoftExcelLogo } from '@phosphor-icons/react';
import { useData } from '../../context/DataContext';
import * as XLSX from 'xlsx';
import { db } from '../../services/db';

export default function ConcentradoPrecios() {
  const { clientes, tiposMovimiento, precios, crud, refreshData } = useData();
  const [expandedClient, setExpandedClient] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ id: null, cliente: '', tipoMovimiento: '', tarifa: '', fechaVigencia: new Date().toISOString().split('T')[0] });
  
  const fileInputRef = useRef(null);

  const stats = useMemo(() => {
    return clientes.map(c => {
      const rutasDelCliente = (precios || []).filter(p => p.cliente === c.razonSocial || p.cliente === c.razon_social);
      return {
        cliente: c.razonSocial || c.razon_social,
        cantidad: rutasDelCliente.length,
        rutas: rutasDelCliente
      };
    }).sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [clientes, precios]);

  const toggleExpand = (clienteName) => {
    if (expandedClient === clienteName) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clienteName);
    }
  };

  const handleEdit = (tarifa) => {
    setManualForm({
      id: tarifa.id,
      cliente: tarifa.cliente,
      tipoMovimiento: tarifa.tipoMovimiento || tarifa.tipo_movimiento || '',
      tarifa: tarifa.dolares || tarifa.precio || '',
      fechaVigencia: tarifa.fechaVigencia || tarifa.fecha_vigencia || new Date().toISOString().split('T')[0]
    });
    setShowManualModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tarifa?")) return;
    try {
      if (crud) {
        await crud.remove('precios', id);
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la tarifa.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      if (data.length > 0) {
        // Validar columnas esperadas: Cliente, Movimiento, Tarifa_USD, Fecha
        const nuevosPrecios = data.map((row, index) => ({
          id: Date.now() + index, // Generar ID único temporal
          cliente: row.Cliente || row.cliente || '',
          tipoMovimiento: row.Movimiento || row.movimiento || '',
          dolares: parseFloat(row.Tarifa_USD || row.tarifa_usd || 0),
          fechaVigencia: row.Fecha || row.fecha || new Date().toISOString().split('T')[0]
        })).filter(p => p.cliente && p.tipoMovimiento); // Filtrar filas inválidas

        if (nuevosPrecios.length > 0) {
          (async () => {
            try {
              if (crud) {
                await Promise.all(nuevosPrecios.map(p => db.insert('precios', {
                  cliente_id: clientes.find(c => c.razonSocial === p.cliente || c.razon_social === p.cliente)?.id || 1,
                  tipo_mov_id: tiposMovimiento.find(t => t.nombre === p.tipoMovimiento)?.id || 1,
                  precio: p.dolares,
                  fecha_vigencia: p.fechaVigencia,
                  cliente: p.cliente,
                  tipoMovimiento: p.tipoMovimiento
                })));
                if (refreshData) await refreshData();
              }
              alert(`Importación exitosa. Se han importado/actualizado ${nuevosPrecios.length} tarifas en USD.`);
            } catch (err) {
              console.error(err);
              alert("Error al importar tarifas.");
            }
          })();
        } else {
          alert('El archivo no contiene la estructura esperada: Cliente, Movimiento, Tarifa_USD, Fecha.');
        }
      }
    };
    reader.readAsBinaryString(file);
    // Limpiar input
    e.target.value = null;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.cliente || !manualForm.tipoMovimiento || !manualForm.tarifa) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      const payload = {
        cliente_id: clientes.find(c => c.razonSocial === manualForm.cliente || c.razon_social === manualForm.cliente)?.id || 1,
        tipo_mov_id: tiposMovimiento.find(t => t.nombre === manualForm.tipoMovimiento)?.id || 1,
        precio: parseFloat(manualForm.tarifa),
        fecha_vigencia: manualForm.fechaVigencia,
        cliente: manualForm.cliente,
        tipoMovimiento: manualForm.tipoMovimiento
      };

      if (manualForm.id) {
        if (crud) {
          await crud.update('precios', manualForm.id, payload);
        }
      } else {
        if (crud) {
          await crud.insert('precios', payload);
        }
      }
      if (refreshData) await refreshData();
      setShowManualModal(false);
      setManualForm({ cliente: '', tipoMovimiento: '', tarifa: '', fechaVigencia: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      alert("Error al guardar la tarifa.");
    }
  };

  return (
    <div className="h-full flex flex-col p-8 animate-in">
      {/* Encabezado */}
      <div className="mb-8">
        <h2 className="text-primary font-label text-xs tracking-[0.2em] mb-2 uppercase">Administración</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Money className="text-primary text-4xl" />
            <h1 className="text-4xl font-display text-on-surface">Tarifas Operativas</h1>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 bg-surface border border-outline-variant/30 hover:border-primary text-primary font-label font-bold text-[10px] uppercase tracking-widest px-6 py-3 transition-all shadow-sm"
            >
              <MicrosoftExcelLogo size={16} weight="bold" />
              Importar Excel
            </button>
            <button onClick={() => {
              setManualForm({ cliente: '', tipoMovimiento: '', tarifa: '', fechaVigencia: new Date().toISOString().split('T')[0] });
              setShowManualModal(true);
            }} className="bg-primary text-on-primary font-label font-bold text-[10px] uppercase tracking-widest px-6 py-3 hover:brightness-110 transition-all shadow-md">
              Añadir Tarifa Manual
            </button>
          </div>
        </div>
      </div>

      {/* Tabla agrupada por clientes */}
      <div className="overflow-auto flex-1 pb-10">
        <div className="bg-surface border border-outline-variant/20 shadow-sm">
          <table className="w-full text-left text-sm font-body">
            <thead className="bg-background sticky top-0 z-10">
              <tr>
                <th className="p-4 font-label uppercase tracking-widest text-xs text-outline font-bold border-b border-outline-variant/20">Clientes</th>
                <th className="p-4 font-label uppercase tracking-widest text-xs text-outline font-bold border-b border-outline-variant/20 text-center w-32">Tarifas Activas</th>
                <th className="p-4 font-label uppercase tracking-widest text-xs text-outline font-bold border-b border-outline-variant/20 text-center w-32">Acciones</th>
                <th className="p-4 font-label uppercase tracking-widest text-xs text-outline font-bold border-b border-outline-variant/20 text-center w-32">Desglose</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row, idx) => (
                <React.Fragment key={idx}>
                  <tr className={`border-b border-outline-variant/10 hover:bg-surface-variant/30 transition-colors ${expandedClient === row.cliente ? 'bg-surface-variant/20' : ''}`}>
                    <td className="p-4 font-bold text-on-surface uppercase">{row.cliente}</td>
                    <td className="p-4 text-center font-mono font-bold text-primary">{row.cantidad}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => {
                        setManualForm({ cliente: row.cliente, tipoMovimiento: '', tarifa: '', fechaVigencia: new Date().toISOString().split('T')[0] });
                        setShowManualModal(true);
                      }} className="text-outline hover:text-primary font-bold text-xl px-2 transition-colors">+</button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleExpand(row.cliente)}
                        className="text-primary hover:text-primary/70 font-bold text-xl px-2 inline-flex items-center justify-center gap-1 transition-colors">
                        {expandedClient === row.cliente ? <CaretUp size={20} /> : <CaretDown size={20} />}
                      </button>
                    </td>
                  </tr>

                  {/* Fila de desglose (Drill-down) */}
                  {expandedClient === row.cliente && row.rutas.length > 0 && (
                    <tr className="bg-background">
                      <td colSpan={4} className="p-6 border-b border-outline-variant/30">
                        <div className="border-l-4 border-primary pl-6">
                          <h4 className="text-primary font-label text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>Tarifas vigentes para {row.cliente}</span>
                          </h4>
                          <div className="grid gap-3">
                            {row.rutas.map(r => (
                              <div key={r.id} className="flex items-center justify-between bg-surface p-4 border border-outline-variant/20 hover:border-primary/50 hover:shadow-sm transition-all">
                                <div className="flex-1">
                                  <span className="font-label text-[9px] uppercase tracking-widest text-outline block mb-1">Tipo de Movimiento</span>
                                  <span className="font-bold text-sm text-on-surface uppercase">{r.tipoMovimiento}</span>
                                </div>
                                <div className="flex-1 text-center">
                                  <span className="font-label text-[9px] uppercase tracking-widest text-outline block mb-1">Tarifa</span>
                                  <span className="font-mono text-lg font-bold text-success">
                                    {r.dolares !== null && r.dolares !== undefined 
                                      ? `USD $${r.dolares.toFixed(2)}` 
                                      : (r.pesos !== null && r.pesos !== undefined ? `MXN $${r.pesos.toFixed(2)}` : 'N/A')}
                                  </span>
                                </div>
                                <div className="flex-1 text-center">
                                  <span className="font-label text-[9px] uppercase tracking-widest text-outline block mb-1">Fecha de Vigencia</span>
                                  <span className="font-mono text-sm text-on-surface">
                                    {r.fechaVigencia}
                                  </span>
                                </div>
                                <div className="flex-1 text-right space-x-3">
                                  <button onClick={() => handleEdit(r)} className="font-label text-[10px] uppercase font-bold text-primary hover:underline tracking-widest">Editar</button>
                                  <span className="text-outline-variant">|</span>
                                  <button onClick={() => handleDelete(r.id)} className="font-label text-[10px] uppercase font-bold text-danger hover:underline tracking-widest">Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedClient === row.cliente && row.rutas.length === 0 && (
                    <tr className="bg-background">
                      <td colSpan={4} className="p-6 border-b border-outline-variant/30 text-center text-outline text-sm font-body">
                        No hay tarifas registradas para este cliente en el catálogo actual.
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-headline text-2xl font-bold mb-6 text-on-surface">Nueva Tarifa Manual</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Cliente</label>
                <input list="modal-clientes" required value={manualForm.cliente} onChange={e => setManualForm({...manualForm, cliente: e.target.value})} className="w-full bg-background border border-outline-variant/30 text-on-surface p-3 text-sm outline-none focus:border-primary" />
                <datalist id="modal-clientes">
                  {clientes.map(c => <option key={c.id} value={c.razonSocial} />)}
                </datalist>
              </div>
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Tipo de Movimiento</label>
                <input list="modal-movimientos" required value={manualForm.tipoMovimiento} onChange={e => setManualForm({...manualForm, tipoMovimiento: e.target.value})} className="w-full bg-background border border-outline-variant/30 text-on-surface p-3 text-sm outline-none focus:border-primary" />
                <datalist id="modal-movimientos">
                  {tiposMovimiento?.map((tm, idx) => <option key={idx} value={tm.nombre} />)}
                </datalist>
              </div>
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Tarifa (USD)</label>
                <input type="number" step="0.01" required value={manualForm.tarifa} onChange={e => setManualForm({...manualForm, tarifa: e.target.value})} className="w-full bg-background border border-outline-variant/30 text-on-surface p-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Fecha Vigencia</label>
                <input type="date" required value={manualForm.fechaVigencia} onChange={e => setManualForm({...manualForm, fechaVigencia: e.target.value})} className="w-full bg-background border border-outline-variant/30 text-on-surface p-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 text-sm font-bold text-outline hover:text-danger">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary text-on-primary font-bold text-sm shadow-md hover:brightness-110">Guardar Tarifa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

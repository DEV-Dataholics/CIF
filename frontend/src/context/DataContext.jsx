import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/db';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [peajes, setPeajes] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);

  const refreshData = async () => {
    try {
      // 1. Cargar catálogos de manera paralela
      const [
        dbClientes,
        dbTiposMov,
        dbOperadores,
        dbUnidades,
        dbCajas,
        dbFacturas,
        dbLocalidades,
        dbPeajes,
        dbPrecios
      ] = await Promise.all([
        db.getAll('clientes'),
        db.getAll('tiposMovimiento'),
        db.getAll('operadores'),
        db.getAll('unidades'),
        db.getAll('cajas'),
        db.getAll('facturas'),
        db.getAll('localidades'),
        db.getAll('peajes'),
        db.getAll('precios')
      ]);

      // Map database snake_case keys to camelCase keys for frontend compatibility
      const mappedUnidades = (dbUnidades || []).map(u => ({
        ...u,
        numeroEconomico: u.numero_economico || u.numeroEconomico || '',
        placas: u.placas_mx || u.placas || '',
        marca: u.marca || '',
        modelo: u.modelo || '',
        anio: u.anio || '',
        activo: (u.activo === true || u.activo == 1 || u.activo === '1')
      }));

      const mappedCajas = (dbCajas || []).map(c => ({
        ...c,
        numeroCaja: c.numero_caja || c.numeroCaja || '',
        tipo: c.tipo || '',
        placas: c.placas_mx || c.placas || '',
        activo: (c.activo === true || c.activo == 1 || c.activo === '1')
      }));

      const mappedOperadores = (dbOperadores || []).map(o => ({
        ...o,
        nombreCompleto: o.nombre_completo || o.nombreCompleto || '',
        licencia: o.licencia_mx || o.licencia || '',
        vigenciaLicencia: o.licencia_mx_vencimiento || o.vigenciaLicencia || null,
        visa: o.licencia_usa || o.visa || '',
        vigenciaVisa: o.licencia_usa_vencimiento || o.vigenciaVisa || null,
        activo: (o.activo === true || o.activo == 1 || o.activo === '1')
      }));

      setClientes((dbClientes || []).map(c => ({ ...c, activo: (c.activo === true || c.activo == 1 || c.activo === '1') })));
      setFacturas(dbFacturas);
      setCajas(mappedCajas);
      setUnidades(mappedUnidades);
      setOperadores(mappedOperadores);
      setLocalidades((dbLocalidades || []).map(l => ({ ...l, activo: (l.activo === true || l.activo == 1 || l.activo === '1') })));
      setPeajes(dbPeajes || []);
      setTiposMovimiento(dbTiposMov);

      // 2. Hidratar (Populate) Movimientos y Precios para no romper la UI actual
      // SINGLE SOURCE OF TRUTH: El nombre siempre viene del ID
      const dbPreciosHydrated = (dbPrecios || []).map(p => {
        const c = dbClientes.find(cli => cli.id === p.clienteId || cli.id == p.cliente_id);
        const t = dbTiposMov.find(tm => tm.id === p.tipoMovId || tm.id == p.tipo_mov_id);
        return {
          ...p,
          cliente: c ? c.razonSocial || c.razon_social : p.cliente,
          tipoMovimiento: t ? t.nombre : p.tipoMovimiento
        };
      });
      setPrecios(dbPreciosHydrated);

      const dbMovimientos = await db.getAll('movimientos');
      const dbMovimientosHydrated = (dbMovimientos || []).map(m => {
        const c = dbClientes.find(cli => cli.id === m.clienteId || cli.id == m.cliente_id);
        const o = dbOperadores.find(op => op.id === m.operadorId || op.id == m.operador_id);
        const u = dbUnidades.find(un => un.id === m.tractorId || un.id == m.tractocamion_id);
        const t = dbTiposMov.find(tm => tm.id === m.tipoMovId || tm.id == m.tipo_movimiento);
        const caja = dbCajas.find(cj => cj.id === m.cajaId || cj.id == m.caja_id);
        
        let fecha = m.fecha;
        let hora = m.hora;
        if (m.fecha_salida && (!fecha || !hora)) {
          const parts = m.fecha_salida.split(' ');
          if (!fecha) fecha = parts[0] || '';
          if (!hora) hora = parts[1] ? parts[1].substring(0, 5) : '';
        }

        return {
          ...m,
          fecha,
          hora,
          cliente: c ? c.razonSocial || c.razon_social : m.cliente,
          operador: o ? o.nombreCompleto || o.nombre_completo : m.operador,
          tractor: u ? u.numeroEconomico || u.numero_economico : m.tractor,
          tipoMov: t ? t.nombre : (m.tipoMov || m.tipo_movimiento),
          caja: caja ? caja.numeroCaja || caja.numero_caja : m.caja,
          valeFisico: m.folio_boleta || m.valeFisico || ''
        };
      });
      setMovimientos(dbMovimientosHydrated);
    } catch (error) {
      console.error("Error refreshing data context:", error);
    }
  };

  useEffect(() => {
    // Evitar consultar API si estamos en la pagina de Login para prevenir loops de redireccion
    if (window.location.pathname === '/login') {
      setDataLoaded(true);
      return;
    }
    const init = async () => {
      await refreshData();
      setDataLoaded(true);
    };
    init();
  }, []);

  const addFacturaYCliente = async (nuevaFactura, nombreCliente) => {
    await db.insert('facturas', nuevaFactura);
    if (nombreCliente && nombreCliente !== "Cliente Desconocido") {
      const existentes = await db.getAll('clientes');
      if (!existentes.some(c => (c.razonSocial || c.razon_social) === nombreCliente)) {
        await db.insert('clientes', {
          razonSocial: nombreCliente,
          rfc: 'EXT000000XX1',
          activo: true
        });
      }
    }
    await refreshData();
  };

  const updateFacturaEstatus = async (id, estatus) => {
    await db.update('facturas', id, { estatus });
    await refreshData();
  };

  const resetDemo = async () => {
    if (window.confirm('¿Estás seguro de que quieres poner el demo en 0? Esto borrará todos los viajes y facturas, manteniendo los catálogos intactos.')) {
      await db.setAll('movimientos', []);
      await db.setAll('facturas', []);
      await refreshData();
    }
  };

  // Wrapper para operaciones genericas
  const crud = {
    insert: async (table, data) => { const r = await db.insert(table, data); await refreshData(); return r; },
    update: async (table, id, data) => { const r = await db.update(table, id, data); await refreshData(); return r; },
    remove: async (table, id) => { 
      if (table === 'clientes') await db.deleteCliente(id);
      else await db.remove(table, id);
      await refreshData();
    }
  };

  if (!dataLoaded) return null; // Esperar a inicializar

  return (
    <DataContext.Provider value={{
      clientes, facturas, movimientos, cajas, unidades, operadores, localidades, peajes, precios, tiposMovimiento,
      addFacturaYCliente, updateFacturaEstatus, resetDemo, crud,
      setMovimientos, setCajas, setUnidades, setOperadores, setClientes, setLocalidades, setPeajes, setPrecios, setTiposMovimiento, refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

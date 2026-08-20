// src/services/dbInit.js
import { db } from './db';
import initialClientes from '../data/clientes.json';
import initialFacturas from '../data/facturas.json';
import initialMovimientos from '../data/movimientos.json';
import initialCajas from '../data/cajas.json';
import initialUnidades from '../data/unidades.json';
import initialOperadores from '../data/operadores.json';
import initialLocalidades from '../data/localidades.json';
import initialPrecios from '../data/precios.json';
import initialTiposMovimiento from '../data/tiposMovimiento.json';

// Utility to find ID by string field
const findId = (array, field, value) => {
  if (!value) return null;
  const found = array.find((item) => item[field]?.toString().toUpperCase() === value.toString().toUpperCase());
  return found ? found.id : null;
};

export const initializeDb = () => {
  // Purga de movimientos demo/acumulados previa (manteniendo todos los catálogos intactos)
  const IS_PURGED = typeof localStorage !== 'undefined' && localStorage.getItem('cif_db_movimientos_purged_v2');
  if (!IS_PURGED && typeof localStorage !== 'undefined') {
    db.setAll('movimientos', []);
    localStorage.setItem('cif_db_movimientos_purged_v2', 'true');
  }

  // Solo inicializar si no hay clientes
  if (db.getAll('clientes').length === 0) {
    console.log("Inicializando Base de Datos Local con relaciones (SSOT)...");

    // 1. Guardar catálogos maestros que ya tienen IDs válidos
    db.setAll('clientes', initialClientes);
    db.setAll('tiposMovimiento', initialTiposMovimiento);
    db.setAll('operadores', initialOperadores);
    db.setAll('unidades', initialUnidades);
    db.setAll('cajas', initialCajas);
    db.setAll('localidades', initialLocalidades);

    // 2. Normalizar e Insertar Precios
    const preciosNormalizados = initialPrecios.map((p) => {
      const clienteId = findId(initialClientes, 'razonSocial', p.cliente) || p.cliente;
      const tipoMovId = findId(initialTiposMovimiento, 'nombre', p.tipoMovimiento) || p.tipoMovimiento;
      return {
        ...p,
        clienteId,
        tipoMovId
      };
    });
    db.setAll('precios', preciosNormalizados);

    // 3. Normalizar e Insertar Movimientos
    const movimientosNormalizados = initialMovimientos.map((m) => {
      const clienteId = findId(initialClientes, 'razonSocial', m.cliente) || m.cliente;
      const operadorId = findId(initialOperadores, 'nombreCompleto', m.operador) || m.operador;
      const tractorId = findId(initialUnidades, 'numeroEconomico', m.tractor) || m.tractor;
      const tipoMovId = findId(initialTiposMovimiento, 'nombre', m.tipoMov || m.tipoMovimiento) || (m.tipoMov || m.tipoMovimiento);
      const cajaId = findId(initialCajas, 'numeroEconomico', m.caja) || m.caja;

      return {
        ...m,
        clienteId,
        operadorId,
        tractorId,
        tipoMovId,
        cajaId
      };
    });
    db.setAll('movimientos', movimientosNormalizados);

    // 4. Facturas
    db.setAll('facturas', initialFacturas);

    console.log("Base de datos inicializada correctamente.");
  }
};

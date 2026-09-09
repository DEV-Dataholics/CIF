const API_URL = '/api';

// Map tables to exact CodeIgniter routes
const getEndpoint = (table) => {
  const mapping = {
    clientes: 'clientes',
    facturas: 'cobranza', // cobranza_facturas
    movimientos: 'viajes', // viajes
    cajas: 'cajas',
    unidades: 'tractocamiones',
    operadores: 'operadores',
    localidades: 'destinos_catalogos',
    usuarios: 'usuarios',
    tiposMovimiento: 'tiposMovimiento',
    precios: 'precios',
    peajes: 'peajes'
  };
  return `${API_URL}/${mapping[table] || table}`;
};

// Normalizar payloads camelCase de frontend a contratos snake_case de MySQL/Backend
const normalizePayload = (table, record) => {
  if (!record || typeof record !== 'object') return record;
  const payload = { ...record };

  if (table === 'movimientos') {
    if (payload.operadorId && !payload.operador_id) payload.operador_id = payload.operadorId;
    if (payload.tractorId && !payload.tractocamion_id) payload.tractocamion_id = payload.tractorId;
    if (payload.cajaId && !payload.caja_id) payload.caja_id = payload.cajaId;
    if (payload.clienteId && !payload.cliente_id) payload.cliente_id = payload.clienteId;
    if (payload.valeFisico && !payload.folio_boleta) payload.folio_boleta = payload.valeFisico;
    if (payload.facPedimento && !payload.folio_boleta) payload.folio_boleta = payload.facPedimento;
    if (payload.puente && !payload.via_cruce) payload.via_cruce = payload.puente;

    // Normalizar tipo_movimiento a enum o nombre del catálogo
    if (!payload.tipo_movimiento) {
      const tm = String(payload.tipoMov || '').toLowerCase();
      if (tm.includes('entra') || tm.includes('vacio') || tm.includes('vacío')) payload.tipo_movimiento = 'local_vacio';
      else if (tm.includes('expo')) payload.tipo_movimiento = 'exportacion';
      else if (tm.includes('impo')) payload.tipo_movimiento = 'importacion';
      else if (tm.includes('recol')) payload.tipo_movimiento = 'recoleccion';
      else if (tm.includes('inter')) payload.tipo_movimiento = 'interplanta';
      else if (tm.includes('rampa')) payload.tipo_movimiento = 'rampa';
      else if (tm.includes('repar')) payload.tipo_movimiento = 'reparto';
      else if (payload.tipoMov) payload.tipo_movimiento = payload.tipoMov;
      else payload.tipo_movimiento = 'local_cargado';
    }

    // Normalizar estatus a enum de MySQL ('solicitado','asignado','en_transito','en_aduana','entregado','documentado','facturado')
    const validEstatus = ['solicitado', 'asignado', 'en_transito', 'en_aduana', 'entregado', 'documentado', 'facturado'];
    if (payload.estatus && !validEstatus.includes(payload.estatus)) {
      if (payload.estatus === 'Completo' || payload.estatus === 'completado') {
        payload.estatus = 'entregado';
      } else if (payload.estatus === 'En Ruta') {
        payload.estatus = 'en_transito';
      } else {
        payload.estatus = 'asignado';
      }
    }
  } else if (table === 'clientes') {
    if (payload.razonSocial && !payload.razon_social) payload.razon_social = payload.razonSocial;
  } else if (table === 'cajas') {
    if (payload.numeroCaja && !payload.numero_caja) payload.numero_caja = payload.numeroCaja;
    if (payload.placas && !payload.placas_mx) payload.placas_mx = payload.placas;
  } else if (table === 'unidades') {
    if (payload.numeroEconomico && !payload.numero_economico) payload.numero_economico = payload.numeroEconomico;
    if (payload.placas && !payload.placas_mx) payload.placas_mx = payload.placas;
  } else if (table === 'operadores') {
    if (payload.nombreCompleto && !payload.nombre_completo) payload.nombre_completo = payload.nombreCompleto;
    if (payload.numeroOperador && !payload.numero_operador) payload.numero_operador = payload.numeroOperador;
    if (payload.licencia && !payload.licencia_mx) payload.licencia_mx = payload.licencia;
  }

  return payload;
};

export const db = {
  // Read all records from a table
  getAll: async (table) => {
    try {
      const response = await fetch(getEndpoint(table), { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return [];
        }
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data = await response.json();
      
      // Adapt nested payloads from CodeIgniter responses
      if (table === 'clientes') return data.clientes || [];
      if (table === 'facturas') return data.facturas || [];
      if (table === 'movimientos') return data.viajes || [];
      if (table === 'cajas') return data.cajas || [];
      if (table === 'unidades') return data.tractos || data.tractocamiones || [];
      if (table === 'operadores') return data.operadores || [];
      if (table === 'localidades') return data.destinos || [];
      if (table === 'peajes') return data.peajes || [];
      if (table === 'usuarios') return data.data || data.usuarios || [];
      
      return Array.isArray(data) ? data : (data[table] || data.data || data);
    } catch (error) {
      console.error(`Error loading ${table}:`, error);
      return [];
    }
  },

  // Read a single record by ID
  getById: async (table, id) => {
    try {
      const response = await fetch(`${getEndpoint(table)}/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`Error loading single ${table} id ${id}:`, error);
      return null;
    }
  },

  // Insert a new record
  insert: async (table, record) => {
    const payload = normalizePayload(table, record);
    const response = await fetch(getEndpoint(table), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.mensaje || `HTTP Error ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },

  // Update an existing record
  update: async (table, id, updates) => {
    const payload = normalizePayload(table, updates);
    const response = await fetch(`${getEndpoint(table)}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.mensaje || `HTTP Error ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },

  // Delete a record
  remove: async (table, id) => {
    const response = await fetch(`${getEndpoint(table)}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      let serverMsg = `HTTP Error ${response.status}`;
      try {
        const errData = await response.json();
        serverMsg = errData.error || errData.mensaje || serverMsg;
      } catch (_) {}
      const err = new Error(serverMsg);
      err.status = response.status;
      throw err;
    }
    return true;
  },

  // Mock implementation for test stability or bulk set-all (CodeIgniter seeds take care of this now)
  setAll: async (table, data) => {
    console.log(`setAll triggered for ${table} with ${data.length} records. Seed database instead.`);
    return data;
  },

  // Business Logic: Referential Integrity checks handled on MySQL / CodeIgniter level
  deleteCliente: async (id) => {
    return db.remove('clientes', id);
  },

  // Reset local context if needed
  resetDb: async () => {
    console.log("DB reset requested.");
  }
};

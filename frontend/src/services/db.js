import fallbackTiposMovimiento from '../data/tiposMovimiento.json';
import fallbackPrecios from '../data/precios.json';

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
    localidades: 'destinos_catalogos'
  };
  return `${API_URL}/${mapping[table] || table}`;
};

export const db = {
  // Read all records from a table
  getAll: async (table) => {
    // Fallback local static catalog tables where no database api is defined
    if (table === 'tiposMovimiento') {
      const stored = localStorage.getItem('cif_tipos_movimiento');
      if (stored) return JSON.parse(stored);
      localStorage.setItem('cif_tipos_movimiento', JSON.stringify(fallbackTiposMovimiento));
      return fallbackTiposMovimiento;
    }
    if (table === 'precios') {
      const stored = localStorage.getItem('cif_precios');
      if (stored) return JSON.parse(stored);
      localStorage.setItem('cif_precios', JSON.stringify(fallbackPrecios));
      return fallbackPrecios;
    }

    try {
      const response = await fetch(getEndpoint(table), { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
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
      
      return data.data || data;
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
    if (table === 'tiposMovimiento' || table === 'precios') {
      const storageKey = table === 'tiposMovimiento' ? 'cif_tipos_movimiento' : 'cif_precios';
      const items = await db.getAll(table);
      const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
      const newItem = { id: newId, ...record };
      items.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return newItem;
    }

    const response = await fetch(getEndpoint(table), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
      credentials: 'include'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP Error ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },

  // Update an existing record
  update: async (table, id, updates) => {
    if (table === 'tiposMovimiento' || table === 'precios') {
      const storageKey = table === 'tiposMovimiento' ? 'cif_tipos_movimiento' : 'cif_precios';
      let items = await db.getAll(table);
      items = items.map(item => item.id == id ? { ...item, ...updates } : item);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return { id, ...updates };
    }

    const response = await fetch(`${getEndpoint(table)}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP Error ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },

  // Delete a record
  remove: async (table, id) => {
    if (table === 'tiposMovimiento' || table === 'precios') {
      const storageKey = table === 'tiposMovimiento' ? 'cif_tipos_movimiento' : 'cif_precios';
      let items = await db.getAll(table);
      items = items.filter(item => item.id != id);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return true;
    }

    const response = await fetch(`${getEndpoint(table)}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
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

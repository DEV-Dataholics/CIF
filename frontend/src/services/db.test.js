// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import { initializeDb } from './dbInit';

// Usaremos un entorno mockeado por jsdom para localStorage
describe('Base de Datos Relacional Local (SSOT)', () => {
  
  beforeEach(() => {
    localStorage.clear();
    initializeDb();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería inicializar los catálogos maestros y mantener la tabla de movimientos purgada (TR-005)', () => {
    const clientes = db.getAll('clientes');
    const movimientos = db.getAll('movimientos');
    
    expect(clientes.length).toBeGreaterThan(0);
    expect(movimientos.length).toBe(0);
  });

  it('debería poder insertar y recuperar un nuevo registro', () => {
    const nuevoCliente = { razonSocial: 'TEST CLIENT', activo: true };
    const insertado = db.insert('clientes', nuevoCliente);
    
    expect(insertado).toHaveProperty('id');
    expect(insertado.razonSocial).toBe('TEST CLIENT');

    const recuperado = db.getById('clientes', insertado.id);
    expect(recuperado).toEqual(insertado);
  });

  it('debería bloquear el borrado de un cliente si tiene viajes asociados (Integridad Referencial)', () => {
    const clientes = db.getAll('clientes');
    const clienteId = clientes[0].id;

    // Crear un viaje asociado para probar la restricción de integridad referencial
    db.insert('movimientos', { clienteId, cliente: clientes[0].razonSocial, origen: 'Paso del Norte', destino: 'Juárez' });

    expect(() => {
      db.deleteCliente(clienteId);
    }).toThrow(/Integridad Referencial: No se puede borrar el cliente/);
  });

  it('debería permitir borrar un cliente que NO tiene viajes asociados', () => {
    // Insertamos cliente sin viajes
    const clienteVacio = db.insert('clientes', { razonSocial: 'CLIENTE VACIO', activo: true });
    
    // Lo borramos
    db.deleteCliente(clienteVacio.id);
    
    // Verificamos que no existe
    const recuperado = db.getById('clientes', clienteVacio.id);
    expect(recuperado).toBeNull();
  });

  it('actualizar el nombre de un cliente se convierte en la única fuente de verdad', () => {
    // Single Source of Truth demonstration
    const clientes = db.getAll('clientes');
    const cliente = clientes[0];
    const nuevoNombre = 'NUEVO NOMBRE SA DE CV';
    
    db.update('clientes', cliente.id, { razonSocial: nuevoNombre });
    
    const actualizado = db.getById('clientes', cliente.id);
    expect(actualizado.razonSocial).toBe(nuevoNombre);
    // UI components relying on getById(clienteId) will immediately see "NUEVO NOMBRE SA DE CV"
  });
});

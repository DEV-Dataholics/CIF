// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './db';

describe('Cliente HTTP Centralizado db.js (API CodeIgniter 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debería consultar el endpoint correcto y desempaquetar la respuesta anidada de clientes', async () => {
    const mockClientes = [{ id: 1, razon_social: 'TRANS MEX SA' }];
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, clientes: mockClientes })
    });

    const result = await db.getAll('clientes');
    expect(global.fetch).toHaveBeenCalledWith('/api/clientes', { credentials: 'include' });
    expect(result).toEqual(mockClientes);
  });

  it('debería consultar y desempaquetar la respuesta anidada de viajes en movimientos', async () => {
    const mockViajes = [{ id: 10, tipo_movimiento: 'exportacion', estatus: 'en_transito' }];
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, viajes: mockViajes })
    });

    const result = await db.getAll('movimientos');
    expect(global.fetch).toHaveBeenCalledWith('/api/viajes', { credentials: 'include' });
    expect(result).toEqual(mockViajes);
  });

  it('debería normalizar payloads camelCase a snake_case al insertar en movimientos', async () => {
    let capturedBody = null;
    vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 201,
        json: async () => ({ ok: true, id: 99 })
      };
    });

    const payload = {
      operadorId: 5,
      tractorId: 8,
      cajaId: 3,
      clienteId: 2,
      tipoMov: 'EXPO PL',
      valeFisico: 'VF-12345',
      estatus: 'Completo'
    };

    const response = await db.insert('movimientos', payload);
    expect(response).toHaveProperty('id', 99);
    expect(capturedBody).toMatchObject({
      operador_id: 5,
      tractocamion_id: 8,
      caja_id: 3,
      cliente_id: 2,
      tipo_movimiento: 'exportacion',
      folio_boleta: 'VF-12345',
      estatus: 'entregado'
    });
  });

  it('debería enviar peticiones PUT para actualización con payload normalizado', async () => {
    let capturedMethod = null;
    let capturedUrl = null;
    vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, opts) => {
      capturedMethod = opts.method;
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, status: 'updated' })
      };
    });

    await db.update('cajas', 12, { numeroCaja: 'CJ-999', placas: 'TX-456' });
    expect(capturedMethod).toBe('PUT');
    expect(capturedUrl).toBe('/api/cajas/12');
  });

  it('debería enviar DELETE para eliminación y capturar errores 409 de integridad referencial', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ ok: false, error: 'Registro con dependencias asociadas' })
    });

    await expect(db.remove('clientes', 1)).rejects.toThrow('Registro con dependencias asociadas');
  });
});

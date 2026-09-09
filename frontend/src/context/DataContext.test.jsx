import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataProvider, useData } from './DataContext';
import { db } from '../services/db';

// Mock de las dependencias
vi.mock('../services/db', () => ({
  db: {
    getAll: vi.fn(),
    insert: vi.fn().mockResolvedValue({ id: 99 }),
    update: vi.fn().mockResolvedValue({ status: 'updated' }),
    deleteCliente: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    setAll: vi.fn().mockResolvedValue([])
  }
}));

const TestComponent = () => {
  const data = useData();
  return (
    <div>
      <span data-testid="clientes-count">{data.clientes.length}</span>
      <span data-testid="facturas-count">{data.facturas.length}</span>
      <button onClick={() => data.addFacturaYCliente({ folio: '123', monto: 100 }, 'CLIENTE TEST')}>Add Factura</button>
      <button onClick={() => data.crud.insert('clientes', { razonSocial: 'NUEVO CLIENTE' })}>Add Cliente CRUD</button>
    </div>
  );
};

describe('DataContext y DataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getAll.mockImplementation((table) => {
      if (table === 'clientes') return Promise.resolve([{ id: 1, razonSocial: 'CLIENTE 1', activo: true }]);
      if (table === 'facturas') return Promise.resolve([{ id: 1, folio: 'F01', monto: 500 }]);
      return Promise.resolve([]);
    });
  });

  it('debería proveer los datos iniciales tras montar el provider', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('clientes-count')).toHaveTextContent('1');
      expect(screen.getByTestId('facturas-count')).toHaveTextContent('1');
    });
  });

  it('addFacturaYCliente debería insertar factura y registrar nuevo cliente si no existe', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('clientes-count')).toHaveTextContent('1');
    });

    await act(async () => {
      screen.getByText('Add Factura').click();
    });

    expect(db.insert).toHaveBeenCalledWith('facturas', { folio: '123', monto: 100 });
    expect(db.insert).toHaveBeenCalledWith('clientes', expect.objectContaining({ razonSocial: 'CLIENTE TEST' }));
  });

  it('crud.insert debería llamar al servicio db y luego recargar los datos', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('clientes-count')).toHaveTextContent('1');
    });

    await act(async () => {
      screen.getByText('Add Cliente CRUD').click();
    });

    expect(db.insert).toHaveBeenCalledWith('clientes', { razonSocial: 'NUEVO CLIENTE' });
    expect(db.getAll).toHaveBeenCalled();
  });
});

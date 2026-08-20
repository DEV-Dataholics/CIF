import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataProvider, useData } from './DataContext';
import { db } from '../services/db';
import { initializeDb } from '../services/dbInit';

// Mock de las dependencias
vi.mock('../services/db', () => ({
  db: {
    getAll: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    deleteCliente: vi.fn(),
    remove: vi.fn(),
    setAll: vi.fn()
  }
}));

vi.mock('../services/dbInit', () => ({
  initializeDb: vi.fn()
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
      if (table === 'clientes') return [{ id: 1, razonSocial: 'CLIENTE 1' }];
      if (table === 'facturas') return [{ id: 1, folio: 'F01', monto: 500 }];
      return [];
    });
  });

  it('debería proveer los datos iniciales tras montar el provider', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );
    expect(initializeDb).toHaveBeenCalled();
    expect(screen.getByTestId('clientes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('facturas-count')).toHaveTextContent('1');
  });

  it('addFacturaYCliente debería insertar factura y registrar nuevo cliente si no existe', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    act(() => {
      screen.getByText('Add Factura').click();
    });

    expect(db.insert).toHaveBeenCalledWith('facturas', { folio: '123', monto: 100 });
    expect(db.insert).toHaveBeenCalledWith('clientes', expect.objectContaining({ razonSocial: 'CLIENTE TEST' }));
  });

  it('crud.insert debería llamar al servicio db y luego recargar los datos', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    act(() => {
      screen.getByText('Add Cliente CRUD').click();
    });

    expect(db.insert).toHaveBeenCalledWith('clientes', { razonSocial: 'NUEVO CLIENTE' });
    // db.getAll es llamado varias veces cada que se refrescan los datos
    expect(db.getAll).toHaveBeenCalled();
  });
});

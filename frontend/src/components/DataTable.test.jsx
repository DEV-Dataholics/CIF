import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable from './DataTable';

const mockColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre Completo' },
  { key: 'estatus', label: 'Estatus' }
];

const mockData = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  nombre: `Usuario ${i + 1}`,
  estatus: i % 2 === 0 ? 'Activo' : 'Inactivo'
}));

describe('DataTable', () => {
  it('debería renderizar la primera página correctamente', () => {
    render(<DataTable columns={mockColumns} data={mockData} pageSize={10} />);
    
    // Debe mostrar la columna
    expect(screen.getByText('Nombre Completo')).toBeInTheDocument();
    
    // Debe mostrar exactamente 10 filas (pageSize) de las 25
    expect(screen.getAllByText('Usuario 1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Usuario 10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Usuario 11').length).toBe(1); // Solo aparece en la tabla de impresión oculta
  });

  it('debería buscar e ignorar case sensitivity', () => {
    render(<DataTable columns={mockColumns} data={mockData} pageSize={10} />);
    
    const input = screen.getByPlaceholderText('Buscar en tabla...');
    
    // Buscar un usuario especifico
    fireEvent.change(input, { target: { value: 'usuario 22' } });
    
    expect(screen.getAllByText('Usuario 22')[0]).toBeInTheDocument();
    expect(screen.queryByText('Usuario 1')).not.toBeInTheDocument();
  });

  it('debería llamar a onRowClick al hacer clic en una fila', () => {
    const handleRowClick = vi.fn();
    render(<DataTable columns={mockColumns} data={mockData} pageSize={10} onRowClick={handleRowClick} />);
    
    const row = screen.getAllByText('Usuario 1')[0].closest('tr');
    fireEvent.click(row);
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });
});

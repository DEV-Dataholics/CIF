import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Cobranza from './Cobranza';
import { useData } from '../context/DataContext';

vi.mock('../context/DataContext', () => ({
  useData: vi.fn()
}));

describe('Cobranza View', () => {
  it('debería renderizar las facturas y calcular totales correctamente', () => {
    useData.mockReturnValue({
      facturas: [
        { id: 1, folio: 'F1', cliente: 'Cliente A', monto: 1000, estatus: 'pendiente', diasAntiguedad: 10, fechaEmision: '2026-06-01' },
        { id: 2, folio: 'F2', cliente: 'Cliente B', monto: 500, estatus: 'pagada', diasAntiguedad: 0, fechaEmision: '2026-06-10' },
        { id: 3, folio: 'F3', cliente: 'Cliente C', monto: 200, estatus: 'vencida', diasAntiguedad: 65, fechaEmision: '2026-04-01' }
      ],
      updateFacturaEstatus: vi.fn(),
      addFacturaYCliente: vi.fn()
    });

    render(<Cobranza />);

    // Verificamos que los folios de las facturas estén en pantalla
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('F2')).toBeInTheDocument();
    expect(screen.getByText('F3')).toBeInTheDocument();

    // Verificamos la tabla/resumen de totales (se formatean con comas según el locale)
    expect(screen.getAllByText(/\$1,700\.00/)[0]).toBeInTheDocument(); // Total
    expect(screen.getAllByText(/\$1,000\.00/)[0]).toBeInTheDocument(); // Pendiente
    expect(screen.getAllByText(/\$500\.00/)[0]).toBeInTheDocument();   // Pagada
    expect(screen.getAllByText(/\$200\.00/)[0]).toBeInTheDocument();   // Vencida
  });
});

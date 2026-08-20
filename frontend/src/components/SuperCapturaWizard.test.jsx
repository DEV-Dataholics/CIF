import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SuperCapturaWizard from './SuperCapturaWizard';
import { useData } from '../context/DataContext';

vi.mock('../context/DataContext', () => ({
  useData: vi.fn()
}));

describe('SuperCapturaWizard View', () => {
  it('debería renderizar correctamente el primer paso del wizard', () => {
    useData.mockReturnValue({
      operadores: [{ id: 1, nombreCompleto: 'OPERADOR DE PRUEBA', numeroOperador: 'OP01' }],
      unidades: [],
      cajas: [],
      clientes: [],
      tiposMovimiento: [],
      localidades: [],
      crud: { insert: vi.fn() }
    });

    render(<SuperCapturaWizard open={true} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Debe mostrar los indicadores de los pasos
    expect(screen.getAllByText(/Operador/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rutas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Confirmar/i).length).toBeGreaterThan(0);

    // Debe mostrar la selección de operador (Paso 1)
    expect(screen.getByPlaceholderText(/selecciona un operador/i)).toBeInTheDocument();
  });
});

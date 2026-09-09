// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

// Mock contexts
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, toggleTheme: vi.fn() })
}));

const mockUseData = vi.fn();
vi.mock('../context/DataContext', () => ({
  useData: () => mockUseData()
}));

describe('TopBar Component', () => {
  it('no debería mostrar badge rojo cuando alertasCount es 0', () => {
    mockUseData.mockReturnValue({
      operadores: [{ id: 1, activo: true, licencia_mx_vencimiento: null }],
      unidades: [{ id: 1, activo: true, vencimiento_poliza_mx: null }]
    });

    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    // El botón debe existir
    const bellBtn = screen.getByTitle(/Sin alertas pendientes/i);
    expect(bellBtn).toBeInTheDocument();

    // No debe existir ningún span con texto "3" ni badge
    expect(screen.queryByText('3')).toBeNull();
  });

  it('debería mostrar badge rojo cuando existen alertas críticas', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const expiringDateStr = tomorrow.toISOString().split('T')[0];

    mockUseData.mockReturnValue({
      operadores: [
        { id: 1, activo: true, licencia_mx_vencimiento: expiringDateStr },
        { id: 2, activo: true, visa_vencimiento: expiringDateStr }
      ],
      unidades: [
        { id: 1, activo: true, vencimiento_poliza_mx: expiringDateStr }
      ]
    });

    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    // El botón debe reflejar las 3 alertas
    const bellBtn = screen.getByTitle(/3 alertas críticas/i);
    expect(bellBtn).toBeInTheDocument();

    // Debe existir el badge con el número 3
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });
});

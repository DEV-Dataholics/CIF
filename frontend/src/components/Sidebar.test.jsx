import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  const renderSidebar = (collapsed = false, setCollapsed = vi.fn(), initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </MemoryRouter>
    );
  };

  it('debería renderizar todos los elementos principales', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Traslado')).toBeInTheDocument();
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
  });

  it('debería mostrar u ocultar secciones hijas al hacer clic (toggle)', () => {
    renderSidebar();
    const adminButton = screen.getByText('Administración');
    
    // Por defecto, en la ruta '/', 'Administración' no está expandida
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();

    // Clic para expandir
    fireEvent.click(adminButton);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Operadores')).toBeInTheDocument();

    // Clic para contraer
    fireEvent.click(adminButton);
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
  });

  it('debería auto-expandir Administración si la ruta inicial es /admin/...', () => {
    renderSidebar(false, vi.fn(), '/admin/clientes');
    
    // Al iniciar en una ruta admin, debería auto-expandirse
    expect(screen.getByText('Clientes')).toBeInTheDocument();
  });
});

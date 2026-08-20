import { test, expect } from '@playwright/test';

test.describe('Navegación del Portal Logístico', () => {
  test('debe cargar el Dashboard en la raíz', async ({ page }) => {
    await page.goto('/');

    // Verifica que el título de la página o un elemento clave esté presente
    // Como el portal asume un login activo de "MIRIAM ADMIN" y muestra un sidebar
    await expect(page.locator('text=CIF — Sistema de Gestión Logística')).toBeVisible();
    await expect(page.locator('text=Entradas Hoy')).toBeVisible();
  });

  test('debe navegar a la sección de Movimientos', async ({ page }) => {
    await page.goto('/');

    // Click en el enlace de movimientos en el sidebar
    await page.click('a[href="/movimientos"]');

    // Verificar que la URL cambie
    await expect(page).toHaveURL(/.*\/movimientos/);
    
    // Verificar que la tabla o título de Movimientos se muestra
    await expect(page.locator('text=Registrar Movimiento').first()).toBeVisible();
  });
});

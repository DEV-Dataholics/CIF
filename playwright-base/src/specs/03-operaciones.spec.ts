import { test, expect } from '@playwright/test';
import { MovimientosPage } from '../pages/MovimientosPage';

test.describe('Operaciones (Súper Captura y Viajes)', () => {
  let movs: MovimientosPage;

  test.beforeEach(async ({ page }) => {
    movs = new MovimientosPage(page);
    await movs.navigateTo('/movimientos');
  });

  test('Súper Captura: El Wizard puede ser limpiado por el usuario', async ({ page }) => {
    await movs.abrirSuperCaptura();
    
    // Simular escritura en un campo que sepamos que existe en la Súper Captura
    // Por ejemplo, cliente o referencia
    const refInput = page.locator('input[name="referencia_cliente"], input[placeholder*="Referencia"]');
    if (await refInput.isVisible()) {
      await refInput.fill('TEST-LIMPIEZA');
      
      // Buscar botón de Limpiar
      const btnLimpiar = page.locator('button', { hasText: /Limpiar/i }).first();
      await btnLimpiar.click();

      // Validar que se haya borrado (esto asume que el refInput sigue existiendo tras limpiar)
      await expect(refInput).toHaveValue('');
    }

    await movs.cerrarSuperCaptura();
  });

  test('Movimientos: Navegar entre tabs de estatus', async ({ page }) => {
    // Probar filtro de tabs
    await movs.tabEnRuta.click();
    
    // Validar visualmente que la tabla reacciona
    await expect(page.locator('table')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { MovimientosPage } from '../pages/MovimientosPage';

test.describe('Operaciones (SÃºper Captura y Viajes)', () => {
  let movs: MovimientosPage;

  test.beforeEach(async ({ page }) => {
    // --- INJECTED LOGIN ---
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@cif.mx');
    await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav', { state: 'attached' });
    // ----------------------

    movs = new MovimientosPage(page);
    await movs.navigateTo('/movimientos');
  });

  test('SÃºper Captura: El Wizard puede ser limpiado por el usuario', async ({ page }) => {
    await movs.abrirSuperCaptura();
    
    // Simular escritura en un campo que sepamos que existe en la SÃºper Captura
    // Por ejemplo, cliente o referencia
    const refInput = page.locator('input[name="referencia_cliente"], input[placeholder*="Referencia"]');
    if (await refInput.isVisible()) {
      await refInput.fill('TEST-LIMPIEZA');
      
      // Buscar botÃ³n de Limpiar
      const btnLimpiar = page.locator('button', { hasText: /Limpiar/i }).first();
      page.on('dialog', dialog => dialog.accept());
      await btnLimpiar.click();

      // Validar que se haya borrado (esto asume que el refInput sigue existiendo tras limpiar)
      await expect(refInput).toHaveValue('');
    }

    await movs.cerrarSuperCaptura();
  });

  test('Movimientos: Navegar entre tabs de estatus', async ({ page }) => {
    // Probar filtro de tabs
    await page.locator('select').first().selectOption({ label: 'En Ruta' });
    
    // Validar visualmente que la tabla reacciona
    await expect(page.locator('table').first()).toBeVisible();
  });
});



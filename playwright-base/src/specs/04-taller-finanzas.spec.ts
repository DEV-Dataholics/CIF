import { test, expect } from '@playwright/test';
import { TallerPage } from '../pages/TallerPage';

test.describe('Taller, Mantenimiento y Finanzas', () => {
  let taller: TallerPage;

  test.beforeEach(async ({ page }) => {
    taller = new TallerPage(page);
  });

  test('Taller: La vista principal de taller carga sin crashear', async ({ page }) => {
    await taller.navigateTo('/taller');
    
    const titulo = page.locator('h1, h2, h3', { hasText: /Taller/i }).first();
    await expect(titulo).toBeVisible();
    
    // Verificar que existen tarjetas o tablas para las solicitudes
    await expect(page.locator('.grid, table')).toBeVisible();
  });

  test('Finanzas (Concentrado Precios): Componente SearchableSelect soporta navegación', async ({ page }) => {
    await taller.navigateTo('/admin/precios');
    
    // Buscar un dropdown de los SearchableSelect implementados (como cliente o tipo)
    const selectTrigger = page.locator('button[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      
      // Probar navegación por teclado (TAB) que fue corregida recientemente
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Validar que se seleccionó algo
      await expect(selectTrigger).not.toContainText('Seleccionar');
    }
  });
});

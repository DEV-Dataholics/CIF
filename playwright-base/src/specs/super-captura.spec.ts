import { test, expect } from '@playwright/test';

test.describe('Súper Captura Wizard', () => {

  test.beforeEach(async ({ page }) => {
    // --- INJECTED LOGIN ---
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@cif.mx');
    await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav', { state: 'attached' });
    // ----------------------

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@cif.mx');
    await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav', { state: 'attached' });
  });

  test('Debe abrirse correctamente y no crashear por bucles infinitos', async ({ page }) => {
    // 1. Navegar a la página de movimientos (asume que auth.setup ya nos logueó)
    await page.goto('/movimientos');
    
    // 2. Esperar a que la página cargue y hacer click en Súper Captura
    const btnAbrir = page.locator('button', { hasText: /Captura/i }).first();
    await btnAbrir.waitFor({ state: 'visible' });
    await btnAbrir.click();

    // 3. Validar que el Wizard se abre viendo su título
    const wizardTitle = page.locator('h2', { hasText: /Captura/i });
    await expect(wizardTitle).toBeVisible({ timeout: 5000 });

    // 4. Seleccionar un operador de prueba (para validar que los dropdowns responden)
    // El Wizard renderiza labels. Buscamos el dropdown de operador.
    const operadorSelect = page.locator('select').first(); // Asume que es el primer select (operador)
    await expect(operadorSelect).toBeEnabled();

    // 5. Cerrar o Limpiar Captura
    const btnCerrar = page.locator('button[title="Cerrar"]');
    if (await btnCerrar.isVisible()) {
      await btnCerrar.click();
    }
  });
});


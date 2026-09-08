import { test, expect } from '@playwright/test';

// Desactivar el estado heredado para probar el login desde cero
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('AutenticaciÃ³n y RBAC', () => {
  test('Debe rechazar credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'usuario_falso@cif.mx');
    await page.fill('input[type="password"]', 'ClaveEquivocada123');
    await page.click('button[type="submit"]');

    // Validar que aparezca un mensaje de error en la UI (texto rojo)
    const errorMsg = page.locator('.text-red-400, .bg-red-500\\/10');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('Debe bloquear el acceso a rutas protegidas sin sesiÃ³n', async ({ page }) => {
    // Intentar ir directo a movimientos
    await page.goto('/movimientos');
    
    // DeberÃ­a redirigirnos al login
    await expect(page).toHaveURL(/.*login/);
  });
});


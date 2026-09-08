import { test, expect } from '@playwright/test';
import { CatalogosPage } from '../pages/CatalogosPage';

test.describe('CatÃ¡logos Core (CRUD)', () => {
  let catalogos: CatalogosPage;

  test.beforeEach(async ({ page }) => {
    // --- INJECTED LOGIN ---
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@cif.mx');
    await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav', { state: 'attached' });
    // ----------------------

    catalogos = new CatalogosPage(page);
  });

  test('Operadores: Crear operador de prueba y eliminarlo', async ({ page }) => {
    const timestamp = new Date().getTime();
    const nombreOperador = `[TEST] Operador ${timestamp}`;

    await catalogos.irA('/admin/operadores');
    
    // Asumimos que la pÃ¡gina cargÃ³ si el botÃ³n de agregar estÃ¡
    await expect(catalogos.btnAgregar).toBeVisible();

    await catalogos.iniciarCreacion();
    
    // Llenar campos requeridos genÃ©ricos
    const modal = page.locator('.fixed.inset-0').first();
    await modal.locator('xpath=.//label[normalize-space(text())="Nombre Completo"]/following-sibling::input').fill(nombreOperador);
    await modal.locator('xpath=.//label[normalize-space(text())="Licencia"]/following-sibling::input').fill('LIC-TEST-123');
    
    await catalogos.guardarYValidar();

    // Buscar y validar que existe en la tabla
    await catalogos.buscar(nombreOperador);
    await expect(catalogos.tableRows.first()).toContainText(nombreOperador);

    // Limpieza (Delete)
    await catalogos.eliminarUltimo(nombreOperador);
  });

  test('Cajas: Validar semaforizaciÃ³n visual de vigencias', async ({ page }) => {
    await catalogos.irA('/admin/cajas');
    
    // Revisar si existen Ã­conos de alerta en la tabla
    const tabla = page.locator('table');
    await expect(tabla).toBeVisible();
    
    // Verificamos que se renderice correctamente la columna de alertas (Ã­conos svg)
    // No exigimos que haya rojas, pero que el componente no haya crasheado
    const iconos = page.locator('svg[title*="vencer"], svg[title*="orden"], svg[title*="vencido"]');
    // Si la tabla no estÃ¡ vacÃ­a, deberÃ­amos ver al menos un Ã­cono
    if (await catalogos.tableRows.count() > 0) {
       await expect(iconos.first()).toBeVisible();
    }
  });
});



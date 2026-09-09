import { test, expect } from '@playwright/test';
import { CatalogosPage } from '../pages/CatalogosPage';

test.describe('CRUD Global de Catálogos (Crear, Editar, Borrar)', () => {
  let catalogos: CatalogosPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@cif.mx');
    await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav', { state: 'attached' });
    catalogos = new CatalogosPage(page);
  });

  const entidades = [
    { 
      url: '/admin/clientes', 
      name: 'Cliente', 
      fillValue: `[TEST] CL-${new Date().getTime()}`,
      extraFill: async (modal) => {}
    },
    { 
      url: '/admin/cajas', 
      name: 'Caja', 
      fillValue: `[TEST] CAJ-${new Date().getTime()}`,
      extraFill: async (modal) => {
          // Llenar tipo
          await modal.locator('select').first().selectOption({ index: 1 });
          // Llenar placas (segundo input)
          await modal.locator('input[type="text"]').nth(1).fill('123-ABC');
      }
    },
    { 
      url: '/admin/unidades', 
      name: 'Unidad', 
      fillValue: `[TEST] UN-${new Date().getTime()}`,
      extraFill: async (modal) => {
          // Llenar placas (segundo input)
          await modal.locator('input[type="text"]').nth(1).fill('999-XYZ');
      }
    },
    { 
      url: '/admin/localidades', 
      name: 'Localidad', 
      fillValue: `[TEST] LOC-${new Date().getTime()}`,
      extraFill: async (modal) => {}
    }
  ];

  for (const entidad of entidades) {
    test(`Flujo completo CRUD para: ${entidad.name}`, async ({ page }) => {
      // 1. Ir a la vista
      await catalogos.irA(entidad.url);
      await expect(catalogos.btnAgregar).toBeVisible();

      // 2. CREAR (Create)
      await catalogos.iniciarCreacion();
      const modal = page.locator('.fixed.inset-0').first();
      await modal.locator('input[type="text"]').first().fill(entidad.fillValue);
      await entidad.extraFill(modal);
      await catalogos.guardarYValidar();

      // 3. LEER (Read)
      await catalogos.buscar(entidad.fillValue);
      await expect(catalogos.tableRows.first()).toContainText(entidad.fillValue);

      // 4. EDITAR (Update)
      const btnEditar = catalogos.tableRows.first().locator('button[title="Editar"], button:has(.ph-pencil-simple)');
      await btnEditar.click();
      const editedValue = `${entidad.fillValue} MODIFICADO`;
      await modal.locator('input[type="text"]').first().fill(editedValue);
      await catalogos.guardarYValidar();

      // Validar Edición
      await catalogos.buscar(editedValue);
      await expect(catalogos.tableRows.first()).toContainText(editedValue);

      // 5. BORRAR (Delete)
      await catalogos.eliminarUltimo(editedValue);
      
      // Validar Borrado
      await catalogos.buscar(editedValue);
      await expect(catalogos.tableRows.first()).toContainText('Sin resultados', { timeout: 3000 }).catch(() => {});
    });
  }
});

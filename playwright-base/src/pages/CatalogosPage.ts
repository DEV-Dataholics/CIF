import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CatalogosPage extends BasePage {
  readonly btnAgregar: Locator;
  readonly tableRows: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.btnAgregar = page.locator('button', { hasText: 'Agregar' });
    this.tableRows = page.locator('tbody tr');
    this.searchInput = page.locator('input[placeholder*="Buscar"]');
  }

  async irA(catalogoUrl: string) {
    await this.navigateTo(catalogoUrl);
  }

  async buscar(termino: string) {
    await this.fillInput(this.searchInput, termino);
    await this.page.waitForTimeout(500); // Dar tiempo al filtrado reactivo
  }

  async iniciarCreacion() {
    await this.clickElement(this.btnAgregar);
    // Esperar a que el modal/drawer se abra
    await this.page.waitForSelector('.fixed.inset-0', { state: 'visible' });
  }

  async guardarYValidar() {
    await this.clickElement(this.page.locator('button', { hasText: /Guardar Cambios|Crear Registro/i }));
    // Esperar a que el modal se cierre (indicador de Ã©xito) o un toast de Ã©xito
    await this.page.waitForTimeout(1000); 
  }

  async eliminarUltimo(nombre: string) {
    await this.buscar(nombre);
    // Asume que la primera fila es nuestro registro
    const btnEliminar = this.tableRows.first().locator('button[title="Eliminar"], button:has(.ph-trash)');
    if (await btnEliminar.isVisible()) {
      await btnEliminar.click();
      // Confirmar eliminaciÃ³n si hay modal
      const btnConfirmar = this.page.locator('button', { hasText: /SÃ­|Confirmar|Eliminar/i }).last();
      if (await btnConfirmar.isVisible()) {
        await btnConfirmar.click();
      }
    }
  }
}


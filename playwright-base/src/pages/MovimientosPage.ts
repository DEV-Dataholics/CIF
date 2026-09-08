import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class MovimientosPage extends BasePage {
  readonly btnSuperCaptura: Locator;
  readonly tableRows: Locator;
  readonly tabEnRuta: Locator;

  constructor(page: Page) {
    super(page);
    this.btnSuperCaptura = page.locator('button', { hasText: /Captura/i }).first();
    this.tableRows = page.locator('tbody tr');
    this.tabEnRuta = page.locator('button', { hasText: /En Ruta/i });
  }

  async abrirSuperCaptura() {
    await this.clickElement(this.btnSuperCaptura);
    await expect(this.page.locator('h2', { hasText: /Captura/i })).toBeVisible({ timeout: 5000 });
  }

  async llenarCartaPorte(origen: string, destino: string, peso: string) {
    // Estos selectores dependerÃ¡n de cÃ³mo implementaste los SearchableSelect
    // Ejemplo bÃ¡sico:
    await this.page.locator('input[placeholder="Buscar origen..."]').fill(origen);
    await this.page.keyboard.press('Tab'); // Autocompletar
    
    await this.page.locator('input[placeholder="Buscar destino..."]').fill(destino);
    await this.page.keyboard.press('Tab');
    
    await this.page.locator('input[name="peso"]').fill(peso);
  }

  async asignarUnidadYOperador() {
    // LÃ³gica para asignar un viaje (ejemplo)
    await this.page.locator('select[name="operador_id"]').selectOption({ index: 1 });
    await this.page.locator('select[name="tractocamion_id"]').selectOption({ index: 1 });
  }

  async cerrarSuperCaptura() {
    const btnCerrar = this.page.locator('button[title="Cerrar"], button:has-text("Cerrar")').first();
    if (await btnCerrar.isVisible()) {
      await btnCerrar.click();
    }
  }
}


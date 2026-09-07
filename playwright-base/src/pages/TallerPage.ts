import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class TallerPage extends BasePage {
  readonly btnNuevaSolicitud: Locator;

  constructor(page: Page) {
    super(page);
    this.btnNuevaSolicitud = page.locator('button', { hasText: /Solicitud/i });
  }

  async crearSolicitudMantenimiento(unidad: string, descripcion: string) {
    await this.clickElement(this.btnNuevaSolicitud);
    // Llenar formulario
    await this.page.locator('select[name="unidad"]').selectOption({ label: unidad });
    await this.page.locator('textarea[name="descripcion"]').fill(descripcion);
    await this.clickElement('button[type="submit"]');
  }
}

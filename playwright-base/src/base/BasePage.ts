import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage genérica. Todas las páginas específicas (Login, Catálogos, etc.)
 * deben extender (heredar) de esta clase para reutilizar la lógica común.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navegación segura
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Helpers de llenado
  async fillInput(locator: Locator | string, value: string) {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await el.waitFor({ state: 'visible' });
    await el.fill(value);
  }

  // Helpers de click
  async clickElement(locator: Locator | string) {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await el.waitFor({ state: 'visible' });
    await el.click();
  }

  // Aserciones comunes
  async verifyTextVisible(text: string) {
    await expect(this.page.locator(`text=${text}`).first()).toBeVisible();
  }
}

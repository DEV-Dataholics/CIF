import { test as setup } from '@playwright/test';
import * as path from 'path';

/**
 * Este archivo se ejecuta ANTES que las pruebas.
 * Sirve para autenticar al usuario y guardar su sesión (cookies/tokens) 
 * en un archivo, evitando tener que hacer login en cada test.
 */

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const url = process.env.BASE_URL || 'http://localhost:3000';
  await page.goto(`${url}/login`);
  
  // Reemplazar los selectores según el proyecto destino
  await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'test@test.com');
  await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'password');
  await page.click('button[type="submit"]');

  try {
    // Esperar a que el contenedor principal se monte en el DOM (en móvil puede estar oculto, así que state: attached)
    await page.waitForSelector('nav', { state: 'attached', timeout: 15000 });
  } catch (e) {
    console.log("TIMEOUT WAITING FOR REDIRECT. CURRENT URL:", page.url());
    throw e;
  }

  
  // Guardar el estado
  await page.context().storageState({ path: authFile });

  // Guardar también el sessionStorage, ya que la app lo usa para el auth state
  const sessionState = await page.evaluate(() => JSON.stringify(sessionStorage));
  require('fs').writeFileSync(path.join(__dirname, '../../.auth/session.json'), sessionState);

});

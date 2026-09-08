import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type CustomFixtures = {
  randomEmail: string;
};

export const test = base.extend<CustomFixtures>({
  randomEmail: async ({}, use) => {
    const email = `testuser_${Math.floor(Math.random() * 10000)}@test.com`;
    await use(email);
  },
  
  page: async ({ page }, use) => {
    try {
      const sessionPath = path.join(__dirname, '../../.auth/session.json');
      if (fs.existsSync(sessionPath)) {
        const sessionData = fs.readFileSync(sessionPath, 'utf-8');
        // Inyectar el sessionStorage ANTES de que cualquier página cargue
        await page.addInitScript((data) => {
          try {
            const parsed = JSON.parse(data);
            for (const key in parsed) {
              window.sessionStorage.setItem(key, parsed[key]);
            }
          } catch(e) {}
        }, sessionData);
      }
    } catch (e) {
      console.error("Error injectando sessionStorage", e);
    }
    
    await use(page);
  }
});

export { expect } from '@playwright/test';

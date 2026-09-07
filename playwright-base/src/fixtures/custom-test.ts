import { test as base } from '@playwright/test';

// Aquí puedes extender el objeto `test` de Playwright para inyectar 
// utilidades personalizadas (como generar data random, clientes API, etc) 
// directamente en los parámetros de tus pruebas.

type CustomFixtures = {
  randomEmail: string;
};

export const test = base.extend<CustomFixtures>({
  randomEmail: async ({}, use) => {
    // Genera un email aleatorio y lo inyecta en el test
    const email = `testuser_${Math.floor(Math.random() * 10000)}@test.com`;
    await use(email);
  },
});

export { expect } from '@playwright/test';

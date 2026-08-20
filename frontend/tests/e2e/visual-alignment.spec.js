import { test, expect } from '@playwright/test';

test.describe('Alineación y Regresión Visual', () => {
  test('El Dashboard debe verse exactamente igual al diseño de referencia', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que los elementos críticos carguen (como gráficos o tablas)
    await page.waitForSelector('text=Entradas Hoy');

    // Esta línea toma una captura de pantalla y la compara con la existente.
    // La primera vez que se ejecute, creará la imagen base (baseline) en la carpeta de pruebas.
    await expect(page).toHaveScreenshot('dashboard-baseline.png', { fullPage: true });
  });

  test('El Sidebar debe mantener sus estilos y proporciones', async ({ page }) => {
    await page.goto('/');
    
    // Tomar captura solo del componente Sidebar (asumiendo que es un `aside` o tiene una clase específica)
    // Aquí usamos aside como selector genérico, ajustaremos si es necesario
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toHaveScreenshot('sidebar-baseline.png');
  });
});

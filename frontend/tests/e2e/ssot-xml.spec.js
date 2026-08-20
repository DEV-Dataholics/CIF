import { test, expect } from '@playwright/test';

test.describe('Single Source of Truth (SSOT) - XML Injection Flow', () => {
  
  test('Una factura inyectada alimenta al contexto global y se refleja en los catálogos de Movimientos', async ({ page }) => {
    // 1. Navegar a la pantalla de Cobranza (Finanzas)
    await page.goto('http://localhost:5173/admin/cobranza');

    // Preparar un XML simulado en memoria
    const testClientName = `Cliente Nuevo E2E Test ${Date.now()}`;
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Serie="E2E" Folio="9999" Fecha="2026-06-15T10:00:00" Total="15000.00">
  <cfdi:Receptor Rfc="E2E000000XXX" Nombre="${testClientName}" UsoCFDI="G03"/>
</cfdi:Comprobante>`;

    // 2. Interceptar el diálogo de alerta para cerrarlo automáticamente y leer el texto
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('CFDI procesado correctamente');
      expect(dialog.message()).toContain(testClientName);
      await dialog.accept();
    });

    // 3. Subir el XML simulando un archivo
    // Creamos el buffer y lo asignamos al input type="file"
    const buffer = Buffer.from(xmlContent, 'utf-8');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-invoice.xml',
      mimeType: 'text/xml',
      buffer
    });

    // 4. Comprobar que la tabla de cobranza contiene al cliente
    // Esperar a que la tabla se actualice y contenga el nombre del cliente
    await expect(page.locator('table')).toContainText(testClientName);

    // 5. Navegar a Movimientos (Operación > Traslados)
    await page.goto('http://localhost:5173/movimientos');

    // 6. Abrir "Nuevo Traslado" (el drawer lateral)
    await page.getByRole('button', { name: /Nuevo Traslado/i }).click();

    // 7. Esperar a que el Drawer se abra y validar que el select de Clientes contenga la opción nueva.
    // El drawer panel envuelve todos estos campos
    const drawer = page.locator('.drawer-panel');
    await expect(drawer).toContainText('Nuevo Traslado');
    
    // Validar que el texto del cliente aparece en las opciones del drawer
    await expect(drawer).toContainText(testClientName);
  });

});

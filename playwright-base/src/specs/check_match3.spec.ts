
import { test, expect } from "@playwright/test";
test("check match logic", async ({ page }) => {
    await page.goto("https://cif.dataholics.com.mx/login");
    await page.fill("input[type=email]", "admin@cif.mx");
    await page.fill("input[type=password]", "Admin123!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    
    await page.goto("https://cif.dataholics.com.mx/reportes/prefacturacion");
    await page.waitForTimeout(3000);

    const log = await page.evaluate(async () => {
        const root = document.querySelector("#root");
        // We will just do the match logic again but with fetch directly
        const [pRes, mRes, cRes, tRes] = await Promise.all([
            fetch("/api/precios").then(r => r.json()), 
            fetch("/api/viajes").then(r => r.json()), 
            fetch("/api/clientes").then(r => r.json()), 
            fetch("/api/tiposMovimiento").then(r => r.json())
        ]);
        const dbPrecios = pRes;
        const dbMovimientos = mRes.viajes;
        const dbClientes = cRes.clientes;
        const dbTiposMov = tRes.tiposMovimiento || tRes;

        const p = dbPrecios.find(p => p.cliente_id == 7 && p.tipo_mov_id == 48); // DANHIL & RECOLECCION
        return {
            p,
            type: dbTiposMov.find(t => t.id == 48),
            precio: p ? (p.precio || p.dolares) : null
        };
    });
    console.log("LOG:", log);
});


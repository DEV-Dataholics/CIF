
import { test, expect } from "@playwright/test";
test("check match logic", async ({ page }) => {
    await page.goto("https://cif.dataholics.com.mx/login");
    await page.fill("input[type=email]", "admin@cif.mx");
    await page.fill("input[type=password]", "Admin123!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    
    const debug = await page.evaluate(async () => {
        const [pRes, mRes, cRes, tRes] = await Promise.all([
            fetch("/api/precios"), fetch("/api/viajes"), fetch("/api/clientes"), fetch("/api/tiposMovimiento")
        ]);
        const dbPrecios = await pRes.json();
        const dbMovimientos = (await mRes.json()).viajes;
        const dbClientes = (await cRes.json()).clientes;
        const dbTiposMov = (await tRes.json()).tiposMovimiento || await tRes.json();

        // mimic DataContext hydration
        const dbPreciosHydrated = dbPrecios.map(p => {
          const c = dbClientes.find(cli => cli.id == p.cliente_id);
          const t = dbTiposMov.find(tm => tm.id == p.tipo_mov_id);
          return {
            ...p,
            cliente: c ? c.razon_social : p.cliente,
            tipoMovimiento: t ? t.nombre : p.tipoMovimiento,
            dolares: p.precio_usd !== undefined ? p.precio_usd : (p.precio || p.dolares),
          };
        });

        const dbMovimientosHydrated = dbMovimientos.map(m => {
          const c = dbClientes.find(cli => cli.id == m.cliente_id);
          const t = dbTiposMov.find(tm => tm.id == m.tipo_movimiento);
          return {
            ...m,
            cliente: c ? c.razon_social : m.cliente,
            tipoMov: t ? t.nombre : m.tipo_movimiento,
          };
        });

        // Mimic matching for "recoleccion" and DANHIL
        const matched = dbMovimientosHydrated.filter(m => m.cliente === "DANHIL").map(m => {
            const pCliente = (m.cliente || "").trim().toLowerCase();
            const mTipo = (m.tipoMov || "").trim().toLowerCase().replace(/ /g, "_");
            const tarifa = dbPreciosHydrated.find(p => {
                const pc = (p.cliente || "").trim().toLowerCase();
                const pt = (p.tipoMovimiento || "").trim().toLowerCase().replace(/ /g, "_");
                return pc === pCliente && pt === mTipo;
            });
            return {
                m_id: m.id,
                mTipo,
                pCliente,
                encontrado: !!tarifa,
                tarifa: tarifa ? tarifa.dolares : null
            };
        });
        return matched.slice(0, 5);
    });
    console.log("Debug Match:", debug);
});


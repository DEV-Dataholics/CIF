
import { test } from "@playwright/test";
test("debug DataContext precios", async ({ page }) => {
    await page.goto("https://cif.dataholics.com.mx/login");
    await page.fill("input[type=email]", "admin@cif.mx");
    await page.fill("input[type=password]", "Admin123!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    
    await page.goto("https://cif.dataholics.com.mx/reportes/prefacturacion");
    await page.waitForTimeout(3000);

    const debug = await page.evaluate(async () => {
        const [pData, mData, cData, tData] = await Promise.all([
            fetch("/api/precios").then(r => r.json()), 
            fetch("/api/viajes").then(r => r.json()), 
            fetch("/api/clientes").then(r => r.json()), 
            fetch("/api/tiposMovimiento").then(r => r.json())
        ]);
        const dbPrecios = pData;
        const dbMovimientos = mData.viajes;
        const dbClientes = cData.clientes;
        const dbTiposMov = tData.tiposMovimiento || tData.data || tData;
        
        // Check first precio hydration
        const firstPrecio = dbPrecios[0];
        const matchedCliente = dbClientes.find(c => c.id === firstPrecio.cliente_id || c.id == firstPrecio.cliente_id);
        const matchedTipo = dbTiposMov && Array.isArray(dbTiposMov) ? dbTiposMov.find(t => t.id === firstPrecio.tipo_mov_id || t.id == firstPrecio.tipo_mov_id) : null;
        
        // Check first movement
        const firstViaje = dbMovimientos[0];
        const tipoMovRaw = firstViaje ? firstViaje.tipo_movimiento : null;
        
        // Simulate exact matching
        const hydrated = dbPrecios.slice(0, 3).map(p => {
            const c = dbClientes.find(cli => cli.id === p.cliente_id || cli.id == p.cliente_id);
            const t = Array.isArray(dbTiposMov) ? dbTiposMov.find(tm => tm.id === p.tipo_mov_id || tm.id == p.tipo_mov_id) : null;
            return {
                id: p.id,
                cliente: c ? (c.razon_social || c.razonSocial) : "NO_MATCH",
                tipoMovimiento: t ? t.nombre : "NO_MATCH_TYPE",
                precio: p.precio
            };
        });
        
        const hydratedMovs = dbMovimientos.slice(0, 3).map(m => {
            const c = dbClientes.find(cli => cli.id === m.cliente_id || cli.id == m.cliente_id);
            const t = Array.isArray(dbTiposMov) ? dbTiposMov.find(tm => tm.id === m.tipo_movimiento || tm.id == m.tipo_movimiento) : null;
            return {
                id: m.id,
                cliente: c ? (c.razon_social || c.razonSocial) : "NO_MATCH",
                tipoMov: t ? t.nombre : ("RAW_TYPE=" + m.tipo_movimiento),
                tipoMovRaw: m.tipo_movimiento
            };
        });
        
        return {
            tiposMovType: typeof dbTiposMov,
            isArray: Array.isArray(dbTiposMov),
            tiposMovCount: Array.isArray(dbTiposMov) ? dbTiposMov.length : "NOT_ARRAY",
            hydrated,
            hydratedMovs
        };
    });
    console.log("DEBUG:", JSON.stringify(debug, null, 2));
});


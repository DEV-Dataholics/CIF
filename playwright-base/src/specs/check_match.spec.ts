
import { test, expect } from "@playwright/test";
test("check price match", async ({ page }) => {
    await page.goto("https://cif.dataholics.com.mx/login");
    await page.fill("input[type=email]", "admin@cif.mx");
    await page.fill("input[type=password]", "Admin123!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    
    const precios = await page.evaluate(async () => {
        const r = await fetch("/api/precios");
        return await r.json();
    });
    console.log("Precios:", JSON.stringify(precios).substring(0, 500));

    const viajes = await page.evaluate(async () => {
        const r = await fetch("/api/viajes");
        return await r.json();
    });
    console.log("Viajes:", JSON.stringify(viajes).substring(0, 500));
});



import { test, expect } from "@playwright/test";
test("check errors", async ({ page }) => {
    page.on("pageerror", err => console.log(`PAGE ERROR: ${err.message}`));
    page.on("console", msg => {
        if (msg.type() === "error") console.log(`CONSOLE ERROR: ${msg.text()}`);
    });
    
    await page.goto("https://cif.dataholics.com.mx/login");
    await page.fill("input[type=email]", "admin@cif.mx");
    await page.fill("input[type=password]", "Admin123!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    
    await page.goto("https://cif.dataholics.com.mx/admin/peajes");
    await page.waitForTimeout(3000);
});


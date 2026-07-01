const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

let browser;
(async () => {
  const root = path.resolve(__dirname, "..");
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.evaluate(() => {
    localStorage.removeItem("stellarFrontierSaveV1");
    localStorage.removeItem("stellarFrontierSeenHelp");
    location.reload();
  });
  await page.waitForFunction(() => window.__game?.state && document.querySelector("#stationPanel"));
  if (errors.length) throw new Error(`Load errors: ${errors.join(" | ")}`);
  if (await page.locator("#startBtn").isVisible()) await page.click("#startBtn");
  else await page.evaluate(() => document.querySelector("#startBtn").click());
  await page.waitForFunction(() => !document.querySelector("#stationPanel").classList.contains("hidden"));

  await page.evaluate(() => {
    const state = window.__game.state;
    state.credits = 50000;
    state.cargo = {};
    state.stationStorage.aurora = {};
    window.__game.renderStation();
  });

  await page.click('[data-hub-module="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));
  await page.waitForFunction(() => [...document.querySelectorAll("#marketItemList img")].every(image => image.complete && image.naturalWidth > 0));
  const marketVisual = await page.evaluate(() => ({
    itemImages: document.querySelectorAll("#marketItemList img").length,
    loadedImages: [...document.querySelectorAll("#marketItemList img")].filter(image => image.naturalWidth > 0).length,
    selectedImageWidth: document.querySelector("#marketSelectedImage").naturalWidth,
    visibleSecondaryLines: [...document.querySelectorAll(".market-list-item small")].filter(node => getComputedStyle(node).display !== "none").length,
    summary: document.querySelector("#marketSummary").textContent
  }));
  await page.screenshot({ path: path.join(__dirname, "market-images-smoke.png"), fullPage: true });

  await page.click('[data-station-tab="hangar"]');
  await page.waitForFunction(() => document.querySelector("#hangarTab").classList.contains("active"));
  const before = await page.evaluate(() => ({
    credits: window.__game.state.credits,
    oreStock: window.__game.state.markets.aurora.ore.stock,
    salvageStock: window.__game.state.markets.aurora.salvage.stock,
    buttonText: document.querySelector('[data-procure-recipe="ammo_pack"]').textContent.trim(),
    disabled: document.querySelector('[data-procure-recipe="ammo_pack"]').disabled
  }));

  await page.click('[data-procure-recipe="ammo_pack"]');
  await page.waitForTimeout(100);
  const afterProcure = await page.evaluate(() => ({
    credits: window.__game.state.credits,
    storage: { ...(window.__game.state.stationStorage.aurora || {}) },
    oreStock: window.__game.state.markets.aurora.ore.stock,
    salvageStock: window.__game.state.markets.aurora.salvage.stock,
    craftDisabled: document.querySelector('[data-craft-recipe="ammo_pack"]').disabled,
    procureText: document.querySelector('[data-procure-recipe="ammo_pack"]').textContent.trim()
  }));

  await page.click('[data-craft-recipe="ammo_pack"]');
  await page.waitForTimeout(100);
  const afterCraft = await page.evaluate(() => ({
    storage: { ...(window.__game.state.stationStorage.aurora || {}) },
    credits: window.__game.state.credits
  }));
  await page.screenshot({ path: path.join(__dirname, "one-click-procurement-smoke.png"), fullPage: true });
  await page.click('[data-station-tab="shipyard"]');
  await page.waitForFunction(() => document.querySelector("#shipyardTab").classList.contains("active"));
  await page.click('[data-shipyard-view-choice="manufacturing"]');
  const pluginButtonText = await page.locator('[data-procure-plugin="railgun"]').textContent();
  await page.click('[data-procure-plugin="railgun"]');
  await page.waitForTimeout(100);
  const pluginProcurement = await page.evaluate(() => ({
    storage: { ...(window.__game.state.stationStorage.aurora || {}) },
    craftDisabled: document.querySelector('[data-craft-plugin="railgun"]').disabled,
    credits: window.__game.state.credits
  }));

  if (marketVisual.itemImages !== 11 || marketVisual.loadedImages !== 11 || marketVisual.selectedImageWidth <= 0) {
    throw new Error(`Market images failed: ${JSON.stringify(marketVisual)}`);
  }
  if (marketVisual.visibleSecondaryLines !== 0) throw new Error(`Market list is still text-heavy: ${JSON.stringify(marketVisual)}`);
  if (before.disabled || !before.buttonText.includes("一键采购")) throw new Error(`Procurement button unavailable: ${JSON.stringify(before)}`);
  if (!(afterProcure.credits < before.credits) || !(afterProcure.oreStock < before.oreStock) || !(afterProcure.salvageStock < before.salvageStock)) {
    throw new Error(`Procurement did not affect economy: ${JSON.stringify({ before, afterProcure })}`);
  }
  if (afterProcure.storage.ore !== 3 || afterProcure.storage.salvage !== 1 || afterProcure.craftDisabled) {
    throw new Error(`Purchased materials not delivered locally: ${JSON.stringify(afterProcure)}`);
  }
  if (afterCraft.storage.ammo !== 6 || afterCraft.storage.ore || afterCraft.storage.salvage) {
    throw new Error(`Craft after procurement failed: ${JSON.stringify(afterCraft)}`);
  }
  if (!pluginButtonText.includes("一键采购") || pluginProcurement.storage.alloy !== 3 || pluginProcurement.storage.guidance !== 1 || pluginProcurement.storage.salvage !== 2 || pluginProcurement.craftDisabled) {
    throw new Error(`Plugin procurement failed: ${JSON.stringify({ pluginButtonText, pluginProcurement })}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    marketVisual,
    before,
    afterProcure,
    afterCraft,
    pluginProcurement,
    screenshots: [
      path.join(__dirname, "market-images-smoke.png"),
      path.join(__dirname, "one-click-procurement-smoke.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

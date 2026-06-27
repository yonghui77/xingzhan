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
  await page.click("#startBtn");
  await page.waitForFunction(() => !document.querySelector("#stationPanel").classList.contains("hidden"));

  await page.evaluate(() => {
    const state = window.__game.state;
    state.stationStorage.aurora = {
      ...(state.stationStorage.aurora || {}),
      alloy: 20,
      guidance: 20,
      salvage: 20,
      capacitor: 20,
      ceramic: 20
    };
    window.__game.renderStation();
  });

  await page.click('[data-hub-module="shipyard"]');
  await page.waitForFunction(() => document.querySelector("#shipyardTab").classList.contains("active"));
  const before = await page.evaluate(() => ({
    damage: window.__game.shipStats().damage,
    shield: window.__game.shipStats().maxShield,
    weaponText: document.querySelector("#combatHud .ability:first-child span").textContent
  }));

  await page.click('[data-craft-plugin="railgun"]');
  await page.click('[data-install-plugin="railgun"]');
  await page.click('[data-craft-plugin="shield_amp"]');
  await page.click('[data-install-plugin="shield_amp"]');
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => ({
    fitted: { ...window.__game.state.fittedPlugins },
    pluginStore: { ...(window.__game.state.pluginInventory.aurora || {}) },
    damage: window.__game.shipStats().damage,
    shield: window.__game.shipStats().maxShield,
    weaponText: document.querySelector("#combatHud .ability:first-child span").textContent,
    slotText: document.querySelector("#fittingPanel").innerText,
    forgeText: document.querySelector("#pluginForge").innerText
  }));

  await page.screenshot({ path: path.join(__dirname, "plugin-smoke.png"), fullPage: true });

  if (after.fitted.weapon !== "railgun" || after.fitted.defense !== "shield_amp") throw new Error(`Plugin fitting failed: ${JSON.stringify(after)}`);
  if (!(after.damage > before.damage)) throw new Error(`Railgun did not increase damage: ${JSON.stringify({ before, after })}`);
  if (!(after.shield > before.shield)) throw new Error(`Shield amp did not increase shield: ${JSON.stringify({ before, after })}`);
  if (!after.weaponText.includes("磁轨炮")) throw new Error(`Weapon HUD did not update: ${JSON.stringify(after)}`);
  if (!after.slotText.includes("轻型磁轨炮") || !after.slotText.includes("小型护盾增幅器")) throw new Error(`Fitting panel missing installed plugins: ${JSON.stringify(after)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    before,
    after: {
      fitted: after.fitted,
      damage: Math.round(after.damage),
      shield: after.shield,
      weaponText: after.weaponText
    },
    screenshot: path.join(__dirname, "plugin-smoke.png")
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

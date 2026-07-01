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
  await page.click('[data-hub-module="contracts"]');
  await page.waitForFunction(() => document.querySelector("#contractsTab").classList.contains("active"));

  const initialJournal = await page.evaluate(() => ({
    pathCount: document.querySelectorAll("[data-career-path]").length,
    active: document.querySelector(".career-path.active")?.dataset.careerPath,
    focus: document.querySelector(".career-focus")?.innerText
  }));
  await page.click('[data-career-path="industrialist"]');
  await page.evaluate(() => {
    const game = window.__game;
    game.state.stats.mined = 20;
    game.state.stats.crafted = 3;
    game.state.stats.pluginsCrafted = 2;
    game.state.stats.jumps = 2;
    game.state.visitedSystems = ["aurora", "helios"];
    game.renderStation();
  });
  await page.waitForFunction(() => document.querySelector('[data-career-path="industrialist"]').classList.contains("completed"));
  const progressedJournal = await page.evaluate(() => ({
    tracked: window.__game.state.career.tracked,
    industrialist: document.querySelector('[data-career-path="industrialist"]').innerText,
    explorer: document.querySelector('[data-career-path="explorer"]').innerText,
    focus: document.querySelector(".career-focus").innerText,
    completed: document.querySelector('[data-career-path="industrialist"]').classList.contains("completed")
  }));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(__dirname, "career-journal-smoke.png"), fullPage: true });

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
  await page.click('[data-station-tab="shipyard"]');
  await page.waitForFunction(() => document.querySelector("#shipyardTab").classList.contains("active"));
  await page.click('[data-shipyard-view-choice="manufacturing"]');
  const preview = await page.evaluate(() => {
    const railgun = document.querySelector('[data-craft-plugin="railgun"]').closest(".plugin-card");
    const shield = document.querySelector('[data-craft-plugin="shield_amp"]').closest(".plugin-card");
    return {
      currentDamage: window.__game.shipStats().damage,
      railgun: railgun.querySelector(".fitting-preview").textContent,
      shield: shield.querySelector(".fitting-preview").textContent,
      previewCount: document.querySelectorAll(".fitting-preview").length,
      collapsedByDefault: document.querySelectorAll(".plugin-details[open]").length === 0
    };
  });
  await page.click('[data-craft-plugin="railgun"]');
  await page.click('[data-install-plugin="railgun"]');
  const installed = await page.evaluate(() => ({
    damage: window.__game.shipStats().damage,
    fitted: window.__game.state.fittedPlugins.weapon,
    activeWeapon: window.__game.state.activeWeapon
  }));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(__dirname, "fitting-simulation-smoke.png"), fullPage: true });

  if (initialJournal.pathCount !== 4 || initialJournal.active !== "explorer") throw new Error(`Career journal initialization failed: ${JSON.stringify(initialJournal)}`);
  if (progressedJournal.tracked !== "industrialist" || !progressedJournal.completed || !progressedJournal.industrialist.includes("100%")) throw new Error(`Career tracking failed: ${JSON.stringify(progressedJournal)}`);
  if (!progressedJournal.explorer.includes("44%")) throw new Error(`Untracked progress did not accumulate: ${JSON.stringify(progressedJournal)}`);
  if (preview.previewCount !== 9 || !preview.collapsedByDefault || !preview.railgun.includes("单发") || !preview.railgun.includes("+3") || !preview.shield.includes("+45")) throw new Error(`Fitting preview failed: ${JSON.stringify(preview)}`);
  if (installed.fitted !== "railgun" || installed.activeWeapon !== "fitted" || Math.abs(installed.damage - 15) > .01) throw new Error(`Preview did not match installed stats: ${JSON.stringify({ preview, installed })}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    initialJournal,
    progressedJournal,
    preview,
    installed,
    screenshots: [
      path.join(__dirname, "career-journal-smoke.png"),
      path.join(__dirname, "fitting-simulation-smoke.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

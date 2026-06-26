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
    localStorage.removeItem("stellarFrontierUiSize");
    localStorage.removeItem("stellarFrontierSettingsV2");
    localStorage.setItem("stellarFrontierSeenHelp", "1");
    location.reload();
  });
  await page.waitForFunction(() => window.__game?.state && !document.querySelector("#stationPanel").classList.contains("hidden"));

  const defaultState = await page.evaluate(() => {
    const font = selector => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    const station = document.querySelector(".station-shell").getBoundingClientRect();
    return {
      size: document.body.dataset.uiSize,
      feedFont: font(".feed-item"),
      marketSmallFont: font(".market-list-item small"),
      orderFont: font(".order-row"),
      cardTitleFont: font(".card-title strong"),
      stationFits: station.left >= 0 && station.right <= innerWidth && station.top >= 0 && station.bottom <= innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth
    };
  });
  await page.screenshot({ path: path.join(__dirname, "readability-1366-large.png"), fullPage: true });

  await page.click("[data-open-settings]");
  await page.waitForFunction(() => !document.querySelector("#settingsPanel").classList.contains("hidden"));
  await page.click('[data-ui-size-choice="xlarge"]');
  await page.click('[data-font-choice="mono"]');
  await page.click('[data-quality-choice="low"]');
  await page.click('[data-language-choice="en"]');
  await page.fill("#masterVolume", "55");
  await page.dispatchEvent("#masterVolume", "input");
  await page.fill("#musicVolume", "35");
  await page.dispatchEvent("#musicVolume", "input");
  await page.fill("#sfxVolume", "60");
  await page.dispatchEvent("#sfxVolume", "input");
  const xlargeState = await page.evaluate(() => {
    const font = selector => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
      size: document.body.dataset.uiSize,
      font: document.body.dataset.font,
      quality: document.body.dataset.quality,
      language: document.documentElement.lang,
      feedFont: font(".feed-item"),
      marketSmallFont: font(".market-list-item small"),
      cardTitleFont: font(".card-title strong"),
      canvasWidth: document.querySelector("#gameCanvas").width,
      settings: window.__game.settings,
      audioStarted: window.__game.audioEngine.started
    };
  });
  await page.screenshot({ path: path.join(__dirname, "settings-panel-xlarge.png"), fullPage: true });
  await page.click("#settingsDoneBtn");
  await page.reload();
  await page.waitForFunction(() => window.__game?.state);
  const persisted = await page.evaluate(() => ({
    size: document.body.dataset.uiSize,
    font: document.body.dataset.font,
    quality: document.body.dataset.quality,
    language: document.documentElement.lang,
    settings: window.__game.settings
  }));

  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(__dirname, "readability-1600-xlarge.png"), fullPage: true });

  if (defaultState.size !== "large") throw new Error(`Default size failed: ${JSON.stringify(defaultState)}`);
  if (defaultState.feedFont < 10 || defaultState.marketSmallFont < 10 || defaultState.orderFont < 10 || defaultState.cardTitleFont < 13) {
    throw new Error(`Default fonts are still too small: ${JSON.stringify(defaultState)}`);
  }
  if (!defaultState.stationFits || defaultState.horizontalOverflow) throw new Error(`1366 layout overflow: ${JSON.stringify(defaultState)}`);
  if (xlargeState.size !== "xlarge" || xlargeState.font !== "mono" || xlargeState.quality !== "low" || xlargeState.language !== "en" || xlargeState.feedFont < 11 || xlargeState.cardTitleFont < 14) {
    throw new Error(`Extra-large size failed: ${JSON.stringify(xlargeState)}`);
  }
  if (xlargeState.settings.masterVolume !== 55 || xlargeState.settings.musicVolume !== 35 || xlargeState.settings.sfxVolume !== 60 || !xlargeState.audioStarted) {
    throw new Error(`Audio settings failed: ${JSON.stringify(xlargeState)}`);
  }
  if (persisted.size !== "xlarge" || persisted.font !== "mono" || persisted.quality !== "low" || persisted.language !== "en") throw new Error(`Settings did not persist: ${JSON.stringify(persisted)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    defaultState,
    xlargeState,
    persisted,
    screenshots: [
      path.join(__dirname, "readability-1366-large.png"),
      path.join(__dirname, "readability-1600-xlarge.png"),
      path.join(__dirname, "settings-panel-xlarge.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

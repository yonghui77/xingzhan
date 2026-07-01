const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

let browser;
(async () => {
  const root = path.resolve(__dirname, "..");
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--enable-webgl", "--ignore-gpu-blocklist"]
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.evaluate(() => {
    localStorage.removeItem("stellarFrontierSaveV1");
    localStorage.setItem("stellarFrontierSeenHelp", "1");
    location.reload();
  });
  await page.waitForFunction(() => window.__game?.state && window.Space3D);
  await page.waitForTimeout(300);
  const dock = await page.evaluate(() => ({
    available: window.Space3D.available,
    bodyClass: document.body.classList.contains("webgl3d"),
    dockActive: document.querySelector("#station3DCanvas").classList.contains("active"),
    dockPixels: document.querySelector("#station3DCanvas").width * document.querySelector("#station3DCanvas").height,
    fallbackHidden: getComputedStyle(document.querySelector(".dock-showcase .docked-ship")).opacity === "0"
  }));
  await page.screenshot({ path: path.join(__dirname, "webgl-dock-3d.png"), fullPage: true });

  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));
  await page.waitForTimeout(250);
  const flight = await page.evaluate(() => ({
    active: document.querySelector("#space3DCanvas").classList.contains("active"),
    pixels: document.querySelector("#space3DCanvas").width * document.querySelector("#space3DCanvas").height,
    overlayTransparent: getComputedStyle(document.querySelector("#gameCanvas")).backgroundColor === "rgba(0, 0, 0, 0)",
    webgl: !!document.querySelector("#space3DCanvas").getContext("webgl"),
    enemies: window.__game.world.enemies.length,
    asteroids: window.__game.world.asteroids.length
  }));
  await page.screenshot({ path: path.join(__dirname, "webgl-flight-3d.png"), fullPage: true });

  await page.click("#settingsBtn");
  await page.click('[data-depth-choice="off"]');
  await page.click("#settingsDoneBtn");
  await page.waitForTimeout(120);
  const fallback = await page.evaluate(() => ({
    depth: window.__game.settings.depthFx,
    webglVisible: getComputedStyle(document.querySelector("#space3DCanvas")).display !== "none",
    bodyClass: document.body.classList.contains("webgl3d")
  }));
  await page.screenshot({ path: path.join(__dirname, "canvas-2d-fallback.png"), fullPage: true });

  if (!dock.available || !dock.bodyClass || !dock.dockActive || dock.dockPixels <= 0 || !dock.fallbackHidden) throw new Error(`Dock 3D failed: ${JSON.stringify(dock)}`);
  if (!flight.active || !flight.webgl || flight.pixels <= 0 || !flight.overlayTransparent || flight.asteroids < 1) throw new Error(`Flight 3D failed: ${JSON.stringify(flight)}`);
  if (fallback.depth !== "off" || fallback.webglVisible) throw new Error(`2D fallback failed: ${JSON.stringify(fallback)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log(JSON.stringify({
    dock,
    flight,
    fallback,
    screenshots: [
      path.join(__dirname, "webgl-dock-3d.png"),
      path.join(__dirname, "webgl-flight-3d.png"),
      path.join(__dirname, "canvas-2d-fallback.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

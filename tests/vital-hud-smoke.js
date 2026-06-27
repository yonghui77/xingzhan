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
  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));

  await page.evaluate(() => {
    window.__game.state.shield = 40;
    window.__game.state.hull = 25;
  });
  await page.waitForTimeout(120);

  const result = await page.evaluate(() => {
    const hud = document.querySelector("#combatHud").getBoundingClientRect();
    const vitals = document.querySelector("#shipVitals").getBoundingClientRect();
    const ring = document.querySelector("#shieldOrb");
    return {
      shipCards: document.querySelectorAll(".ship-card").length,
      hud: { left: hud.left, right: hud.right, bottom: hud.bottom, width: hud.width },
      vitals: { width: vitals.width, height: vitals.height, bottom: vitals.bottom },
      shieldVar: ring.style.getPropertyValue("--shield"),
      hullVar: ring.style.getPropertyValue("--hull"),
      status: document.querySelector("#shipVitalStatus").textContent.trim(),
      shieldText: document.querySelector("#shieldText").textContent,
      hullText: document.querySelector("#hullText").textContent,
      wings: document.querySelectorAll(".combat-wing").length
    };
  });

  await page.screenshot({ path: path.join(__dirname, "vital-hud-smoke.png"), fullPage: true });

  if (result.shipCards !== 0) throw new Error(`Legacy ship card still visible: ${JSON.stringify(result)}`);
  if (result.wings !== 2) throw new Error(`Combat wings missing: ${JSON.stringify(result)}`);
  if (result.hud.left < 0 || result.hud.right > 1366 || result.hud.bottom > 768) throw new Error(`HUD overflow: ${JSON.stringify(result)}`);
  if (result.shieldVar !== "40%" || result.hullVar !== "25%") throw new Error(`Circular progress did not update: ${JSON.stringify(result)}`);
  if (!result.status.includes("危险")) throw new Error(`Critical status did not update: ${JSON.stringify(result)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    result,
    screenshot: path.join(__dirname, "vital-hud-smoke.png")
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

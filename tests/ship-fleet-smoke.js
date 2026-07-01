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
  await page.click('[data-hub-module="shipyard"]');
  await page.waitForFunction(() => document.querySelector("#shipyardTab").classList.contains("active"));

  const initial = await page.evaluate(() => ({
    hullCards: document.querySelectorAll(".ship-hull-card").length,
    active: window.__game.state.activeShip,
    stats: window.__game.shipStats(),
    owned: { ...window.__game.state.ownedShips }
  }));

  const modelProfiles = {};
  for (const id of ["pioneer", "courier", "prospector", "vanguard"]) {
    await page.click(`[data-preview-hull="${id}"]`);
    modelProfiles[id] = await page.evaluate(() => {
      const model = document.querySelector("#shipyardHullModel");
      const core = model.querySelector(".ship-core");
      const wing = model.querySelector(".ship-wing.left");
      return {
        hull: model.dataset.hull,
        title: document.querySelector("#shipyardShipTitle").textContent,
        coreWidth: getComputedStyle(core).width,
        wingWidth: getComputedStyle(wing).width,
        coreClip: getComputedStyle(core).clipPath
      };
    });
    await page.locator(".ship-schematic").screenshot({ path: path.join(__dirname, `hull-preview-${id}.png`) });
  }
  await page.evaluate(() => { document.querySelector("#shipyardTab").scrollTop = 0; });
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(__dirname, "ship-hull-roster-smoke.png"), fullPage: true });

  await page.evaluate(() => {
    const state = window.__game.state;
    state.credits = 50000;
    state.stationStorage.aurora = {
      ...(state.stationStorage.aurora || {}),
      alloy: 100,
      superconductor: 100,
      capacitor: 100,
      ceramic: 100,
      lens: 100,
      guidance: 100,
      salvage: 100
    };
    window.__game.renderStation();
  });
  for (const id of ["courier", "prospector", "vanguard"]) {
    await page.click(`[data-commission-ship="${id}"]`);
  }
  const commissioned = await page.evaluate(() => ({ ...window.__game.state.ownedShips }));

  await page.click('[data-switch-ship="courier"]');
  const courier = await page.evaluate(() => ({
    active: window.__game.state.activeShip,
    stats: window.__game.shipStats(),
    maxFuel: window.__game.state.maxFuel,
    radius: window.__game.player.radius,
    model: document.querySelector("#shipyardHullModel").dataset.hull,
    vital: document.querySelector("#shipVitals").dataset.hull
  }));

  await page.click('[data-shipyard-view-choice="manufacturing"]');
  await page.click('[data-craft-plugin="railgun"]');
  await page.click('[data-install-plugin="railgun"]');
  await page.click('[data-shipyard-view-choice="hulls"]');
  await page.evaluate(() => {
    window.__game.state.cargo = { ore: 31 };
    window.__game.renderStation();
  });
  await page.click('[data-switch-ship="pioneer"]');
  const cargoBlocked = await page.evaluate(() => window.__game.state.activeShip);
  await page.evaluate(() => {
    window.__game.state.cargo = {};
    window.__game.renderStation();
  });
  await page.click('[data-switch-ship="pioneer"]');
  const pioneerAfterReturn = await page.evaluate(() => ({
    active: window.__game.state.activeShip,
    weapon: window.__game.state.fittedPlugins.weapon
  }));
  await page.click('[data-switch-ship="courier"]');
  const courierLoadout = await page.evaluate(() => ({
    active: window.__game.state.activeShip,
    weapon: window.__game.state.fittedPlugins.weapon,
    damage: window.__game.shipStats().damage
  }));

  await page.click('[data-station-tab="hub"]');
  await page.waitForTimeout(2200);
  const hub = await page.evaluate(() => ({
    label: document.querySelector("#hubShipClass").textContent,
    hull: document.querySelector(".dock-showcase .docked-ship").dataset.hull,
    engineCount: [...document.querySelectorAll(".dock-showcase .ship-engine")].filter(node => getComputedStyle(node).display !== "none").length
  }));
  await page.screenshot({ path: path.join(__dirname, "courier-hangar-model-smoke.png"), fullPage: true });

  await page.click("#hubUndockBtn");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(__dirname, "courier-flight-model-smoke.png"), fullPage: true });

  if (initial.hullCards !== 4 || initial.active !== "pioneer" || initial.stats.speed !== 240 || initial.stats.cargo !== 30) throw new Error(`Initial fleet failed: ${JSON.stringify(initial)}`);
  if (new Set(Object.values(modelProfiles).map(profile => `${profile.coreWidth}/${profile.wingWidth}/${profile.coreClip}`)).size !== 4) throw new Error(`Hull models are not distinct: ${JSON.stringify(modelProfiles)}`);
  if (commissioned.courier !== "aurora" || commissioned.prospector !== "aurora" || commissioned.vanguard !== "aurora") throw new Error(`Commissioning failed: ${JSON.stringify(commissioned)}`);
  if (courier.active !== "courier" || courier.stats.speed !== 315 || courier.stats.cargo !== 62 || courier.maxFuel !== 10 || courier.radius !== 15 || courier.model !== "courier" || courier.vital !== "courier") throw new Error(`Courier switch failed: ${JSON.stringify(courier)}`);
  if (cargoBlocked !== "courier") throw new Error(`Cargo capacity switch guard failed: ${cargoBlocked}`);
  if (pioneerAfterReturn.weapon !== null || courierLoadout.weapon !== "railgun" || Math.abs(courierLoadout.damage - 12.5) > .01) throw new Error(`Per-hull loadout failed: ${JSON.stringify({ pioneerAfterReturn, courierLoadout })}`);
  if (!hub.label.includes("信使级") || hub.hull !== "courier" || hub.engineCount !== 3) throw new Error(`Hangar model failed: ${JSON.stringify(hub)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    initial: { hullCards: initial.hullCards, active: initial.active, speed: initial.stats.speed, cargo: initial.stats.cargo },
    modelProfiles,
    commissioned,
    courier: { active: courier.active, speed: courier.stats.speed, cargo: courier.stats.cargo, maxFuel: courier.maxFuel, radius: courier.radius },
    loadouts: { cargoBlocked, pioneer: pioneerAfterReturn, courier: courierLoadout },
    hub,
    screenshots: [
      path.join(__dirname, "ship-hull-roster-smoke.png"),
      path.join(__dirname, "courier-hangar-model-smoke.png"),
      path.join(__dirname, "courier-flight-model-smoke.png"),
      ...["pioneer", "courier", "prospector", "vanguard"].map(id => path.join(__dirname, `hull-preview-${id}.png`))
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

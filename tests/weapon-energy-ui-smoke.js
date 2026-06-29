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
  await page.evaluate(() => document.querySelector("#startBtn").click());
  await page.waitForFunction(() => !document.querySelector("#stationPanel").classList.contains("hidden"));

  const stationStyle = await page.evaluate(() => {
    const activeTab = document.querySelector(".station-tabs button.active");
    const module = document.querySelector(".station-function-grid .station-module");
    return {
      tabRadius: getComputedStyle(activeTab).borderRadius,
      tabBackground: getComputedStyle(activeTab).backgroundColor,
      moduleRadius: getComputedStyle(module).borderRadius,
      moduleSecondaryVisible: getComputedStyle(module.querySelector("small")).display !== "none"
    };
  });
  await page.screenshot({ path: path.join(__dirname, "ios-station-smoke.png"), fullPage: true });

  await page.evaluate(() => {
    const game = window.__game;
    game.state.fittedPlugins.weapon = "pulse_laser";
    game.state.activeWeapon = "fitted";
    game.state.capacitor = 100;
  });
  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));

  const fitted = await page.evaluate(() => {
    const stats = window.__game.shipStats();
    return {
      mode: window.__game.state.activeWeapon,
      type: stats.damageType,
      label: stats.weaponLabel,
      capacitorCost: stats.capacitorCost,
      weaponHeat: stats.weaponHeatPerShot
    };
  });

  await page.click("#weaponSwitchBtn");
  const pulse = await page.evaluate(() => {
    const stats = window.__game.shipStats();
    return {
      mode: window.__game.state.activeWeapon,
      type: stats.damageType,
      label: stats.weaponLabel,
      capacitorCost: stats.capacitorCost,
      weaponHeat: stats.weaponHeatPerShot,
      damage: stats.damage,
      fireRate: stats.fireRate,
      spread: stats.spread
    };
  });

  const fireModes = await page.evaluate(() => {
    const game = window.__game;
    const balanced = game.shipStats();
    game.cycleFireMode();
    const precision = game.shipStats();
    game.cycleFireMode();
    const rapid = game.shipStats();
    return {
      state: game.state.fireMode,
      balanced: { damage: balanced.damage, fireRate: balanced.fireRate, spread: balanced.spread, capacitorCost: balanced.capacitorCost },
      precision: { damage: precision.damage, fireRate: precision.fireRate, spread: precision.spread, capacitorCost: precision.capacitorCost },
      rapid: { damage: rapid.damage, fireRate: rapid.fireRate, spread: rapid.spread, capacitorCost: rapid.capacitorCost }
    };
  });

  const overheat = await page.evaluate(() => {
    const game = window.__game;
    game.toggleWeapon();
    game.state.capacitor = 100;
    game.player.weaponHeat = 94;
    game.player.overheatLocked = false;
    game.player.fireCooldown = 0;
    const bulletsBefore = game.world.bullets.length;
    game.shootPlayer();
    const afterFirst = {
      capacitor: game.state.capacitor,
      heat: game.player.weaponHeat,
      locked: game.player.overheatLocked,
      bullets: game.world.bullets.length - bulletsBefore
    };
    game.player.fireCooldown = 0;
    game.shootPlayer();
    return {
      afterFirst,
      bulletsAfterLockedShot: game.world.bullets.length - bulletsBefore
    };
  });

  await page.waitForTimeout(100);
  await page.evaluate(() => { window.__game.pve.heat = 30; });
  await page.waitForTimeout(400);
  const hud = await page.evaluate(() => ({
    weapon: document.querySelector("#activeWeaponName").textContent,
    capacitor: document.querySelector("#capacitorText").textContent,
    heat: document.querySelector("#weaponHeatText").textContent,
    overheated: document.querySelector("#weaponSwitchBtn").classList.contains("overheated"),
    status: document.querySelector("#weaponCooldown").textContent,
    resourcesVisible: getComputedStyle(document.querySelector(".weapon-resources")).display !== "none",
    fireMode: document.querySelector("#weaponSwitchBtn").dataset.fireMode,
    combatFocus: document.body.classList.contains("combat-focus"),
    leftHudOpacity: parseFloat(getComputedStyle(document.querySelector(".left-hud")).opacity)
  }));
  await page.screenshot({ path: path.join(__dirname, "weapon-energy-ui-smoke.png"), fullPage: true });

  const damageProfiles = await page.evaluate(() => {
    const game = window.__game;
    game.player.invulnerable = 0;
    game.state.shield = 100;
    game.state.hull = 100;
    game.damagePlayer(10, { x: game.player.x + 10, y: game.player.y, damageType: "thermal" });
    const thermalShieldLoss = 100 - game.state.shield;
    game.player.invulnerable = 0;
    game.state.shield = 100;
    game.state.hull = 100;
    game.damagePlayer(10, { x: game.player.x + 10, y: game.player.y, damageType: "kinetic" });
    const kineticShieldLoss = 100 - game.state.shield;
    game.player.invulnerable = 0;
    game.state.shield = 0;
    game.state.hull = 100;
    game.damagePlayer(10, { x: game.player.x + 10, y: game.player.y, damageType: "kinetic" });
    const kineticHullLoss = 100 - game.state.hull;
    game.player.invulnerable = 0;
    game.state.shield = 0;
    game.state.hull = 100;
    game.damagePlayer(10, { x: game.player.x + 10, y: game.player.y, damageType: "thermal" });
    const thermalHullLoss = 100 - game.state.hull;
    return { thermalShieldLoss, kineticShieldLoss, kineticHullLoss, thermalHullLoss };
  });

  if (fitted.mode !== "fitted" || fitted.type !== "thermal" || !fitted.label.includes("激光")) throw new Error(`Fitted weapon profile failed: ${JSON.stringify(fitted)}`);
  if (pulse.mode !== "pulse" || pulse.type !== "plasma" || !pulse.label.includes("脉冲炮")) throw new Error(`Pulse weapon switch failed: ${JSON.stringify(pulse)}`);
  if (!(fitted.capacitorCost > pulse.capacitorCost) || !(fitted.weaponHeat > pulse.weaponHeat)) throw new Error(`Weapon resource distinction failed: ${JSON.stringify({ fitted, pulse })}`);
  if (fireModes.state !== "rapid" || !(fireModes.precision.damage > fireModes.balanced.damage) || !(fireModes.precision.spread < fireModes.balanced.spread) || !(fireModes.rapid.fireRate < fireModes.balanced.fireRate) || !(fireModes.rapid.damage < fireModes.balanced.damage)) {
    throw new Error(`Fire modes failed: ${JSON.stringify(fireModes)}`);
  }
  if (!overheat.afterFirst.locked || overheat.afterFirst.bullets !== 1 || overheat.bulletsAfterLockedShot !== 1) throw new Error(`Overheat lock failed: ${JSON.stringify(overheat)}`);
  if (!hud.resourcesVisible || !hud.overheated || !hud.status.includes("过热") || hud.fireMode !== "rapid" || !hud.combatFocus || !(hud.leftHudOpacity < .5)) throw new Error(`Weapon HUD failed: ${JSON.stringify(hud)}`);
  if (!(damageProfiles.thermalShieldLoss > damageProfiles.kineticShieldLoss) || !(damageProfiles.kineticHullLoss > damageProfiles.thermalHullLoss)) {
    throw new Error(`Enemy damage profiles failed: ${JSON.stringify(damageProfiles)}`);
  }
  if (stationStyle.moduleSecondaryVisible || stationStyle.tabRadius === "0px") throw new Error(`Minimal station style failed: ${JSON.stringify(stationStyle)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    stationStyle,
    fitted,
    pulse,
    fireModes,
    overheat,
    hud,
    damageProfiles,
    screenshots: [
      path.join(__dirname, "ios-station-smoke.png"),
      path.join(__dirname, "weapon-energy-ui-smoke.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

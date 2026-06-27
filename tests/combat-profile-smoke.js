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

  const result = await page.evaluate(() => {
    const game = window.__game;
    game.world.enemies.length = 0;
    const target = game.spawnEnemy({
      forced: true,
      type: "interceptor",
      reason: "测试目标",
      x: game.player.x + 110,
      y: game.player.y
    });
    target.hp = target.maxHp = 100;
    target.shield = target.maxShield = 100;
    const thermalShield = game.applyDamageToEnemy(target, 10, "thermal", { silent: true });
    target.hp = 100;
    target.shield = 100;
    const kineticShield = game.applyDamageToEnemy(target, 10, "kinetic", { silent: true });
    target.hp = 100;
    target.shield = 0;
    const kineticHull = game.applyDamageToEnemy(target, 10, "kinetic", { silent: true });
    target.hp = 100;
    target.shield = 0;
    const thermalHull = game.applyDamageToEnemy(target, 10, "thermal", { silent: true });

    game.state.fittedPlugins.weapon = "missile_pod";
    const missileStats = game.shipStats();
    game.state.currentSystem = "aurora";
    const auroraYield = game.craftedOutputAmount({ output: { item: "alloy", amount: 3 } });
    game.state.currentSystem = "helios";
    const heliosYield = game.craftedOutputAmount({ output: { item: "alloy", amount: 3 } });
    game.state.currentSystem = "aurora";
    target.hp = target.maxHp = 100;
    target.shield = target.maxShield = 60;
    return {
      thermalShield: thermalShield.shieldDamage,
      kineticShield: kineticShield.shieldDamage,
      kineticHull: kineticHull.hullDamage,
      thermalHull: thermalHull.hullDamage,
      missile: {
        type: missileStats.damageType,
        splashRadius: missileStats.splashRadius,
        ammo: missileStats.ammoItem
      },
      auroraYield,
      heliosYield
    };
  });

  await page.waitForTimeout(150);
  const hud = await page.evaluate(() => ({
    panelHidden: document.querySelector("#targetPanel").classList.contains("hidden"),
    shield: document.querySelector("#targetShieldValue").textContent,
    hull: document.querySelector("#targetHullValue").textContent,
    profile: document.querySelector("#targetDefenseProfile").textContent,
    advice: document.querySelector("#targetWeaponAdvice").textContent
  }));
  await page.screenshot({ path: path.join(__dirname, "combat-profile-smoke.png"), fullPage: true });

  if (!(result.thermalShield > result.kineticShield)) throw new Error(`Thermal shield advantage failed: ${JSON.stringify(result)}`);
  if (!(result.kineticHull > result.thermalHull)) throw new Error(`Kinetic hull advantage failed: ${JSON.stringify(result)}`);
  if (result.missile.type !== "explosive" || result.missile.splashRadius < 50 || result.missile.ammo !== "ammo") {
    throw new Error(`Missile profile failed: ${JSON.stringify(result.missile)}`);
  }
  if (!(result.heliosYield > result.auroraYield)) throw new Error(`Station industry bonus failed: ${JSON.stringify(result)}`);
  if (hud.panelHidden || !hud.profile.includes("护盾") || !hud.advice.includes("爆炸")) {
    throw new Error(`Target HUD profile failed: ${JSON.stringify(hud)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    damageComparison: result,
    hud,
    screenshot: path.join(__dirname, "combat-profile-smoke.png")
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

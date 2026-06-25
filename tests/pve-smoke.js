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
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
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
  await page.waitForFunction(() => window.__game?.state);
  await page.evaluate(() => {
    if (window.__game.state.docked) window.__game.undock();
    window.__game.jumpTo("nyx");
  });
  await page.waitForFunction(() => window.__game.state.currentSystem === "nyx" && !window.__game.state.docked);

  const spawnState = await page.evaluate(() => ({
    enemyCount: window.__game.world.enemies.length,
    minPlayerDistance: Math.min(...window.__game.world.enemies.map(enemy => Math.hypot(enemy.x - window.__game.player.x, enemy.y - window.__game.player.y))),
    minStationDistance: Math.min(...window.__game.world.enemies.map(enemy => Math.hypot(enemy.x, enemy.y))),
    types: [...new Set(window.__game.world.enemies.map(enemy => enemy.type))],
    outpost: Boolean(window.__game.world.outpost?.active)
  }));

  await page.evaluate(() => {
    const game = window.__game;
    game.world.asteroids.length = 0;
    game.world.asteroids.push({
      id: "signal-rock", x: game.player.x + 60, y: game.player.y, r: 28,
      rotation: 0, spin: 0, hp: 30, maxHp: 30, resource: "crystal", color: "#a980ff"
    });
  });
  await page.keyboard.press("e");
  await page.waitForTimeout(1200);
  const miningThreat = await page.evaluate(() => ({
    active: window.__game.mining.active,
    signal: window.__game.pve.miningSignal,
    budget: window.__game.pve.budget
  }));

  await page.evaluate(() => {
    window.__game.pve.heat = 52;
  });
  await page.waitForTimeout(1600);
  const alertState = await page.evaluate(() => ({
    alert: window.__game.pve.alert,
    reinforcementLevels: window.__game.pve.reinforcements.size,
    enemyCount: window.__game.world.enemies.length
  }));

  const outpostBefore = await page.evaluate(() => ({
    shield: window.__game.world.outpost.shield,
    hp: window.__game.world.outpost.hp,
    threat: window.__game.state.systemThreat.nyx,
    ammo: window.__game.state.markets.nyx.ammo.stock
  }));
  await page.evaluate(() => window.__game.damageOutpost(10000));
  await page.waitForTimeout(100);
  const shieldStage = await page.evaluate(() => ({
    shield: window.__game.world.outpost.shield,
    hp: window.__game.world.outpost.hp,
    wave: window.__game.world.outpost.waveTriggered,
    enemyCount: window.__game.world.enemies.length
  }));
  await page.evaluate(() => window.__game.damageOutpost(10000));
  await page.waitForTimeout(100);
  const outpostAfter = await page.evaluate(() => ({
    active: window.__game.world.outpost.active,
    outposts: window.__game.state.stats.outposts,
    intel: window.__game.state.stats.intel,
    threat: window.__game.state.systemThreat.nyx,
    ammo: window.__game.state.markets.nyx.ammo.stock
  }));

  await page.screenshot({ path: path.join(__dirname, "pve-v3-smoke.png"), fullPage: true });

  if (spawnState.enemyCount < 1 || spawnState.minPlayerDistance < 690 || spawnState.minStationDistance < 590 || !spawnState.outpost) {
    throw new Error(`Unsafe initial spawn: ${JSON.stringify(spawnState)}`);
  }
  if (!miningThreat.active || miningThreat.signal <= 0 || miningThreat.budget <= 0) {
    throw new Error(`Mining threat did not rise: ${JSON.stringify(miningThreat)}`);
  }
  if (alertState.alert < 2 || alertState.reinforcementLevels < 1) {
    throw new Error(`Alert reinforcement failed: ${JSON.stringify(alertState)}`);
  }
  if (shieldStage.shield !== 0 || !shieldStage.wave || shieldStage.hp <= 0) {
    throw new Error(`Outpost shield stage failed: ${JSON.stringify(shieldStage)}`);
  }
  if (outpostAfter.active || outpostAfter.outposts !== 1 || outpostAfter.intel < 3 || outpostAfter.threat >= outpostBefore.threat || outpostAfter.ammo <= outpostBefore.ammo) {
    throw new Error(`Outpost completion failed: ${JSON.stringify({ outpostBefore, outpostAfter })}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    spawnState, miningThreat, alertState, shieldStage, outpostAfter,
    screenshot: path.join(__dirname, "pve-v3-smoke.png")
  }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

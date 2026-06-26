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
  console.log("step:loaded");
  await page.evaluate(() => {
    localStorage.removeItem("stellarFrontierSaveV1");
    localStorage.removeItem("stellarFrontierSeenHelp");
    location.reload();
  });
  await page.waitForFunction(() => window.__game?.state && document.querySelector("#stationPanel"));
  console.log("step:initialized");

  const helpVisible = await page.locator("#helpPanel").evaluate(node => !node.classList.contains("hidden"));
  await page.click("#startBtn");
  await page.waitForFunction(() => !document.querySelector("#stationPanel").classList.contains("hidden"));
  console.log("step:station");

  const hubState = await page.evaluate(() => ({
    hubActive: document.querySelector("#hubTab").classList.contains("active"),
    modules: document.querySelectorAll("[data-hub-module]").length,
    headline: document.querySelector("#hubHeadline").textContent,
    storyPulse: document.querySelector("#hubStoryPulse").innerText,
    accessLabels: [...document.querySelectorAll(".starport-dashboard > .station-function-grid [data-module-title]")].map(node => node.textContent),
    undockCompact: (() => {
      const r = document.querySelector("#hubUndockBtn").getBoundingClientRect();
      return r.width <= 180 && r.height <= 62;
    })(),
    bodyScroll: document.scrollingElement.scrollHeight > innerHeight,
    shipModel: (() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right) };
      };
      const leftWing = rect(".docked-ship .ship-wing.left");
      const rightWing = rect(".docked-ship .ship-wing.right");
      const core = rect(".docked-ship .ship-core");
      return {
        wingWidthOk: leftWing.w <= 54 && rightWing.w <= 54,
        wingAttachedOk: leftWing.right >= core.x - 20 && rightWing.x <= core.right + 20,
        symmetricOk: Math.abs((core.x - leftWing.x) - (rightWing.right - core.right)) <= 18
      };
    })()
  }));
  await page.click('[data-hub-module="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));

  const initial = await page.evaluate(() => ({
    credits: window.__game.state.credits,
    docked: window.__game.state.docked,
    system: window.__game.state.currentSystem,
    marketItems: document.querySelectorAll(".market-list-item").length,
    sellOrders: document.querySelectorAll("#sellOrders .order-row").length,
    aiCount: window.__game.aiPilots.length
  }));

  await page.fill("#tradeQuantity", "1");
  await page.click("#executeTradeBtn");
  const afterBuy = await page.evaluate(() => ({
    credits: window.__game.state.credits,
    ore: window.__game.state.cargo.ore || 0
  }));

  await page.click("#undockBtn");
  await page.waitForFunction(() => !window.__game.state.docked);
  console.log("step:undocked");

  await page.evaluate(() => {
    const game = window.__game;
    game.world.asteroids.length = 0;
    game.world.asteroids.push({
      id: "test-rock", x: game.player.x + 35, y: game.player.y, r: 25,
      rotation: 0, spin: 0, hp: .35, maxHp: 1, resource: "ore", color: "#5d819a"
    });
  });
  await page.keyboard.down("e");
  await page.waitForTimeout(70);
  await page.screenshot({ path: path.join(__dirname, "mining-smoke.png"), fullPage: true });
  await page.waitForTimeout(400);
  await page.keyboard.up("e");
  const afterMine = await page.evaluate(() => window.__game.state.cargo.ore || 0);
  console.log("step:mined");
  const miningPanelVisible = await page.locator("#miningPanel").evaluate(node => !node.classList.contains("hidden"));

  await page.evaluate(() => {
    const game = window.__game;
    game.world.enemies.length = 0;
    game.world.enemies.push({
      id: "test-enemy", x: game.player.x + 160, y: game.player.y, vx: 0, vy: 0,
      homeX: game.player.x + 160, homeY: game.player.y, patrolAngle: 0,
      angle: 0, r: 18, hp: 1, maxHp: 1, speed: 0, fireCooldown: 99, tier: 1,
      type: "interceptor", name: "测试海盗舰", state: "attack", lockTimer: 1, lostTimer: 0,
      calledReinforcement: true, detection: 650, lockRange: 470, weaponRange: 285, optimal: 225
    });
  });
  await page.mouse.move(960, 500);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
  const kills = await page.evaluate(() => window.__game.state.stats.kills);
  console.log("step:combat");

  const beforeFuel = await page.evaluate(() => window.__game.state.fuel);
  await page.evaluate(() => window.__game.jumpTo("nyx"));
  await page.waitForFunction(() => window.__game.state.currentSystem === "nyx");
  console.log("step:jumped");
  const afterJump = await page.evaluate(() => ({
    system: window.__game.state.currentSystem,
    fuel: window.__game.state.fuel,
    enemies: window.__game.world.enemies.length
  }));
  await page.evaluate(() => {
    window.__game.player.invulnerable = 0;
    window.__game.damagePlayer(10, { x: window.__game.player.x + 30, y: window.__game.player.y });
  });
  await page.waitForTimeout(50);
  const shieldVisual = await page.evaluate(() => ({
    shield: window.__game.state.shield,
    orb: document.querySelector("#shieldOrb").classList.contains("hit")
  }));
  await page.screenshot({ path: path.join(__dirname, "flight-smoke.png"), fullPage: true });

  await page.evaluate(() => window.__game.dock());
  await page.waitForFunction(() => window.__game.state.docked);
  console.log("step:docked");
  await page.click('[data-hub-module="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));
  const beforeSellCredits = await page.evaluate(() => window.__game.state.credits);
  await page.click('[data-market-mode="sell"]');
  await page.fill("#tradeQuantity", "1");
  await page.click("#executeTradeBtn");
  const afterSell = await page.evaluate(() => ({
    credits: window.__game.state.credits,
    ore: window.__game.state.cargo.ore || 0
  }));

  await page.evaluate(() => window.__game.state.credits = 10000);
  await page.click('[data-station-tab="shipyard"]');
  await page.locator('[data-upgrade="weapon"]').click();
  const weaponLevel = await page.evaluate(() => window.__game.state.upgrades.weapon);
  console.log("step:upgraded");
  await page.selectOption("#aiCountSelect", "32");
  await page.evaluate(() => {
    window.__game.aiPilots.slice(0, 5).forEach(pilot => window.__game.runAIEconomicAction(pilot));
  });
  await page.waitForTimeout(100);
  const aiState = await page.evaluate(() => ({
    count: window.__game.aiPilots.length,
    tradeRows: document.querySelectorAll("#aiTradeFeed .ai-trade-row").length
  }));
  await page.click('[data-station-tab="market"]');
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(__dirname, "market-v2-smoke.png"), fullPage: true });

  await page.screenshot({ path: path.join(__dirname, "game-smoke.png"), fullPage: true });
  await page.click("#undockBtn");
  await page.keyboard.press("m");
  await page.waitForFunction(() => !document.querySelector("#mapPanel").classList.contains("hidden"));
  const mapNodes = await page.locator(".system-node").count();
  console.log("step:map");
  await page.screenshot({ path: path.join(__dirname, "map-smoke.png"), fullPage: true });

  if (!helpVisible) throw new Error("First-run help was not shown");
  if (!hubState.hubActive || hubState.modules < 7 || !hubState.storyPulse.includes("任务") || !hubState.accessLabels.includes("交易行") || !hubState.accessLabels.includes("设置") || !hubState.undockCompact || hubState.bodyScroll) throw new Error(`Station hub failed: ${JSON.stringify(hubState)}`);
  if (!hubState.shipModel.wingWidthOk || !hubState.shipModel.wingAttachedOk || !hubState.shipModel.symmetricOk) throw new Error(`Docked ship model failed: ${JSON.stringify(hubState.shipModel)}`);
  if (!initial.docked || initial.system !== "aurora" || initial.marketItems !== 5 || initial.sellOrders !== 6 || initial.aiCount !== 16) throw new Error(`Invalid initial state: ${JSON.stringify(initial)}`);
  if (!(afterBuy.credits < initial.credits) || afterBuy.ore !== 1) throw new Error(`Market buy failed: ${JSON.stringify(afterBuy)}`);
  if (afterMine <= afterBuy.ore) throw new Error(`Mining did not add cargo: ${afterMine}`);
  if (miningPanelVisible) throw new Error("Mining panel should close after depletion");
  if (kills < 1) throw new Error("Combat did not register a kill");
  if (afterJump.system !== "nyx" || afterJump.fuel !== beforeFuel - 1 || afterJump.enemies < 1) throw new Error(`Jump failed: ${JSON.stringify(afterJump)}`);
  if (shieldVisual.shield >= 100 || !shieldVisual.orb) throw new Error(`Shield visualization failed: ${JSON.stringify(shieldVisual)}`);
  if (!(afterSell.credits > beforeSellCredits) || afterSell.ore >= afterMine) throw new Error(`Market sell failed: ${JSON.stringify(afterSell)}`);
  if (weaponLevel !== 1) throw new Error(`Upgrade failed: ${weaponLevel}`);
  if (aiState.count !== 32 || aiState.tradeRows < 1) throw new Error(`AI simulation failed: ${JSON.stringify(aiState)}`);
  if (mapNodes !== 4) throw new Error(`Expected 4 map nodes, received ${mapNodes}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    helpVisible, hubState, initial, afterBuy, afterMine, kills, afterJump, shieldVisual, afterSell, weaponLevel, aiState, mapNodes,
    screenshots: ["mining-smoke.png", "flight-smoke.png", "market-v2-smoke.png", "game-smoke.png", "map-smoke.png"].map(file => path.join(__dirname, file))
  }));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

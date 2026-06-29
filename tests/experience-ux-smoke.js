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
  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));

  await page.evaluate(() => {
    const game = window.__game;
    game.player.x = game.world.station.x + 70;
    game.player.y = game.world.station.y;
  });
  await page.waitForFunction(() => !document.querySelector("#contextActionBtn").disabled);
  const dockContext = await page.evaluate(() => ({
    action: document.querySelector("#contextActionBtn").dataset.action,
    label: document.querySelector("#contextActionName").textContent,
    prompt: document.querySelector("#interactionPrompt").textContent.replace(/\s+/g, " ").trim()
  }));
  await page.click("#contextActionBtn");
  await page.waitForFunction(() => !document.querySelector("#stationPanel").classList.contains("hidden"));

  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));
  await page.evaluate(() => {
    const game = window.__game;
    const asteroid = game.world.asteroids[0];
    game.player.x = asteroid.x;
    game.player.y = asteroid.y;
    game.world.loot.push({
      id: "ux-priority-loot",
      x: asteroid.x,
      y: asteroid.y,
      vx: 0,
      vy: 0,
      item: "salvage",
      amount: 2,
      radius: 8
    });
  });
  await page.waitForTimeout(400);
  const priorityState = await page.evaluate(() => ({
    action: document.querySelector("#contextActionBtn").dataset.action,
    mining: window.__game.mining.active,
    lootCount: window.__game.world.loot.length,
    lootDistance: window.__game.world.loot[0] ? Math.hypot(window.__game.player.x - window.__game.world.loot[0].x, window.__game.player.y - window.__game.world.loot[0].y) : null,
    stationDistance: Math.hypot(window.__game.player.x - window.__game.world.station.x, window.__game.player.y - window.__game.world.station.y)
  }));
  if (priorityState.action !== "loot") throw new Error(`Loot context did not activate: ${JSON.stringify(priorityState)}`);
  const cargoBefore = await page.evaluate(() => window.__game.state.cargo.salvage || 0);
  const lootContext = await page.evaluate(() => ({
    action: document.querySelector("#contextActionBtn").dataset.action,
    label: document.querySelector("#contextActionName").textContent,
    hint: document.querySelector("#contextActionHint").textContent
  }));
  await page.click("#contextActionBtn");
  await page.waitForFunction(before => (window.__game.state.cargo.salvage || 0) > before, cargoBefore);

  const modeBefore = await page.evaluate(() => window.__game.state.fireMode);
  await page.click("#fireModeBtn");
  const modeAfter = await page.evaluate(() => ({
    state: window.__game.state.fireMode,
    label: document.querySelector("#fireModeName").textContent,
    dataMode: document.querySelector("#fireModeBtn").dataset.fireMode
  }));

  const typingGuard = await page.evaluate(() => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const before = window.__game.state.fireMode;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    const after = window.__game.state.fireMode;
    input.remove();
    return { before, after };
  });

  const pressFeedback = await page.evaluate(() => {
    dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
    const pressed = document.querySelector("[data-control-key='shift']").classList.contains("control-pressed");
    dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", bubbles: true }));
    const released = !document.querySelector("[data-control-key='shift']").classList.contains("control-pressed");
    return { pressed, released };
  });

  await page.waitForFunction(() => document.querySelector("#contextActionBtn").dataset.action === "mine");
  await page.waitForTimeout(2200);
  const layout = await page.evaluate(() => {
    const context = document.querySelector("#contextActionBtn").getBoundingClientRect();
    const mode = document.querySelector("#fireModeBtn").getBoundingClientRect();
    const prompt = document.querySelector("#interactionPrompt").getBoundingClientRect();
    return {
      context: { left: context.left, right: context.right, top: context.top, bottom: context.bottom },
      mode: { left: mode.left, right: mode.right, top: mode.top, bottom: mode.bottom },
      prompt: { left: prompt.left, right: prompt.right, top: prompt.top, bottom: prompt.bottom },
      promptVisible: !document.querySelector("#interactionPrompt").classList.contains("hidden")
    };
  });
  await page.screenshot({ path: path.join(__dirname, "experience-ux-smoke.png"), fullPage: true });

  if (dockContext.action !== "dock" || !dockContext.label.includes("停靠")) throw new Error(`Dock context failed: ${JSON.stringify(dockContext)}`);
  if (lootContext.action !== "loot" || !lootContext.label.includes("回收")) throw new Error(`Loot priority failed: ${JSON.stringify(lootContext)}`);
  if (modeBefore !== "balanced" || modeAfter.state !== "precision" || modeAfter.dataMode !== "precision") throw new Error(`Mouse fire mode failed: ${JSON.stringify({ modeBefore, modeAfter })}`);
  if (typingGuard.before !== typingGuard.after) throw new Error(`Typing shortcut guard failed: ${JSON.stringify(typingGuard)}`);
  if (!pressFeedback.pressed || !pressFeedback.released) throw new Error(`Press feedback failed: ${JSON.stringify(pressFeedback)}`);
  if (!layout.promptVisible || layout.context.left < 0 || layout.context.right > 1366 || layout.mode.top < 0 || layout.prompt.right > 1366) throw new Error(`UX layout overflow: ${JSON.stringify(layout)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    dockContext,
    lootContext,
    fireMode: { before: modeBefore, after: modeAfter },
    typingGuard,
    pressFeedback,
    layout,
    screenshot: path.join(__dirname, "experience-ux-smoke.png")
  }));
})().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  if (browser) await browser.close();
});

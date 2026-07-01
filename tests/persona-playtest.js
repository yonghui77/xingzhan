const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

let browser;
const results = {};
const scorePersona = (name, checks) => {
  const passed = checks.filter(check => check.pass).length;
  results[name] = {
    score: Math.round(passed / checks.length * 100),
    checks: checks.map(({ label, pass, evidence }) => ({ label, pass, evidence }))
  };
};

(async () => {
  const root = path.resolve(__dirname, "..");
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
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
  await page.waitForFunction(() => window.__game?.state && !document.querySelector("#stationPanel").classList.contains("hidden"));

  const newcomer = await page.evaluate(() => {
    const shell = document.querySelector(".station-shell").getBoundingClientRect();
    return {
      primaryTabs: document.querySelectorAll(".station-tabs button").length,
      modules: document.querySelectorAll("[data-hub-module]").length,
      hasTask: !!document.querySelector('[data-hub-module="contracts"]'),
      hasUndock: !!document.querySelector("#hubUndockBtn"),
      fits: shell.left >= 0 && shell.right <= innerWidth && shell.top >= 0 && shell.bottom <= innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  });
  scorePersona("newcomer", [
    { label: "主导航数量可控", pass: newcomer.primaryTabs <= 7, evidence: newcomer.primaryTabs },
    { label: "功能入口集中", pass: newcomer.modules <= 7, evidence: newcomer.modules },
    { label: "任务入口明确", pass: newcomer.hasTask, evidence: newcomer.hasTask },
    { label: "离站主操作可见", pass: newcomer.hasUndock, evidence: newcomer.hasUndock },
    { label: "1440px 无横向溢出", pass: newcomer.fits && !newcomer.overflow, evidence: newcomer }
  ]);

  await page.click('[data-hub-module="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));
  await page.hover("#marketChart", { position: { x: 260, y: 110 } });
  await page.waitForTimeout(80);
  const tooltipVisible = await page.evaluate(() => !document.querySelector("#chartTooltip").classList.contains("hidden"));
  await page.click('[data-market-mode="sell"]');
  const trader = await page.evaluate(tooltipVisible => ({
    search: !!document.querySelector("#marketSearch"),
    stationCount: document.querySelector("#marketSystemSelect").options.length,
    hasChart: !!document.querySelector("#marketChart"),
    tooltipVisible,
    hasOrderBook: document.querySelectorAll(".order-list").length === 2,
    customSell: !document.querySelector("#limitSellField").classList.contains("hidden")
  }), tooltipVisible);
  scorePersona("trader", [
    { label: "商品搜索可见", pass: trader.search, evidence: trader.search },
    { label: "支持跨站行情", pass: trader.stationCount >= 4, evidence: trader.stationCount },
    { label: "走势图可交互", pass: trader.hasChart && trader.tooltipVisible, evidence: trader.tooltipVisible },
    { label: "买卖盘完整", pass: trader.hasOrderBook, evidence: trader.hasOrderBook },
    { label: "可设置出售价格", pass: trader.customSell, evidence: trader.customSell }
  ]);

  await page.click('[data-station-tab="shipyard"]');
  await page.waitForFunction(() => document.querySelector("#shipyardTab").classList.contains("active"));
  const hullView = await page.evaluate(() => ({
    viewTabs: document.querySelectorAll("[data-shipyard-view-choice]").length,
    hulls: document.querySelectorAll(".ship-hull-card").length,
    artReady: [...document.querySelectorAll(".hull-art")].every(node => getComputedStyle(node).backgroundImage.includes("ship-fleet-concept-v1")),
    detailsClosed: [...document.querySelectorAll(".hull-card-details")].every(node => !node.open),
    workbenchHidden: getComputedStyle(document.querySelector(".shipyard-workbench")).display === "none"
  }));
  await page.click('[data-shipyard-view-choice="manufacturing"]');
  const industrialCollapsed = await page.evaluate(() => ({
    cards: document.querySelectorAll(".plugin-card").length,
    details: document.querySelectorAll(".plugin-details").length,
    open: document.querySelectorAll(".plugin-details[open]").length,
    visiblePanels: [...document.querySelectorAll(".upgrade-intro,.fitting-panel,.plugin-forge,.upgrade-grid")]
      .filter(node => getComputedStyle(node).display !== "none").map(node => node.className)
  }));
  await page.locator(".plugin-details summary").first().click();
  const industrialExpanded = await page.evaluate(() => ({
    open: document.querySelectorAll(".plugin-details[open]").length,
    previewVisible: !!document.querySelector(".plugin-details[open] .fitting-preview"),
    recipeVisible: !!document.querySelector(".plugin-details[open] .craft-recipe"),
    overflow: document.documentElement.scrollWidth > innerWidth
  }));
  await page.screenshot({ path: path.join(__dirname, "persona-industrialist-expanded.png"), fullPage: true });
  scorePersona("industrialist", [
    { label: "工坊四类分区", pass: hullView.viewTabs === 4, evidence: hullView.viewTabs },
    { label: "四舰体图片可识别", pass: hullView.hulls === 4 && hullView.artReady, evidence: hullView },
    { label: "舰体页无无关工坊", pass: hullView.detailsClosed && hullView.workbenchHidden, evidence: hullView },
    { label: "制造页仅保留制造面板", pass: industrialCollapsed.cards >= 6 && industrialCollapsed.open === 0 && industrialCollapsed.visiblePanels.length === 1, evidence: industrialCollapsed },
    { label: "详细参数按需展开", pass: industrialExpanded.open === 1 && industrialExpanded.previewVisible && industrialExpanded.recipeVisible && !industrialExpanded.overflow, evidence: industrialExpanded }
  ]);

  await page.click('[data-station-tab="hub"]');
  await page.click("#hubUndockBtn");
  await page.waitForFunction(() => document.querySelector("#stationPanel").classList.contains("hidden"));
  const fireBefore = await page.getAttribute("#fireModeBtn", "data-fire-mode");
  await page.press("body", "r");
  const combat = await page.evaluate(() => ({
    stationHidden: document.querySelector("#stationPanel").classList.contains("hidden"),
    vitalsVisible: getComputedStyle(document.querySelector("#shipVitals")).display !== "none",
    weapons: document.querySelectorAll(".ability.weapon-switch").length,
    scanner: !!document.querySelector('#radarCanvas[aria-label]'),
    fireMode: document.querySelector("#fireModeBtn").dataset.fireMode,
    overflow: document.documentElement.scrollWidth > innerWidth
  }));
  scorePersona("combatPilot", [
    { label: "单击离站进入战斗", pass: combat.stationHidden, evidence: combat.stationHidden },
    { label: "圆形舰船状态可见", pass: combat.vitalsVisible, evidence: combat.vitalsVisible },
    { label: "武器切换入口可见", pass: combat.weapons === 1, evidence: combat.weapons },
    { label: "扫描与态势入口可见", pass: combat.scanner, evidence: combat.scanner },
    { label: "射击模式有即时反馈", pass: combat.fireMode && combat.fireMode !== fireBefore && !combat.overflow, evidence: { before: fireBefore, after: combat.fireMode } }
  ]);
  await page.screenshot({ path: path.join(__dirname, "persona-combat-pilot.png"), fullPage: true });

  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  const scores = Object.values(results).map(result => result.score);
  const overall = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  if (overall < 80) throw new Error(`Playability score below target: ${overall}`);
  console.log(JSON.stringify({
    methodology: "Four deterministic UI personas; five observable checks per persona; 20 points per check.",
    results,
    overall,
    screenshots: [
      path.join(__dirname, "persona-industrialist-expanded.png"),
      path.join(__dirname, "persona-combat-pilot.png")
    ]
  }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

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
  await page.waitForFunction(() => window.__game?.state && !document.querySelector("#stationPanel").classList.contains("hidden"));
  await page.click('[data-hub-module="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));

  const marketSelect = await page.evaluate(() => ({
    options: document.querySelectorAll("#marketSystemSelect option").length,
    initial: document.querySelector("#marketSystemSelect").value
  }));
  await page.selectOption("#marketSystemSelect", "nyx");
  await page.waitForTimeout(100);
  const remoteState = await page.evaluate(() => ({
    selected: document.querySelector("#marketSystemSelect").value,
    disabled: document.querySelector("#executeTradeBtn").disabled,
    summary: document.querySelector("#marketSummary").textContent,
    credits: window.__game.state.credits
  }));
  await page.click("#executeTradeBtn", { force: true }).catch(() => {});
  const afterRemoteClickCredits = await page.evaluate(() => window.__game.state.credits);

  await page.selectOption("#marketSystemSelect", "aurora");
  await page.fill("#tradeQuantity", "35");
  await page.click("#executeTradeBtn");
  const afterLargeBuy = await page.evaluate(() => ({
    cargoOre: window.__game.state.cargo.ore || 0,
    storedOre: window.__game.state.stationStorage.aurora?.ore || 0,
    cargoUsed: Object.entries(window.__game.state.cargo).reduce((sum, [key, amount]) => sum + window.__game.goods[key].weight * amount, 0)
  }));

  await page.click('[data-station-tab="hangar"]');
  await page.waitForFunction(() => document.querySelector("#hangarTab").classList.contains("active"));
  await page.locator('[data-deposit-item="ore"]').first().click();
  const afterDeposit = await page.evaluate(() => ({
    cargoOre: window.__game.state.cargo.ore || 0,
    storedOre: window.__game.state.stationStorage.aurora?.ore || 0
  }));
  await page.locator('[data-withdraw-item="ore"]').first().click();
  const afterWithdraw = await page.evaluate(() => ({
    cargoOre: window.__game.state.cargo.ore || 0,
    storedOre: window.__game.state.stationStorage.aurora?.ore || 0
  }));

  await page.click('[data-station-tab="market"]');
  await page.waitForFunction(() => document.querySelector("#marketTab").classList.contains("active"));
  await page.click('[data-market-mode="sell"]');
  await page.waitForFunction(() => !document.querySelector("#limitSellField").classList.contains("hidden"));
  const defaultSellPrice = await page.locator("#limitSellPrice").inputValue();
  await page.fill("#limitSellPrice", String(Number(defaultSellPrice) + 25));
  await page.fill("#tradeQuantity", "2");
  await page.click("#executeTradeBtn");
  const limitOrderState = await page.evaluate(() => ({
    orders: window.__game.state.playerOrders.length,
    order: window.__game.state.playerOrders[0],
    cargoOre: window.__game.state.cargo.ore || 0,
    panelText: document.querySelector("#playerOrdersPanel").innerText
  }));
  const chartBox = await page.locator("#marketChart").boundingBox();
  await page.waitForTimeout(250);
  await page.mouse.move(chartBox.x + chartBox.width * .78, chartBox.y + chartBox.height * .42);
  await page.waitForTimeout(80);
  const chartHover = await page.evaluate(() => ({
    visible: !document.querySelector("#chartTooltip").classList.contains("hidden"),
    text: document.querySelector("#chartTooltip").innerText
  }));

  await page.evaluate(() => {
    const store = window.__game.state.stationStorage.aurora ||= {};
    store.ore = Math.max(store.ore || 0, 8);
    store.fuel = Math.max(store.fuel || 0, 1);
    window.__game.renderStation();
  });
  await page.click('[data-station-tab="hangar"]');
  await page.waitForFunction(() => document.querySelector("#hangarTab").classList.contains("active"));
  await page.locator('[data-craft-recipe="phase_crystal"]').click();
  const afterCraft = await page.evaluate(() => ({
    crystal: window.__game.state.stationStorage.aurora?.crystal || 0,
    stationKeys: Object.keys(window.__game.state.stationStorage)
  }));

  await page.screenshot({ path: path.join(__dirname, "local-economy-smoke.png"), fullPage: true });

  if (marketSelect.options !== 4 || marketSelect.initial !== "aurora") throw new Error(`Market picker failed: ${JSON.stringify(marketSelect)}`);
  if (remoteState.selected !== "nyx" || !remoteState.disabled || !remoteState.summary.includes("远程")) throw new Error(`Remote quote mode failed: ${JSON.stringify(remoteState)}`);
  if (afterRemoteClickCredits !== remoteState.credits) throw new Error("Remote market changed credits");
  if (afterLargeBuy.cargoOre !== 30 || afterLargeBuy.storedOre < 5 || afterLargeBuy.cargoUsed !== 30) throw new Error(`Overflow storage failed: ${JSON.stringify(afterLargeBuy)}`);
  if (afterDeposit.cargoOre !== 0 || afterDeposit.storedOre < 35) throw new Error(`Deposit failed: ${JSON.stringify(afterDeposit)}`);
  if (afterWithdraw.cargoOre !== 30 || afterWithdraw.storedOre < 5) throw new Error(`Withdraw failed: ${JSON.stringify(afterWithdraw)}`);
  if (limitOrderState.orders < 1 || limitOrderState.order.price <= Number(defaultSellPrice) || limitOrderState.cargoOre !== 28 || !limitOrderState.panelText.includes("撤单")) throw new Error(`Limit sell order failed: ${JSON.stringify(limitOrderState)}`);
  if (!chartHover.visible || !chartHover.text.includes("ISK") || !chartHover.text.includes("库存")) throw new Error(`Chart hover tooltip failed: ${JSON.stringify(chartHover)}`);
  if (afterCraft.crystal < 1 || !afterCraft.stationKeys.includes("aurora")) throw new Error(`Craft failed: ${JSON.stringify(afterCraft)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({ marketSelect, remoteState, afterLargeBuy, afterDeposit, afterWithdraw, limitOrderState, chartHover, afterCraft, screenshot: path.join(__dirname, "local-economy-smoke.png") }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

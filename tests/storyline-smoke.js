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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
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

  const beforeMarket = await page.evaluate(() => JSON.stringify(window.__game.state.markets));
  await page.click('[data-station-tab="contracts"]');
  await page.waitForFunction(() => document.querySelector("#contractsTab").classList.contains("active"));
  const storyState = await page.evaluate(() => ({
    visible: !!document.querySelector("#storyPanel"),
    text: document.querySelector("#storyPanel").innerText,
    marketAfterRender: JSON.stringify(window.__game.state.markets),
    viewedRemoteBefore: !!window.__game.state.story?.viewedRemoteMarket
  }));

  await page.click('[data-station-tab="market"]');
  await page.selectOption("#marketSystemSelect", "nyx");
  const remoteState = await page.evaluate(() => ({
    selected: document.querySelector("#marketSystemSelect").value,
    executeDisabled: document.querySelector("#executeTradeBtn").disabled,
    viewedRemoteAfter: !!window.__game.state.story?.viewedRemoteMarket,
    marketAfterRemoteView: JSON.stringify(window.__game.state.markets)
  }));

  await page.click('[data-station-tab="contracts"]');
  await page.screenshot({ path: path.join(__dirname, "storyline-smoke.png"), fullPage: true });

  if (!storyState.visible || !storyState.text.includes("边境档案")) throw new Error("Story dossier panel was not rendered");
  if (!storyState.text.includes("剧情不直接改价")) throw new Error("Economy independence rule is missing");
  if (!storyState.text.includes("采集 3 单位资源")) throw new Error("Story should track real mining progress instead of tutorial completion");
  if (storyState.text.includes("完成执照训练")) throw new Error("Story should not use tutorial completion as a mainline gate");
  if (storyState.marketAfterRender !== beforeMarket) throw new Error("Rendering story panel changed market state");
  if (storyState.viewedRemoteBefore) throw new Error("Remote-market story flag should start false");
  if (remoteState.selected !== "nyx" || !remoteState.executeDisabled) throw new Error(`Remote market is not quote-only: ${JSON.stringify(remoteState)}`);
  if (!remoteState.viewedRemoteAfter) throw new Error("Remote-market viewing was not recorded for tutorial/story progress");
  if (remoteState.marketAfterRemoteView !== beforeMarket) throw new Error("Viewing remote market changed market state");
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({
    storyTitle: storyState.text.split("\n").slice(0, 4),
    remoteState,
    screenshot: path.join(__dirname, "storyline-smoke.png")
  }));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close().catch(() => {});
});

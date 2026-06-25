const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const formatNumber = value => Math.round(value).toLocaleString("zh-CN");
const randomRange = (min, max) => min + Math.random() * (max - min);

const GOODS = {
  ore: { name: "钛辉矿", icon: "◆", color: "#39ddff", base: 42, weight: 1, description: "基础舰体与工业组件原料" },
  crystal: { name: "相位晶体", icon: "✦", color: "#a980ff", base: 135, weight: 1, description: "边境区稀有能量材料" },
  salvage: { name: "舰船残骸", icon: "⌬", color: "#ff9d66", base: 92, weight: 2, description: "海盗舰船拆解所得零件" },
  fuel: { name: "跃迁燃料", icon: "◉", color: "#51e7a6", base: 68, weight: 1, description: "星系跃迁所需消耗品" },
  ammo: { name: "导弹弹药", icon: "➤", color: "#ff617b", base: 31, weight: 1, description: "前线持续消耗的军用品" }
};

const SYSTEMS = {
  aurora: {
    name: "曙光星系", station: "晨星贸易站", trait: "核心区综合贸易枢纽", security: 1, securityText: "安全区 1.0",
    color: "#51e7a6", map: [18, 50], links: ["helios", "nyx"], risk: "极低",
    description: "新飞行员的起点。市场流动性高，但本地资源收益有限。",
    modifiers: { ore: 1.18, crystal: 1.42, salvage: 1.15, fuel: .92, ammo: 1.03 },
    stock: { ore: 130, crystal: 35, salvage: 55, fuel: 180, ammo: 150 }
  },
  helios: {
    name: "赫利俄斯工业区", station: "铸日空间站", trait: "舰船制造与矿石精炼中心", security: .7, securityText: "管制区 0.7",
    color: "#39ddff", map: [43, 25], links: ["aurora", "nyx", "vanta"], risk: "低",
    description: "工业设施密集，矿石需求旺盛，舰船补给价格较低。",
    modifiers: { ore: 1.38, crystal: 1.2, salvage: 1.08, fuel: .95, ammo: .87 },
    stock: { ore: 70, crystal: 50, salvage: 70, fuel: 145, ammo: 230 }
  },
  nyx: {
    name: "倪克斯边境", station: "夜幕前哨", trait: "矿业殖民地与护航集散地", security: .4, securityText: "边境区 0.4",
    color: "#ffc45c", map: [46, 76], links: ["aurora", "helios", "vanta"], risk: "中等",
    description: "富含相位晶体，海盗活动频繁，运输与护航利润可观。",
    modifiers: { ore: .72, crystal: .61, salvage: .9, fuel: 1.22, ammo: 1.35 },
    stock: { ore: 260, crystal: 190, salvage: 95, fuel: 80, ammo: 65 }
  },
  vanta: {
    name: "万塔深空", station: "黑潮自由港", trait: "无法区黑市与战争前线", security: 0, securityText: "无法区 0.0",
    color: "#ff617b", map: [75, 48], links: ["helios", "nyx"], risk: "极高",
    description: "顶级资源与最高战损并存。保险赔付降低，海盗舰队密集。",
    modifiers: { ore: .83, crystal: .78, salvage: 1.52, fuel: 1.58, ammo: 1.85 },
    stock: { ore: 190, crystal: 120, salvage: 40, fuel: 40, ammo: 24 }
  }
};

const UPGRADES = {
  weapon: { name: "聚焦脉冲阵列", description: "每级提高25%武器伤害，并略微提高射速。", baseCost: 2200, max: 5 },
  shield: { name: "自适应护盾", description: "每级增加35点护盾容量和再生效率。", baseCost: 1900, max: 5 },
  cargo: { name: "折叠货舱", description: "每级增加15单位货舱，适合贸易与采矿。", baseCost: 1700, max: 5 },
  engine: { name: "矢量推进器", description: "每级提高12%航速与推进能量恢复。", baseCost: 1800, max: 5 },
  mining: { name: "谐振采矿束", description: "每级提高35%采矿速度，并增加稀有矿产概率。", baseCost: 1500, max: 5 },
  hull: { name: "纳米复合装甲", description: "每级增加45点装甲，降低舰船损毁风险。", baseCost: 2100, max: 5 }
};

const CONTRACT_LIBRARY = [
  { id: "mine", type: "开采", title: "工业原料短缺", description: "开采并带回钛辉矿，支援本地制造链。", item: "ore", amount: 12, reward: 1450 },
  { id: "hunt", type: "战斗", title: "清剿边境海盗", description: "摧毁海盗舰船，降低运输航线风险。", amount: 5, reward: 2600 },
  { id: "crystal", type: "探索", title: "相位样本征集", description: "取得边境相位晶体，供研究机构分析。", item: "crystal", amount: 8, reward: 3100 },
  { id: "deliver", type: "运输", title: "前哨紧急补给", description: "向夜幕前哨交付导弹弹药。货物需自行采购。", item: "ammo", amount: 10, destination: "nyx", reward: 2300 },
  { id: "salvage", type: "打捞", title: "回收舰船组件", description: "从被摧毁的舰船中回收残骸。", item: "salvage", amount: 7, reward: 2800 },
  { id: "trade", type: "贸易", title: "市场流动性计划", description: "通过地区交易累计获得指定销售额。", amount: 4000, reward: 1900 }
];

const AI_NAMES = ["北辰","弥赛亚","灰隼","折光","织梦者","零度航线","深蓝","白噪声","阿特拉斯","星尘","渡鸦","远望","长风","玻色子","天琴","暗潮","巡游者","琥珀","量子猫","逐日","回声","赫卡忒","白鲸","夜莺","漫游者","红移","静海","逐光","边界人","苍穹","鸢尾","引力井"];
const AI_ROLES = {
  miner: { name: "矿工", color: "#ffc45c" },
  trader: { name: "商人", color: "#51e7a6" },
  explorer: { name: "探索者", color: "#a980ff" },
  mercenary: { name: "雇佣兵", color: "#ff617b" }
};

const ENEMY_TYPES = {
  scout: {
    name: "海盗侦察无人机", color: "#ffb45d", hp: 42, radius: 14, speed: 165,
    detection: 720, lock: 500, weapon: 220, optimal: 175, damage: 6, fireRate: 1.05, bulletSpeed: 430,
    bounty: 55, salvage: [1, 2], cost: 8
  },
  interceptor: {
    name: "掠夺者截击舰", color: "#ff617b", hp: 68, radius: 18, speed: 178,
    detection: 650, lock: 470, weapon: 285, optimal: 225, damage: 10, fireRate: 1.35, bulletSpeed: 410,
    bounty: 95, salvage: [1, 3], cost: 14
  },
  missile: {
    name: "秃鹫级导弹舰", color: "#c46dff", hp: 82, radius: 21, speed: 108,
    detection: 920, lock: 700, weapon: 590, optimal: 500, damage: 15, fireRate: 2.15, bulletSpeed: 285,
    bounty: 135, salvage: [2, 4], cost: 20
  },
  gunship: {
    name: "海盗重型炮舰", color: "#ff445f", hp: 148, radius: 27, speed: 82,
    detection: 620, lock: 490, weapon: 370, optimal: 305, damage: 21, fireRate: 1.55, bulletSpeed: 350,
    bounty: 185, salvage: [3, 6], cost: 28
  }
};

const SAVE_KEY = "stellarFrontierSaveV1";
const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d");
const radar = $("#radarCanvas");
const rctx = radar.getContext("2d");

const defaultState = () => ({
  version: 1,
  credits: 5200,
  currentSystem: "aurora",
  docked: true,
  cargo: {},
  fuel: 7,
  maxFuel: 8,
  shield: 100,
  hull: 100,
  upgrades: { weapon: 0, shield: 0, cargo: 0, engine: 0, mining: 0, hull: 0 },
  stats: { kills: 0, mined: 0, tradeRevenue: 0, jumps: 0, deaths: 0, intel: 0, outposts: 0 },
  mission: { ...CONTRACT_LIBRARY[0], progress: 0 },
  markets: {},
  reputation: 0,
  aiCount: 16,
  systemThreat: { aurora: 0, helios: 18, nyx: 42, vanta: 68 },
  discovered: ["aurora", "helios", "nyx"],
  playSeconds: 0
});

let state = loadGame();
let marketMode = "buy";
let selectedSystem = null;
let paused = true;
let lastTime = performance.now();
let saveTimer = 0;
let marketTimer = 0;
let enemySpawnTimer = 0;
let interactionLock = false;
let soundEnabled = true;
let feed = [];
let aiPilots = [];
let aiTradeLog = [];
let aiEconomyTimer = 0;
let selectedMarketItem = "ore";
let marketSearchText = "";
let shieldImpact = 0;
let shieldHitAngle = 0;
const mining = { targetId: null, active: false };
const pve = {
  budget: 0, heat: 0, alert: 0, miningSignal: 0, spawnCooldown: 4,
  recentKills: 0, combatQuiet: 0, status: "航线平静",
  reinforcements: new Set(), outpostStage: 0
};

const player = {
  x: 0, y: 320, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 17,
  fireCooldown: 0, boostEnergy: 100, shieldDelay: 0, invulnerable: 0
};
const camera = { x: 0, y: 0 };
const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
const keys = {};
const world = {
  width: 2600, height: 1800, asteroids: [], enemies: [], bullets: [], enemyBullets: [], loot: [], particles: [],
  station: { x: 0, y: 0, radius: 88 }, outpost: null
};

function initializeMarkets() {
  Object.entries(SYSTEMS).forEach(([id, system]) => {
    if (!state.markets[id]) {
      state.markets[id] = {};
      Object.keys(GOODS).forEach(key => {
        state.markets[id][key] = {
          stock: system.stock[key],
          priceFactor: system.modifiers[key],
          history: [GOODS[key].base * system.modifiers[key]]
        };
      });
    }
  });
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    return {
      ...defaultState(), ...saved,
      upgrades: { ...defaultState().upgrades, ...(saved.upgrades || {}) },
      stats: { ...defaultState().stats, ...(saved.stats || {}) },
      systemThreat: { ...defaultState().systemThreat, ...(saved.systemThreat || {}) },
      cargo: saved.cargo || {},
      markets: saved.markets || {}
    };
  } catch {
    return defaultState();
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function shipStats() {
  const u = state.upgrades;
  return {
    maxShield: 100 + u.shield * 35,
    maxHull: 100 + u.hull * 45,
    damage: 12 * (1 + u.weapon * .25),
    fireRate: Math.max(.12, .27 - u.weapon * .018),
    cargo: 30 + u.cargo * 15,
    speed: 240 * (1 + u.engine * .12),
    miningRate: 1 + u.mining * .35,
    shieldRegen: 5 + u.shield * 1.5,
    boostRecovery: 18 + u.engine * 3
  };
}

function cargoUsed() {
  return Object.entries(state.cargo).reduce((total, [key, amount]) => total + (GOODS[key]?.weight || 1) * amount, 0);
}

function cargoSpaceFor(key) {
  return Math.max(0, Math.floor((shipStats().cargo - cargoUsed()) / GOODS[key].weight));
}

function addCargo(key, amount) {
  const accepted = Math.max(0, Math.min(amount, cargoSpaceFor(key)));
  state.cargo[key] = (state.cargo[key] || 0) + accepted;
  if (state.cargo[key] <= 0) delete state.cargo[key];
  return accepted;
}

function removeCargo(key, amount) {
  const removed = Math.min(amount, state.cargo[key] || 0);
  state.cargo[key] = (state.cargo[key] || 0) - removed;
  if (state.cargo[key] <= 0) delete state.cargo[key];
  return removed;
}

function marketPrice(systemId, itemKey, side = "buy") {
  const market = state.markets[systemId][itemKey];
  const system = SYSTEMS[systemId];
  const targetStock = system.stock[itemKey];
  const scarcity = clamp((targetStock - market.stock) / targetStock, -.7, 1.3);
  const mid = GOODS[itemKey].base * market.priceFactor * (1 + scarcity * .35);
  return Math.max(3, Math.round(mid * (side === "buy" ? 1.045 : .955)));
}

function simulateMarkets(intensity = 1) {
  Object.entries(SYSTEMS).forEach(([systemId, system]) => {
    Object.keys(GOODS).forEach(itemKey => {
      const market = state.markets[systemId][itemKey];
      const target = system.stock[itemKey];
      const productionBias = itemKey === "ore" || itemKey === "crystal" ? (1 - system.modifiers[itemKey]) : 0;
      const warDemand = (itemKey === "ammo" || itemKey === "fuel") * (1 - system.security) * 3.5;
      const flow = (target - market.stock) * .022 + productionBias * 2.2 - warDemand + randomRange(-1.2, 1.2);
      market.stock = clamp(market.stock + flow * intensity, 2, target * 3);
      market.priceFactor = lerp(market.priceFactor, system.modifiers[itemKey], .025 * intensity);
      const current = marketPrice(systemId, itemKey);
      market.history.push(current);
      if (market.history.length > 24) market.history.shift();
    });
  });
}

function createAIPilots(count = state.aiCount) {
  const oldById = new Map(aiPilots.map(pilot => [pilot.id, pilot]));
  aiPilots = Array.from({ length: count }, (_, index) => {
    const id = `ai-${index}`;
    const existing = oldById.get(id);
    if (existing) return existing;
    const role = Object.keys(AI_ROLES)[index % Object.keys(AI_ROLES).length];
    const system = Object.keys(SYSTEMS)[index % Object.keys(SYSTEMS).length];
    const angle = randomRange(0, Math.PI * 2);
    const radius = randomRange(220, 1000);
    return {
      id,
      name: `${AI_NAMES[index % AI_NAMES.length]}-${String(index + 1).padStart(2, "0")}`,
      role,
      system,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      angle,
      targetX: randomRange(-900, 900),
      targetY: randomRange(-650, 650),
      actionTimer: randomRange(2, 9),
      credits: randomRange(3500, 28000),
      cargo: {},
      status: AI_ROLES[role].name
    };
  });
  state.aiCount = count;
  $("#aiCountSelect").value = String(count);
  updateAIPopulationHud();
}

function updateAIPopulationHud() {
  const local = aiPilots.filter(pilot => pilot.system === state.currentSystem).length;
  $("#aiOnlineCount").textContent = `${state.aiCount} 在线`;
  $("#localCount").textContent = `${world.enemies.length + world.asteroids.length + local} 信号`;
}

function recordAITrade(pilot, itemKey, amount, side, systemId, price) {
  aiTradeLog.unshift({
    pilot: pilot.name,
    item: itemKey,
    amount,
    side,
    system: systemId,
    price,
    time: Date.now()
  });
  aiTradeLog = aiTradeLog.slice(0, 18);
  if (!$("#stationPanel").classList.contains("hidden")) renderMarketSidebar();
}

function chooseBestTrade(systemId) {
  const links = SYSTEMS[systemId].links;
  let best = null;
  Object.keys(GOODS).forEach(itemKey => {
    const buy = marketPrice(systemId, itemKey, "buy");
    links.forEach(destination => {
      const sell = marketPrice(destination, itemKey, "sell");
      const margin = sell - buy;
      if (!best || margin > best.margin) best = { itemKey, destination, buy, sell, margin };
    });
  });
  return best;
}

function runAIEconomicAction(pilot) {
  const systemId = pilot.system;
  const market = state.markets[systemId];
  if (pilot.role === "miner") {
    const itemKey = SYSTEMS[systemId].security < .7 && Math.random() < .38 ? "crystal" : "ore";
    const amount = Math.floor(randomRange(2, 7));
    const price = marketPrice(systemId, itemKey, "sell");
    market[itemKey].stock = clamp(market[itemKey].stock + amount, 2, SYSTEMS[systemId].stock[itemKey] * 3);
    pilot.credits += price * amount;
    pilot.status = `出售${GOODS[itemKey].name}`;
    recordAITrade(pilot, itemKey, amount, "sell", systemId, price);
  } else if (pilot.role === "trader") {
    const trade = chooseBestTrade(systemId);
    if (trade && trade.margin > 0) {
      const amount = Math.max(1, Math.min(Math.floor(randomRange(2, 9)), Math.floor(market[trade.itemKey].stock * .12)));
      market[trade.itemKey].stock = Math.max(2, market[trade.itemKey].stock - amount);
      const destinationMarket = state.markets[trade.destination][trade.itemKey];
      const routeThreat = ((state.systemThreat[systemId] || 0) + (state.systemThreat[trade.destination] || 0)) / 200;
      const intercepted = Math.random() < routeThreat * .18;
      const delivered = intercepted ? Math.max(0, Math.floor(amount * randomRange(.2, .6))) : amount;
      destinationMarket.stock = clamp(destinationMarket.stock + delivered, 2, SYSTEMS[trade.destination].stock[trade.itemKey] * 3);
      pilot.credits += trade.margin * delivered;
      pilot.system = trade.destination;
      pilot.x = randomRange(-900, 900);
      pilot.y = randomRange(-650, 650);
      pilot.status = `运输${GOODS[trade.itemKey].name}`;
      recordAITrade(pilot, trade.itemKey, amount, "buy", systemId, trade.buy);
      if (delivered) recordAITrade(pilot, trade.itemKey, delivered, "sell", trade.destination, trade.sell);
      if (intercepted) {
        state.markets[trade.destination].ammo.priceFactor = clamp(state.markets[trade.destination].ammo.priceFactor * 1.015, .3, 3.5);
        state.markets[trade.destination].fuel.priceFactor = clamp(state.markets[trade.destination].fuel.priceFactor * 1.012, .3, 3.5);
        if (systemId === state.currentSystem || trade.destination === state.currentSystem) addFeed(`<b>${pilot.name}</b> 的运输队遭到拦截，地区补给价格承压。`, "danger");
      }
    }
  } else if (pilot.role === "explorer") {
    const links = SYSTEMS[systemId].links;
    const destination = links[Math.floor(Math.random() * links.length)];
    pilot.system = destination;
    pilot.x = randomRange(-1000, 1000);
    pilot.y = randomRange(-700, 700);
    pilot.status = "扫描异常信号";
    if (Math.random() < .32) {
      state.markets[destination].crystal.stock += 1;
      if (destination === state.currentSystem) addFeed(`<b>${pilot.name}</b> 共享了一处相位晶体信号。`);
    }
  } else {
    const ammo = Math.floor(randomRange(1, 4));
    market.ammo.stock = Math.max(2, market.ammo.stock - ammo);
    market.salvage.stock = clamp(market.salvage.stock + randomRange(.3, 1.2), 2, SYSTEMS[systemId].stock.salvage * 3);
    pilot.status = "执行护航巡逻";
    pilot.credits += randomRange(90, 260);
    recordAITrade(pilot, "ammo", ammo, "buy", systemId, marketPrice(systemId, "ammo", "buy"));
  }
}

function updateAIPilots(dt) {
  aiEconomyTimer += dt;
  aiPilots.forEach(pilot => {
    pilot.actionTimer -= dt;
    if (pilot.actionTimer <= 0) {
      runAIEconomicAction(pilot);
      pilot.actionTimer = randomRange(5, 13);
      pilot.targetX = randomRange(-1050, 1050);
      pilot.targetY = randomRange(-720, 720);
    }
    if (pilot.system !== state.currentSystem || state.docked) return;
    const dx = pilot.targetX - pilot.x;
    const dy = pilot.targetY - pilot.y;
    const d = Math.hypot(dx, dy);
    if (d < 45) {
      pilot.targetX = randomRange(-1050, 1050);
      pilot.targetY = randomRange(-720, 720);
    } else {
      const speed = pilot.role === "trader" ? 115 : 82;
      pilot.angle = Math.atan2(dy, dx);
      pilot.vx = lerp(pilot.vx, dx / d * speed, dt * 1.7);
      pilot.vy = lerp(pilot.vy, dy / d * speed, dt * 1.7);
      pilot.x += pilot.vx * dt;
      pilot.y += pilot.vy * dt;
    }
  });
  if (aiEconomyTimer > 2.5) {
    Object.keys(SYSTEMS).forEach(systemId => {
      Object.keys(GOODS).forEach(itemKey => {
        const market = state.markets[systemId][itemKey];
        market.priceFactor = clamp(market.priceFactor * (1 + randomRange(-.002, .002)), .3, 3.5);
      });
    });
    aiEconomyTimer = 0;
    if (!$("#stationPanel").classList.contains("hidden")) renderMarket();
  }
}

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetWorld() {
  world.asteroids.length = 0;
  world.enemies.length = 0;
  world.bullets.length = 0;
  world.enemyBullets.length = 0;
  world.loot.length = 0;
  world.particles.length = 0;
  world.outpost = null;
  player.x = 0;
  player.y = 320;
  player.vx = player.vy = 0;
  player.invulnerable = 2;
  stopMining(false);
  pve.heat = 0;
  pve.alert = 0;
  pve.miningSignal = 0;
  pve.spawnCooldown = 5;
  pve.recentKills = 0;
  pve.reinforcements.clear();
  pve.outpostStage = 0;

  const system = SYSTEMS[state.currentSystem];
  const asteroidCount = 13 + Math.round((1 - system.security) * 10);
  for (let i = 0; i < asteroidCount; i++) spawnAsteroid();
  const enemyCount = system.security >= 1 ? 0 : Math.max(1, Math.round((1 - system.security) * 4));
  for (let i = 0; i < enemyCount; i++) spawnEnemy({ initial: true, reason: "巡逻" });
  if (system.security < .7 && (state.systemThreat[state.currentSystem] >= 35 || system.security === 0)) spawnPirateOutpost();
  aiPilots.filter(pilot => pilot.system === state.currentSystem).forEach(pilot => {
    pilot.x = randomRange(-1050, 1050);
    pilot.y = randomRange(-720, 720);
    pilot.targetX = randomRange(-1050, 1050);
    pilot.targetY = randomRange(-720, 720);
  });
  addFeed(`进入 <b>${system.name}</b>，扫描到 ${asteroidCount} 个资源信号。`);
}

function spawnAsteroid() {
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange(300, 1150);
  const rareChance = .08 + (1 - SYSTEMS[state.currentSystem].security) * .32 + state.upgrades.mining * .025;
  const resource = Math.random() < rareChance ? "crystal" : "ore";
  world.asteroids.push({
    id: crypto.randomUUID(), x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
    r: randomRange(25, 53), rotation: Math.random() * Math.PI, spin: randomRange(-.2, .2),
    hp: randomRange(7, 14), maxHp: 14, resource,
    color: resource === "crystal" ? "#a980ff" : "#5d819a"
  });
}

function chooseEnemyType(reason = "巡逻") {
  const security = SYSTEMS[state.currentSystem].security;
  const roll = Math.random();
  if (reason === "采矿伏击") return roll < .45 ? "scout" : roll < .8 ? "interceptor" : "missile";
  if (pve.alert >= 3 || security === 0) return roll < .2 ? "scout" : roll < .48 ? "interceptor" : roll < .75 ? "missile" : "gunship";
  if (pve.alert >= 2) return roll < .3 ? "scout" : roll < .68 ? "interceptor" : "missile";
  return roll < .45 ? "scout" : "interceptor";
}

function findSafeSpawnPoint(minPlayerDistance = 820) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = randomRange(minPlayerDistance, 1120);
    const point = {
      x: clamp(player.x + Math.cos(angle) * radius, -world.width / 2 + 80, world.width / 2 - 80),
      y: clamp(player.y + Math.sin(angle) * radius, -world.height / 2 + 80, world.height / 2 - 80)
    };
    const screen = worldToScreen(point.x, point.y);
    const offscreen = screen.x < -80 || screen.x > innerWidth + 80 || screen.y < -80 || screen.y > innerHeight + 80;
    if (distance(point, player) >= minPlayerDistance && distance(point, world.station) >= 600 && offscreen) return point;
  }
  const angle = Math.random() * Math.PI * 2;
  return { x: player.x + Math.cos(angle) * minPlayerDistance, y: player.y + Math.sin(angle) * minPlayerDistance };
}

function spawnEnemy(options = {}) {
  const security = SYSTEMS[state.currentSystem].security;
  if (security >= 1 && !options.forced) return null;
  const reason = options.reason || "巡逻";
  const type = options.type || chooseEnemyType(reason);
  const spec = ENEMY_TYPES[type];
  if (!spec) return null;
  const point = options.x != null ? { x: options.x, y: options.y } : findSafeSpawnPoint(options.initial ? 700 : 820);
  const hpScale = 1 + (1 - security) * .16;
  const maxHp = Math.round(spec.hp * hpScale);
  const enemy = {
    id: crypto.randomUUID(), x: point.x, y: point.y,
    homeX: point.x, homeY: point.y, patrolAngle: randomRange(0, Math.PI * 2),
    vx: 0, vy: 0, angle: 0, r: spec.radius, hp: maxHp, maxHp,
    speed: spec.speed, fireCooldown: randomRange(.4, spec.fireRate), tier: type === "gunship" ? 2 : 1,
    type, name: spec.name, state: "patrol", lockTimer: 0, lostTimer: 0, calledReinforcement: false, spawnReason: reason,
    detection: spec.detection, lockRange: spec.lock, weaponRange: spec.weapon, optimal: spec.optimal
  };
  world.enemies.push({
    ...enemy
  });
  pve.status = `${reason}：${spec.name}`;
  return enemy;
}

function spawnPirateOutpost() {
  const point = { x: 920, y: -560 };
  if (distance(point, world.station) < 600) point.x = 1050;
  world.outpost = {
    x: point.x, y: point.y, r: 68, maxShield: 420, shield: 420, maxHp: 620, hp: 620,
    fireCooldown: 1.5, active: true, waveTriggered: false, name: "血棘海盗据点"
  };
  pve.status = "侦测到海盗据点";
}

function addFeed(text, type = "") {
  feed.unshift({ text, type });
  feed = feed.slice(0, 7);
  $("#eventFeed").innerHTML = feed.map(item => `<div class="feed-item ${item.type}"><i></i><span>${item.text}</span></div>`).join("");
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2000);
}

function flashWallet() {
  const wallet = $(".wallet");
  wallet.classList.remove("flash");
  requestAnimationFrame(() => wallet.classList.add("flash"));
  setTimeout(() => wallet.classList.remove("flash"), 520);
}

function createParticles(x, y, color, amount = 8, speed = 100) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    world.particles.push({
      x, y, vx: Math.cos(angle) * randomRange(20, speed), vy: Math.sin(angle) * randomRange(20, speed),
      life: randomRange(.35, .9), maxLife: 1, color, size: randomRange(1, 3)
    });
  }
}

function playerCargoValue() {
  return Object.entries(state.cargo).reduce((total, [key, amount]) => total + marketPrice(state.currentSystem, key, "sell") * amount, 0);
}

function updatePVE(dt) {
  const system = SYSTEMS[state.currentSystem];
  const localTraders = aiPilots.filter(pilot => pilot.system === state.currentSystem && pilot.role === "trader").length;
  pve.miningSignal = clamp(pve.miningSignal + (mining.active ? dt * 15 : -dt * 5), 0, 100);
  const activity =
    (1 - system.security) * 48 +
    (state.systemThreat[state.currentSystem] || 0) * .55 +
    Math.min(22, playerCargoValue() / 420) +
    localTraders * 1.6 +
    pve.miningSignal * .34 +
    (world.outpost?.active ? 18 : 0) -
    pve.recentKills * 2.2;
  pve.budget = lerp(pve.budget, clamp(activity, 0, 100), 1 - Math.exp(-dt * 1.1));
  state.systemThreat[state.currentSystem] = clamp(
    lerp(state.systemThreat[state.currentSystem] || 0, pve.budget, dt * .004),
    0, 100
  );

  const engaged = world.enemies.some(enemy => enemy.state === "chase" || enemy.state === "attack" || enemy.state === "locked");
  if (engaged) {
    pve.combatQuiet = 0;
    pve.heat = clamp(pve.heat + dt * 1.2, 0, 100);
  } else {
    pve.combatQuiet += dt;
    if (pve.combatQuiet > 5) pve.heat = Math.max(0, pve.heat - dt * 2.1);
  }
  pve.recentKills = Math.max(0, pve.recentKills - dt * .08);
  const newAlert = clamp(Math.floor(pve.heat / 22), 0, 4);
  if (newAlert > pve.alert) {
    pve.alert = newAlert;
    triggerAlertReinforcement(newAlert);
  } else {
    pve.alert = newAlert;
  }

  pve.spawnCooldown -= dt;
  const enemyCap = Math.max(1, Math.round((1 - system.security) * 7 + pve.alert * 1.5));
  const canSpawn = system.security < 1 && world.enemies.length < enemyCap && pve.budget >= 18;
  if (canSpawn && pve.spawnCooldown <= 0) {
    const miningAmbush = pve.miningSignal > 38 && Math.random() < .62;
    const reason = miningAmbush ? "采矿伏击" : "航道巡逻";
    const enemy = spawnEnemy({ reason });
    if (enemy) pve.budget = Math.max(0, pve.budget - ENEMY_TYPES[enemy.type].cost);
    pve.spawnCooldown = randomRange(7, 13) + system.security * 6;
  }
  updateOutpost(dt);
  updatePVEHud();
}

function triggerAlertReinforcement(level) {
  if (level <= 0 || pve.reinforcements.has(level)) return;
  pve.reinforcements.add(level);
  const composition =
    level === 1 ? ["scout"] :
    level === 2 ? ["interceptor", "interceptor"] :
    level === 3 ? ["missile", "interceptor"] :
    ["gunship", "missile", "interceptor"];
  composition.forEach((type, index) => {
    setTimeout(() => {
      if (!state.docked && pve.alert >= level - 1) spawnEnemy({ type, reason: `警戒${level}增援` });
    }, index * 650);
  });
  addFeed(`敌方警戒提升至 <b>${level}</b>，侦测到增援跃迁信号。`, "danger");
}

function updatePVEHud() {
  const card = $(".threat-card");
  card.className = `hud-card threat-card alert-${pve.alert}`;
  $("#alertLevel").textContent = `警戒 ${pve.alert}`;
  $("#threatBudget").textContent = Math.round(pve.budget);
  $("#threatBar").style.width = `${pve.budget}%`;
  $("#miningSignal").textContent = `${Math.round(pve.miningSignal)}%`;
  $("#miningSignalBar").style.width = `${pve.miningSignal}%`;
  let status = pve.status;
  let cls = "";
  if (world.outpost?.active) { status = world.outpost.shield > 0 ? "海盗据点护盾在线" : "据点核心暴露"; cls = "danger"; }
  else if (pve.alert >= 2) { status = "敌方舰队正在追捕"; cls = "danger"; }
  else if (pve.miningSignal > 40) { status = "工业信号可能暴露位置"; cls = "warn"; }
  else if (world.enemies.some(enemy => enemy.state !== "patrol")) { status = "敌舰已进入交战状态"; cls = "warn"; }
  else status = pve.budget < 25 ? "航线平静" : "侦测到敌对活动";
  const statusElement = $("#pveStatus").parentElement;
  statusElement.className = `pve-status ${cls}`;
  $("#pveStatus").textContent = status;
}

function updateOutpost(dt) {
  const outpost = world.outpost;
  if (!outpost?.active) return;
  const d = distance(player, outpost);
  outpost.fireCooldown -= dt;
  if (d < 720 && d > 220 && outpost.fireCooldown <= 0) {
    const angle = Math.atan2(player.y - outpost.y, player.x - outpost.x);
    world.enemyBullets.push({
      x: outpost.x + Math.cos(angle) * outpost.r, y: outpost.y + Math.sin(angle) * outpost.r,
      vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
      life: 2.8, damage: 18, r: 5, source: "outpost"
    });
    outpost.fireCooldown = 1.65;
  }
}

function update(dt) {
  shieldImpact = Math.max(0, shieldImpact - dt * 2.3);
  if (!paused || state.docked) updateAIPilots(dt);
  if (paused || state.docked) return;
  state.playSeconds += dt;
  saveTimer += dt;
  marketTimer += dt;
  enemySpawnTimer += dt;
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.shieldDelay = Math.max(0, player.shieldDelay - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  interactionLock = false;

  const stats = shipStats();
  let dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  const boosting = keys.shift && player.boostEnergy > 1 && (dx || dy);
  const speed = stats.speed * (boosting ? 1.75 : 1);
  if (boosting) player.boostEnergy = Math.max(0, player.boostEnergy - dt * 35);
  else player.boostEnergy = Math.min(100, player.boostEnergy + dt * stats.boostRecovery);
  player.vx = lerp(player.vx, dx * speed, 1 - Math.exp(-dt * 7));
  player.vy = lerp(player.vy, dy * speed, 1 - Math.exp(-dt * 7));
  player.x = clamp(player.x + player.vx * dt, -world.width / 2, world.width / 2);
  player.y = clamp(player.y + player.vy * dt, -world.height / 2, world.height / 2);
  camera.x = lerp(camera.x, player.x, 1 - Math.exp(-dt * 5));
  camera.y = lerp(camera.y, player.y, 1 - Math.exp(-dt * 5));

  const mouseWorld = screenToWorld(mouse.x, mouse.y);
  player.angle = Math.atan2(mouseWorld.y - player.y, mouseWorld.x - player.x);
  if ((mouse.down || keys[" "]) && player.fireCooldown <= 0) shootPlayer();

  if (player.shieldDelay <= 0) state.shield = Math.min(stats.maxShield, state.shield + stats.shieldRegen * dt);

  updateBullets(dt);
  updateEnemies(dt);
  updateLoot(dt);
  updateParticles(dt);
  updateInteraction(dt);
  updateMission();
  updatePVE(dt);

  world.asteroids.forEach(asteroid => asteroid.rotation += asteroid.spin * dt);
  if (marketTimer > 12) {
    simulateMarkets(.45);
    marketTimer = 0;
  }
  if (saveTimer > 10) {
    saveGame();
    saveTimer = 0;
  }
}

function shootPlayer() {
  const stats = shipStats();
  const spread = randomRange(-.018, .018);
  const angle = player.angle + spread;
  world.bullets.push({
    x: player.x + Math.cos(angle) * 24, y: player.y + Math.sin(angle) * 24,
    vx: Math.cos(angle) * 720, vy: Math.sin(angle) * 720,
    life: 1.3, damage: stats.damage, r: 3
  });
  player.fireCooldown = stats.fireRate;
  pve.heat = clamp(pve.heat + .45, 0, 100);
  createParticles(player.x + Math.cos(angle) * 22, player.y + Math.sin(angle) * 22, "#39ddff", 2, 35);
}

function updateBullets(dt) {
  world.bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    for (const enemy of world.enemies) {
      if (bullet.life > 0 && distance(bullet, enemy) < enemy.r + bullet.r) {
        enemy.hp -= bullet.damage;
        bullet.life = 0;
        createParticles(bullet.x, bullet.y, "#ff768c", 5, 75);
        if (enemy.hp <= 0) destroyEnemy(enemy);
      }
    }
    const outpost = world.outpost;
    if (bullet.life > 0 && outpost?.active && distance(bullet, outpost) < outpost.r + bullet.r) {
      bullet.life = 0;
      damageOutpost(bullet.damage);
      createParticles(bullet.x, bullet.y, outpost.shield > 0 ? "#a980ff" : "#ff617b", 7, 85);
    }
  });
  world.enemyBullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (bullet.life > 0 && distance(bullet, player) < player.radius + bullet.r) {
      bullet.life = 0;
      damagePlayer(bullet.damage, bullet);
    }
  });
  world.bullets = world.bullets.filter(b => b.life > 0);
  world.enemyBullets = world.enemyBullets.filter(b => b.life > 0);
}

function damageOutpost(amount) {
  const outpost = world.outpost;
  if (!outpost?.active) return;
  pve.heat = clamp(pve.heat + 1.6, 0, 100);
  if (outpost.shield > 0) {
    outpost.shield = Math.max(0, outpost.shield - amount);
    if (outpost.shield <= 0 && !outpost.waveTriggered) {
      outpost.waveTriggered = true;
      pve.outpostStage = 1;
      addFeed("海盗据点护盾已瓦解，核心暴露并呼叫防御舰队。", "danger");
      ["interceptor", "missile", "gunship"].forEach((type, index) => {
        const angle = index / 3 * Math.PI * 2;
        spawnEnemy({
          type, reason: "据点防御",
          x: outpost.x + Math.cos(angle) * 190,
          y: outpost.y + Math.sin(angle) * 190,
          forced: true
        });
      });
    }
  } else {
    outpost.hp = Math.max(0, outpost.hp - amount);
    if (outpost.hp <= 0) destroyOutpost();
  }
}

function destroyOutpost() {
  const outpost = world.outpost;
  if (!outpost?.active) return;
  outpost.active = false;
  state.stats.outposts++;
  state.stats.intel += 3;
  state.credits += 650;
  const recovered = addCargo("salvage", 10);
  state.systemThreat[state.currentSystem] = Math.max(0, (state.systemThreat[state.currentSystem] || 0) - 28);
  state.markets[state.currentSystem].ammo.stock += 18;
  state.markets[state.currentSystem].fuel.stock += 10;
  pve.heat = Math.max(0, pve.heat - 55);
  pve.recentKills += 8;
  createParticles(outpost.x, outpost.y, "#ff617b", 65, 280);
  addFeed("<b>血棘海盗据点</b> 已被摧毁，地区威胁下降，航线补给开始恢复。", "danger");
  toast(`据点清除：+650 ISK、残骸×${recovered}、情报×3`);
  flashWallet();
  saveGame();
}

function updateEnemies(dt) {
  world.enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;
    const spec = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.interceptor;
    const d = distance(enemy, player);
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.angle = angle;
    const homeDistance = Math.hypot(enemy.x - enemy.homeX, enemy.y - enemy.homeY);
    const stationSafe = distance(player, world.station) < 350;
    const signalMultiplier = 1 + pve.miningSignal / 180 + (keys.shift ? .15 : 0) + (mouse.down ? .12 : 0);
    const effectiveDetection = enemy.detection * signalMultiplier;

    if (stationSafe || homeDistance > 1250 || enemy.hp / enemy.maxHp < .16) enemy.state = "retreat";
    else if (d <= enemy.weaponRange && enemy.lockTimer >= .8) enemy.state = "attack";
    else if (d <= enemy.lockRange) {
      enemy.lostTimer = 0;
      enemy.lockTimer += dt;
      enemy.state = enemy.lockTimer >= .8 ? "locked" : "chase";
    } else if (d <= effectiveDetection) {
      enemy.lostTimer = 0;
      enemy.state = "chase";
      enemy.lockTimer = Math.max(0, enemy.lockTimer - dt * .25);
      if (enemy.type === "scout" && !enemy.calledReinforcement && d < enemy.detection * .75) {
        enemy.calledReinforcement = true;
        pve.heat = clamp(pve.heat + 15, 0, 100);
        addFeed("海盗侦察无人机已确认目标，正在呼叫截击增援。", "danger");
        setTimeout(() => {
          if (!state.docked && enemy.hp > 0) spawnEnemy({ type: "interceptor", reason: "侦察呼援" });
        }, 1800);
      }
    } else {
      enemy.lockTimer = Math.max(0, enemy.lockTimer - dt * .8);
      if (enemy.state !== "patrol") enemy.lostTimer += dt;
      if (enemy.lostTimer > 5) enemy.state = "patrol";
    }

    let targetVx = 0;
    let targetVy = 0;
    if (enemy.state === "retreat") {
      const retreatAngle = Math.atan2(enemy.homeY - enemy.y, enemy.homeX - enemy.x);
      targetVx = Math.cos(retreatAngle) * enemy.speed * 1.15;
      targetVy = Math.sin(retreatAngle) * enemy.speed * 1.15;
    } else if (enemy.state === "patrol") {
      enemy.patrolAngle += dt * .32;
      const patrolX = enemy.homeX + Math.cos(enemy.patrolAngle) * 135;
      const patrolY = enemy.homeY + Math.sin(enemy.patrolAngle) * 135;
      const patrolAngle = Math.atan2(patrolY - enemy.y, patrolX - enemy.x);
      targetVx = Math.cos(patrolAngle) * enemy.speed * .42;
      targetVy = Math.sin(patrolAngle) * enemy.speed * .42;
    } else {
      const radial = d > enemy.optimal + 45 ? 1 : d < enemy.optimal - 45 ? -1 : 0;
      const strafe = enemy.type === "interceptor" ? .72 : enemy.type === "missile" ? .28 : .12;
      targetVx = Math.cos(angle) * enemy.speed * radial + Math.cos(angle + Math.PI / 2) * enemy.speed * strafe;
      targetVy = Math.sin(angle) * enemy.speed * radial + Math.sin(angle + Math.PI / 2) * enemy.speed * strafe;
    }
    enemy.vx = lerp(enemy.vx, targetVx, 1 - Math.exp(-dt * 2.7));
    enemy.vy = lerp(enemy.vy, targetVy, 1 - Math.exp(-dt * 2.7));
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.fireCooldown -= dt;
    if (enemy.state === "attack" && d <= enemy.weaponRange && enemy.fireCooldown <= 0) {
      world.enemyBullets.push({
        x: enemy.x + Math.cos(angle) * enemy.r, y: enemy.y + Math.sin(angle) * enemy.r,
        vx: Math.cos(angle) * spec.bulletSpeed, vy: Math.sin(angle) * spec.bulletSpeed,
        life: Math.max(2.1, enemy.weaponRange / spec.bulletSpeed + .4), damage: spec.damage,
        r: enemy.type === "gunship" ? 5 : enemy.type === "missile" ? 4 : 3,
        source: enemy.type
      });
      enemy.fireCooldown = spec.fireRate;
    }
  });
  world.enemies = world.enemies.filter(enemy => enemy.hp > 0);
}

function destroyEnemy(enemy) {
  enemy.hp = 0;
  const spec = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.interceptor;
  state.stats.kills++;
  pve.heat = clamp(pve.heat + 11 + spec.cost * .28, 0, 100);
  pve.recentKills += 1;
  state.credits += spec.bounty;
  const salvage = Math.floor(randomRange(spec.salvage[0], spec.salvage[1] + 1));
  world.loot.push({ x: enemy.x, y: enemy.y, item: "salvage", amount: salvage, r: 12, pulse: 0 });
  if (Math.random() < .28) world.loot.push({ x: enemy.x + 18, y: enemy.y - 12, item: "ammo", amount: 1 + enemy.tier, r: 10, pulse: 0 });
  if (Math.random() < .22) {
    state.stats.intel++;
    addFeed("从敌舰数据库中提取到 1 份海盗情报。");
  }
  createParticles(enemy.x, enemy.y, spec.color, enemy.tier === 2 ? 30 : 18, 190);
  addFeed(`摧毁 <b>${enemy.name}</b>，获得 ${spec.bounty} ISK 与残骸。`, "danger");
}

function damagePlayer(amount, source = null) {
  if (player.invulnerable > 0) return;
  player.shieldDelay = 4;
  if (state.shield > 0) {
    const absorbed = Math.min(state.shield, amount);
    state.shield -= absorbed;
    amount -= absorbed;
    shieldImpact = 1;
    shieldHitAngle = source ? Math.atan2(source.y - player.y, source.x - player.x) : player.angle + Math.PI;
    $("#shieldOrb").classList.remove("hit");
    requestAnimationFrame(() => $("#shieldOrb").classList.add("hit"));
    createParticles(player.x, player.y, "#39ddff", 7, 95);
  }
  if (amount > 0) {
    state.hull -= amount;
    createParticles(player.x, player.y, "#ff9d66", 9, 115);
  }
  if (state.hull <= 0) destroyPlayer();
}

function destroyPlayer() {
  paused = true;
  state.stats.deaths++;
  const cargoValue = Object.entries(state.cargo).reduce((sum, [key, amount]) => sum + marketPrice(state.currentSystem, key, "sell") * amount, 0);
  const insurance = Math.round(700 + state.upgrades.hull * 120);
  state.credits += insurance;
  state.cargo = {};
  state.hull = shipStats().maxHull;
  state.shield = shipStats().maxShield;
  $("#deathReport").textContent = `货物损失约 ${formatNumber(cargoValue)} ISK；基础保险赔付 ${formatNumber(insurance)} ISK。`;
  $("#deathPanel").classList.remove("hidden");
  saveGame();
}

function updateLoot(dt) {
  world.loot.forEach(loot => {
    loot.pulse += dt;
  });
  world.loot = world.loot.filter(loot => loot.amount > 0);
}

function updateParticles(dt) {
  world.particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= .985;
    p.vy *= .985;
    p.life -= dt;
  });
  world.particles = world.particles.filter(p => p.life > 0);
}

function updateInteraction(dt) {
  const prompt = $("#interactionPrompt");
  const stationDistance = distance(player, world.station);
  let nearestAsteroid = null;
  let nearestDistance = Infinity;
  world.asteroids.forEach(asteroid => {
    const d = distance(player, asteroid);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestAsteroid = asteroid;
    }
  });

  if (stationDistance < 150) {
    prompt.textContent = "按 E 停靠空间站";
    prompt.classList.remove("hidden");
    return;
  }

  const activeTarget = world.asteroids.find(asteroid => asteroid.id === mining.targetId);
  if (mining.active && activeTarget) {
    const targetDistance = distance(player, activeTarget);
    if (targetDistance > 260 || cargoSpaceFor(activeTarget.resource) <= 0) {
      stopMining();
      if (targetDistance > 260) toast("采矿束超出有效距离");
    } else {
      mineAsteroid(activeTarget, dt);
      prompt.textContent = "按 E 关闭采矿束";
      prompt.classList.remove("hidden");
      return;
    }
  } else if (mining.active) {
    stopMining(false);
  }

  if (nearestAsteroid && nearestDistance < 225) {
    prompt.textContent = `按 E 锁定 ${GOODS[nearestAsteroid.resource].name}`;
    prompt.classList.remove("hidden");
    return;
  }
  const nearbyLoot = world.loot.find(loot => distance(player, loot) < 135);
  if (nearbyLoot) {
    prompt.textContent = `按 E 回收 ${GOODS[nearbyLoot.item].name}`;
    prompt.classList.remove("hidden");
    return;
  }
  prompt.classList.add("hidden");
}

function handleInteractionAction() {
  if (state.docked || paused) return;
  if (distance(player, world.station) < 150) {
    dock();
    return;
  }
  const nearbyLoot = world.loot.find(loot => distance(player, loot) < 135);
  if (nearbyLoot) {
    const accepted = addCargo(nearbyLoot.item, nearbyLoot.amount);
    if (accepted > 0) {
      nearbyLoot.amount -= accepted;
      createParticles(nearbyLoot.x, nearbyLoot.y, GOODS[nearbyLoot.item].color, 8, 70);
      addFeed(`回收 ${GOODS[nearbyLoot.item].name} × ${accepted}。`);
    } else toast("货舱已满");
    return;
  }
  if (mining.active) {
    stopMining();
    return;
  }
  let target = null;
  let closest = Infinity;
  world.asteroids.forEach(asteroid => {
    const d = distance(player, asteroid);
    if (d < closest && d < 225) {
      target = asteroid;
      closest = d;
    }
  });
  if (target) {
    if (cargoSpaceFor(target.resource) <= 0) return toast("货舱已满，无法启动采矿束");
    mining.targetId = target.id;
    mining.active = true;
    $("#miningPanel").classList.remove("hidden");
    toast(`已锁定 ${GOODS[target.resource].name}`);
  }
}

function stopMining(showToast = true) {
  if (mining.active && showToast) toast("采矿束已关闭");
  mining.active = false;
  mining.targetId = null;
  $("#miningPanel")?.classList.add("hidden");
}

function mineAsteroid(asteroid, dt) {
  const rate = shipStats().miningRate;
  asteroid.hp -= dt * rate;
  const progress = clamp(1 - asteroid.hp / asteroid.maxHp, 0, 1);
  $("#miningTargetName").textContent = GOODS[asteroid.resource].name;
  $("#miningRange").textContent = `${Math.round(distance(player, asteroid))}m`;
  $("#miningProgressBar").style.width = `${progress * 100}%`;
  $("#miningPanel").classList.remove("hidden");
  if (Math.random() < dt * rate * 5) createParticles(asteroid.x, asteroid.y, GOODS[asteroid.resource].color, 2, 45);
  if (asteroid.hp <= 0) {
    const amount = asteroid.resource === "crystal" ? Math.floor(randomRange(2, 5)) : Math.floor(randomRange(4, 8));
    const accepted = addCargo(asteroid.resource, amount);
    if (accepted > 0) {
      state.stats.mined += accepted;
      addFeed(`采集 ${GOODS[asteroid.resource].name} × ${accepted}。`);
      createParticles(asteroid.x, asteroid.y, GOODS[asteroid.resource].color, 18, 150);
    } else toast("货舱已满，无法继续采矿");
    world.asteroids = world.asteroids.filter(item => item !== asteroid);
    stopMining(false);
    setTimeout(() => {
      if (!state.docked) spawnAsteroid();
    }, 5000);
  }
}

function dock() {
  state.docked = true;
  paused = true;
  player.vx = player.vy = 0;
  pve.heat = Math.max(0, pve.heat - 20);
  autoRefuel();
  checkDeliveryMission();
  simulateMarkets(.8);
  openStation();
  addFeed(`已停靠 <b>${SYSTEMS[state.currentSystem].station}</b>。`);
  saveGame();
}

function undock() {
  state.docked = false;
  paused = false;
  player.x = 0;
  player.y = 250;
  player.invulnerable = 2;
  $("#stationPanel").classList.add("hidden");
  toast("离站完成，祝航行顺利");
}

function autoRefuel() {
  const needed = state.maxFuel - state.fuel;
  if (needed > 0 && state.cargo.fuel) {
    const loaded = removeCargo("fuel", Math.min(needed, state.cargo.fuel));
    state.fuel += loaded;
    if (loaded) addFeed(`自动装填跃迁燃料 × ${loaded}。`);
  }
}

function jumpTo(systemId) {
  if (!SYSTEMS[state.currentSystem].links.includes(systemId)) return toast("只能跃迁到相邻星系");
  autoRefuel();
  if (state.fuel < 1) return toast("跃迁燃料不足，请在市场补给");
  state.fuel--;
  state.stats.jumps++;
  state.currentSystem = systemId;
  if (!state.discovered.includes(systemId)) state.discovered.push(systemId);
  selectedSystem = null;
  $("#mapPanel").classList.add("hidden");
  state.docked = false;
  paused = false;
  simulateMarkets(1.4);
  resetWorld();
  updateSystemHud();
  toast(`跃迁抵达 ${SYSTEMS[systemId].name}`);
  saveGame();
}

function buyItem(itemKey, requested) {
  const market = state.markets[state.currentSystem][itemKey];
  const price = marketPrice(state.currentSystem, itemKey, "buy");
  const amountByMoney = Math.floor(state.credits / (price * 1.025));
  const amountByCargo = cargoSpaceFor(itemKey);
  const amount = Math.max(0, Math.min(requested === "max" ? 9999 : requested, Math.floor(market.stock), amountByMoney, amountByCargo));
  if (amount <= 0) return toast(amountByCargo <= 0 ? "货舱空间不足" : "资金或市场库存不足");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  state.credits -= gross + fee;
  addCargo(itemKey, amount);
  market.stock -= amount;
  market.priceFactor = clamp(market.priceFactor * (1 + amount / (SYSTEMS[state.currentSystem].stock[itemKey] * 18)), .3, 3.5);
  autoRefuel();
  addFeed(`购入 ${GOODS[itemKey].name} × ${amount}，支出 ${formatNumber(gross + fee)} ISK。`);
  flashWallet();
  renderStation();
  updateHud();
  saveGame();
}

function sellItem(itemKey, requested) {
  const owned = state.cargo[itemKey] || 0;
  const amount = Math.max(0, Math.min(requested === "max" ? owned : requested, owned));
  if (amount <= 0) return toast("货舱中没有该商品");
  const market = state.markets[state.currentSystem][itemKey];
  const price = marketPrice(state.currentSystem, itemKey, "sell");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  removeCargo(itemKey, amount);
  state.credits += gross - fee;
  state.stats.tradeRevenue += gross - fee;
  market.stock += amount;
  market.priceFactor = clamp(market.priceFactor * (1 - amount / (SYSTEMS[state.currentSystem].stock[itemKey] * 22)), .3, 3.5);
  addFeed(`售出 ${GOODS[itemKey].name} × ${amount}，收入 ${formatNumber(gross - fee)} ISK。`);
  flashWallet();
  renderStation();
  updateHud();
  updateMission();
  saveGame();
}

function repairShip() {
  const stats = shipStats();
  const missingHull = stats.maxHull - state.hull;
  const missingShield = stats.maxShield - state.shield;
  const cost = Math.ceil(missingHull * 8 + missingShield * 1.5);
  if (cost <= 0) return toast("舰船状态完好");
  if (state.credits < cost) return toast("维修资金不足");
  state.credits -= cost;
  state.hull = stats.maxHull;
  state.shield = stats.maxShield;
  addFeed(`完成舰船维修，支付 ${formatNumber(cost)} ISK。`);
  renderStation();
  updateHud();
  saveGame();
}

function buyUpgrade(key) {
  const upgrade = UPGRADES[key];
  const level = state.upgrades[key];
  if (level >= upgrade.max) return;
  const cost = Math.round(upgrade.baseCost * Math.pow(1.7, level));
  if (state.credits < cost) return toast("升级资金不足");
  state.credits -= cost;
  state.upgrades[key]++;
  const stats = shipStats();
  state.shield = Math.min(stats.maxShield, state.shield + (key === "shield" ? 35 : 0));
  state.hull = Math.min(stats.maxHull, state.hull + (key === "hull" ? 45 : 0));
  addFeed(`安装 ${upgrade.name} MK ${state.upgrades[key]}。`);
  renderStation();
  updateHud();
  saveGame();
}

function acceptContract(contractId) {
  const template = CONTRACT_LIBRARY.find(contract => contract.id === contractId);
  const startValue =
    template.id === "mine" ? state.stats.mined :
    template.id === "hunt" ? state.stats.kills :
    template.id === "trade" ? state.stats.tradeRevenue : 0;
  state.mission = { ...template, progress: 0, startValue };
  toast(`已接受合约：${template.title}`);
  updateHud();
  renderStation();
  saveGame();
}

function missionProgress(mission) {
  if (!mission) return 0;
  if (mission.id === "mine") return Math.min(mission.amount, state.stats.mined - (mission.startValue || 0));
  if (mission.id === "hunt") return Math.min(mission.amount, state.stats.kills - (mission.startValue || 0));
  if (mission.id === "trade") return Math.min(mission.amount, state.stats.tradeRevenue - (mission.startValue || 0));
  return Math.min(mission.amount, state.cargo[mission.item] || 0);
}

function updateMission() {
  const mission = state.mission;
  if (!mission) return;
  mission.progress = missionProgress(mission);
  if (["mine", "hunt", "trade"].includes(mission.id) && mission.progress >= mission.amount) completeMission();
  updateMissionHud();
}

function checkDeliveryMission() {
  const mission = state.mission;
  if (!mission || !mission.item) return;
  mission.progress = missionProgress(mission);
  const correctDestination = !mission.destination || mission.destination === state.currentSystem;
  if (mission.progress >= mission.amount && correctDestination) {
    removeCargo(mission.item, mission.amount);
    completeMission();
  }
}

function completeMission() {
  const mission = state.mission;
  if (!mission) return;
  state.credits += mission.reward;
  state.reputation += 1;
  addFeed(`合约 <b>${mission.title}</b> 已完成，获得 ${formatNumber(mission.reward)} ISK。`);
  toast(`合约完成 +${formatNumber(mission.reward)} ISK`);
  state.mission = null;
  updateHud();
  saveGame();
}

function openStation() {
  const system = SYSTEMS[state.currentSystem];
  $("#stationPanel").classList.remove("hidden");
  $("#stationTitle").textContent = system.station;
  $("#stationTrait").textContent = system.trait;
  renderStation();
}

function renderStation() {
  renderMarket();
  renderUpgrades();
  renderContracts();
  renderIntel();
  const stats = shipStats();
  const repairCost = Math.ceil((stats.maxHull - state.hull) * 8 + (stats.maxShield - state.shield) * 1.5);
  $("#repairCost").textContent = repairCost ? `${formatNumber(repairCost)} ISK` : "完好";
  $("#repairBtn").disabled = repairCost <= 0;
}

function renderMarket() {
  const systemId = state.currentSystem;
  const system = SYSTEMS[systemId];
  const market = state.markets[systemId];
  const scarce = Object.keys(GOODS).filter(key => market[key].stock < system.stock[key] * .35).length;
  $("#marketSummary").textContent = scarce ? `${scarce} 类商品供应紧张` : "市场流动性正常";
  const filtered = Object.entries(GOODS).filter(([, item]) => item.name.includes(marketSearchText) || item.description.includes(marketSearchText));
  $("#marketItemList").innerHTML = filtered.map(([key, item]) => {
    const price = marketPrice(systemId, key, "buy");
    const change = (price / item.base - 1) * 100;
    return `
      <button class="market-list-item ${selectedMarketItem === key ? "active" : ""}" data-market-item="${key}" style="--item-color:${item.color}">
        <span class="market-list-icon">${item.icon}</span>
        <span><strong>${item.name}</strong><small>库存 ${Math.floor(market[key].stock)} · 持有 ${state.cargo[key] || 0}</small></span>
        <span class="market-list-price"><b>${formatNumber(price)}</b><span class="${change > 0 ? "up" : ""}">${change >= 0 ? "+" : ""}${change.toFixed(0)}%</span></span>
      </button>`;
  }).join("");
  $$("[data-market-item]").forEach(button => button.addEventListener("click", () => {
    selectedMarketItem = button.dataset.marketItem;
    renderMarket();
  }));
  renderMarketDetail();
}

function renderMarketDetail() {
  const systemId = state.currentSystem;
  const itemKey = selectedMarketItem;
  const item = GOODS[itemKey];
  const market = state.markets[systemId][itemKey];
  const buyPrice = marketPrice(systemId, itemKey, "buy");
  const sellPrice = marketPrice(systemId, itemKey, "sell");
  const currentPrice = marketMode === "buy" ? buyPrice : sellPrice;
  const change = (currentPrice / item.base - 1) * 100;
  const owned = state.cargo[itemKey] || 0;
  const available = marketMode === "buy" ? Math.floor(market.stock) : owned;

  $("#marketSelectedIcon").textContent = item.icon;
  $("#marketSelectedIcon").style.setProperty("--selected-color", item.color);
  $("#marketSelectedCategory").textContent = itemKey === "ore" || itemKey === "crystal" ? "资源与工业原料" : "舰船补给与回收品";
  $("#marketSelectedName").textContent = item.name;
  $("#marketSelectedDescription").textContent = item.description;
  $("#marketMidPrice").textContent = `${formatNumber(Math.round((buyPrice + sellPrice) / 2))} ISK`;
  $("#marketPriceChange").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  $("#marketPriceChange").className = change > 0 ? "up" : "";
  $("#marketSpread").textContent = `${formatNumber(buyPrice - sellPrice)} ISK`;
  $("#ticketModeLabel").textContent = marketMode === "buy" ? "立即购买" : "立即出售";
  $("#ticketAvailable").textContent = marketMode === "buy" ? `市场库存 ${available}` : `货舱持有 ${available}`;
  $("#selectedOwned").textContent = `${owned} 单位`;
  $("#executeTradeBtn").textContent = marketMode === "buy" ? "确认购买" : "确认出售";
  $("#executeTradeBtn").classList.toggle("sell", marketMode === "sell");

  const quantityInput = $("#tradeQuantity");
  const maxAmount = Math.max(1, available);
  quantityInput.max = maxAmount;
  quantityInput.value = String(clamp(Number(quantityInput.value) || 1, 1, maxAmount));
  updateTradeTicket();

  const sellOrders = Array.from({ length: 6 }, (_, index) => {
    const price = buyPrice + index * Math.max(1, Math.round(buyPrice * .012));
    const amount = Math.max(1, Math.round(market.stock * (.035 + index * .013)));
    return { price, amount };
  }).reverse();
  const buyOrders = Array.from({ length: 6 }, (_, index) => {
    const price = sellPrice - index * Math.max(1, Math.round(sellPrice * .011));
    const amount = Math.max(1, Math.round(SYSTEMS[systemId].stock[itemKey] * (.028 + index * .011)));
    return { price: Math.max(1, price), amount };
  });
  renderOrderRows("#sellOrders", sellOrders, "sell");
  renderOrderRows("#buyOrders", buyOrders, "buy");
  renderMarketSidebar();
  requestAnimationFrame(() => drawMarketChart(itemKey));
}

function renderOrderRows(selector, orders, side) {
  let cumulative = 0;
  const max = Math.max(...orders.map(order => order.amount));
  $(selector).innerHTML = orders.map(order => {
    cumulative += order.amount;
    return `<div class="order-row" style="--depth:${order.amount / max * 100}%" data-order-price="${order.price}">
      <span>${formatNumber(order.amount)}</span><span>${formatNumber(order.price)}</span><span>${formatNumber(cumulative)}</span>
    </div>`;
  }).join("");
  $(`${selector}`).querySelectorAll(".order-row").forEach(row => row.addEventListener("click", () => {
    toast(`${side === "sell" ? "卖单" : "买单"}价格 ${formatNumber(Number(row.dataset.orderPrice))} ISK`);
  }));
}

function updateTradeTicket() {
  if (!GOODS[selectedMarketItem]) return;
  const amount = Math.max(1, Number($("#tradeQuantity").value) || 1);
  const price = marketPrice(state.currentSystem, selectedMarketItem, marketMode === "buy" ? "buy" : "sell");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  $("#tradeTotal").textContent = `${formatNumber(marketMode === "buy" ? gross + fee : gross - fee)} ISK`;
  $("#tradeFee").textContent = `成交额 ${formatNumber(gross)} · 税费 ${formatNumber(fee)}`;
}

function executeMarketTrade() {
  const amount = Math.max(1, Math.floor(Number($("#tradeQuantity").value) || 1));
  if (marketMode === "buy") buyItem(selectedMarketItem, amount);
  else sellItem(selectedMarketItem, amount);
}

function renderMarketSidebar() {
  const stats = shipStats();
  const usage = cargoUsed();
  $("#marketCargoUsage").textContent = `${usage} / ${stats.cargo}`;
  $("#marketCargoBar").style.width = `${clamp(usage / stats.cargo * 100, 0, 100)}%`;
  const recentWindow = Date.now() - 60000;
  $("#aiTradeRate").textContent = `${aiTradeLog.filter(entry => entry.time > recentWindow).length} 笔/分`;
  $("#aiTradeFeed").innerHTML = aiTradeLog.slice(0, 7).map(entry => `
    <div class="ai-trade-row"><span><b>${entry.pilot}</b> ${entry.side === "buy" ? "买入" : "卖出"} ${GOODS[entry.item].name} ×${entry.amount}</span><b class="${entry.side === "sell" ? "sell" : ""}">${formatNumber(entry.price)}</b></div>
  `).join("") || `<div class="ai-trade-row"><span>等待玩家成交数据…</span><b>—</b></div>`;
  $("#regionalPrices").innerHTML = Object.entries(SYSTEMS).map(([id, system]) => `
    <div class="regional-row"><span>${system.station}</span><b>${formatNumber(marketPrice(id, selectedMarketItem, "sell"))}</b></div>
  `).join("");
}

function drawMarketChart(itemKey) {
  const chart = $("#marketChart");
  if (!chart) return;
  const rect = chart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = devicePixelRatio || 1;
  chart.width = rect.width * dpr;
  chart.height = rect.height * dpr;
  const c = chart.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = rect.width;
  const height = rect.height;
  const pad = { l: 32, r: 8, t: 12, b: 20 };
  const history = [...state.markets[state.currentSystem][itemKey].history];
  while (history.length < 24) history.unshift(history[0] || GOODS[itemKey].base);
  history[history.length - 1] = marketPrice(state.currentSystem, itemKey);
  const min = Math.min(...history) * .94;
  const max = Math.max(...history) * 1.06;
  c.clearRect(0, 0, width, height);
  c.font = "7px ui-monospace, monospace";
  c.fillStyle = "#52617b";
  c.strokeStyle = "rgba(137,165,215,.09)";
  for (let i = 0; i < 4; i++) {
    const y = pad.t + (height - pad.t - pad.b) * i / 3;
    c.beginPath(); c.moveTo(pad.l, y); c.lineTo(width - pad.r, y); c.stroke();
    c.fillText(Math.round(max - (max - min) * i / 3), 2, y + 3);
  }
  const color = GOODS[itemKey].color;
  const points = history.map((value, index) => ({
    x: pad.l + (width - pad.l - pad.r) * index / (history.length - 1),
    y: pad.t + (height - pad.t - pad.b) * (1 - (value - min) / Math.max(1, max - min))
  }));
  const gradient = c.createLinearGradient(0, pad.t, 0, height - pad.b);
  gradient.addColorStop(0, `${color}35`);
  gradient.addColorStop(1, `${color}00`);
  c.beginPath();
  points.forEach((point, index) => index ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y));
  c.lineTo(points[points.length - 1].x, height - pad.b);
  c.lineTo(points[0].x, height - pad.b);
  c.closePath();
  c.fillStyle = gradient;
  c.fill();
  c.beginPath();
  points.forEach((point, index) => index ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y));
  c.strokeStyle = color;
  c.lineWidth = 1.7;
  c.shadowColor = color;
  c.shadowBlur = 7;
  c.stroke();
  c.shadowBlur = 0;
}

function renderUpgrades() {
  $("#upgradeGrid").innerHTML = Object.entries(UPGRADES).map(([key, upgrade]) => {
    const level = state.upgrades[key];
    const cost = Math.round(upgrade.baseCost * Math.pow(1.7, level));
    const maxed = level >= upgrade.max;
    return `
      <article class="upgrade-card">
        <header><h3>${upgrade.name}</h3><span>MK ${level}</span></header>
        <p>${upgrade.description}</p>
        <footer><span>${maxed ? "已满级" : `${formatNumber(cost)} ISK`}</span><button data-upgrade="${key}" ${maxed || state.credits < cost ? "disabled" : ""}>${maxed ? "完成" : "安装升级"}</button></footer>
      </article>`;
  }).join("");
  $$("[data-upgrade]").forEach(button => button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade)));
}

function renderContracts() {
  const available = CONTRACT_LIBRARY.filter(contract => contract.id !== state.mission?.id).slice(0, 5);
  $("#contractGrid").innerHTML = available.map(contract => `
    <article class="contract-card">
      <span class="contract-type">${contract.type.toUpperCase()}</span>
      <h3>${contract.title}</h3><p>${contract.description}</p>
      <div class="contract-reward"><span>目标 ${formatNumber(contract.amount)}</span><b>${formatNumber(contract.reward)} ISK</b></div>
      <button data-contract="${contract.id}">接受合约</button>
    </article>`).join("");
  $$("[data-contract]").forEach(button => button.addEventListener("click", () => acceptContract(button.dataset.contract)));
}

function renderIntel() {
  const current = state.currentSystem;
  const opportunities = [];
  Object.keys(GOODS).forEach(key => {
    const localBuy = marketPrice(current, key, "buy");
    Object.keys(SYSTEMS).forEach(systemId => {
      if (systemId === current) return;
      const remoteSell = marketPrice(systemId, key, "sell");
      const margin = remoteSell - localBuy;
      if (margin > 0) opportunities.push({ key, systemId, margin, pct: margin / localBuy * 100 });
    });
  });
  opportunities.sort((a, b) => b.pct - a.pct);
  $("#tradeIntel").innerHTML = `<div class="intel-list">${opportunities.slice(0, 6).map(item => `
    <div class="intel-row"><span>${GOODS[item.key].name} → ${SYSTEMS[item.systemId].station}</span><b>+${item.pct.toFixed(0)}%</b></div>`).join("") || `<div class="intel-row"><span>暂无明显套利路线</span><b>—</b></div>`}</div>`;
  $("#riskIntel").innerHTML = `<div class="intel-list">${SYSTEMS[current].links.map(id => {
    const system = SYSTEMS[id];
    return `<div class="intel-row"><span>${system.name} · ${system.securityText}</span><b class="${system.security < .5 ? "risk" : ""}">${system.risk}</b></div>`;
  }).join("")}</div>`;
}

function updateSystemHud() {
  const system = SYSTEMS[state.currentSystem];
  $("#systemName").textContent = system.name;
  $("#locationName").textContent = state.docked ? system.station : "星系空间";
  const badge = $("#securityBadge");
  badge.textContent = system.securityText;
  badge.className = `security ${system.security >= .7 ? "safe" : system.security > 0 ? "low" : "null"}`;
}

function updateHud() {
  const stats = shipStats();
  state.shield = Math.min(state.shield, stats.maxShield);
  state.hull = Math.min(state.hull, stats.maxHull);
  $("#credits").textContent = formatNumber(state.credits);
  $("#shieldText").textContent = `${Math.ceil(state.shield)} / ${stats.maxShield}`;
  $("#hullText").textContent = `${Math.ceil(state.hull)} / ${stats.maxHull}`;
  $("#fuelText").textContent = `${state.fuel} / ${state.maxFuel}`;
  $("#shieldBar").style.width = `${state.shield / stats.maxShield * 100}%`;
  const shieldPct = Math.round(state.shield / stats.maxShield * 100);
  $("#shieldOrb").style.setProperty("--shield", `${shieldPct}%`);
  $("#shieldOrbValue").textContent = `${shieldPct}%`;
  $("#hullBar").style.width = `${state.hull / stats.maxHull * 100}%`;
  $("#fuelBar").style.width = `${state.fuel / state.maxFuel * 100}%`;
  $("#damageStat").textContent = Math.round(stats.damage);
  $("#cargoStat").textContent = `${cargoUsed()}/${stats.cargo}`;
  $("#speedStat").textContent = Math.round(stats.speed);
  $("#boostStatus").textContent = `${Math.round(player.boostEnergy)}%`;
  $("#weaponCooldown").textContent = player.fireCooldown > 0 ? `${player.fireCooldown.toFixed(1)}s` : "就绪";
  updateSystemHud();
  updateAIPopulationHud();
  updateCargoHud();
  updateMissionHud();
}

function updateCargoHud() {
  const entries = Object.entries(state.cargo).filter(([, amount]) => amount > 0);
  $("#cargoList").innerHTML = entries.length ? entries.map(([key, amount]) => `
    <div class="cargo-row"><i style="background:${GOODS[key].color}"></i><span>${GOODS[key].name}</span><b>× ${amount}</b></div>`).join("") : `<div class="cargo-empty">货舱为空 · 去寻找第一笔生意</div>`;
  const value = entries.reduce((sum, [key, amount]) => sum + marketPrice(state.currentSystem, key, "sell") * amount, 0);
  $("#cargoValue").textContent = `${formatNumber(value)} ISK`;
}

function updateMissionHud() {
  const mission = state.mission;
  if (!mission) {
    $("#missionContent").innerHTML = `<div class="cargo-empty">暂无合约 · 在空间站合约中心领取</div>`;
    return;
  }
  mission.progress = missionProgress(mission);
  const pct = clamp(mission.progress / mission.amount * 100, 0, 100);
  const destination = mission.destination ? ` · ${SYSTEMS[mission.destination].station}` : "";
  $("#missionContent").innerHTML = `
    <div class="mission-name">${mission.title}</div>
    <p class="mission-desc">${mission.description}${destination}</p>
    <div class="mission-progress"><i style="width:${pct}%"></i></div>
    <div class="mission-meta"><span>${formatNumber(mission.progress)} / ${formatNumber(mission.amount)}</span><b>${formatNumber(mission.reward)} ISK</b></div>`;
}

function renderMap() {
  const map = $("#starMap");
  map.querySelectorAll(".system-node").forEach(node => node.remove());
  Object.entries(SYSTEMS).forEach(([id, system]) => {
    const node = document.createElement("button");
    node.className = `system-node ${id === state.currentSystem ? "current" : ""} ${selectedSystem === id ? "selected" : ""}`;
    node.style.left = `${system.map[0]}%`;
    node.style.top = `${system.map[1]}%`;
    node.style.setProperty("--node-color", system.color);
    node.innerHTML = `<div class="star"></div><strong>${system.name}</strong><span>${system.securityText}</span>`;
    node.addEventListener("click", () => {
      selectedSystem = id;
      renderMap();
      renderRoute();
    });
    map.appendChild(node);
  });
  renderRoute();
}

function renderRoute() {
  if (!selectedSystem) {
    $("#routeName").textContent = "选择一个星系";
    $("#routeSecurity").textContent = "—";
    $("#routeInfo").innerHTML = "选择星系查看地区经济、资源与航行风险。";
    $("#jumpBtn").disabled = true;
    return;
  }
  const system = SYSTEMS[selectedSystem];
  const adjacent = SYSTEMS[state.currentSystem].links.includes(selectedSystem);
  const current = selectedSystem === state.currentSystem;
  $("#routeName").textContent = system.name;
  $("#routeSecurity").textContent = system.securityText;
  $("#routeSecurity").style.color = system.color;
  const best = Object.keys(GOODS).sort((a, b) => system.modifiers[a] - system.modifiers[b])[0];
  const demand = Object.keys(GOODS).sort((a, b) => system.modifiers[b] - system.modifiers[a])[0];
  $("#routeInfo").innerHTML = `
    ${system.description}
    <strong>主要产出</strong>${GOODS[best].name}
    <strong>高需求商品</strong>${GOODS[demand].name}
    <strong>航线状态</strong>${current ? "当前所在星系" : adjacent ? `相邻航线 · 消耗1燃料 · 风险${system.risk}` : "没有直接星门连接"}`;
  $("#jumpBtn").disabled = current || !adjacent || state.fuel < 1;
  $("#jumpBtn").textContent = state.fuel < 1 ? "燃料不足" : adjacent ? "设定跃迁航线" : "不可直接跃迁";
}

function openMap() {
  $("#mapPanel").classList.remove("hidden");
  paused = true;
  selectedSystem = null;
  renderMap();
}

function closeMap() {
  $("#mapPanel").classList.add("hidden");
  paused = state.docked;
}

function worldToScreen(x, y) {
  return { x: x - camera.x + innerWidth / 2, y: y - camera.y + innerHeight / 2 };
}

function screenToWorld(x, y) {
  return { x: x + camera.x - innerWidth / 2, y: y + camera.y - innerHeight / 2 };
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  drawBackground();
  drawWorldBounds();
  drawStation();
  drawPirateOutpost();
  world.asteroids.forEach(drawAsteroid);
  drawMiningBeam();
  world.loot.forEach(drawLoot);
  world.bullets.forEach(bullet => drawBullet(bullet, "#55e5ff"));
  world.enemyBullets.forEach(bullet => drawBullet(bullet, "#ff607a"));
  world.enemies.forEach(drawEnemy);
  aiPilots.filter(pilot => pilot.system === state.currentSystem).forEach(drawAIPilot);
  world.particles.forEach(drawParticle);
  if (!state.docked) drawPlayer();
  drawRadar();
  updateTargetHud();
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(innerWidth * .62, innerHeight * .2, 0, innerWidth * .62, innerHeight * .2, innerWidth * .85);
  const systemColor = SYSTEMS[state.currentSystem].color;
  gradient.addColorStop(0, `${systemColor}18`);
  gradient.addColorStop(.38, "#091126");
  gradient.addColorStop(1, "#02050d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  for (let layer = 0; layer < 3; layer++) {
    const count = 70 + layer * 30;
    const parallax = .03 + layer * .04;
    for (let i = 0; i < count; i++) {
      const seedX = ((i * 193 + layer * 71) % 997) / 997;
      const seedY = ((i * 389 + layer * 43) % 991) / 991;
      const x = ((seedX * innerWidth - camera.x * parallax) % innerWidth + innerWidth) % innerWidth;
      const y = ((seedY * innerHeight - camera.y * parallax) % innerHeight + innerHeight) % innerHeight;
      ctx.globalAlpha = .22 + layer * .18;
      ctx.fillStyle = i % 13 === 0 ? systemColor : "#d7e7ff";
      ctx.beginPath();
      ctx.arc(x, y, .45 + layer * .35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawWorldBounds() {
  const topLeft = worldToScreen(-world.width / 2, -world.height / 2);
  ctx.strokeStyle = "rgba(80,120,170,.08)";
  ctx.setLineDash([8, 12]);
  ctx.strokeRect(topLeft.x, topLeft.y, world.width, world.height);
  ctx.setLineDash([]);
}

function drawStation() {
  const p = worldToScreen(world.station.x, world.station.y);
  if (p.x < -140 || p.x > innerWidth + 140 || p.y < -140 || p.y > innerHeight + 140) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(performance.now() * .00008);
  ctx.strokeStyle = "rgba(57,221,255,.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 1.55);
  ctx.stroke();
  ctx.rotate(-performance.now() * .0002);
  ctx.strokeStyle = "rgba(169,128,255,.24)";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 1.35);
  ctx.stroke();
  ctx.fillStyle = "#12243b";
  ctx.beginPath();
  ctx.moveTo(0, -37); ctx.lineTo(28, 25); ctx.lineTo(0, 41); ctx.lineTo(-28, 25); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#6ce9ff";
  ctx.beginPath(); ctx.arc(0, 4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "rgba(213,235,255,.76)";
  ctx.font = "10px Microsoft YaHei";
  ctx.textAlign = "center";
  ctx.fillText(SYSTEMS[state.currentSystem].station, p.x, p.y + 105);
}

function drawPlayer() {
  const p = worldToScreen(player.x, player.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(player.angle + Math.PI / 2);
  if (keys.shift && player.boostEnergy > 0) {
    const flame = ctx.createLinearGradient(0, 15, 0, 45);
    flame.addColorStop(0, "#d9fbff"); flame.addColorStop(.4, "#39ddff"); flame.addColorStop(1, "transparent");
    ctx.fillStyle = flame;
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 48 + Math.random() * 10); ctx.lineTo(6, 14); ctx.fill();
  }
  ctx.shadowColor = "#39ddff"; ctx.shadowBlur = 18;
  ctx.fillStyle = "#c6f5ff";
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(14, 17); ctx.lineTo(0, 11); ctx.lineTo(-14, 17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#1b3b5a";
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(6, 10); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  if (state.shield > 0) {
    const ratio = state.shield / shipStats().maxShield;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(performance.now() * .00018);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `rgba(57,221,255,${.12 + ratio * .18})`;
    ctx.beginPath(); ctx.arc(0, 0, 28, -.5, Math.PI * 1.42); ctx.stroke();
    ctx.rotate(-performance.now() * .00036);
    ctx.strokeStyle = `rgba(147,239,255,${.08 + ratio * .12})`;
    ctx.beginPath(); ctx.arc(0, 0, 33, 1.2, Math.PI * 2.15); ctx.stroke();
    ctx.setLineDash([]);
    if (shieldImpact > 0) {
      ctx.rotate(shieldHitAngle - player.angle);
      const impactGradient = ctx.createRadialGradient(25, 0, 0, 25, 0, 18);
      impactGradient.addColorStop(0, `rgba(220,252,255,${shieldImpact})`);
      impactGradient.addColorStop(.35, `rgba(57,221,255,${shieldImpact * .8})`);
      impactGradient.addColorStop(1, "rgba(57,221,255,0)");
      ctx.fillStyle = impactGradient;
      ctx.beginPath(); ctx.arc(27, 0, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(215,252,255,${shieldImpact})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 31, -.34, .34); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawMiningBeam() {
  if (!mining.active) return;
  const asteroid = world.asteroids.find(item => item.id === mining.targetId);
  if (!asteroid) return;
  const start = worldToScreen(player.x, player.y);
  const end = worldToScreen(asteroid.x, asteroid.y);
  const pulse = .55 + Math.sin(performance.now() * .015) * .25;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(169,128,255,${pulse * .25})`;
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.strokeStyle = `rgba(105,230,255,${.7 + pulse * .25})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.lineDashOffset = -performance.now() * .04;
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(225,252,255,${.7 + pulse * .25})`;
  ctx.beginPath(); ctx.arc(end.x, end.y, 4 + pulse * 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawAIPilot(pilot) {
  const p = worldToScreen(pilot.x, pilot.y);
  if (p.x < -80 || p.x > innerWidth + 80 || p.y < -80 || p.y > innerHeight + 80) return;
  const role = AI_ROLES[pilot.role];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(pilot.angle + Math.PI / 2);
  ctx.fillStyle = role.color;
  ctx.globalAlpha = .78;
  ctx.beginPath();
  ctx.moveTo(0, -13); ctx.lineTo(8, 9); ctx.lineTo(0, 6); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = .22;
  ctx.strokeStyle = role.color;
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = .8;
  ctx.textAlign = "center";
  ctx.font = "7px Microsoft YaHei";
  ctx.fillStyle = "#9cabc1";
  ctx.fillText(pilot.name, p.x, p.y + 24);
  ctx.fillStyle = role.color;
  ctx.fillText(role.name, p.x, p.y + 34);
  ctx.globalAlpha = 1;
}

function drawAsteroid(asteroid) {
  const p = worldToScreen(asteroid.x, asteroid.y);
  if (p.x < -80 || p.x > innerWidth + 80 || p.y < -80 || p.y > innerHeight + 80) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(asteroid.rotation);
  ctx.fillStyle = asteroid.resource === "crystal" ? "#392a5c" : "#263645";
  ctx.strokeStyle = asteroid.color;
  ctx.globalAlpha = .92;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const angle = i / 9 * Math.PI * 2;
    const r = asteroid.r * (.72 + ((i * 17) % 5) / 16);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (asteroid.resource === "crystal") {
    ctx.strokeStyle = "#a980ff";
    ctx.beginPath(); ctx.moveTo(-10, 18); ctx.lineTo(3, -22); ctx.lineTo(13, 12); ctx.stroke();
  }
  ctx.restore();
}

function drawPirateOutpost() {
  const outpost = world.outpost;
  if (!outpost?.active) return;
  const p = worldToScreen(outpost.x, outpost.y);
  if (p.x < -130 || p.x > innerWidth + 130 || p.y < -130 || p.y > innerHeight + 130) return;
  const rotation = performance.now() * .00016;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rotation);
  ctx.strokeStyle = outpost.shield > 0 ? "rgba(169,128,255,.58)" : "rgba(255,97,123,.36)";
  ctx.lineWidth = outpost.shield > 0 ? 5 : 2;
  ctx.setLineDash([13, 8]);
  ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.rotate(-rotation * 1.8);
  ctx.fillStyle = "#371526";
  for (let i = 0; i < 5; i++) {
    ctx.rotate(Math.PI * 2 / 5);
    ctx.beginPath(); ctx.moveTo(-13, -12); ctx.lineTo(0, -70); ctx.lineTo(13, -12); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = "#6b233b";
  ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = outpost.shield > 0 ? "#c39cff" : "#ff617b";
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  const ratio = outpost.shield > 0 ? outpost.shield / outpost.maxShield : outpost.hp / outpost.maxHp;
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(p.x - 50, p.y - 96, 100, 5);
  ctx.fillStyle = outpost.shield > 0 ? "#a980ff" : "#ff617b"; ctx.fillRect(p.x - 50, p.y - 96, 100 * ratio, 5);
  ctx.textAlign = "center"; ctx.fillStyle = "#ffb4c0"; ctx.font = "9px Microsoft YaHei";
  ctx.fillText(outpost.name, p.x, p.y + 101);
}

function drawEnemy(enemy) {
  const p = worldToScreen(enemy.x, enemy.y);
  if (p.x < -60 || p.x > innerWidth + 60 || p.y < -60 || p.y > innerHeight + 60) return;
  const spec = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.interceptor;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(enemy.angle + Math.PI / 2);
  ctx.shadowColor = spec.color; ctx.shadowBlur = 12;
  ctx.fillStyle = spec.color;
  ctx.globalAlpha = .68;
  ctx.beginPath();
  if (enemy.type === "scout") {
    ctx.moveTo(0, -enemy.r); ctx.lineTo(enemy.r, 0); ctx.lineTo(0, enemy.r); ctx.lineTo(-enemy.r, 0);
  } else if (enemy.type === "missile") {
    ctx.moveTo(0, -enemy.r * 1.25); ctx.lineTo(enemy.r * 1.15, enemy.r * .65); ctx.lineTo(0, enemy.r * .25); ctx.lineTo(-enemy.r * 1.15, enemy.r * .65);
  } else if (enemy.type === "gunship") {
    ctx.moveTo(0, -enemy.r); ctx.lineTo(enemy.r, -enemy.r * .25); ctx.lineTo(enemy.r * .72, enemy.r); ctx.lineTo(-enemy.r * .72, enemy.r); ctx.lineTo(-enemy.r, -enemy.r * .25);
  } else {
    ctx.moveTo(0, -enemy.r * 1.2); ctx.lineTo(enemy.r, enemy.r); ctx.lineTo(0, enemy.r * .55); ctx.lineTo(-enemy.r, enemy.r);
  }
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffd2d9"; ctx.fillRect(-2, -5, 4, 10);
  ctx.shadowBlur = 0; ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(p.x - 22, p.y - enemy.r - 13, 44, 3);
  ctx.fillStyle = spec.color; ctx.fillRect(p.x - 22, p.y - enemy.r - 13, 44 * enemy.hp / enemy.maxHp, 3);
  if (enemy.state !== "patrol") {
    ctx.textAlign = "center"; ctx.font = "7px Microsoft YaHei"; ctx.fillStyle = spec.color;
    ctx.fillText(enemy.state === "attack" ? "攻击" : enemy.state === "retreat" ? "撤退" : "锁定", p.x, p.y + enemy.r + 14);
  }
}

function drawBullet(bullet, color) {
  const p = worldToScreen(bullet.x, bullet.y);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(p.x, p.y, bullet.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawLoot(loot) {
  const p = worldToScreen(loot.x, loot.y);
  const pulse = 1 + Math.sin(loot.pulse * 4) * .15;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(pulse, pulse);
  ctx.strokeStyle = GOODS[loot.item].color; ctx.fillStyle = `${GOODS[loot.item].color}22`;
  ctx.beginPath(); ctx.rect(-8, -8, 16, 16); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawParticle(particle) {
  const p = worldToScreen(particle.x, particle.y);
  ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
  ctx.fillStyle = particle.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, particle.size, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRadar() {
  const width = radar.width;
  const height = radar.height;
  rctx.clearRect(0, 0, width, height);
  rctx.strokeStyle = "rgba(88,140,170,.16)";
  rctx.beginPath(); rctx.arc(width / 2, height / 2, 35, 0, Math.PI * 2); rctx.stroke();
  rctx.beginPath(); rctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2); rctx.stroke();
  rctx.strokeStyle = "rgba(88,140,170,.09)";
  rctx.beginPath(); rctx.moveTo(width / 2, 8); rctx.lineTo(width / 2, height - 8); rctx.moveTo(8, height / 2); rctx.lineTo(width - 8, height / 2); rctx.stroke();
  const scale = 75 / 900;
  const dot = (x, y, color, size) => {
    const rx = width / 2 + (x - player.x) * scale;
    const ry = height / 2 + (y - player.y) * scale;
    if (rx < 5 || rx > width - 5 || ry < 5 || ry > height - 5) return;
    rctx.fillStyle = color; rctx.beginPath(); rctx.arc(rx, ry, size, 0, Math.PI * 2); rctx.fill();
  };
  dot(world.station.x, world.station.y, "#39ddff", 3);
  if (world.outpost?.active) dot(world.outpost.x, world.outpost.y, "#ff3159", 4);
  world.asteroids.forEach(a => dot(a.x, a.y, a.resource === "crystal" ? "#a980ff" : "#ffc45c", 1.5));
  world.enemies.forEach(e => dot(e.x, e.y, "#ff617b", e.tier === 2 ? 3 : 2));
  const localPilots = aiPilots.filter(pilot => pilot.system === state.currentSystem);
  localPilots.forEach(pilot => dot(pilot.x, pilot.y, AI_ROLES[pilot.role].color, 1.6));
  rctx.fillStyle = "#fff"; rctx.beginPath(); rctx.arc(width / 2, height / 2, 2.5, 0, Math.PI * 2); rctx.fill();
  $("#localCount").textContent = `${world.enemies.length + world.asteroids.length + localPilots.length} 信号`;
}

function updateTargetHud() {
  let target = null;
  let closest = Infinity;
  world.enemies.forEach(enemy => {
    const d = distance(player, enemy);
    if (d < closest && d < 980) { closest = d; target = enemy; }
  });
  if (world.outpost?.active) {
    const d = distance(player, world.outpost);
    if (d < closest && d < 1250) {
      closest = d;
      target = { ...world.outpost, type: "outpost", detection: 1200, lockRange: 900, weaponRange: 720, state: d < 720 ? "attack" : "detected" };
    }
  }
  if (!target || state.docked) {
    $("#targetPanel").classList.add("hidden");
    return;
  }
  $("#targetPanel").classList.remove("hidden");
  const isOutpost = target.type === "outpost";
  $("#targetType").textContent = isOutpost ? "敌对设施" : `敌对舰船 · ${target.state === "patrol" ? "巡逻" : "交战"}`;
  $("#targetName").textContent = target.name;
  const healthRatio = isOutpost && target.shield > 0 ? target.shield / target.maxShield : target.hp / target.maxHp;
  $("#targetHealthBar").style.width = `${healthRatio * 100}%`;
  $("#targetHealthBar").style.background = isOutpost && target.shield > 0 ? "#a980ff" : "#ff617b";
  $("#targetDistance").textContent = `${Math.round(closest)}m`;
  const stateText =
    closest <= target.weaponRange ? "武器射程内" :
    closest <= target.lockRange ? "已锁定" :
    closest <= target.detection ? "已侦测" : "未发现你";
  $("#targetState").textContent = stateText;
  $("#detectBand").classList.toggle("active", closest <= target.detection);
  $("#lockBand").classList.toggle("active", closest <= target.lockRange);
  $("#weaponBand").classList.toggle("active", closest <= target.weaponRange);
}

function gameLoop(time) {
  const dt = Math.min(.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  updateHud();
  requestAnimationFrame(gameLoop);
}

function setupEvents() {
  addEventListener("resize", resize);
  addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    keys[key] = true;
    if (key === "e" && !event.repeat) handleInteractionAction();
    if (key === "m" && !event.repeat && $("#helpPanel").classList.contains("hidden") && $("#deathPanel").classList.contains("hidden")) {
      if ($("#mapPanel").classList.contains("hidden")) openMap(); else closeMap();
    }
    if (key === "escape") {
      if (!$("#mapPanel").classList.contains("hidden")) closeMap();
      else if (!$("#helpPanel").classList.contains("hidden")) $("#helpPanel").classList.add("hidden");
    }
  });
  addEventListener("keyup", event => keys[event.key.toLowerCase()] = false);
  canvas.addEventListener("mousemove", event => { mouse.x = event.clientX; mouse.y = event.clientY; });
  canvas.addEventListener("mousedown", event => { if (event.button === 0) mouse.down = true; });
  addEventListener("mouseup", event => { if (event.button === 0) mouse.down = false; });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  addEventListener("pointerdown", event => {
    if (!event.target.closest("button")) return;
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 520);
  });

  $("#undockBtn").addEventListener("click", undock);
  $("#repairBtn").addEventListener("click", repairShip);
  $("#helpBtn").addEventListener("click", () => { $("#helpPanel").classList.remove("hidden"); paused = true; });
  $("#closeHelpBtn").addEventListener("click", () => { $("#helpPanel").classList.add("hidden"); paused = state.docked; });
  $("#startBtn").addEventListener("click", () => { $("#helpPanel").classList.add("hidden"); if (state.docked) openStation(); });
  $("#soundBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("#soundBtn").textContent = soundEnabled ? "♪" : "×";
    toast(soundEnabled ? "声音已开启" : "声音已关闭");
  });
  $("#aiCountSelect").addEventListener("change", event => {
    createAIPilots(Number(event.target.value));
    toast(`模拟玩家数量调整为 ${state.aiCount}`);
    saveGame();
  });
  $("#closeMapBtn").addEventListener("click", closeMap);
  $("#jumpBtn").addEventListener("click", () => selectedSystem && jumpTo(selectedSystem));
  $("#respawnBtn").addEventListener("click", () => {
    state.currentSystem = "aurora";
    state.docked = true;
    $("#deathPanel").classList.add("hidden");
    resetWorld();
    openStation();
    updateHud();
  });
  $("#cycleMissionBtn").addEventListener("click", () => {
    if (state.mission) {
      const nextIndex = (CONTRACT_LIBRARY.findIndex(item => item.id === state.mission.id) + 1) % CONTRACT_LIBRARY.length;
      acceptContract(CONTRACT_LIBRARY[nextIndex].id);
    } else acceptContract(CONTRACT_LIBRARY[0].id);
  });
  $$(".station-tabs button").forEach(button => button.addEventListener("click", () => {
    $$(".station-tabs button").forEach(item => item.classList.toggle("active", item === button));
    $$(".station-tab").forEach(tab => tab.classList.toggle("active", tab.id === `${button.dataset.stationTab}Tab`));
    renderStation();
  }));
  $$("[data-market-mode]").forEach(button => button.addEventListener("click", () => {
    marketMode = button.dataset.marketMode;
    $$("[data-market-mode]").forEach(item => item.classList.toggle("active", item === button));
    renderMarket();
  }));
  $("#marketSearch").addEventListener("input", event => {
    marketSearchText = event.target.value.trim();
    renderMarket();
  });
  $("#tradeQuantity").addEventListener("input", updateTradeTicket);
  $$(".quantity-presets button").forEach(button => button.addEventListener("click", () => {
    const available = marketMode === "buy"
      ? Math.floor(state.markets[state.currentSystem][selectedMarketItem].stock)
      : state.cargo[selectedMarketItem] || 0;
    $("#tradeQuantity").value = button.dataset.qty === "max" ? Math.max(1, available) : button.dataset.qty;
    updateTradeTicket();
  }));
  $("#executeTradeBtn").addEventListener("click", executeMarketTrade);
  addEventListener("beforeunload", saveGame);
}

function initializeMissionBaselines() {
  if (!state.mission) return;
  if (state.mission.id === "mine" && state.mission.startValue == null) state.mission.startValue = state.stats.mined;
  if (state.mission.id === "hunt" && state.mission.startValue == null) state.mission.startValue = state.stats.kills;
  if (state.mission.id === "trade" && state.mission.startValue == null) state.mission.startValue = state.stats.tradeRevenue;
}

function init() {
  initializeMarkets();
  createAIPilots(Number(state.aiCount) || 16);
  initializeMissionBaselines();
  const stats = shipStats();
  if (!Number.isFinite(state.shield)) state.shield = stats.maxShield;
  if (!Number.isFinite(state.hull)) state.hull = stats.maxHull;
  resize();
  setupEvents();
  resetWorld();
  updateHud();
  if (state.docked) openStation();
  if (!localStorage.getItem("stellarFrontierSeenHelp")) {
    $("#helpPanel").classList.remove("hidden");
    localStorage.setItem("stellarFrontierSeenHelp", "1");
  }
  addFeed("欢迎回来，飞行员。地区市场已同步。");
  requestAnimationFrame(gameLoop);
}

window.__game = {
  get state() { return state; },
  get world() { return world; },
  get player() { return player; },
  get aiPilots() { return aiPilots; },
  get mining() { return mining; },
  get pve() { return pve; },
  systems: SYSTEMS,
  goods: GOODS,
  undock,
  dock,
  jumpTo,
  buyItem,
  sellItem,
  spawnEnemy,
  spawnAsteroid,
  createAIPilots,
  runAIEconomicAction,
  damagePlayer,
  damageOutpost,
  destroyOutpost,
  spawnPirateOutpost,
  resetSave() { localStorage.removeItem(SAVE_KEY); location.reload(); },
  simulateMarkets
};

init();

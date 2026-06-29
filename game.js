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
  ammo: { name: "导弹弹药", icon: "➤", color: "#ff617b", base: 31, weight: 1, description: "前线持续消耗的军用品" },
  alloy: { name: "钛合金", icon: "▰", color: "#8edff2", base: 86, weight: 1, description: "插件外壳、炮架和基础舰体结构材料" },
  ceramic: { name: "纳米陶瓷", icon: "◧", color: "#e8f3ff", base: 122, weight: 1, description: "高强度装甲与隔热材料" },
  superconductor: { name: "超导纤维", icon: "∿", color: "#72f7d0", base: 165, weight: 1, description: "能源核心、激光武器和推进线路材料" },
  lens: { name: "量子透镜", icon: "◈", color: "#c8a7ff", base: 210, weight: 1, description: "激光聚焦、扫描阵列和相位校准组件" },
  capacitor: { name: "等离子电容", icon: "▣", color: "#7df4ff", base: 185, weight: 1, description: "护盾、跃迁与高能插件的储能组件" },
  guidance: { name: "制导芯片", icon: "⌁", color: "#ffd36d", base: 148, weight: 1, description: "导弹、无人机和火控插件的计算核心" }
};

const MARKET_ITEM_IMAGES = Object.fromEntries(
  Object.keys(GOODS).map(key => [key, `assets/market/${key}.webp`])
);

const SYSTEMS = {
  aurora: {
    name: "曙光星系", station: "晨星贸易站", trait: "核心区综合贸易枢纽", security: 1, securityText: "安全区 1.0",
    color: "#51e7a6", map: [18, 50], links: ["helios", "nyx"], risk: "极低",
    description: "新飞行员的起点。市场流动性高，但本地资源收益有限。",
    modifiers: { ore: 1.18, crystal: 1.42, salvage: 1.15, fuel: .92, ammo: 1.03, alloy: 1.08, ceramic: 1.22, superconductor: 1.36, lens: 1.44, capacitor: 1.28, guidance: 1.18 },
    stock: { ore: 130, crystal: 35, salvage: 55, fuel: 180, ammo: 150, alloy: 64, ceramic: 28, superconductor: 18, lens: 14, capacitor: 22, guidance: 34 }
  },
  helios: {
    name: "赫利俄斯工业区", station: "铸日空间站", trait: "舰船制造与矿石精炼中心", security: .7, securityText: "管制区 0.7",
    color: "#39ddff", map: [43, 25], links: ["aurora", "nyx", "vanta"], risk: "低",
    description: "工业设施密集，矿石需求旺盛，舰船补给价格较低。",
    modifiers: { ore: 1.38, crystal: 1.2, salvage: 1.08, fuel: .95, ammo: .87, alloy: .86, ceramic: .92, superconductor: 1.12, lens: 1.18, capacitor: .98, guidance: .9 },
    stock: { ore: 70, crystal: 50, salvage: 70, fuel: 145, ammo: 230, alloy: 180, ceramic: 90, superconductor: 44, lens: 32, capacitor: 70, guidance: 95 }
  },
  nyx: {
    name: "倪克斯边境", station: "夜幕前哨", trait: "矿业殖民地与护航集散地", security: .4, securityText: "边境区 0.4",
    color: "#ffc45c", map: [46, 76], links: ["aurora", "helios", "vanta"], risk: "中等",
    description: "富含相位晶体，海盗活动频繁，运输与护航利润可观。",
    modifiers: { ore: .72, crystal: .61, salvage: .9, fuel: 1.22, ammo: 1.35, alloy: 1.02, ceramic: 1.04, superconductor: .88, lens: .78, capacitor: 1.08, guidance: 1.2 },
    stock: { ore: 260, crystal: 190, salvage: 95, fuel: 80, ammo: 65, alloy: 86, ceramic: 55, superconductor: 82, lens: 64, capacitor: 48, guidance: 38 }
  },
  vanta: {
    name: "万塔深空", station: "黑潮自由港", trait: "无法区黑市与战争前线", security: 0, securityText: "无法区 0.0",
    color: "#ff617b", map: [75, 48], links: ["helios", "nyx"], risk: "极高",
    description: "顶级资源与最高战损并存。保险赔付降低，海盗舰队密集。",
    modifiers: { ore: .83, crystal: .78, salvage: 1.52, fuel: 1.58, ammo: 1.85, alloy: 1.22, ceramic: 1.38, superconductor: .82, lens: .92, capacitor: 1.32, guidance: 1.46 },
    stock: { ore: 190, crystal: 120, salvage: 40, fuel: 40, ammo: 24, alloy: 44, ceramic: 34, superconductor: 58, lens: 28, capacitor: 24, guidance: 20 }
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

const SHIP_HULLS = {
  pioneer: {
    name: "拓荒者级", en: "Pioneer", role: "多用途护卫舰", roleEn: "Multipurpose Frigate",
    description: "均衡、可靠的边境起步舰，适合学习采矿、贸易和基础战斗。",
    descriptionEn: "A balanced frontier starter hull for mining, trading and basic combat.",
    color: "#53e8ff", accent: "#d9fbff", cost: 0, inputs: {},
    stats: { maxShield: 100, maxHull: 100, damage: 12, cargo: 30, speed: 240, miningRate: 1, shieldRegen: 5, boostRecovery: 18, maxCapacitor: 100, fuel: 8, radius: 17 },
    visual: { model: "pioneer", engines: [-9, 9], scale: 1 }
  },
  courier: {
    name: "信使级", en: "Courier", role: "高速运输舰", roleEn: "Fast Hauler",
    description: "细长舰体与三联推进器带来高航速和大货舱，但正面防御较弱。",
    descriptionEn: "A slender triple-engine hauler with high speed and cargo capacity but lighter defenses.",
    color: "#51e7a6", accent: "#dfffea", cost: 6200, inputs: { alloy: 6, superconductor: 2, capacitor: 1 },
    stats: { maxShield: 82, maxHull: 78, damage: 10, cargo: 62, speed: 315, miningRate: .8, shieldRegen: 4.2, boostRecovery: 26, maxCapacitor: 105, fuel: 10, radius: 15 },
    visual: { model: "courier", engines: [-11, 0, 11], scale: .94 }
  },
  prospector: {
    name: "开拓者级", en: "Prospector", role: "工业采矿舰", roleEn: "Industrial Miner",
    description: "宽体双臂工业舰，拥有高采矿效率、货舱和装甲，机动性较低。",
    descriptionEn: "A broad industrial hull with strong mining yield, cargo and armor at the cost of agility.",
    color: "#ffc45c", accent: "#fff0c4", cost: 8500, inputs: { alloy: 10, ceramic: 4, lens: 2 },
    stats: { maxShield: 108, maxHull: 138, damage: 11, cargo: 76, speed: 188, miningRate: 1.7, shieldRegen: 5.4, boostRecovery: 14, maxCapacitor: 115, fuel: 7, radius: 22 },
    visual: { model: "prospector", engines: [-16, 16], scale: 1.08 }
  },
  vanguard: {
    name: "堡垒级", en: "Vanguard", role: "重型战斗舰", roleEn: "Heavy Gunship",
    description: "厚重楔形装甲与四联引擎构成正面火力平台，代价是货舱和巡航速度。",
    descriptionEn: "A heavy wedge-shaped gunship with four engines and strong frontal durability.",
    color: "#ff617b", accent: "#ffd8df", cost: 12000, inputs: { alloy: 14, ceramic: 6, guidance: 4, capacitor: 2 },
    stats: { maxShield: 155, maxHull: 168, damage: 15, cargo: 24, speed: 202, miningRate: .72, shieldRegen: 7, boostRecovery: 16, maxCapacitor: 125, fuel: 8, radius: 24 },
    visual: { model: "vanguard", engines: [-18, -6, 6, 18], scale: 1.12 }
  }
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
CONTRACT_LIBRARY.push(
  { id: "recon_nyx", type: "探索", title: "边境航线侦察", description: "前往夜幕前哨完成一次停靠扫描，解锁当地风险报告。", destination: "nyx", visit: true, amount: 1, reward: 1700 },
  { id: "outpost", type: "突袭", title: "海盗据点清除", description: "摧毁任意海盗据点，降低地区威胁并回收战利品。", metric: "outposts", amount: 1, reward: 4200 },
  { id: "intel", type: "情报", title: "黑匣子数据回收", description: "通过战斗或据点残骸取得海盗情报数据。", metric: "intel", amount: 3, reward: 2400 }
);

const TUTORIAL_STEPS = [
  { id: "station_briefing", title: "读取星港中枢", hint: "先确认你停靠在空间站。星港只是入口，市场、仓库、合约和情报都在不同模块里。", target: 1, reward: 0, track: "执照登记" },
  { id: "open_market", title: "进入市场交易所", hint: "打开市场。注意：这里显示价格、库存和买卖盘，不会替你计算路线利润。", target: 1, reward: 0, track: "市场观察" },
  { id: "undock", title: "离站出航", hint: "点击右上角“离站”，进入星系空间。货物、风险和距离会从这里开始变得真实。", target: 1, reward: 0, track: "飞行许可" },
  { id: "mine_ore", title: "采集 3 单位资源", hint: "靠近矿石按住 E。采集到的矿石会进入飞船货舱，它是真实货物，不是抽象分数。", target: 3, reward: 0, track: "资源采集" },
  { id: "dock_again", title: "返回空间站", hint: "飞回空间站附近按 E 停靠。只有抵达空间站，才能使用当地市场、仓库与制造。", target: 1, reward: 0, track: "停靠流程" },
  { id: "sell_cargo", title: "卖出任意货物", hint: "打开市场并切换到出售。出售会增加当地市场库存，价格变化由供需自然产生。", target: 1, reward: 0, track: "本地交易" },
  { id: "view_regional_quotes", title: "查看全星系行情", hint: "在市场下拉菜单切换到其他空间站，只看报价。真正买便宜货，仍需要亲自飞过去。", target: 1, reward: 0, track: "行情判断" },
  { id: "open_hangar", title: "检查独立仓库", hint: "进入仓库货舱。每个空间站仓库独立，存货不会自动跨站传送。", target: 1, reward: 0, track: "资产归属" },
  { id: "open_contracts", title: "查看自由合约", hint: "进入合约中心。主线只给方向，跑商、采矿、战斗和探索路线由你自己选择。", target: 1, reward: 1200, track: "自由职业" }
];

const STORY_CHAPTERS = [
  {
    id: "license",
    title: "第一章：边境飞行员执照",
    summary: "完成一次真实的新人循环：停靠、出航采集、把货物运回本地市场出售，再学会查看远程行情。剧情只解释世界规则，不操控市场价格。",
    checks: ["dockedOnce", "firstMining", "firstSale", "regionalQuote"]
  },
  {
    id: "contractor",
    title: "第二章：独立承包人",
    summary: "开始从公开合约里选择自己的职业方向。合约给奖励，但商品价格仍由真实供需决定。",
    checks: ["contractReputation", "shipUpgrade", "systemVisited"]
  },
  {
    id: "frontier",
    title: "第三章：边境档案",
    summary: "进入更高风险区域，收集情报、清理威胁或建立运输路线。主线只记录你的成长轨迹。",
    checks: ["combatRecord", "intelRecord", "outpostRecord"]
  }
];

const CAREER_PATHS = {
  explorer: {
    name: "深空探索者", en: "Deep-space Explorer", icon: "✦", color: "#a980ff",
    description: "通过跃迁、实地访问和情报回收建立自己的边境航图。",
    descriptionEn: "Build your frontier chart through jumps, physical visits and recovered intel.",
    goals: [
      { metric: "jumps", label: "完成星系跃迁", en: "Complete system jumps", target: 3 },
      { metric: "visited", label: "访问不同星系", en: "Visit different systems", target: 3 },
      { metric: "intel", label: "回收海盗情报", en: "Recover pirate intel", target: 2 }
    ]
  },
  industrialist: {
    name: "星港工业家", en: "Station Industrialist", icon: "◆", color: "#39ddff",
    description: "采集、加工并制造真正进入本地库存的材料和插件。",
    descriptionEn: "Gather, process and manufacture materials and plugins that physically enter local inventory.",
    goals: [
      { metric: "mined", label: "采集资源", en: "Mine resources", target: 20 },
      { metric: "crafted", label: "完成材料制作", en: "Complete material jobs", target: 3 },
      { metric: "pluginsCrafted", label: "制造舰船插件", en: "Manufacture ship plugins", target: 2 }
    ]
  },
  trader: {
    name: "独立贸易商", en: "Independent Trader", icon: "◇", color: "#51e7a6",
    description: "观察本地供需、建立订单并亲自运输货物，不提供路线利润答案。",
    descriptionEn: "Read local supply, place orders and haul goods yourself without a route-profit answer.",
    goals: [
      { metric: "tradeRevenue", label: "累计销售收入", en: "Accumulate sales revenue", target: 5000, suffix: " ISK" },
      { metric: "ordersCreated", label: "创建限价卖单", en: "Create limit sell orders", target: 2 },
      { metric: "remoteQuotes", label: "查看异地行情", en: "Inspect remote quotes", target: 1 }
    ]
  },
  enforcer: {
    name: "边境执法者", en: "Frontier Enforcer", icon: "➤", color: "#ff617b",
    description: "清理敌对舰船与海盗据点，承担高风险区域的战斗工作。",
    descriptionEn: "Clear hostile ships and pirate outposts across high-risk systems.",
    goals: [
      { metric: "kills", label: "击毁敌对舰船", en: "Destroy hostile ships", target: 5 },
      { metric: "outposts", label: "摧毁海盗据点", en: "Destroy pirate outposts", target: 1 },
      { metric: "reputation", label: "完成公开合约", en: "Complete public contracts", target: 2 }
    ]
  }
};

const CRAFTING_RECIPES = [
  { id: "ammo_pack", name: "导弹弹药补给", description: "将矿物和残骸加工成前线消耗品。", inputs: { ore: 3, salvage: 1 }, output: { item: "ammo", amount: 6 } },
  { id: "jump_fuel", name: "跃迁燃料精炼", description: "压缩晶体能量，制造可装填燃料。", inputs: { ore: 2, crystal: 1 }, output: { item: "fuel", amount: 4 } },
  { id: "phase_crystal", name: "相位晶体筛选", description: "从高纯矿物中筛选少量相位晶体。", inputs: { ore: 8, fuel: 1 }, output: { item: "crystal", amount: 1 } },
  { id: "titanium_alloy", name: "钛合金铸造", description: "把矿石和残骸熔炼为舰船插件外壳。", inputs: { ore: 5, salvage: 1 }, output: { item: "alloy", amount: 3 } },
  { id: "nano_ceramic", name: "纳米陶瓷烧结", description: "制造耐热装甲和防御插件材料。", inputs: { ore: 4, crystal: 1 }, output: { item: "ceramic", amount: 2 } },
  { id: "super_fiber", name: "超导纤维拉制", description: "将相位晶体和燃料棒加工为高效能源线路。", inputs: { crystal: 2, fuel: 2 }, output: { item: "superconductor", amount: 1 } },
  { id: "quantum_lens", name: "量子透镜校准", description: "用于激光、扫描和电子战模块的精密部件。", inputs: { crystal: 3, salvage: 1 }, output: { item: "lens", amount: 1 } },
  { id: "plasma_capacitor", name: "等离子电容封装", description: "为护盾和高能插件提供短时能量缓存。", inputs: { fuel: 3, crystal: 1, alloy: 1 }, output: { item: "capacitor", amount: 1 } },
  { id: "guidance_chip", name: "制导芯片蚀刻", description: "制造导弹、火控和无人机控制所需芯片。", inputs: { salvage: 3, crystal: 1 }, output: { item: "guidance", amount: 1 } }
];

const STATION_INDUSTRY = {
  aurora: { name: "标准化装配", en: "Standard Assembly", bonuses: {} },
  helios: { name: "重工业产线", en: "Heavy Industry Line", bonuses: { alloy: 1, ceramic: 1, capacitor: 1 } },
  nyx: { name: "边境精炼阵列", en: "Frontier Refinery", bonuses: { crystal: 1, superconductor: 1, lens: 1 } },
  vanta: { name: "战地军需工坊", en: "Field Arsenal", bonuses: { ammo: 2, guidance: 1 } }
};

const SHIP_SLOTS = {
  weapon: { name: "武器槽", en: "Weapon", icon: "◇" },
  defense: { name: "防御槽", en: "Defense", icon: "⬡" },
  engineering: { name: "工程槽", en: "Engineering", icon: "◉" },
  industrial: { name: "工业槽", en: "Industrial", icon: "▤" },
  electronic: { name: "电子槽", en: "Electronic", icon: "⌁" }
};

const PLUGINS = {
  railgun: {
    name: "轻型磁轨炮", en: "Light Railgun", slot: "weapon", icon: "━", color: "#8edff2", rarity: "T1",
    description: "高速动能炮，擅长击穿装甲，对护盾效率较低。",
    inputs: { alloy: 3, guidance: 1, salvage: 2 },
    stats: { weaponKind: "railgun", damageType: "kinetic", damageMult: 1.25, fireRateMult: .92, projectileSpeed: 900, bulletLife: 1.05, projectileRadius: 3.2, spread: .012, heat: .56, weaponHeat: 9, capacitorCost: 3, weaponColor: "#8edff2", weaponLabel: "磁轨炮" }
  },
  pulse_laser: {
    name: "脉冲激光器", en: "Pulse Laser", slot: "weapon", icon: "✦", color: "#a4f3ff", rarity: "T1",
    description: "高精度热能武器，快速瓦解护盾，不消耗弹药但发热更高。",
    inputs: { lens: 1, superconductor: 2, capacitor: 1 },
    stats: { weaponKind: "laser", damageType: "thermal", damageMult: 1.08, fireRateMult: .72, projectileSpeed: 1080, bulletLife: .78, projectileRadius: 2.4, spread: .004, heat: .78, weaponHeat: 13, capacitorCost: 10, weaponColor: "#a4f3ff", weaponLabel: "脉冲激光" }
  },
  missile_pod: {
    name: "轻型导弹仓", en: "Light Missile Pod", slot: "weapon", icon: "➤", color: "#ff617b", rarity: "T1",
    description: "远程爆炸武器，造成范围伤害，每次发射消耗 1 单位导弹弹药。",
    inputs: { alloy: 2, guidance: 3, ammo: 8 },
    stats: { weaponKind: "missile", damageType: "explosive", damageMult: 1.95, fireRateMult: 2.15, projectileSpeed: 520, bulletLife: 2.25, projectileRadius: 5.5, splashRadius: 92, spread: .02, heat: .68, weaponHeat: 7, capacitorCost: 2, ammoItem: "ammo", ammoCost: 1, weaponColor: "#ff617b", weaponLabel: "轻型导弹" }
  },
  shield_amp: {
    name: "小型护盾增幅器", en: "Small Shield Amplifier", slot: "defense", icon: "⬡", color: "#53e8ff", rarity: "T1",
    description: "提升护盾容量与护盾再生，适合护航和低风险跑商。",
    inputs: { capacitor: 2, ceramic: 1, alloy: 2 },
    stats: { shieldBonus: 45, shieldRegenBonus: 2.2 }
  },
  armor_plate: {
    name: "复合装甲板", en: "Composite Armor Plate", slot: "defense", icon: "▰", color: "#e8f3ff", rarity: "T1",
    description: "大幅提高装甲，但会略微降低航速。",
    inputs: { ceramic: 3, alloy: 3, salvage: 2 },
    stats: { hullBonus: 70, speedMult: .95 }
  },
  vector_thruster: {
    name: "矢量推进插件", en: "Vector Thruster", slot: "engineering", icon: "↗", color: "#51e7a6", rarity: "T1",
    description: "提升巡航速度与推进能量恢复，适合跑商和脱战。",
    inputs: { superconductor: 2, fuel: 5, capacitor: 1 },
    stats: { speedMult: 1.16, boostRecoveryBonus: 6 }
  },
  cargo_rack: {
    name: "折叠货架舱", en: "Folded Cargo Rack", slot: "industrial", icon: "▤", color: "#ffc45c", rarity: "T1",
    description: "增加货舱容量，但略微增加船体负载。",
    inputs: { alloy: 4, ceramic: 1, ore: 6 },
    stats: { cargoBonus: 24, speedMult: .97 }
  },
  mining_array: {
    name: "采矿增效阵列", en: "Mining Booster Array", slot: "industrial", icon: "◆", color: "#39ddff", rarity: "T1",
    description: "提升采矿速度，并稍微提高稀有材料筛出概率。",
    inputs: { lens: 1, alloy: 2, superconductor: 1 },
    stats: { miningBonus: .55, rareBonus: .035 }
  },
  radar_array: {
    name: "雷达锁定阵列", en: "Radar Lock Array", slot: "electronic", icon: "⌁", color: "#c8a7ff", rarity: "T1",
    description: "提高武器有效飞行时间与锁定辅助，适合远程交战。",
    inputs: { guidance: 2, lens: 1, capacitor: 1 },
    stats: { bulletLifeBonus: .25, spreadMult: .72 }
  }
};

const DAMAGE_TYPES = {
  plasma: { name: "等离子", en: "Plasma", color: "#39ddff", shield: 1, hull: 1, advice: "均衡伤害" },
  kinetic: { name: "动能", en: "Kinetic", color: "#8edff2", shield: .78, hull: 1.32, advice: "装甲克制" },
  thermal: { name: "热能", en: "Thermal", color: "#a4f3ff", shield: 1.38, hull: .76, advice: "护盾克制" },
  explosive: { name: "爆炸", en: "Explosive", color: "#ff617b", shield: .94, hull: 1.12, advice: "范围打击" }
};

const AI_ROLES = {
  miner: { name: "矿工", color: "#ffc45c" },
  trader: { name: "商人", color: "#51e7a6" },
  explorer: { name: "探索者", color: "#a980ff" },
  mercenary: { name: "雇佣兵", color: "#ff617b" }
};

const ENEMY_TYPES = {
  scout: {
    name: "海盗侦察无人机", color: "#ffb45d", hp: 42, radius: 14, speed: 165,
    shieldRatio: .18, shieldResist: { thermal: .05 }, hullResist: { kinetic: .04 },
    detection: 720, lock: 500, weapon: 220, optimal: 175, damage: 6, damageType: "thermal", bulletColor: "#ffb45d", fireRate: 1.05, bulletSpeed: 430,
    bounty: 55, salvage: [1, 2], cost: 8
  },
  interceptor: {
    name: "掠夺者截击舰", color: "#ff617b", hp: 68, radius: 18, speed: 178,
    shieldRatio: .42, shieldResist: { thermal: .12, explosive: .06 }, hullResist: { kinetic: .08 },
    detection: 650, lock: 470, weapon: 285, optimal: 225, damage: 10, damageType: "kinetic", bulletColor: "#ff617b", fireRate: 1.35, bulletSpeed: 410,
    bounty: 95, salvage: [1, 3], cost: 14
  },
  missile: {
    name: "秃鹫级导弹舰", color: "#c46dff", hp: 82, radius: 21, speed: 108,
    shieldRatio: .62, shieldResist: { thermal: .2, explosive: .08 }, hullResist: { kinetic: .04 },
    detection: 920, lock: 700, weapon: 590, optimal: 500, damage: 15, damageType: "explosive", bulletColor: "#c46dff", fireRate: 2.15, bulletSpeed: 285,
    bounty: 135, salvage: [2, 4], cost: 20
  },
  gunship: {
    name: "海盗重型炮舰", color: "#ff445f", hp: 148, radius: 27, speed: 82,
    shieldRatio: .28, shieldResist: { thermal: .08 }, hullResist: { kinetic: .18, explosive: .12 },
    detection: 620, lock: 490, weapon: 370, optimal: 305, damage: 21, damageType: "kinetic", bulletColor: "#ff445f", fireRate: 1.55, bulletSpeed: 350,
    bounty: 185, salvage: [3, 6], cost: 28
  }
};

const SAVE_KEY = "stellarFrontierSaveV1";
const UI_SIZE_KEY = "stellarFrontierUiSize";
const SETTINGS_KEY = "stellarFrontierSettingsV2";
const UI_SIZES = ["standard", "large", "xlarge"];
const UI_SIZE_LABELS = { standard: "标准", large: "大号", xlarge: "特大" };
const DEFAULT_SETTINGS = {
  uiSize: "large",
  font: "sans",
  quality: "high",
  depthFx: "standard",
  language: "zh",
  masterVolume: 65,
  musicEnabled: true,
  musicVolume: 45,
  sfxEnabled: true,
  sfxVolume: 70
};
const EN_LABELS = {
  goods: {
    ore: ["Titan Ore", "Basic hull and industrial component material"],
    crystal: ["Phase Crystal", "Rare energy material from frontier systems"],
    salvage: ["Ship Salvage", "Recovered components from destroyed ships"],
    fuel: ["Jump Fuel", "Consumable required for system jumps"],
    ammo: ["Missile Ammunition", "Military supply consumed on the front line"],
    alloy: ["Titanium Alloy", "Hull frame and ship module casing material"],
    ceramic: ["Nano Ceramic", "Heat-resistant armor and defense material"],
    superconductor: ["Superconductive Fiber", "Energy line material for lasers and propulsion"],
    lens: ["Quantum Lens", "Precision optic for laser, scanner and phase calibration"],
    capacitor: ["Plasma Capacitor", "Power buffer for shields and high-energy modules"],
    guidance: ["Guidance Chip", "Control core for missiles, drones and fire-control modules"]
  },
  systems: {
    aurora: ["Aurora", "Morningstar Trade Station"],
    helios: ["Helios Industrial Zone", "Sunforge Station"],
    nyx: ["Nyx Frontier", "Nightfall Outpost"],
    vanta: ["Vanta Deep Space", "Blacktide Freeport"]
  }
};
const UI_TEXT = {
  zh: {
    settings: "游戏设置", done: "完成", online: "在线", account: "账户余额",
    shield: "护盾", hull: "装甲", fuel: "跃迁燃料", firepower: "火力", cargo: "货舱", speed: "速度",
    market: "地区市场", fitting: "舰船改装", contracts: "合约中心", intel: "区域情报",
    buy: "购买", sell: "出售", confirmBuy: "确认购买", confirmSell: "确认出售",
    marketNormal: "市场流动性正常", signals: "信号", ready: "就绪",
    threat: "区域威胁", flightLog: "航行日志", tacticalRadar: "战术雷达",
    hub: "星港中枢", hangar: "仓库货舱", map: "星图导航",
    stationCommand: "STATION COMMAND", welcomeDock: "欢迎回港，飞行员",
    dockBriefing: "对接臂已锁定，市场、维修、合约与航线情报均已同步。",
    securityLevel: "安全等级", tradeTax: "交易税率", localThreat: "周边威胁", localTraffic: "本地交通"
  },
  en: {
    settings: "Game Settings", done: "Done", online: "Online", account: "Account Balance",
    shield: "Shield", hull: "Hull", fuel: "Jump Fuel", firepower: "Damage", cargo: "Cargo", speed: "Speed",
    market: "Regional Market", fitting: "Ship Fitting", contracts: "Contracts", intel: "Regional Intel",
    buy: "Buy", sell: "Sell", confirmBuy: "Confirm Purchase", confirmSell: "Confirm Sale",
    marketNormal: "Market liquidity is normal", signals: "Signals", ready: "Ready",
    threat: "Regional Threat", flightLog: "Flight Log", tacticalRadar: "Tactical Radar",
    hub: "Station Hub", hangar: "Hangar Hold", map: "Star Map",
    stationCommand: "STATION COMMAND", welcomeDock: "Welcome back, pilot",
    dockBriefing: "Docking arms are locked. Market, repairs, contracts and route intel are synchronized.",
    securityLevel: "Security", tradeTax: "Trade Tax", localThreat: "Threat", localTraffic: "Traffic"
  }
};
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
  capacitor: 100,
  activeWeapon: "pulse",
  fireMode: "balanced",
  activeShip: "pioneer",
  ownedShips: { pioneer: "active" },
  shipLoadouts: {},
  upgrades: { weapon: 0, shield: 0, cargo: 0, engine: 0, mining: 0, hull: 0 },
  stats: { kills: 0, mined: 0, tradeRevenue: 0, jumps: 0, deaths: 0, intel: 0, outposts: 0, crafted: 0, pluginsCrafted: 0, ordersCreated: 0 },
  mission: { ...CONTRACT_LIBRARY[0], progress: 0 },
  markets: {},
  reputation: 0,
  aiCount: 16,
  systemThreat: { aurora: 0, helios: 18, nyx: 42, vanta: 68 },
  discovered: ["aurora", "helios", "nyx"],
  visitedSystems: ["aurora"],
  playSeconds: 0,
  marketMemory: {},
  stationStorage: {},
  playerOrders: [],
  pluginInventory: {},
  fittedPlugins: { weapon: null, defense: null, engineering: null, industrial: null, electronic: null },
  story: { dockedOnce: true, viewedRemoteMarket: false },
  career: { tracked: "explorer" },
  tutorial: { active: true, completed: false, step: 0, baselines: {}, enteredStep: null }
});

let state = loadGame();
let settings = loadSettings();
let marketMode = "buy";
let selectedSystem = null;
let paused = true;
let lastTime = performance.now();
let saveTimer = 0;
let marketTimer = 0;
let enemySpawnTimer = 0;
let interactionLock = false;
let feed = [];
let aiPilots = [];
let aiTradeLog = [];
let aiEconomyTimer = 0;
let selectedMarketItem = "ore";
let selectedMarketSystem = null;
let marketSearchText = "";
let selectedHullPreview = null;
let marketChartHover = null;
let marketChartCache = null;
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
  fireCooldown: 0, boostEnergy: 100, shieldDelay: 0, invulnerable: 0,
  weaponHeat: 0, overheatLocked: false
};
const camera = { x: 0, y: 0 };
const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
const keys = {};
const world = {
  width: 2600, height: 1800, asteroids: [], enemies: [], bullets: [], enemyBullets: [], loot: [], particles: [], combatText: [],
  station: { x: 0, y: 0, radius: 88 }, outpost: null
};

const audioEngine = {
  context: null,
  master: null,
  music: null,
  sfx: null,
  musicNodes: [],
  musicTimer: null,
  started: false,
  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.music = this.context.createGain();
      this.sfx = this.context.createGain();
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") this.context.resume();
    this.started = true;
    this.applySettings();
    if (settings.musicEnabled) this.startMusic();
  },
  applySettings() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(settings.masterVolume / 100, now, .03);
    this.music.gain.setTargetAtTime(settings.musicEnabled ? settings.musicVolume / 100 * .22 : 0, now, .08);
    this.sfx.gain.setTargetAtTime(settings.sfxEnabled ? settings.sfxVolume / 100 * .42 : 0, now, .03);
    if (settings.musicEnabled && this.started) this.startMusic();
    else this.stopMusic();
  },
  tone(frequency, duration, options = {}) {
    if (!this.context || !settings.sfxEnabled) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.gain || .12, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.sfx);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  },
  noise(duration = .12, gainValue = .07) {
    if (!this.context || !settings.sfxEnabled) return;
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.value = gainValue;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.sfx);
    source.start();
  },
  play(name) {
    if (!this.started || !settings.sfxEnabled) return;
    if (name === "click") this.tone(520, .05, { gain: .035, type: "sine", endFrequency: 680 });
    else if (name === "shoot") this.tone(330, .08, { gain: .07, type: "square", endFrequency: 130 });
    else if (name === "hit") { this.tone(110, .13, { gain: .09, type: "sawtooth", endFrequency: 55 }); this.noise(.1, .04); }
    else if (name === "shield") this.tone(760, .2, { gain: .09, type: "sine", endFrequency: 260 });
    else if (name === "mine") this.tone(210, .18, { gain: .045, type: "triangle", endFrequency: 430 });
    else if (name === "trade") { this.tone(660, .08, { gain: .06 }); setTimeout(() => this.tone(880, .11, { gain: .05 }), 70); }
    else if (name === "jump") { this.tone(90, .65, { gain: .1, type: "sawtooth", endFrequency: 620 }); this.noise(.5, .035); }
    else if (name === "explosion") { this.tone(85, .45, { gain: .12, type: "sawtooth", endFrequency: 35 }); this.noise(.35, .1); }
    else if (name === "alert") { this.tone(440, .12, { gain: .08 }); setTimeout(() => this.tone(330, .16, { gain: .08 }), 140); }
  },
  startMusic() {
    if (!this.context || this.musicNodes.length || !settings.musicEnabled) return;
    const now = this.context.currentTime;
    [55, 82.41, 110].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 360 + index * 140;
      gain.gain.value = index === 0 ? .16 : .055;
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      oscillator.start(now);
      this.musicNodes.push(oscillator, gain, filter);
    });
    const notes = [220, 246.94, 293.66, 329.63, 369.99];
    this.musicTimer = setInterval(() => {
      if (!this.context || !settings.musicEnabled || document.hidden) return;
      const frequency = notes[Math.floor(Math.random() * notes.length)] / (Math.random() < .45 ? 2 : 1);
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const nowTime = this.context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, nowTime);
      gain.gain.exponentialRampToValueAtTime(.035, nowTime + .8);
      gain.gain.exponentialRampToValueAtTime(.0001, nowTime + 4.5);
      oscillator.connect(gain);
      gain.connect(this.music);
      oscillator.start(nowTime);
      oscillator.stop(nowTime + 4.7);
    }, 3600);
  },
  stopMusic() {
    this.musicNodes.forEach(node => {
      try { if (typeof node.stop === "function") node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    });
    this.musicNodes = [];
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
};

function initializeMarkets() {
  Object.entries(SYSTEMS).forEach(([id, system]) => {
    if (!state.markets[id]) state.markets[id] = {};
    Object.keys(GOODS).forEach(key => {
      if (!state.markets[id][key]) {
        state.markets[id][key] = {
          stock: system.stock[key] ?? 80,
          priceFactor: system.modifiers[key] ?? 1,
          history: [GOODS[key].base * (system.modifiers[key] ?? 1)]
        };
      } else {
        const market = state.markets[id][key];
        if (!Number.isFinite(market.stock)) market.stock = system.stock[key] ?? 80;
        if (!Number.isFinite(market.priceFactor)) market.priceFactor = system.modifiers[key] ?? 1;
        if (!Array.isArray(market.history) || !market.history.length) market.history = [GOODS[key].base * (market.priceFactor || 1)];
      }
    });
  });
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const base = defaultState();
    const tutorial = saved.tutorial
      ? { ...base.tutorial, ...saved.tutorial, baselines: { ...(saved.tutorial.baselines || {}) } }
      : (saved.playSeconds > 240 ? { ...base.tutorial, active: false, completed: true, step: TUTORIAL_STEPS.length } : base.tutorial);
    return {
      ...base, ...saved,
      upgrades: { ...base.upgrades, ...(saved.upgrades || {}) },
      stats: { ...base.stats, ...(saved.stats || {}) },
      activeShip: SHIP_HULLS[saved.activeShip] ? saved.activeShip : base.activeShip,
      ownedShips: { ...base.ownedShips, ...(saved.ownedShips || {}) },
      shipLoadouts: saved.shipLoadouts || {},
      systemThreat: { ...base.systemThreat, ...(saved.systemThreat || {}) },
      cargo: saved.cargo || {},
      markets: saved.markets || {},
      marketMemory: saved.marketMemory || {},
      stationStorage: saved.stationStorage || {},
      playerOrders: Array.isArray(saved.playerOrders) ? saved.playerOrders : [],
      pluginInventory: saved.pluginInventory || {},
      fittedPlugins: { ...base.fittedPlugins, ...(saved.fittedPlugins || {}) },
      visitedSystems: saved.visitedSystems || base.visitedSystems,
      story: { ...base.story, ...(saved.story || {}) },
      career: { ...base.career, ...(saved.career || {}) },
      tutorial
    };
  } catch {
    return defaultState();
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const legacySize = localStorage.getItem(UI_SIZE_KEY);
    return { ...DEFAULT_SETTINGS, ...stored, ...(legacySize && !stored.uiSize ? { uiSize: legacySize } : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyTextSize(size) {
  const resolved = UI_SIZES.includes(size) ? size : "large";
  settings.uiSize = resolved;
  document.body.dataset.uiSize = resolved;
  localStorage.setItem(UI_SIZE_KEY, resolved);
  saveSettings();
}

function localizedGood(key) {
  if (settings.language === "en" && EN_LABELS.goods[key]) {
    return { name: EN_LABELS.goods[key][0], description: EN_LABELS.goods[key][1] };
  }
  return GOODS[key];
}

function localizedSystem(key) {
  if (settings.language === "en" && EN_LABELS.systems[key]) {
    return { name: EN_LABELS.systems[key][0], station: EN_LABELS.systems[key][1] };
  }
  return SYSTEMS[key];
}

function applyLanguage() {
  const text = UI_TEXT[settings.language] || UI_TEXT.zh;
  document.documentElement.lang = settings.language === "en" ? "en" : "zh-CN";
  $(".wallet>span").textContent = text.account;
  const statusLabels = $$(".status-line>span");
  if (statusLabels[0]) statusLabels[0].textContent = text.shield;
  if (statusLabels[1]) statusLabels[1].textContent = text.hull;
  if (statusLabels[2]) statusLabels[2].textContent = text.fuel;
  const statLabels = $$(".ship-stats>span");
  if (statLabels[0]) statLabels[0].childNodes[0].textContent = `${text.firepower} `;
  if (statLabels[1]) statLabels[1].childNodes[0].textContent = `${text.cargo} `;
  if (statLabels[2]) statLabels[2].childNodes[0].textContent = `${text.speed} `;
  const tabs = $$(".station-tabs button");
  [text.hub, text.market, text.fitting, text.contracts, text.hangar, text.intel].forEach((label, index) => tabs[index] && (tabs[index].textContent = label));
  updateStationModeLabel($(".station-tabs button.active")?.dataset.stationTab || "hub");
  if ($("#hubKicker")) $("#hubKicker").textContent = text.stationCommand;
  if ($("#hubHeadline")) $("#hubHeadline").textContent = text.welcomeDock;
  if ($("#hubBriefing")) $("#hubBriefing").textContent = text.dockBriefing;
  if ($("#hubSecurityLabel")) $("#hubSecurityLabel").textContent = text.securityLevel;
  if ($("#hubTaxLabel")) $("#hubTaxLabel").textContent = text.tradeTax;
  if ($("#hubThreatLabel")) $("#hubThreatLabel").textContent = text.localThreat;
  if ($("#hubTrafficLabel")) $("#hubTrafficLabel").textContent = text.localTraffic;
  if ($("#hangarTitle")) $("#hangarTitle").textContent = text.hangar;
  if ($("#hangarUsageLabel")) $("#hangarUsageLabel").textContent = settings.language === "en" ? "Cargo Usage" : "货舱占用";
  if ($("#hangarValueLabel")) $("#hangarValueLabel").textContent = settings.language === "en" ? "Local Sell Estimate" : "本地卖出估值";
  if ($("#hangarNotice")) $("#hangarNotice").textContent = settings.language === "en"
    ? "Cargo travels with your ship. Regional prices move with inventory, AI trading and hostile activity."
    : "货物会随玩家移动，地区市场价格会根据库存、AI交易与敌对活动波动。";
  const modes = $$("[data-market-mode]");
  if (modes[0]) modes[0].textContent = text.buy;
  if (modes[1]) modes[1].textContent = text.sell;
  $(".radar-card .card-title strong").textContent = text.tacticalRadar;
  $(".threat-card .card-title strong").textContent = text.threat;
  $(".feed-card .card-title strong").textContent = text.flightLog;
  $("#settingsPanel h2").textContent = text.settings;
  $("#settingsDoneBtn").textContent = text.done;
  $("#settingsBtn").title = text.settings;
  $$("[data-open-settings]").forEach(button => button.textContent = text.settings);
  const settingCopy = settings.language === "en" ? [
    ["Interface Size", "Adjust the size of the HUD, market and help text."],
    ["Font Style", "Choose a readable or terminal-inspired typeface."],
    ["Graphics Quality", "Adjust particles, star density, glow and render resolution."],
    ["3D Visuals", "Control hangar perspective, panel depth, star parallax and ship lighting."],
    ["Language", "Switch the primary game interface language."],
    ["Master Volume", "Controls the overall game volume."],
    ["Background Music", "Procedurally generated deep-space ambience."],
    ["Sound Effects", "Weapons, shields, mining, trading, jumps and UI sounds."]
  ] : [
    ["界面字号", "调整HUD、市场和说明文字的大小。"],
    ["字体风格", "选择更适合阅读或更有科幻感的字体。"],
    ["画面质量", "调整粒子、星空密度、光晕效果和渲染分辨率。"],
    ["3D视觉效果", "控制机库透视、面板层次、星空视差和舰船模型光影。"],
    ["语言", "切换游戏核心界面语言。"],
    ["主音量", "控制游戏的整体音量。"],
    ["背景音乐", "程序化生成的太空氛围音乐。"],
    ["游戏音效", "武器、护盾、采矿、交易、跃迁和按钮音效。"]
  ];
  $$(".setting-row").forEach((row, index) => {
    if (!settingCopy[index]) return;
    row.querySelector(":scope > div:first-child strong").textContent = settingCopy[index][0];
    row.querySelector(":scope > div:first-child span").textContent = settingCopy[index][1];
  });
  const labels = settings.language === "en"
    ? { standard: "Standard", large: "Large", xlarge: "Extra Large", sans: "Clear", rounded: "Rounded", mono: "Terminal", low: "Performance", medium: "Balanced", high: "High", off: "Off", enhanced: "Enhanced" }
    : { standard: "标准", large: "大号", xlarge: "特大", sans: "清晰", rounded: "圆润", mono: "终端", low: "流畅", medium: "均衡", high: "精细", off: "关闭", enhanced: "增强" };
  Object.entries(labels).forEach(([value, label]) => {
    $$(`[data-ui-size-choice="${value}"],[data-font-choice="${value}"],[data-quality-choice="${value}"],[data-depth-choice="${value}"]`).forEach(button => {
      button.textContent = label;
    });
  });
  $(".settings-preview>span").textContent = settings.language === "en" ? "Preview" : "预览";
  $(".settings-preview>strong").textContent = settings.language === "en" ? "Regional market prices are fluctuating" : "区域市场价格出现波动";
  $(".settings-preview>p").textContent = settings.language === "en" ? "Pirate activity is reducing transport efficiency and raising local supply prices." : "海盗活动正在影响运输效率与当地补给价格。";
  $(".market-toolbar p").textContent = settings.language === "en" ? "Regional inventory · Physical transport required · AI pilots trade in real time" : "区域独立库存 · 实物必须运输 · AI玩家实时成交";
  $(".market-search input").placeholder = settings.language === "en" ? "Search market" : "搜索商品";
  $(".market-group-title").innerHTML = settings.language === "en" ? `Market Categories <b id="marketCategoryCount">${Object.keys(GOODS).length}</b>` : `市场分类 <b id="marketCategoryCount">${Object.keys(GOODS).length}</b>`;
  $(".price-chart-panel .terminal-section-head strong").textContent = settings.language === "en" ? "Price History" : "价格走势";
  $(".price-chart-panel .terminal-section-head span").textContent = settings.language === "en" ? "Last 24 cycles" : "最近24个周期";
  $(".order-book-panel .terminal-section-head strong").textContent = settings.language === "en" ? "Market Depth" : "市场深度";
  $(".order-book-panel .terminal-section-head span").textContent = settings.language === "en" ? "Quantity / Unit Price" : "数量 / 单价";
  $(".market-spread span").textContent = settings.language === "en" ? "Spread" : "价差";
  const sidebarHeads = $$(".market-sidebar .terminal-section-head strong");
  const sidebarLabels = settings.language === "en" ? ["My Position", "Pilot Transactions", "Regional Comparison"] : ["我的持仓", "玩家成交动态", "地区比较"];
  sidebarHeads.forEach((node, index) => node.textContent = sidebarLabels[index]);
  $(".ticket-total>span").textContent = settings.language === "en" ? "Estimated Total" : "预计总额";
  $$(".quantity-presets button").forEach(button => {
    if (button.dataset.qty === "max") button.textContent = settings.language === "en" ? "Max" : "最大";
  });
  updateSystemHud();
  renderStation();
  renderSettings();
}

function applyGraphicsQuality(quality) {
  settings.quality = ["low", "medium", "high"].includes(quality) ? quality : "high";
  document.body.dataset.quality = settings.quality;
  resize();
  saveSettings();
}

function applySettings() {
  applyTextSize(settings.uiSize);
  document.body.dataset.font = settings.font;
  document.body.dataset.quality = settings.quality;
  document.body.dataset.depth = settings.depthFx;
  applyLanguage();
  audioEngine.applySettings();
  renderSettings();
  resize();
  saveSettings();
}

function renderSettings() {
  $$("[data-ui-size-choice]").forEach(button => button.classList.toggle("active", button.dataset.uiSizeChoice === settings.uiSize));
  $$("[data-font-choice]").forEach(button => button.classList.toggle("active", button.dataset.fontChoice === settings.font));
  $$("[data-quality-choice]").forEach(button => button.classList.toggle("active", button.dataset.qualityChoice === settings.quality));
  $$("[data-depth-choice]").forEach(button => button.classList.toggle("active", button.dataset.depthChoice === settings.depthFx));
  $$("[data-language-choice]").forEach(button => button.classList.toggle("active", button.dataset.languageChoice === settings.language));
  $("#masterVolume").value = settings.masterVolume;
  $("#musicVolume").value = settings.musicVolume;
  $("#sfxVolume").value = settings.sfxVolume;
  $("#masterVolumeValue").textContent = `${settings.masterVolume}%`;
  $("#musicVolumeValue").textContent = `${settings.musicVolume}%`;
  $("#sfxVolumeValue").textContent = `${settings.sfxVolume}%`;
  updateToggleButton("#musicToggle", settings.musicEnabled);
  updateToggleButton("#sfxToggle", settings.sfxEnabled);
}

function updateToggleButton(selector, active) {
  const button = $(selector);
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
  button.querySelector("span").textContent = settings.language === "en" ? (active ? "On" : "Off") : (active ? "开启" : "关闭");
}

function openSettings() {
  $("#settingsPanel").classList.remove("hidden");
  paused = true;
  renderSettings();
}

function closeSettings() {
  $("#settingsPanel").classList.add("hidden");
  paused = state.docked || !$("#mapPanel").classList.contains("hidden") || !$("#helpPanel").classList.contains("hidden");
}

function setSetting(key, value, previewSound = false) {
  settings[key] = value;
  if (key === "uiSize") applyTextSize(value);
  else if (key === "font") document.body.dataset.font = value;
  else if (key === "quality") applyGraphicsQuality(value);
  else if (key === "depthFx") document.body.dataset.depth = value;
  else if (key === "language") applyLanguage();
  audioEngine.applySettings();
  renderSettings();
  saveSettings();
  if (previewSound) {
    audioEngine.ensure();
    audioEngine.play("trade");
  }
}

function pluginStore(systemId = state.currentSystem) {
  if (!state.pluginInventory) state.pluginInventory = {};
  if (!state.pluginInventory[systemId]) state.pluginInventory[systemId] = {};
  return state.pluginInventory[systemId];
}

function fittedPluginList() {
  if (!state.fittedPlugins) state.fittedPlugins = { weapon: null, defense: null, engineering: null, industrial: null, electronic: null };
  return Object.values(state.fittedPlugins).map(id => PLUGINS[id]).filter(Boolean);
}

function localizedPlugin(id) {
  const plugin = PLUGINS[id];
  if (!plugin) return null;
  return {
    ...plugin,
    name: settings.language === "en" ? plugin.en : plugin.name,
    slotName: settings.language === "en" ? SHIP_SLOTS[plugin.slot].en : SHIP_SLOTS[plugin.slot].name
  };
}

function activeWeaponPlugin() {
  if (state.activeWeapon !== "fitted") return null;
  return PLUGINS[state.fittedPlugins?.weapon] || null;
}

function activeShipHull() {
  return SHIP_HULLS[state.activeShip] || SHIP_HULLS.pioneer;
}

function saveActiveShipLoadout() {
  if (!state.shipLoadouts) state.shipLoadouts = {};
  state.shipLoadouts[state.activeShip] = {
    upgrades: { ...state.upgrades },
    fittedPlugins: { ...state.fittedPlugins },
    activeWeapon: state.activeWeapon
  };
}

function loadShipLoadout(shipId) {
  const loadout = state.shipLoadouts?.[shipId] || {};
  state.upgrades = { ...defaultState().upgrades, ...(loadout.upgrades || {}) };
  state.fittedPlugins = { ...defaultState().fittedPlugins, ...(loadout.fittedPlugins || {}) };
  state.activeWeapon = loadout.activeWeapon === "fitted" && state.fittedPlugins.weapon ? "fitted" : "pulse";
}

function canCommissionShip(shipId) {
  const hull = SHIP_HULLS[shipId];
  return !!hull && !state.ownedShips?.[shipId] && state.credits >= hull.cost &&
    Object.entries(hull.inputs).every(([key, amount]) => localItemAmount(key) >= amount);
}

function commissionShip(shipId) {
  const hull = SHIP_HULLS[shipId];
  if (!hull || state.ownedShips?.[shipId]) return;
  if (state.credits < hull.cost) return toast(`建造委托需要 ${formatNumber(hull.cost)} ISK`);
  const missing = Object.entries(hull.inputs).find(([key, amount]) => localItemAmount(key) < amount);
  if (missing) return toast(`舰体材料不足：${localizedGood(missing[0]).name}`);
  Object.entries(hull.inputs).forEach(([key, amount]) => removeLocalItems(key, amount));
  state.credits -= hull.cost;
  state.ownedShips = { ...(state.ownedShips || {}), [shipId]: state.currentSystem };
  state.shipLoadouts = { ...(state.shipLoadouts || {}), [shipId]: { upgrades: { ...defaultState().upgrades }, fittedPlugins: { ...defaultState().fittedPlugins }, activeWeapon: "pulse" } };
  addFeed(`在 <b>${localizedSystem(state.currentSystem).station}</b> 完成舰体建造：${hull.name}。`);
  toast(`舰体建造完成：${hull.name}`);
  flashWallet();
  renderStation();
  updateHud();
  saveGame();
}

function switchShip(shipId) {
  const hull = SHIP_HULLS[shipId];
  if (!hull || !state.docked) return;
  if (shipId === state.activeShip) return toast(`${hull.name}正在使用`);
  const location = state.ownedShips?.[shipId];
  if (location !== state.currentSystem) {
    const station = location && SYSTEMS[location] ? localizedSystem(location).station : "其他空间站";
    return toast(`该舰停放在 ${station}`);
  }
  const targetLoadout = state.shipLoadouts?.[shipId] || {};
  const targetStats = calculateShipStats(
    { ...defaultState().fittedPlugins, ...(targetLoadout.fittedPlugins || {}) },
    targetLoadout.activeWeapon || "pulse",
    shipId,
    { ...defaultState().upgrades, ...(targetLoadout.upgrades || {}) }
  );
  if (cargoUsed() > targetStats.cargo) return toast(`目标舰货舱仅 ${targetStats.cargo}，请先把多余货物存入本站仓库`);
  const before = shipStats();
  const shieldRatio = clamp(state.shield / Math.max(1, before.maxShield), 0, 1);
  const hullRatio = clamp(state.hull / Math.max(1, before.maxHull), 0, 1);
  saveActiveShipLoadout();
  state.ownedShips[state.activeShip] = state.currentSystem;
  state.activeShip = shipId;
  state.ownedShips[shipId] = "active";
  selectedHullPreview = shipId;
  loadShipLoadout(shipId);
  const after = shipStats();
  state.shield = Math.max(1, after.maxShield * shieldRatio);
  state.hull = Math.max(1, after.maxHull * hullRatio);
  state.maxFuel = hull.stats.fuel;
  state.fuel = Math.min(state.fuel, state.maxFuel);
  state.capacitor = Math.min(state.capacitor, after.maxCapacitor);
  player.radius = hull.stats.radius;
  toast(`已切换至 ${hull.name}`);
  renderStation();
  updateHud();
  saveGame();
}

function toggleWeapon() {
  const fittedId = state.fittedPlugins?.weapon;
  if (!fittedId || !PLUGINS[fittedId]) return toast(settings.language === "en" ? "No alternate weapon fitted" : "尚未安装可切换武器");
  state.activeWeapon = state.activeWeapon === "fitted" ? "pulse" : "fitted";
  player.fireCooldown = Math.max(player.fireCooldown, .18);
  const stats = shipStats();
  toast(`${settings.language === "en" ? "Weapon" : "武器切换"}：${stats.weaponLabel}`);
  updateHud();
  saveGame();
}

const FIRE_MODES = {
  balanced: { name: "均衡", en: "Balanced" },
  precision: { name: "精准", en: "Precision" },
  rapid: { name: "连射", en: "Rapid" }
};

function cycleFireMode() {
  const modes = Object.keys(FIRE_MODES);
  const index = Math.max(0, modes.indexOf(state.fireMode));
  state.fireMode = modes[(index + 1) % modes.length];
  player.fireCooldown = Math.max(player.fireCooldown, .16);
  const mode = FIRE_MODES[state.fireMode];
  toast(`${settings.language === "en" ? "Fire Mode" : "射击模式"}：${settings.language === "en" ? mode.en : mode.name}`);
  updateHud();
  saveGame();
}

function pluginInputText(inputs) {
  return Object.entries(inputs).map(([key, amount]) => {
    const current = localItemAmount(key);
    const enough = current >= amount;
    return `<span class="${enough ? "" : "missing"}">${localizedGood(key).name} ${current}/${amount}</span>`;
  }).join(" · ");
}

function canCraftPlugin(pluginId) {
  const plugin = PLUGINS[pluginId];
  return !!plugin && Object.entries(plugin.inputs).every(([key, amount]) => localItemAmount(key) >= amount);
}

function calculateShipStats(fitting = state.fittedPlugins, weaponMode = state.activeWeapon, hullId = state.activeShip, upgrades = state.upgrades) {
  const u = upgrades;
  const base = (SHIP_HULLS[hullId] || SHIP_HULLS.pioneer).stats;
  const stats = {
    maxShield: base.maxShield + u.shield * 35,
    maxHull: base.maxHull + u.hull * 45,
    damage: base.damage * (1 + u.weapon * .25),
    fireRate: Math.max(.12, .27 - u.weapon * .018),
    cargo: base.cargo + u.cargo * 15,
    speed: base.speed * (1 + u.engine * .12),
    miningRate: base.miningRate + u.mining * .35,
    shieldRegen: base.shieldRegen + u.shield * 1.5,
    boostRecovery: base.boostRecovery + u.engine * 3,
    maxCapacitor: base.maxCapacitor,
    capacitorRegen: 16,
    weaponHeatCooling: 22,
    projectileSpeed: 720,
    bulletLife: 1.3,
    projectileRadius: 3,
    spread: .018,
    weaponColor: "#39ddff",
    weaponKind: "pulse",
    damageType: "plasma",
    weaponLabel: settings.language === "en" ? "Pulse Cannon" : "脉冲炮",
    heatPerShot: .45,
    weaponHeatPerShot: 7,
    capacitorCost: 4,
    splashRadius: 0,
    ammoItem: null,
    ammoCost: 0,
    rareBonus: 0
  };
  Object.values(fitting || {}).map(id => PLUGINS[id]).filter(Boolean).forEach(plugin => {
    if (plugin.slot === "weapon" && weaponMode !== "fitted") return;
    const s = plugin.stats || {};
    if (s.damageMult) stats.damage *= s.damageMult;
    if (s.fireRateMult) stats.fireRate *= s.fireRateMult;
    if (s.speedMult) stats.speed *= s.speedMult;
    if (s.spreadMult) stats.spread *= s.spreadMult;
    if (s.shieldBonus) stats.maxShield += s.shieldBonus;
    if (s.hullBonus) stats.maxHull += s.hullBonus;
    if (s.cargoBonus) stats.cargo += s.cargoBonus;
    if (s.miningBonus) stats.miningRate += s.miningBonus;
    if (s.rareBonus) stats.rareBonus += s.rareBonus;
    if (s.shieldRegenBonus) stats.shieldRegen += s.shieldRegenBonus;
    if (s.boostRecoveryBonus) stats.boostRecovery += s.boostRecoveryBonus;
    if (s.projectileSpeed) stats.projectileSpeed = s.projectileSpeed;
    if (s.bulletLife) stats.bulletLife = s.bulletLife;
    if (s.bulletLifeBonus) stats.bulletLife += s.bulletLifeBonus;
    if (s.projectileRadius) stats.projectileRadius = s.projectileRadius;
    if (s.spread != null) stats.spread = s.spread;
    if (s.weaponColor) stats.weaponColor = s.weaponColor;
    if (s.weaponKind) stats.weaponKind = s.weaponKind;
    if (s.damageType) stats.damageType = s.damageType;
    if (s.weaponLabel) stats.weaponLabel = settings.language === "en" ? (plugin.en || s.weaponLabel) : s.weaponLabel;
    if (s.splashRadius) stats.splashRadius = s.splashRadius;
    if (s.heat) stats.heatPerShot = s.heat;
    if (s.weaponHeat) stats.weaponHeatPerShot = s.weaponHeat;
    if (s.capacitorCost != null) stats.capacitorCost = s.capacitorCost;
    if (s.ammoItem) stats.ammoItem = s.ammoItem;
    if (s.ammoCost) stats.ammoCost = s.ammoCost;
  });
  stats.fireRate = Math.max(.08, stats.fireRate);
  stats.spread = Math.max(.001, stats.spread);
  if (state.fireMode === "precision") {
    stats.damage *= 1.18;
    stats.fireRate *= 1.35;
    stats.spread *= .5;
    stats.projectileSpeed *= 1.08;
    stats.capacitorCost *= 1.2;
    stats.weaponHeatPerShot *= 1.1;
  } else if (state.fireMode === "rapid") {
    stats.damage *= .82;
    stats.fireRate *= .62;
    stats.spread *= 1.55;
    stats.capacitorCost *= .82;
    stats.weaponHeatPerShot *= 1.25;
  }
  stats.fireRate = Math.max(.065, stats.fireRate);
  stats.spread = Math.max(.001, stats.spread);
  stats.capacitorCost = Math.max(1, Math.round(stats.capacitorCost * 10) / 10);
  return stats;
}

function shipStats() {
  return calculateShipStats();
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

function stationStore(systemId = state.currentSystem) {
  if (!state.stationStorage[systemId]) state.stationStorage[systemId] = {};
  return state.stationStorage[systemId];
}

function addToStationStorage(key, amount, systemId = state.currentSystem) {
  const store = stationStore(systemId);
  store[key] = (store[key] || 0) + Math.max(0, amount);
  if (store[key] <= 0) delete store[key];
}

function removeFromStationStorage(key, amount, systemId = state.currentSystem) {
  const store = stationStore(systemId);
  const removed = Math.min(amount, store[key] || 0);
  store[key] = (store[key] || 0) - removed;
  if (store[key] <= 0) delete store[key];
  return removed;
}

function localItemAmount(key, systemId = state.currentSystem) {
  return (state.cargo[key] || 0) + (stationStore(systemId)[key] || 0);
}

function removeLocalItems(key, amount, systemId = state.currentSystem) {
  let remaining = amount;
  const fromCargo = removeCargo(key, remaining);
  remaining -= fromCargo;
  if (remaining > 0) remaining -= removeFromStationStorage(key, remaining, systemId);
  return amount - Math.max(0, remaining);
}

function craftedOutputAmount(recipe, systemId = state.currentSystem) {
  const bonus = STATION_INDUSTRY[systemId]?.bonuses?.[recipe.output.item] || 0;
  return recipe.output.amount + bonus;
}

function procurementQuote(inputs, systemId = state.currentSystem) {
  const missing = Object.entries(inputs).map(([itemKey, required]) => {
    const amount = Math.max(0, required - localItemAmount(itemKey, systemId));
    if (amount <= 0) return null;
    const market = state.markets[systemId]?.[itemKey];
    const unitPrice = market ? marketPrice(systemId, itemKey, "buy") : 0;
    const gross = amount * unitPrice;
    const fee = amount > 0 ? Math.max(1, Math.round(gross * .025)) : 0;
    return {
      itemKey,
      amount,
      available: Math.floor(market?.stock || 0),
      unitPrice,
      gross,
      fee,
      total: gross + fee
    };
  }).filter(Boolean);
  const total = missing.reduce((sum, line) => sum + line.total, 0);
  const unavailable = missing.find(line => line.available < line.amount);
  return {
    systemId,
    missing,
    total,
    unavailable,
    affordable: state.credits >= total,
    canPurchase: missing.length > 0 && !unavailable && state.credits >= total
  };
}

function procurementButtonLabel(quote) {
  if (!quote.missing.length) return settings.language === "en" ? "Materials Ready" : "材料齐全";
  if (quote.unavailable) return settings.language === "en" ? "Local Stock Shortage" : "本站市场缺货";
  if (!quote.affordable) return settings.language === "en"
    ? `Need ${formatNumber(quote.total)} ISK`
    : `余额不足 · ${formatNumber(quote.total)} ISK`;
  return settings.language === "en"
    ? `Buy Missing · ${formatNumber(quote.total)} ISK`
    : `一键采购 · ${formatNumber(quote.total)} ISK`;
}

function procureMaterials(inputs, sourceName = "制造项目") {
  if (!state.docked) return toast("必须停靠空间站才能采购制造材料");
  const quote = procurementQuote(inputs);
  if (!quote.missing.length) return toast("所需材料已经齐全");
  if (quote.unavailable) {
    return toast(`本站市场库存不足：${localizedGood(quote.unavailable.itemKey).name} 需要 ${quote.unavailable.amount}，库存 ${quote.unavailable.available}`);
  }
  if (!quote.affordable) return toast(`采购需要 ${formatNumber(quote.total)} ISK，当前余额不足`);

  state.credits -= quote.total;
  quote.missing.forEach(line => {
    const market = state.markets[state.currentSystem][line.itemKey];
    market.stock -= line.amount;
    market.priceFactor = clamp(
      market.priceFactor * (1 + line.amount / (SYSTEMS[state.currentSystem].stock[line.itemKey] * 18)),
      .3,
      3.5
    );
    addToStationStorage(line.itemKey, line.amount);
  });
  rememberCurrentMarket();
  const summary = quote.missing
    .map(line => `${localizedGood(line.itemKey).name} × ${line.amount}`)
    .join("、");
  addFeed(`<b>${sourceName}</b> 一键采购：${summary}，支出 ${formatNumber(quote.total)} ISK。材料已送入本站仓库。`);
  toast(`采购完成 · ${formatNumber(quote.total)} ISK`);
  flashWallet();
  audioEngine.play("trade");
  renderStation();
  updateHud();
  saveGame();
}

function depositCargo(key, amount = Infinity) {
  const moved = removeCargo(key, Number.isFinite(amount) ? amount : (state.cargo[key] || 0));
  if (moved <= 0) return toast("货舱没有可存入的物品");
  addToStationStorage(key, moved);
  toast(`已存入 ${localizedGood(key).name} × ${moved}`);
  renderStation();
  updateHud();
  saveGame();
}

function withdrawCargo(key, amount = Infinity) {
  const available = stationStore()[key] || 0;
  const requested = Number.isFinite(amount) ? amount : available;
  const movable = Math.min(requested, cargoSpaceFor(key), available);
  if (movable <= 0) return toast(cargoSpaceFor(key) <= 0 ? "货舱空间不足" : "仓库没有该物品");
  removeFromStationStorage(key, movable);
  addCargo(key, movable);
  autoRefuel();
  toast(`已取出 ${localizedGood(key).name} × ${movable}`);
  renderStation();
  updateHud();
  saveGame();
}

function craftItem(recipeId) {
  const recipe = CRAFTING_RECIPES.find(item => item.id === recipeId);
  if (!recipe) return;
  const missing = Object.entries(recipe.inputs).find(([key, amount]) => localItemAmount(key) < amount);
  if (missing) return toast(`材料不足：${localizedGood(missing[0]).name}`);
  Object.entries(recipe.inputs).forEach(([key, amount]) => removeLocalItems(key, amount));
  const outputAmount = craftedOutputAmount(recipe);
  addToStationStorage(recipe.output.item, outputAmount);
  state.stats.crafted = (state.stats.crafted || 0) + 1;
  addFeed(`在 <b>${localizedSystem(state.currentSystem).station}</b> 制作 ${localizedGood(recipe.output.item).name} × ${outputAmount}。`);
  audioEngine.play("trade");
  renderStation();
  updateHud();
  saveGame();
}

function craftPlugin(pluginId) {
  const plugin = PLUGINS[pluginId];
  if (!plugin) return;
  const missing = Object.entries(plugin.inputs).find(([key, amount]) => localItemAmount(key) < amount);
  if (missing) return toast(`材料不足：${localizedGood(missing[0]).name}`);
  Object.entries(plugin.inputs).forEach(([key, amount]) => removeLocalItems(key, amount));
  const store = pluginStore();
  store[pluginId] = (store[pluginId] || 0) + 1;
  state.stats.pluginsCrafted = (state.stats.pluginsCrafted || 0) + 1;
  addFeed(`在 <b>${localizedSystem(state.currentSystem).station}</b> 制造插件：${localizedPlugin(pluginId).name}。`);
  audioEngine.play("trade");
  renderStation();
  updateHud();
  saveGame();
}

function installPlugin(pluginId) {
  const plugin = PLUGINS[pluginId];
  if (!plugin) return;
  const store = pluginStore();
  if ((store[pluginId] || 0) <= 0) return toast("当前空间站没有该插件库存");
  if (!state.fittedPlugins) state.fittedPlugins = defaultState().fittedPlugins;
  const previous = state.fittedPlugins[plugin.slot];
  if (previous === pluginId) return toast("该插件已经安装");
  store[pluginId]--;
  if (store[pluginId] <= 0) delete store[pluginId];
  if (previous) store[previous] = (store[previous] || 0) + 1;
  state.fittedPlugins[plugin.slot] = pluginId;
  if (plugin.slot === "weapon") state.activeWeapon = "fitted";
  const stats = shipStats();
  state.shield = Math.min(stats.maxShield, state.shield + (plugin.stats.shieldBonus || 0));
  state.hull = Math.min(stats.maxHull, state.hull + (plugin.stats.hullBonus || 0));
  toast(`已安装：${localizedPlugin(pluginId).name}`);
  addFeed(`舰船 ${SHIP_SLOTS[plugin.slot].name} 安装 <b>${localizedPlugin(pluginId).name}</b>。`);
  renderStation();
  updateHud();
  saveGame();
}

function uninstallPlugin(slot) {
  if (!state.fittedPlugins) state.fittedPlugins = defaultState().fittedPlugins;
  const pluginId = state.fittedPlugins[slot];
  if (!pluginId || !PLUGINS[pluginId]) return;
  const store = pluginStore();
  store[pluginId] = (store[pluginId] || 0) + 1;
  state.fittedPlugins[slot] = null;
  if (slot === "weapon") state.activeWeapon = "pulse";
  const stats = shipStats();
  state.shield = Math.min(state.shield, stats.maxShield);
  state.hull = Math.min(state.hull, stats.maxHull);
  toast(`已拆下：${localizedPlugin(pluginId).name}`);
  renderStation();
  updateHud();
  saveGame();
}

function marketPrice(systemId, itemKey, side = "buy") {
  const market = state.markets[systemId][itemKey];
  const system = SYSTEMS[systemId];
  const targetStock = system.stock[itemKey];
  const scarcity = clamp((targetStock - market.stock) / targetStock, -.7, 1.3);
  const mid = GOODS[itemKey].base * market.priceFactor * (1 + scarcity * .35);
  return Math.max(3, Math.round(mid * (side === "buy" ? 1.045 : .955)));
}

function rememberCurrentMarket() {
  const systemId = state.currentSystem;
  state.marketMemory[systemId] = {
    playSeconds: state.playSeconds,
    prices: Object.fromEntries(Object.keys(GOODS).map(key => [key, {
      buy: marketPrice(systemId, key, "buy"),
      sell: marketPrice(systemId, key, "sell"),
      stock: Math.floor(state.markets[systemId][key].stock)
    }]))
  };
}

function marketMemoryAge(memory) {
  if (!memory) return settings.language === "en" ? "Unsynced" : "未同步";
  const minutes = Math.max(0, Math.floor((state.playSeconds - (memory.playSeconds || 0)) / 60));
  if (minutes <= 0) return settings.language === "en" ? "Live" : "刚同步";
  return settings.language === "en" ? `${minutes}m ago` : `${minutes}分钟前`;
}

function marketPressure(systemId, itemKey, snapshot = null) {
  const system = SYSTEMS[systemId];
  const stock = snapshot?.stock ?? state.markets[systemId][itemKey].stock;
  const ref = system.stock[itemKey] || 1;
  const ratio = stock / ref;
  const price = snapshot?.buy ?? marketPrice(systemId, itemKey, "buy");
  const priceRatio = price / Math.max(1, GOODS[itemKey].base * system.modifiers[itemKey]);
  const tags = [];
  if (ratio < .42) tags.push(settings.language === "en" ? "shortage" : "库存紧张");
  else if (ratio > 1.55) tags.push(settings.language === "en" ? "surplus" : "库存充裕");
  if (priceRatio > 1.18) tags.push(settings.language === "en" ? "price high" : "价格高位");
  else if (priceRatio < .9) tags.push(settings.language === "en" ? "price low" : "价格低位");
  if ((state.systemThreat[systemId] || 0) > 55 && ["ammo", "fuel", "salvage"].includes(itemKey)) {
    tags.push(settings.language === "en" ? "war demand" : "战事需求");
  }
  return tags;
}

function collectMarketSignals() {
  const signals = [];
  Object.keys(SYSTEMS).forEach(systemId => {
    const memory = state.marketMemory[systemId];
    const live = systemId === state.currentSystem;
    if (!memory && !live) return;
    Object.keys(GOODS).forEach(itemKey => {
      const snapshot = live ? null : memory?.prices?.[itemKey];
      if (!snapshot && !live) return;
      const tags = marketPressure(systemId, itemKey, snapshot);
      if (!tags.length) return;
      signals.push({
        systemId,
        itemKey,
        tags,
        live,
        age: live ? (settings.language === "en" ? "Live" : "实时") : marketMemoryAge(memory),
        threat: state.systemThreat[systemId] || 0
      });
    });
  });
  return signals.sort((a, b) => {
    const riskA = a.threat > 55 ? 1 : 0;
    const riskB = b.threat > 55 ? 1 : 0;
    return b.tags.length + riskB - (a.tags.length + riskA);
  });
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
  matchPlayerOrders(intensity);
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
  const text = UI_TEXT[settings.language] || UI_TEXT.zh;
  $("#aiOnlineCount").textContent = `${state.aiCount} ${text.online}`;
  $("#localCount").textContent = `${world.enemies.length + world.asteroids.length + local} ${text.signals}`;
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
  const qualityScale = settings.quality === "low" ? .65 : settings.quality === "medium" ? .85 : 1;
  const dpr = Math.max(.65, (devicePixelRatio || 1) * qualityScale);
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
  world.combatText.length = 0;
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
  const stats = shipStats();
  const rareChance = .08 + (1 - SYSTEMS[state.currentSystem].security) * .32 + state.upgrades.mining * .025 + stats.rareBonus;
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
  const maxShield = Math.round(spec.hp * (spec.shieldRatio || 0) * hpScale);
  const enemy = {
    id: crypto.randomUUID(), x: point.x, y: point.y,
    homeX: point.x, homeY: point.y, patrolAngle: randomRange(0, Math.PI * 2),
    vx: 0, vy: 0, angle: 0, r: spec.radius, hp: maxHp, maxHp, shield: maxShield, maxShield,
    speed: spec.speed, fireCooldown: randomRange(.4, spec.fireRate), tier: type === "gunship" ? 2 : 1,
    type, name: spec.name, state: "patrol", lockTimer: 0, lostTimer: 0, calledReinforcement: false, spawnReason: reason,
    detection: spec.detection, lockRange: spec.lock, weaponRange: spec.weapon, optimal: spec.optimal
  };
  world.enemies.push(enemy);
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
  const factor = settings.quality === "low" ? .35 : settings.quality === "medium" ? .65 : 1;
  for (let i = 0; i < Math.max(1, Math.round(amount * factor)); i++) {
    const angle = Math.random() * Math.PI * 2;
    world.particles.push({
      x, y, vx: Math.cos(angle) * randomRange(20, speed), vy: Math.sin(angle) * randomRange(20, speed),
      life: randomRange(.35, .9), maxLife: 1, color, size: randomRange(1, 3)
    });
  }
}

function damageLayerMultiplier(type, layer, spec = {}) {
  const profile = DAMAGE_TYPES[type] || DAMAGE_TYPES.plasma;
  const resistMap = layer === "shield" ? spec.shieldResist : spec.hullResist;
  const resistance = clamp(resistMap?.[type] || 0, 0, .8);
  return Math.max(.1, profile[layer] * (1 - resistance));
}

function createCombatText(x, y, amount, type, layer, critical = false) {
  const profile = DAMAGE_TYPES[type] || DAMAGE_TYPES.plasma;
  world.combatText.push({
    x, y, amount: Math.max(0, Math.round(amount)), type, layer,
    color: layer === "shield" ? "#53e8ff" : profile.color,
    life: critical ? 1.05 : .78, maxLife: critical ? 1.05 : .78,
    vy: critical ? -42 : -30, critical
  });
}

function applyDamageToEnemy(enemy, amount, type = "plasma", options = {}) {
  if (!enemy || enemy.hp <= 0 || amount <= 0) {
    return { shieldDamage: 0, hullDamage: 0, total: 0, destroyed: false };
  }
  const spec = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.interceptor;
  let rawRemaining = amount;
  let shieldDamage = 0;
  let hullDamage = 0;
  if (enemy.shield > 0 && rawRemaining > 0) {
    const multiplier = damageLayerMultiplier(type, "shield", spec);
    const before = enemy.shield;
    shieldDamage = Math.min(before, rawRemaining * multiplier);
    enemy.shield = Math.max(0, before - shieldDamage);
    rawRemaining = Math.max(0, rawRemaining - before / multiplier);
  }
  if (rawRemaining > 0) {
    const multiplier = damageLayerMultiplier(type, "hull", spec);
    hullDamage = Math.min(enemy.hp, rawRemaining * multiplier);
    enemy.hp = Math.max(0, enemy.hp - hullDamage);
  }
  const layer = hullDamage > 0 ? "hull" : "shield";
  const displayed = hullDamage > 0 ? hullDamage : shieldDamage;
  if (!options.silent && displayed > 0) {
    createCombatText(enemy.x, enemy.y - enemy.r, displayed, type, layer, options.direct === true);
  }
  if (enemy.hp <= 0) destroyEnemy(enemy);
  return { shieldDamage, hullDamage, total: shieldDamage + hullDamage, destroyed: enemy.hp <= 0 };
}

function applyMissileExplosion(bullet, primaryEnemy) {
  const radius = bullet.splashRadius || 0;
  const targets = world.enemies.filter(enemy => enemy.hp > 0 && distance(enemy, bullet) <= radius);
  if (primaryEnemy && !targets.includes(primaryEnemy)) targets.unshift(primaryEnemy);
  targets.forEach(enemy => {
    const d = enemy === primaryEnemy ? 0 : distance(enemy, bullet);
    const falloff = enemy === primaryEnemy ? 1 : clamp(1 - d / Math.max(1, radius), .2, .62);
    applyDamageToEnemy(enemy, bullet.damage * falloff, bullet.damageType, { direct: enemy === primaryEnemy });
  });
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
  audioEngine.play("alert");
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
      life: 2.8, damage: 18, damageType: "thermal", color: "#a980ff", r: 5, source: "outpost"
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
  state.capacitor = Math.min(stats.maxCapacitor, state.capacitor + stats.capacitorRegen * dt);
  player.weaponHeat = Math.max(0, player.weaponHeat - stats.weaponHeatCooling * dt);
  if (player.overheatLocked && player.weaponHeat <= 42) {
    player.overheatLocked = false;
    toast(settings.language === "en" ? "Weapon cooling complete" : "武器冷却完成");
  }
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
  if (player.overheatLocked) {
    player.fireCooldown = .18;
    return;
  }
  if (state.capacitor < stats.capacitorCost) {
    player.fireCooldown = .24;
    return toast(settings.language === "en" ? "Insufficient capacitor" : "武器电容不足");
  }
  if (stats.ammoItem && stats.ammoCost > 0) {
    const consumed = removeCargo(stats.ammoItem, stats.ammoCost);
    if (consumed < stats.ammoCost) {
      if (consumed > 0) addCargo(stats.ammoItem, consumed);
      player.fireCooldown = .35;
      return toast(`${localizedGood(stats.ammoItem).name}不足，无法发射${stats.weaponLabel}`);
    }
  }
  const spread = randomRange(-stats.spread, stats.spread);
  const angle = player.angle + spread;
  world.bullets.push({
    x: player.x + Math.cos(angle) * 24, y: player.y + Math.sin(angle) * 24,
    vx: Math.cos(angle) * stats.projectileSpeed, vy: Math.sin(angle) * stats.projectileSpeed,
    life: stats.bulletLife, damage: stats.damage, r: stats.projectileRadius,
    kind: stats.weaponKind, damageType: stats.damageType, splashRadius: stats.splashRadius, color: stats.weaponColor
  });
  state.capacitor = Math.max(0, state.capacitor - stats.capacitorCost);
  player.weaponHeat = clamp(player.weaponHeat + stats.weaponHeatPerShot, 0, 100);
  if (player.weaponHeat >= 100) {
    player.overheatLocked = true;
    audioEngine.play("alert");
    toast(settings.language === "en" ? "Weapon overheated · cooling locked" : "武器过热 · 正在强制冷却");
  }
  player.fireCooldown = stats.fireRate;
  pve.heat = clamp(pve.heat + stats.heatPerShot, 0, 100);
  audioEngine.play("shoot");
  createParticles(player.x + Math.cos(angle) * 22, player.y + Math.sin(angle) * 22, stats.weaponColor, stats.weaponKind === "missile" ? 5 : 2, stats.weaponKind === "missile" ? 55 : 35);
}

function updateBullets(dt) {
  world.bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    for (const enemy of world.enemies) {
      if (bullet.life > 0 && distance(bullet, enemy) < enemy.r + bullet.r) {
        bullet.life = 0;
        if (bullet.kind === "missile") applyMissileExplosion(bullet, enemy);
        else applyDamageToEnemy(enemy, bullet.damage, bullet.damageType, { direct: true });
        createParticles(bullet.x, bullet.y, bullet.color || "#ff768c", bullet.kind === "missile" ? 9 : 5, bullet.kind === "missile" ? 105 : 75);
      }
    }
    const outpost = world.outpost;
    if (bullet.life > 0 && outpost?.active && distance(bullet, outpost) < outpost.r + bullet.r) {
      bullet.life = 0;
      damageOutpost(bullet.damage, bullet.damageType);
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

function damageOutpost(amount, type = "plasma") {
  const outpost = world.outpost;
  if (!outpost?.active) return;
  pve.heat = clamp(pve.heat + 1.6, 0, 100);
  if (outpost.shield > 0) {
    const multiplier = damageLayerMultiplier(type, "shield", { shieldResist: { thermal: .18, explosive: .1 } });
    const dealt = Math.min(outpost.shield, amount * multiplier);
    outpost.shield = Math.max(0, outpost.shield - dealt);
    createCombatText(outpost.x, outpost.y - outpost.r, dealt, type, "shield", true);
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
    const multiplier = damageLayerMultiplier(type, "hull", { hullResist: { kinetic: .22, explosive: .16 } });
    const dealt = Math.min(outpost.hp, amount * multiplier);
    outpost.hp = Math.max(0, outpost.hp - dealt);
    createCombatText(outpost.x, outpost.y - outpost.r, dealt, type, "hull", true);
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
  audioEngine.play("explosion");
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
        damageType: spec.damageType || "plasma", color: spec.bulletColor || spec.color,
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
  audioEngine.play("explosion");
  addFeed(`摧毁 <b>${enemy.name}</b>，获得 ${spec.bounty} ISK 与残骸。`, "danger");
}

function damagePlayer(amount, source = null) {
  if (player.invulnerable > 0) return;
  player.shieldDelay = 4;
  const damageType = source?.damageType || "plasma";
  let rawRemaining = amount;
  if (state.shield > 0 && rawRemaining > 0) {
    const multiplier = damageLayerMultiplier(damageType, "shield");
    const before = state.shield;
    const absorbed = Math.min(before, rawRemaining * multiplier);
    state.shield = Math.max(0, before - absorbed);
    rawRemaining = Math.max(0, rawRemaining - before / multiplier);
    shieldImpact = 1;
    shieldHitAngle = source ? Math.atan2(source.y - player.y, source.x - player.x) : player.angle + Math.PI;
    $("#shieldOrb").classList.remove("hit");
    requestAnimationFrame(() => $("#shieldOrb").classList.add("hit"));
    createParticles(player.x, player.y, "#39ddff", 7, 95);
    audioEngine.play("shield");
  }
  if (rawRemaining > 0) {
    const hullDamage = rawRemaining * damageLayerMultiplier(damageType, "hull");
    state.hull -= hullDamage;
    createParticles(player.x, player.y, "#ff9d66", 9, 115);
    audioEngine.play("hit");
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
  world.combatText.forEach(text => {
    text.y += text.vy * dt;
    text.vy *= .96;
    text.life -= dt;
  });
  world.combatText = world.combatText.filter(text => text.life > 0);
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
    setContextAction(
      "dock",
      settings.language === "en" ? "Dock at station" : "停靠空间站",
      settings.language === "en" ? `${Math.round(stationDistance)}m · Market, storage and fitting` : `${Math.round(stationDistance)}m · 市场、仓库与改装`
    );
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
      const progress = Math.round(clamp(1 - activeTarget.hp / activeTarget.maxHp, 0, 1) * 100);
      setContextAction(
        "mining",
        settings.language === "en" ? "Stop mining beam" : "关闭采矿束",
        settings.language === "en" ? `${Math.round(targetDistance)}m · Extraction ${progress}%` : `${Math.round(targetDistance)}m · 开采进度 ${progress}%`
      );
      return;
    }
  } else if (mining.active) {
    stopMining(false);
  }

  const nearbyLoot = world.loot.find(loot => distance(player, loot) < 135);
  if (nearbyLoot) {
    const lootDistance = distance(player, nearbyLoot);
    setContextAction(
      "loot",
      settings.language === "en" ? `Recover ${localizedGood(nearbyLoot.item).name}` : `回收 ${localizedGood(nearbyLoot.item).name}`,
      settings.language === "en" ? `${Math.round(lootDistance)}m · ${nearbyLoot.amount} units` : `${Math.round(lootDistance)}m · 数量 ${nearbyLoot.amount}`
    );
    return;
  }
  if (nearestAsteroid && nearestDistance < 225) {
    setContextAction(
      "mine",
      settings.language === "en" ? `Lock ${localizedGood(nearestAsteroid.resource).name}` : `锁定 ${localizedGood(nearestAsteroid.resource).name}`,
      settings.language === "en" ? `${Math.round(nearestDistance)}m · Start mining beam` : `${Math.round(nearestDistance)}m · 启动采矿束`
    );
    return;
  }
  setContextAction();
}

function setContextAction(type = "", title = "", detail = "") {
  const prompt = $("#interactionPrompt");
  const button = $("#contextActionBtn");
  const active = !!type;
  prompt.classList.toggle("hidden", !active);
  prompt.dataset.action = type;
  button.disabled = !active;
  button.classList.toggle("ready", active);
  button.dataset.action = type;
  button.title = active ? `${title} · ${detail}` : (settings.language === "en" ? "No interactive target in range" : "范围内没有可交互目标");
  button.setAttribute("aria-label", active ? title : (settings.language === "en" ? "Context scan" : "扫描交互"));
  $("#contextActionName").textContent = active ? title : (settings.language === "en" ? "Context scan" : "扫描交互");
  $("#contextActionHint").textContent = active ? detail : (settings.language === "en" ? "Approach an interactive target" : "靠近可交互目标");
  if (!active) return;
  $("#interactionAction").textContent = title;
  $("#interactionDetail").textContent = detail;
}

function handleInteractionAction() {
  if (state.docked || paused) return;
  if (distance(player, world.station) < 150) {
    dock();
    return;
  }
  if (mining.active) {
    stopMining();
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
    audioEngine.play("mine");
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
    audioEngine.play("trade");
    stopMining(false);
    setTimeout(() => {
      if (!state.docked) spawnAsteroid();
    }, 5000);
  }
}

function dock() {
  state.docked = true;
  state.story = { ...(state.story || {}), dockedOnce: true };
  paused = true;
  player.vx = player.vy = 0;
  player.weaponHeat = 0;
  player.overheatLocked = false;
  state.capacitor = shipStats().maxCapacitor;
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
  audioEngine.play("jump");
  if (!state.discovered.includes(systemId)) state.discovered.push(systemId);
  if (!state.visitedSystems) state.visitedSystems = ["aurora"];
  if (!state.visitedSystems.includes(systemId)) state.visitedSystems.push(systemId);
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
  const amount = Math.max(0, Math.min(requested === "max" ? 9999 : requested, Math.floor(market.stock), amountByMoney));
  if (amount <= 0) return toast("资金或市场库存不足");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  state.credits -= gross + fee;
  const loaded = addCargo(itemKey, amount);
  const stored = amount - loaded;
  if (stored > 0) addToStationStorage(itemKey, stored);
  market.stock -= amount;
  market.priceFactor = clamp(market.priceFactor * (1 + amount / (SYSTEMS[state.currentSystem].stock[itemKey] * 18)), .3, 3.5);
  autoRefuel();
  addFeed(`购入 ${GOODS[itemKey].name} × ${amount}，支出 ${formatNumber(gross + fee)} ISK。${stored ? ` ${stored} 单位已送入本站仓库。` : ""}`);
  flashWallet();
  audioEngine.play("trade");
  renderStation();
  updateHud();
  saveGame();
}

function sellItem(itemKey, requested) {
  const owned = localItemAmount(itemKey);
  const amount = Math.max(0, Math.min(requested === "max" ? owned : requested, owned));
  if (amount <= 0) return toast("本地没有该商品");
  const market = state.markets[state.currentSystem][itemKey];
  const price = marketPrice(state.currentSystem, itemKey, "sell");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  removeLocalItems(itemKey, amount);
  state.credits += gross - fee;
  state.stats.tradeRevenue += gross - fee;
  market.stock += amount;
  market.priceFactor = clamp(market.priceFactor * (1 - amount / (SYSTEMS[state.currentSystem].stock[itemKey] * 22)), .3, 3.5);
  addFeed(`售出 ${GOODS[itemKey].name} × ${amount}，收入 ${formatNumber(gross - fee)} ISK。`);
  flashWallet();
  audioEngine.play("trade");
  renderStation();
  updateHud();
  updateMission();
  saveGame();
}

function playerSellOrders(systemId = state.currentSystem, itemKey = null) {
  if (!Array.isArray(state.playerOrders)) state.playerOrders = [];
  return state.playerOrders
    .filter(order => order.type === "sell" && order.systemId === systemId && (!itemKey || order.itemKey === itemKey) && order.amount > 0)
    .sort((a, b) => a.price - b.price || a.createdAt - b.createdAt);
}

function settleSellOrder(order, fillAmount = order.amount, source = "市场撮合") {
  const amount = Math.max(0, Math.min(order.amount, Math.floor(fillAmount)));
  if (amount <= 0) return 0;
  const gross = amount * order.price;
  const fee = Math.max(1, Math.round(gross * .025));
  state.credits += gross - fee;
  state.stats.tradeRevenue += gross - fee;
  order.amount -= amount;
  recordAITrade({ name: source }, order.itemKey, amount, "buy", order.systemId, order.price);
  addFeed(`卖单成交 <b>${localizedGood(order.itemKey).name}</b> × ${amount}，单价 ${formatNumber(order.price)} ISK，收入 ${formatNumber(gross - fee)} ISK。`);
  return amount;
}

function matchPlayerOrders(intensity = 1) {
  if (!Array.isArray(state.playerOrders) || !state.playerOrders.length) return;
  state.playerOrders.forEach(order => {
    if (order.type !== "sell" || order.amount <= 0 || !state.markets[order.systemId]?.[order.itemKey]) return;
    const bestBid = marketPrice(order.systemId, order.itemKey, "sell");
    const demandLift = (state.systemThreat[order.systemId] || 0) > 45 && ["ammo", "fuel", "salvage"].includes(order.itemKey) ? 1.03 : 1;
    if (order.price <= bestBid * demandLift) {
      settleSellOrder(order, Math.max(1, Math.ceil(order.amount * clamp(.45 * intensity, .25, 1))), "交易所撮合");
    }
  });
  state.playerOrders = state.playerOrders.filter(order => order.amount > 0);
}

function placeLimitSellOrder(itemKey, requested, limitPrice) {
  const amount = Math.max(0, Math.min(requested === "max" ? localItemAmount(itemKey) : requested, localItemAmount(itemKey)));
  const price = Math.max(1, Math.round(Number(limitPrice) || 0));
  if (amount <= 0) return toast("本地没有该商品");
  if (!Number.isFinite(price) || price <= 0) return toast("请输入有效出售单价");
  const bestBid = marketPrice(state.currentSystem, itemKey, "sell");
  if (price <= bestBid) {
    const previousPrice = $("#limitSellPrice")?.value;
    sellItemAtPrice(itemKey, amount, bestBid, `限价单即时成交，按当前买盘 ${formatNumber(bestBid)} ISK 结算。`);
    if ($("#limitSellPrice")) $("#limitSellPrice").value = previousPrice;
    return;
  }
  const removed = removeLocalItems(itemKey, amount);
  if (removed <= 0) return toast("本地没有该商品");
  if (!Array.isArray(state.playerOrders)) state.playerOrders = [];
  state.playerOrders.unshift({
    id: `sell-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "sell",
    systemId: state.currentSystem,
    itemKey,
    amount: removed,
    originalAmount: removed,
    price,
    createdAt: state.playSeconds
  });
  state.stats.ordersCreated = (state.stats.ordersCreated || 0) + 1;
  addFeed(`挂出卖单 <b>${localizedGood(itemKey).name}</b> × ${removed}，单价 ${formatNumber(price)} ISK。`);
  toast(`已挂单：${localizedGood(itemKey).name} × ${removed} @ ${formatNumber(price)} ISK`);
  audioEngine.play("trade");
  renderStation();
  updateHud();
  saveGame();
}

function sellItemAtPrice(itemKey, requested, unitPrice, note = "") {
  const owned = localItemAmount(itemKey);
  const amount = Math.max(0, Math.min(requested === "max" ? owned : requested, owned));
  if (amount <= 0) return toast("本地没有该商品");
  const market = state.markets[state.currentSystem][itemKey];
  const price = Math.max(1, Math.round(unitPrice));
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  removeLocalItems(itemKey, amount);
  state.credits += gross - fee;
  state.stats.tradeRevenue += gross - fee;
  market.stock += amount;
  market.priceFactor = clamp(market.priceFactor * (1 - amount / (SYSTEMS[state.currentSystem].stock[itemKey] * 22)), .3, 3.5);
  addFeed(`售出 ${localizedGood(itemKey).name} × ${amount}，单价 ${formatNumber(price)} ISK，收入 ${formatNumber(gross - fee)} ISK。${note ? ` ${note}` : ""}`);
  flashWallet();
  audioEngine.play("trade");
  renderStation();
  updateHud();
  updateMission();
  saveGame();
}

function cancelPlayerOrder(orderId) {
  if (!Array.isArray(state.playerOrders)) return;
  const order = state.playerOrders.find(item => item.id === orderId);
  if (!order) return;
  addToStationStorage(order.itemKey, order.amount, order.systemId);
  state.playerOrders = state.playerOrders.filter(item => item.id !== orderId);
  toast(`已撤单，货物退回 ${localizedSystem(order.systemId).station} 仓库`);
  renderStation();
  updateHud();
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
  state.capacitor = stats.maxCapacitor;
  player.weaponHeat = 0;
  player.overheatLocked = false;
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
    template.metric ? (state.stats[template.metric] || 0) :
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
  if (mission.metric) return Math.min(mission.amount, (state.stats[mission.metric] || 0) - (mission.startValue || 0));
  if (mission.visit) return state.docked && state.currentSystem === mission.destination ? mission.amount : 0;
  if (mission.id === "mine") return Math.min(mission.amount, state.stats.mined - (mission.startValue || 0));
  if (mission.id === "hunt") return Math.min(mission.amount, state.stats.kills - (mission.startValue || 0));
  if (mission.id === "trade") return Math.min(mission.amount, state.stats.tradeRevenue - (mission.startValue || 0));
  return Math.min(mission.amount, state.cargo[mission.item] || 0);
}

function updateMission() {
  const mission = state.mission;
  if (!mission) return;
  mission.progress = missionProgress(mission);
  if ((["mine", "hunt", "trade"].includes(mission.id) || mission.metric || mission.visit) && mission.progress >= mission.amount) completeMission();
  updateMissionHud();
}

function checkDeliveryMission() {
  const mission = state.mission;
  if (!mission) return;
  if (mission.visit) {
    mission.progress = missionProgress(mission);
    if (mission.progress >= mission.amount) completeMission();
    return;
  }
  if (!mission.item) return;
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

function careerMetricValue(metric) {
  if (metric === "visited") return new Set(state.visitedSystems || ["aurora"]).size;
  if (metric === "remoteQuotes") return state.story?.viewedRemoteMarket ? 1 : 0;
  if (metric === "reputation") return state.reputation || 0;
  return Number(state.stats?.[metric]) || 0;
}

function careerPathProgress(pathId) {
  const path = CAREER_PATHS[pathId] || CAREER_PATHS.explorer;
  const goals = path.goals.map(goal => ({ ...goal, current: careerMetricValue(goal.metric) }));
  const pct = goals.reduce((sum, goal) => sum + clamp(goal.current / goal.target, 0, 1), 0) / goals.length * 100;
  return { path, goals, pct, completed: goals.every(goal => goal.current >= goal.target) };
}

function trackedCareerId() {
  const tracked = state.career?.tracked;
  return CAREER_PATHS[tracked] ? tracked : "explorer";
}

function selectCareerPath(pathId) {
  if (!CAREER_PATHS[pathId]) return;
  state.career = { ...(state.career || {}), tracked: pathId };
  renderCareerJournal();
  updateTutorial();
  toast(`${settings.language === "en" ? "Tracking" : "正在追踪"}：${settings.language === "en" ? CAREER_PATHS[pathId].en : CAREER_PATHS[pathId].name}`);
  saveGame();
}

function renderCareerJournal() {
  const panel = $("#careerJournal");
  if (!panel) return;
  const trackedId = trackedCareerId();
  const focus = careerPathProgress(trackedId);
  const isEn = settings.language === "en";
  panel.innerHTML = `
    <header class="career-head">
      <div><span>${isEn ? "CAPSULEER PATHS" : "飞行员职业日志"}</span><strong>${isEn ? "Choose a direction, keep every achievement" : "选择方向，但不丢失任何进度"}</strong></div>
      <p>${isEn ? "All paths progress in parallel. Rewards are identity badges and never manipulate market prices." : "所有路线同时累计。完成后获得身份徽章，不发放可交易物品，也不干预市场价格。"}</p>
    </header>
    <div class="career-paths">
      ${Object.entries(CAREER_PATHS).map(([id, path]) => {
        const progress = careerPathProgress(id);
        return `<button class="career-path ${id === trackedId ? "active" : ""} ${progress.completed ? "completed" : ""}" data-career-path="${id}" style="--career-color:${path.color}">
          <i>${path.icon}</i><span><strong>${isEn ? path.en : path.name}</strong><small>${Math.round(progress.pct)}%</small></span>
          <b style="--progress:${progress.pct}%"></b>
        </button>`;
      }).join("")}
    </div>
    <section class="career-focus" style="--career-color:${focus.path.color}">
      <div class="career-summary"><i>${focus.path.icon}</i><span><strong>${isEn ? focus.path.en : focus.path.name}</strong><small>${isEn ? focus.path.descriptionEn : focus.path.description}</small></span><b>${focus.completed ? (isEn ? "BADGE EARNED" : "徽章已获得") : (isEn ? "TRACKING" : "正在追踪")}</b></div>
      <div class="career-goals">
        ${focus.goals.map(goal => {
          const done = goal.current >= goal.target;
          const value = `${formatNumber(Math.min(goal.current, goal.target))}/${formatNumber(goal.target)}${goal.suffix || ""}`;
          return `<div class="${done ? "done" : ""}"><span>${isEn ? goal.en : goal.label}</span><b>${done ? "✓" : value}</b><i><em style="width:${clamp(goal.current / goal.target * 100, 0, 100)}%"></em></i></div>`;
        }).join("")}
      </div>
    </section>`;
  $$("[data-career-path]").forEach(button => button.addEventListener("click", () => selectCareerPath(button.dataset.careerPath)));
}

function currentTutorialStep() {
  if (!state.tutorial || state.tutorial.completed || !state.tutorial.active) return null;
  return TUTORIAL_STEPS[state.tutorial.step] || null;
}

function ensureTutorialStepBaseline(step) {
  if (!step || state.tutorial.enteredStep === step.id) return;
  state.tutorial.enteredStep = step.id;
  state.tutorial.baselines = {
    fuel: state.fuel,
    mined: state.stats.mined,
    tradeRevenue: state.stats.tradeRevenue
  };
}

function tutorialProgress(step) {
  if (!step) return 0;
  const base = state.tutorial.baselines || {};
  if (step.id === "station_briefing") return state.docked && $("#hubTab")?.classList.contains("active") ? 1 : 0;
  if (step.id === "open_market") return $("#marketTab")?.classList.contains("active") ? 1 : 0;
  if (step.id === "undock") return state.docked ? 0 : 1;
  if (step.id === "mine_ore") return Math.max(0, state.stats.mined - (base.mined || 0));
  if (step.id === "dock_again") return state.docked ? 1 : 0;
  if (step.id === "sell_cargo") return state.stats.tradeRevenue > (base.tradeRevenue || 0) ? 1 : 0;
  if (step.id === "view_regional_quotes") return $("#marketTab")?.classList.contains("active") && marketViewSystem() !== state.currentSystem ? 1 : 0;
  if (step.id === "open_hangar") return $("#hangarTab")?.classList.contains("active") ? 1 : 0;
  if (step.id === "open_contracts") return $("#contractsTab")?.classList.contains("active") ? 1 : 0;
  return 0;
}

function completeTutorialStep(step) {
  if (!step) return;
  if (step.reward) {
    state.credits += step.reward;
    flashWallet();
    addFeed(`边境飞行员执照奖励：${formatNumber(step.reward)} ISK。`);
    toast(`执照奖励 +${formatNumber(step.reward)} ISK`);
  }
  state.tutorial.step += 1;
  state.tutorial.enteredStep = null;
  state.tutorial.baselines = {};
  if (state.tutorial.step >= TUTORIAL_STEPS.length) {
    state.tutorial.active = false;
    state.tutorial.completed = true;
    addFeed("边境飞行员执照已签发。后续可自由选择跑商、采矿、战斗或探索路线。");
  }
  if (state.docked) renderStation();
  saveGame();
}

function updateTutorial() {
  const step = currentTutorialStep();
  if (!step) {
    renderTutorial(null, 0);
    return;
  }
  ensureTutorialStepBaseline(step);
  const progress = tutorialProgress(step);
  if (progress >= step.target) completeTutorialStep(step);
  const nextStep = currentTutorialStep();
  renderTutorial(nextStep, nextStep === step ? progress : tutorialProgress(nextStep));
}

function renderTutorial(step, progress) {
  const card = $("#tutorialCard");
  if (!card) return;
  const done = !step;
  card.classList.toggle("completed", done);
  if (done) {
    const focus = careerPathProgress(trackedCareerId());
    const next = focus.goals.find(goal => goal.current < goal.target) || focus.goals[focus.goals.length - 1];
    const isEn = settings.language === "en";
    card.classList.remove("completed");
    $("#tutorialTitle").textContent = isEn ? "Career Path" : "职业航迹";
    $("#tutorialContent").innerHTML = `
      <div class="tutorial-step-label"><span>${isEn ? focus.path.en : focus.path.name}</span><b>${Math.round(focus.pct)}%</b></div>
      <div class="tutorial-objective">${focus.completed ? (isEn ? "Path badge earned" : "路线徽章已获得") : (isEn ? next.en : next.label)}</div>
      <p class="tutorial-hint">${isEn ? "Every activity counts even when another path is tracked." : "未追踪的路线也会同步累计；停靠后可在任务大厅切换。"}</p>
      <div class="tutorial-progress"><i style="width:${focus.pct}%"></i></div>
      <div class="tutorial-reward"><span>${formatNumber(Math.min(next.current, next.target))} / ${formatNumber(next.target)}</span><b>${isEn ? "Identity badge" : "身份徽章"}</b></div>`;
    return;
  }
  const index = state.tutorial.step + 1;
  const pct = clamp(progress / step.target * 100, 0, 100);
  $("#tutorialTitle").textContent = settings.language === "en" ? "Pilot License" : "飞行员执照";
  const label = settings.language === "en" ? "Frontier License" : "边境飞行员执照";
  const reward = step.reward ? `${formatNumber(step.reward)} ISK` : (settings.language === "en" ? "Training" : "执照训练");
  $("#tutorialContent").innerHTML = `
    <div class="tutorial-step-label"><span>${label} · ${step.track || ""}</span><b>${index}/${TUTORIAL_STEPS.length}</b></div>
    <div class="tutorial-objective">${step.title}</div>
    <p class="tutorial-hint">${step.hint}</p>
    <div class="tutorial-progress"><i style="width:${pct}%"></i></div>
    <div class="tutorial-reward"><span>${Math.floor(progress)} / ${step.target}</span><b>${reward}</b></div>`;
}

function updateStationModeLabel(tabId) {
  const zh = settings.language !== "en";
  const labels = zh ? {
    hub: "DOCKED · 星港中枢",
    market: "DOCKED · 市场终端",
    shipyard: "DOCKED · 舰船维护",
    contracts: "DOCKED · 任务大厅",
    hangar: "DOCKED · 仓库货舱",
    intel: "DOCKED · 情报终端"
  } : {
    hub: "DOCKED · STARPORT HUB",
    market: "DOCKED · MARKET TERMINAL",
    shipyard: "DOCKED · SERVICE BAY",
    contracts: "DOCKED · CONTRACT HALL",
    hangar: "DOCKED · HANGAR HOLD",
    intel: "DOCKED · INTEL TERMINAL"
  };
  const node = $("#stationModeLabel");
  if (node) node.textContent = labels[tabId] || labels.hub;
}

function activateStationTab(tabId, options = {}) {
  if (tabId === "map") {
    openMap();
    return;
  }
  if (tabId === "settings") {
    openSettings();
    return;
  }
  const target = $(`#${tabId}Tab`);
  if (!target) return;
  $$(".station-tabs button").forEach(button => button.classList.toggle("active", button.dataset.stationTab === tabId));
  $$(".station-tab").forEach(tab => tab.classList.toggle("active", tab === target));
  updateStationModeLabel(tabId);
  if (!options.skipRender) renderStation();
}

function openHubModule(module) {
  if (module === "settings") return openSettings();
  if (module === "map") return openMap();
  activateStationTab(module);
}

function handleStoryAction(action) {
  if (!action) return;
  if (action === "undock") return state.docked ? undock() : toast("已在星系空间，寻找矿石、敌对势力或航线目标");
  if (action === "map") return openMap();
  if (action === "hub") return activateStationTab("hub");
  if (["market", "shipyard", "contracts", "hangar", "intel"].includes(action)) return activateStationTab(action);
}

function openStation() {
  const system = SYSTEMS[state.currentSystem];
  state.story = { ...(state.story || {}), dockedOnce: true };
  $("#stationPanel").classList.remove("hidden");
  $("#stationTitle").textContent = system.station;
  $("#stationTrait").textContent = system.trait;
  selectedMarketSystem = state.currentSystem;
  activateStationTab("hub", { skipRender: true });
  renderStation();
}

function renderStation() {
  if (state.docked) rememberCurrentMarket();
  renderHub();
  renderMarket();
  renderUpgrades();
  renderContracts();
  renderHangar();
  renderIntel();
  const stats = shipStats();
  const repairCost = Math.ceil((stats.maxHull - state.hull) * 8 + (stats.maxShield - state.shield) * 1.5);
  $("#repairCost").textContent = repairCost ? `${formatNumber(repairCost)} ISK` : "完好";
  $("#repairBtn").disabled = repairCost <= 0;
}

function stationThreatText(value) {
  if (settings.language === "en") {
    if (value < 15) return "Stable";
    if (value < 40) return "Controlled";
    if (value < 70) return "Danger";
    return "Critical";
  }
  if (value < 15) return "稳定";
  if (value < 40) return "受控";
  if (value < 70) return "危险";
  return "高危";
}

function marketViewSystem() {
  if (!selectedMarketSystem || !SYSTEMS[selectedMarketSystem]) selectedMarketSystem = state.currentSystem;
  return selectedMarketSystem;
}

function canTradeViewedMarket() {
  return state.docked && marketViewSystem() === state.currentSystem;
}

function renderMarketSystemPicker() {
  const picker = $("#marketSystemSelect");
  if (!picker) return;
  const currentValue = marketViewSystem();
  picker.innerHTML = Object.entries(SYSTEMS).map(([id]) => {
    const label = localizedSystem(id).station;
    const suffix = id === state.currentSystem ? (settings.language === "en" ? " · Docked" : " · 当前") : "";
    return `<option value="${id}">${label}${suffix}</option>`;
  }).join("");
  picker.value = currentValue;
  $("#marketSystemLabel").textContent = settings.language === "en" ? "Quote Station" : "行情站点";
}

function renderHub() {
  const text = UI_TEXT[settings.language] || UI_TEXT.zh;
  const system = SYSTEMS[state.currentSystem];
  const label = localizedSystem(state.currentSystem);
  const stats = shipStats();
  const activeHull = activeShipHull();
  const repairCost = Math.ceil((stats.maxHull - state.hull) * 8 + (stats.maxShield - state.shield) * 1.5);
  const cargoUsedNow = cargoUsed();
  const localPilots = aiPilots.filter(pilot => pilot.system === state.currentSystem).length;
  const threatValue = state.systemThreat[state.currentSystem] || 0;
  const scarce = Object.keys(GOODS).filter(key => state.markets[state.currentSystem][key].stock < system.stock[key] * .35).length;
  const activeContracts = CONTRACT_LIBRARY.filter(contract => contract.id !== state.mission?.id).length;
  const signals = collectMarketSignals();
  const primarySignal = signals[0];
  const storyFocus = currentStoryFocus();
  const upgradeLevel = Object.values(state.upgrades || {}).reduce((sum, value) => sum + value, 0);
  const shieldPct = Math.round((state.shield / Math.max(1, stats.maxShield)) * 100);
  const hullPct = Math.round((state.hull / Math.max(1, stats.maxHull)) * 100);
  const rankLabel = settings.language === "en"
    ? `Frontier License · MK ${String(upgradeLevel + 1).padStart(2, "0")}`
    : `边境飞行执照 · MK ${String(upgradeLevel + 1).padStart(2, "0")}`;

  if ($("#pilotCallsign")) $("#pilotCallsign").textContent = settings.language === "en" ? "Frontier Pilot" : "边境飞行员";
  if ($("#pilotRank")) $("#pilotRank").textContent = rankLabel;
  if ($("#pilotWallet")) $("#pilotWallet").textContent = `${formatNumber(state.credits)} ISK`;
  if ($("#pilotCargo")) $("#pilotCargo").textContent = `${cargoUsedNow} / ${stats.cargo}`;
  if ($("#hubShipClass")) $("#hubShipClass").textContent = `${settings.language === "en" ? activeHull.en.toUpperCase() : activeHull.name} · MK ${upgradeLevel + 1}`;
  if ($("#hubShipIntegrity")) $("#hubShipIntegrity").textContent = settings.language === "en" ? `Shield ${shieldPct}% · Hull ${hullPct}%` : `护盾 ${shieldPct}% · 装甲 ${hullPct}%`;
  const dockedShipModel = $(".dock-showcase .docked-ship");
  if (dockedShipModel) dockedShipModel.dataset.hull = state.activeShip;
  const hubUndock = $("#hubUndockBtn");
  if (hubUndock) {
    hubUndock.querySelector("span").textContent = settings.language === "en" ? "Launch" : "离站";
    hubUndock.querySelector("strong").textContent = settings.language === "en" ? "UNDOCK" : "UNDOCK";
  }

  $("#hubKicker").textContent = text.stationCommand;
  $("#hubHeadline").textContent = settings.language === "en" ? `Docked at ${label.station}` : `已停靠：${label.station}`;
  $("#hubBriefing").textContent = settings.language === "en"
    ? "Use the top access bar. Tasks and contracts are collected in the mission desk."
    : "使用顶部功能栏。主线与合约统一收进任务入口。";
  $("#hubSecurityLabel").textContent = text.securityLevel;
  $("#hubTaxLabel").textContent = text.tradeTax;
  $("#hubThreatLabel").textContent = text.localThreat;
  $("#hubTrafficLabel").textContent = text.localTraffic;
  $("#hubSecurity").textContent = system.securityText;
  $("#hubTax").textContent = "2.5%";
  $("#hubThreat").textContent = stationThreatText(threatValue);
  $("#hubTraffic").textContent = settings.language === "en" ? `${localPilots} ships` : `${localPilots} 艘`;

  const moduleCopy = settings.language === "en" ? {
    market: ["Exchange", "Buy, sell, inspect order books and price history", scarce ? `${scarce} scarce` : "Online"],
    shipyard: ["Fitting", "Repair shields and hull; upgrade weapons and cargo", repairCost ? `${formatNumber(repairCost)} ISK` : "Ready"],
    contracts: ["Missions", "Main thread, contracts, hauling, mining and combat", `${activeContracts} open`],
    hangar: ["Storage", "Inspect inventory, cargo usage and local valuation", `${cargoUsedNow}/${stats.cargo}`],
    map: ["Map", "Review security, routes and jump options", `${state.fuel}/${state.maxFuel}`],
    intel: ["Intel", "Regional spreads, risk reports and pirate activity", stationThreatText(threatValue)],
    settings: ["Settings", "Fonts, graphics clarity, language, music and SFX", "Prefs"]
  } : {
    market: ["交易行", "买入、出售、查看买卖盘和价格走势", scarce ? `${scarce} 类紧缺` : "在线"],
    shipyard: ["改装", "维修护盾与装甲，升级武器和货舱", repairCost ? `${formatNumber(repairCost)} ISK` : "就绪"],
    contracts: ["任务", "主线、合约、运输、采矿与清剿", `${activeContracts} 份可接`],
    hangar: ["仓库", "查看库存、货舱占用与本地估值", `${cargoUsedNow}/${stats.cargo}`],
    map: ["星图", "查看星系安全、航线和跃迁条件", `${state.fuel}/${state.maxFuel}`],
    intel: ["情报", "地区价差、风险报告与海盗活动", stationThreatText(threatValue)],
    settings: ["设置", "字体、清晰度、语言、音乐和音效", "偏好"]
  };
  Object.entries(moduleCopy).forEach(([key, [title, copy, status]]) => {
    const titleNode = $(`[data-module-title="${key}"]`);
    const copyNode = $(`[data-module-copy="${key}"]`);
    const statusNode = $(`[data-module-status="${key}"]`);
    if (titleNode) titleNode.textContent = title;
    if (copyNode) copyNode.textContent = copy;
    if (statusNode) statusNode.textContent = status;
  });

  const storyPulse = $("#hubStoryPulse");
  if (storyPulse) {
    storyPulse.dataset.storyAction = "contracts";
    storyPulse.innerHTML = `
      <div>
        <span>${settings.language === "en" ? "MISSION DESK" : "任务"}</span>
        <strong>${storyFocus.allDone ? (settings.language === "en" ? "Open Frontier" : "自由边境") : storyFocus.next.label}</strong>
        <p>${settings.language === "en" ? "Main thread and station contracts are inside." : "主线目标与空间站合约已收进任务大厅。"}</p>
      </div>
      <em>${settings.language === "en" ? "Open" : "查看"}</em>
      <i style="width:${storyFocus.pct}%"></i>`;
  }

  const news = [];
  news.push({
    level: threatValue >= 65 ? "danger" : threatValue >= 35 ? "warn" : "",
    text: settings.language === "en" ? `Route security: ${stationThreatText(threatValue)} · ${system.risk}` : `航线安全：${stationThreatText(threatValue)} · ${system.risk}`,
    tag: "SEC"
  });
  news.push({
    level: primarySignal ? "warn" : "",
    text: primarySignal
      ? (settings.language === "en"
        ? `${localizedSystem(primarySignal.systemId).station} · ${localizedGood(primarySignal.itemKey).name}: ${primarySignal.tags.join(" / ")}`
        : `${localizedSystem(primarySignal.systemId).station} · ${localizedGood(primarySignal.itemKey).name}：${primarySignal.tags.join(" / ")}`)
      : (settings.language === "en" ? "No unusual market pressure in synced stations" : "已同步市场暂无异常压力"),
    tag: "MKT"
  });
  news.push({
    level: state.mission ? "" : "warn",
    text: state.mission
      ? (settings.language === "en" ? `Active contract: ${state.mission.title}` : `当前合约：${state.mission.title}`)
      : (settings.language === "en" ? "Contract hall has open work orders" : "任务大厅有可领取合约"),
    tag: "JOB"
  });
  news.push({
    level: storyFocus.allDone ? "" : "warn",
    text: storyFocus.allDone
      ? (settings.language === "en" ? "Main thread no longer constrains play: free career development" : "主线不再约束玩法：自由职业发展已开放")
      : (settings.language === "en" ? `Main thread: ${storyFocus.next.label}` : `主线下一步：${storyFocus.next.label}`),
    tag: "MAIN"
  });
  news.push({
    level: "",
    text: settings.language === "en"
      ? `${localPilots} simulated pilots are moving goods in this system`
      : `${localPilots} 名模拟玩家正在本地搬运货物`,
    tag: "AI"
  });
  $("#hubNewsFeed").innerHTML = news.map(item => `
    <div class="${item.level}"><i></i><span>${item.text}</span><b>${item.tag}</b></div>
  `).join("");
}

function renderMarket() {
  const systemId = state.currentSystem;
  const system = SYSTEMS[systemId];
  const market = state.markets[systemId];
  const scarce = Object.keys(GOODS).filter(key => market[key].stock < system.stock[key] * .35).length;
  $("#marketSummary").textContent = settings.language === "en"
    ? (scarce ? `${scarce} product categories are in short supply` : "Market liquidity is normal")
    : (scarce ? `${scarce} 类商品供应紧张` : "市场流动性正常");
  const localSignals = collectMarketSignals().filter(signal => signal.systemId === systemId);
  $("#marketAdvisor").textContent = localSignals.length
    ? (settings.language === "en"
      ? `Local pressure: ${localSignals.slice(0, 2).map(signal => `${localizedGood(signal.itemKey).name} ${signal.tags[0]}`).join(" · ")}`
      : `本站压力：${localSignals.slice(0, 2).map(signal => `${localizedGood(signal.itemKey).name}${signal.tags[0]}`).join(" · ")}`)
    : (settings.language === "en" ? "No obvious local pressure · compare your market journal" : "本站暂无明显压力 · 可对照市场手账自行判断");
  const filtered = Object.entries(GOODS).filter(([key]) => {
    const item = localizedGood(key);
    return item.name.toLowerCase().includes(marketSearchText.toLowerCase()) || item.description.toLowerCase().includes(marketSearchText.toLowerCase());
  });
  $("#marketItemList").innerHTML = filtered.map(([key, item]) => {
    const label = localizedGood(key);
    const price = marketPrice(systemId, key, "buy");
    const change = (price / item.base - 1) * 100;
    return `
      <button class="market-list-item ${selectedMarketItem === key ? "active" : ""}" data-market-item="${key}" style="--item-color:${item.color}">
        <span class="market-list-icon">${item.icon}</span>
        <span><strong>${label.name}</strong><small>${settings.language === "en" ? "Stock" : "库存"} ${Math.floor(market[key].stock)} · ${settings.language === "en" ? "Owned" : "持有"} ${state.cargo[key] || 0}</small></span>
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
  const label = localizedGood(itemKey);
  const market = state.markets[systemId][itemKey];
  const buyPrice = marketPrice(systemId, itemKey, "buy");
  const sellPrice = marketPrice(systemId, itemKey, "sell");
  const currentPrice = marketMode === "buy" ? buyPrice : sellPrice;
  const change = (currentPrice / item.base - 1) * 100;
  const owned = state.cargo[itemKey] || 0;
  const available = marketMode === "buy" ? Math.floor(market.stock) : owned;

  $("#marketSelectedIcon").textContent = item.icon;
  $("#marketSelectedIcon").style.setProperty("--selected-color", item.color);
  $("#marketSelectedCategory").textContent = settings.language === "en"
    ? (itemKey === "ore" || itemKey === "crystal" ? "Resources & Industry" : "Ship Supplies & Salvage")
    : (itemKey === "ore" || itemKey === "crystal" ? "资源与工业原料" : "舰船补给与回收品");
  $("#marketSelectedName").textContent = label.name;
  $("#marketSelectedDescription").textContent = label.description;
  $("#marketMidPrice").textContent = `${formatNumber(Math.round((buyPrice + sellPrice) / 2))} ISK`;
  $("#marketPriceChange").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  $("#marketPriceChange").className = change > 0 ? "up" : "";
  $("#marketSpread").textContent = `${formatNumber(buyPrice - sellPrice)} ISK`;
  $("#ticketModeLabel").textContent = settings.language === "en" ? (marketMode === "buy" ? "Instant Buy" : "Instant Sell") : (marketMode === "buy" ? "立即购买" : "立即出售");
  $("#ticketAvailable").textContent = settings.language === "en" ? (marketMode === "buy" ? `Market Stock ${available}` : `Cargo Owned ${available}`) : (marketMode === "buy" ? `市场库存 ${available}` : `货舱持有 ${available}`);
  $("#selectedOwned").textContent = settings.language === "en" ? `${owned} units` : `${owned} 单位`;
  $("#executeTradeBtn").textContent = settings.language === "en" ? (marketMode === "buy" ? "Confirm Purchase" : "Confirm Sale") : (marketMode === "buy" ? "确认购买" : "确认出售");
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
    return `<div class="order-row ${order.owner === "player" ? "player-order" : ""}" style="--depth:${order.amount / max * 100}%" data-order-price="${order.price}" data-order-id="${order.id || ""}">
      <span>${formatNumber(order.amount)}${order.owner === "player" ? " · 你" : ""}</span><span>${formatNumber(order.price)}</span><span>${formatNumber(cumulative)}</span>
    </div>`;
  }).join("");
  $(`${selector}`).querySelectorAll(".order-row").forEach(row => row.addEventListener("click", () => {
    if (side === "sell" && marketMode === "sell" && $("#limitSellPrice")) {
      $("#limitSellPrice").value = String(Math.max(1, Math.round(Number(row.dataset.orderPrice) || 1)));
      $("#limitSellPrice").dataset.edited = "1";
      updateTradeTicket();
    }
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
  $("#regionalPrices").innerHTML = Object.entries(SYSTEMS).map(([id, system]) => {
    const live = id === state.currentSystem;
    const memory = state.marketMemory[id];
    const snapshot = live ? { sell: marketPrice(id, selectedMarketItem, "sell") } : memory?.prices?.[selectedMarketItem];
    const price = snapshot ? `${formatNumber(snapshot.sell)} ISK` : (settings.language === "en" ? "Unsynced" : "未同步");
    const age = live ? (settings.language === "en" ? "Live" : "实时") : marketMemoryAge(memory);
    return `<div class="regional-row"><span>${localizedSystem(id).station}<small>${age}</small></span><b>${price}</b></div>`;
  }).join("");
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
  const systemId = marketViewSystem();
  const history = [...state.markets[systemId][itemKey].history];
  while (history.length < 24) history.unshift(history[0] || GOODS[itemKey].base);
  history[history.length - 1] = marketPrice(systemId, itemKey);
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
    y: pad.t + (height - pad.t - pad.b) * (1 - (value - min) / Math.max(1, max - min)),
    value,
    index
  }));
  const stock = Math.floor(state.markets[systemId][itemKey].stock);
  marketChartCache = { systemId, itemKey, history, points, pad, width, height, min, max, stock };
  const gradient = c.createLinearGradient(0, pad.t, 0, height - pad.b);
  gradient.addColorStop(0, `${color}35`);
  gradient.addColorStop(1, `${color}00`);
  c.fillStyle = "rgba(137,165,215,.08)";
  points.forEach((point, index) => {
    const previous = history[index - 1] || point.value;
    const volumeSeed = Math.abs(point.value - previous) / Math.max(1, point.value) + (stock % 11) / 80;
    const barHeight = clamp(volumeSeed * 70, 5, 34);
    c.fillRect(point.x - 2, height - pad.b - barHeight, 4, barHeight);
  });
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
  if (marketChartHover?.active && marketChartHover.systemId === systemId && marketChartHover.itemKey === itemKey) {
    const point = points[marketChartHover.index] || points[points.length - 1];
    c.save();
    c.strokeStyle = "rgba(164,243,255,.45)";
    c.lineWidth = 1;
    c.setLineDash([3, 5]);
    c.beginPath(); c.moveTo(point.x, pad.t); c.lineTo(point.x, height - pad.b); c.stroke();
    c.beginPath(); c.moveTo(pad.l, point.y); c.lineTo(width - pad.r, point.y); c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#eaffff";
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath(); c.arc(point.x, point.y, 4.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
    updateChartTooltip(point);
  } else {
    $("#chartTooltip")?.classList.add("hidden");
  }
}

function updateChartTooltip(point) {
  const tooltip = $("#chartTooltip");
  if (!tooltip || !marketChartCache) return;
  const previous = marketChartCache.history[point.index - 1] || point.value;
  const change = previous ? (point.value / previous - 1) * 100 : 0;
  const period = point.index - marketChartCache.history.length + 1;
  tooltip.classList.remove("hidden");
  tooltip.style.left = `${clamp(point.x + 12, 8, marketChartCache.width - 150)}px`;
  tooltip.style.top = `${clamp(point.y - 58, 8, marketChartCache.height - 86)}px`;
  tooltip.innerHTML = `
    <b>${localizedSystem(marketChartCache.systemId).station}</b>
    <span>${settings.language === "en" ? "Cycle" : "周期"} ${period >= 0 ? (settings.language === "en" ? "Now" : "当前") : period}</span>
    <strong>${formatNumber(Math.round(point.value))} ISK</strong>
    <em class="${change > 0 ? "up" : change < 0 ? "down" : ""}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</em>
    <small>${settings.language === "en" ? "Stock" : "库存"} ${formatNumber(marketChartCache.stock)}</small>`;
}

function hideChartTooltip() {
  marketChartHover = null;
  $("#chartTooltip")?.classList.add("hidden");
  if (GOODS[selectedMarketItem]) requestAnimationFrame(() => drawMarketChart(selectedMarketItem));
}

function handleChartHover(event) {
  if (!marketChartCache || marketChartCache.itemKey !== selectedMarketItem || marketChartCache.systemId !== marketViewSystem()) {
    drawMarketChart(selectedMarketItem);
  }
  if (!marketChartCache) return;
  const chart = $("#marketChart");
  const rect = chart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const nearest = marketChartCache.points.reduce((best, point, index) => {
    const distance = Math.abs(point.x - x);
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Infinity });
  marketChartHover = {
    active: true,
    index: nearest.index,
    systemId: marketChartCache.systemId,
    itemKey: marketChartCache.itemKey
  };
  requestAnimationFrame(() => drawMarketChart(marketChartCache.itemKey));
}

function renderMarketSystemPicker() {
  const picker = $("#marketSystemSelect");
  if (!picker) return;
  const currentValue = marketViewSystem();
  picker.innerHTML = Object.entries(SYSTEMS).map(([id]) => {
    const label = localizedSystem(id).station;
    const suffix = id === state.currentSystem ? (settings.language === "en" ? " · Docked" : " · 当前") : "";
    return `<option value="${id}">${label}${suffix}</option>`;
  }).join("");
  picker.value = currentValue;
  $("#marketSystemLabel").textContent = settings.language === "en" ? "Quote Station" : "行情站点";
}

function renderMarket() {
  const systemId = marketViewSystem();
  const system = SYSTEMS[systemId];
  const market = state.markets[systemId];
  const local = canTradeViewedMarket();
  renderMarketSystemPicker();
  const scarce = Object.keys(GOODS).filter(key => market[key].stock < system.stock[key] * .35).length;
  $("#marketSummary").textContent = settings.language === "en"
    ? `${localizedSystem(systemId).station} · ${local ? "local trading enabled" : "quote view only"}${scarce ? ` · ${scarce} scarce` : ""}`
    : `${localizedSystem(systemId).station} · ${local ? "本地可交易" : "远程仅看行情"}${scarce ? ` · ${scarce}类紧缺` : ""}`;
  const signals = collectMarketSignals().filter(signal => signal.systemId === systemId);
  $("#marketAdvisor").textContent = signals.length
    ? (settings.language === "en"
      ? `Market pressure: ${signals.slice(0, 2).map(signal => `${localizedGood(signal.itemKey).name} ${signal.tags[0]}`).join(" · ")}`
      : `市场压力：${signals.slice(0, 2).map(signal => `${localizedGood(signal.itemKey).name}${signal.tags[0]}`).join(" · ")}`)
    : (settings.language === "en" ? "No obvious pressure · goods do not teleport between stations" : "暂无明显压力 · 物品不会在空间站之间瞬移");
  const filtered = Object.entries(GOODS).filter(([key]) => {
    const item = localizedGood(key);
    return item.name.toLowerCase().includes(marketSearchText.toLowerCase()) || item.description.toLowerCase().includes(marketSearchText.toLowerCase());
  });
  $("#marketItemList").innerHTML = filtered.map(([key, item]) => {
    const label = localizedGood(key);
    const price = marketPrice(systemId, key, "buy");
    const change = (price / item.base - 1) * 100;
    const ownedLabel = local ? `${localItemAmount(key)}` : (settings.language === "en" ? "remote" : "远程");
    return `
      <button class="market-list-item ${selectedMarketItem === key ? "active" : ""}" data-market-item="${key}" style="--item-color:${item.color}" title="${label.description} · ${settings.language === "en" ? "Stock" : "库存"} ${Math.floor(market[key].stock)} · ${settings.language === "en" ? "Local owned" : "本地持有"} ${ownedLabel}">
        <span class="market-list-icon"><img src="${MARKET_ITEM_IMAGES[key]}" alt=""></span>
        <span><strong>${label.name}</strong></span>
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
  const systemId = marketViewSystem();
  const itemKey = selectedMarketItem;
  const item = GOODS[itemKey];
  const label = localizedGood(itemKey);
  const market = state.markets[systemId][itemKey];
  const buyPrice = marketPrice(systemId, itemKey, "buy");
  const sellPrice = marketPrice(systemId, itemKey, "sell");
  const currentPrice = marketMode === "buy" ? buyPrice : sellPrice;
  const change = (currentPrice / item.base - 1) * 100;
  const local = canTradeViewedMarket();
  const owned = local ? localItemAmount(itemKey) : 0;
  const available = marketMode === "buy" ? Math.floor(market.stock) : owned;

  $("#marketSelectedImage").src = MARKET_ITEM_IMAGES[itemKey];
  $("#marketSelectedImage").alt = label.name;
  $("#marketSelectedIcon").style.setProperty("--selected-color", item.color);
  $("#marketSelectedCategory").textContent = settings.language === "en"
    ? (itemKey === "ore" || itemKey === "crystal" ? "Resources & Industry" : "Ship Supplies & Salvage")
    : (itemKey === "ore" || itemKey === "crystal" ? "资源与工业原料" : "舰船补给与回收品");
  $("#marketSelectedName").textContent = label.name;
  $("#marketSelectedDescription").textContent = label.description;
  $("#marketSelectedDescription").title = label.description;
  $("#marketMidPrice").textContent = `${formatNumber(Math.round((buyPrice + sellPrice) / 2))} ISK`;
  $("#marketPriceChange").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  $("#marketPriceChange").className = change > 0 ? "up" : "";
  $("#marketSpread").textContent = `${formatNumber(buyPrice - sellPrice)} ISK`;
  $("#ticketModeLabel").textContent = local
    ? (settings.language === "en" ? (marketMode === "buy" ? "Instant Buy" : "Instant Sell") : (marketMode === "buy" ? "立即购买" : "立即出售"))
    : (settings.language === "en" ? "Quote Only" : "仅查看行情");
  $("#ticketAvailable").textContent = local
    ? (settings.language === "en" ? (marketMode === "buy" ? `Market Stock ${available}` : `Local Owned ${available}`) : (marketMode === "buy" ? `市场库存 ${available}` : `本地持有 ${available}`))
    : (settings.language === "en" ? `Dock at ${localizedSystem(systemId).station} to trade` : `需前往 ${localizedSystem(systemId).station} 交易`);
  $("#selectedOwned").textContent = settings.language === "en" ? `${localItemAmount(itemKey)} local units` : `${localItemAmount(itemKey)} 本地单位`;
  $("#executeTradeBtn").textContent = local
    ? (settings.language === "en" ? (marketMode === "buy" ? "Confirm Purchase" : "Submit Sell Order") : (marketMode === "buy" ? "确认购买" : "提交卖单"))
    : (settings.language === "en" ? "Travel Required" : "需要前往该站");
  $("#executeTradeBtn").classList.toggle("sell", marketMode === "sell");
  $(".market-ticket")?.classList.toggle("sell-mode", marketMode === "sell");
  $("#limitSellField")?.classList.toggle("hidden", marketMode !== "sell");

  const quantityInput = $("#tradeQuantity");
  const limitSellInput = $("#limitSellPrice");
  if (limitSellInput) {
    const stalePrice = limitSellInput.dataset.item !== itemKey || limitSellInput.dataset.system !== systemId || limitSellInput.dataset.mode !== marketMode;
    if (stalePrice || !limitSellInput.dataset.edited) {
      limitSellInput.value = String(sellPrice);
      limitSellInput.dataset.edited = "";
    }
    limitSellInput.dataset.item = itemKey;
    limitSellInput.dataset.system = systemId;
    limitSellInput.dataset.mode = marketMode;
  }
  const maxAmount = Math.max(1, available);
  quantityInput.max = maxAmount;
  quantityInput.value = String(clamp(Number(quantityInput.value) || 1, 1, maxAmount));
  updateTradeTicket();

  const syntheticSellOrders = Array.from({ length: 6 }, (_, index) => {
    const price = buyPrice + index * Math.max(1, Math.round(buyPrice * .012));
    const amount = Math.max(1, Math.round(market.stock * (.035 + index * .013)));
    return { price, amount };
  });
  const sellOrders = [...syntheticSellOrders, ...playerSellOrders(systemId, itemKey).map(order => ({
    price: order.price,
    amount: order.amount,
    owner: "player",
    id: order.id
  }))].sort((a, b) => b.price - a.price || b.amount - a.amount);
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

function updateTradeTicket() {
  if (!GOODS[selectedMarketItem]) return;
  const amount = Math.max(1, Number($("#tradeQuantity").value) || 1);
  const systemId = marketViewSystem();
  const bestBid = marketPrice(systemId, selectedMarketItem, "sell");
  const price = marketMode === "sell"
    ? Math.max(1, Math.round(Number($("#limitSellPrice")?.value) || bestBid))
    : marketPrice(systemId, selectedMarketItem, "buy");
  const gross = amount * price;
  const fee = Math.max(1, Math.round(gross * .025));
  $("#tradeTotal").textContent = `${formatNumber(marketMode === "buy" ? gross + fee : gross - fee)} ISK`;
  $("#tradeFee").textContent = canTradeViewedMarket()
    ? (marketMode === "sell"
      ? (price <= bestBid
        ? (settings.language === "en" ? `Immediate fill at bid ${formatNumber(bestBid)} · Tax ${formatNumber(fee)}` : `可即时成交 · 当前买盘 ${formatNumber(bestBid)} · 税费 ${formatNumber(fee)}`)
        : (settings.language === "en" ? `Limit ask ${formatNumber(price)} · waits for matching` : `限价挂单 ${formatNumber(price)} · 等待撮合`))
      : (settings.language === "en" ? `Turnover ${formatNumber(gross)} · Tax ${formatNumber(fee)}` : `成交额 ${formatNumber(gross)} · 税费 ${formatNumber(fee)}`))
    : (settings.language === "en" ? "Quote only · physical travel required" : "仅行情 · 需实体运输前往");
  $("#executeTradeBtn").disabled = !canTradeViewedMarket();
}

function executeMarketTrade() {
  if (!canTradeViewedMarket()) return toast("远程市场只能查看行情，必须驾驶战舰前往该空间站交易");
  const amount = Math.max(1, Math.floor(Number($("#tradeQuantity").value) || 1));
  if (marketMode === "buy") buyItem(selectedMarketItem, amount);
  else placeLimitSellOrder(selectedMarketItem, amount, Number($("#limitSellPrice")?.value));
}

function renderMarketSidebar() {
  const stats = shipStats();
  const usage = cargoUsed();
  $("#marketCargoUsage").textContent = `${usage} / ${stats.cargo}`;
  $("#marketCargoBar").style.width = `${clamp(usage / stats.cargo * 100, 0, 100)}%`;
  const recentWindow = Date.now() - 60000;
  $("#aiTradeRate").textContent = `${aiTradeLog.filter(entry => entry.time > recentWindow).length} ${settings.language === "en" ? "trades/min" : "笔/分"}`;
  $("#aiTradeFeed").innerHTML = aiTradeLog.slice(0, 7).map(entry => `
    <div class="ai-trade-row"><span><b>${entry.pilot}</b> ${entry.side === "buy" ? "买入" : "卖出"} ${localizedGood(entry.item).name} ×${entry.amount}</span><b class="${entry.side === "sell" ? "sell" : ""}">${formatNumber(entry.price)}</b></div>
  `).join("") || `<div class="ai-trade-row"><span>${settings.language === "en" ? "Waiting for pilot trade data..." : "等待玩家成交数据…"}</span><b>—</b></div>`;
  $("#regionalPrices").innerHTML = Object.entries(SYSTEMS).map(([id]) => {
    const live = id === state.currentSystem;
    const viewed = id === marketViewSystem();
    const memory = state.marketMemory[id];
    const snapshot = live ? { sell: marketPrice(id, selectedMarketItem, "sell") } : memory?.prices?.[selectedMarketItem];
    const price = snapshot ? `${formatNumber(snapshot.sell)} ISK` : (settings.language === "en" ? "Unsynced" : "未同步");
    const age = live ? (settings.language === "en" ? "Live" : "实时") : marketMemoryAge(memory);
    return `<div class="regional-row ${viewed ? "active" : ""}"><span>${localizedSystem(id).station}<small>${age}</small></span><b>${price}</b></div>`;
  }).join("");
  const orders = playerSellOrders(marketViewSystem(), selectedMarketItem);
  $("#playerOrderCount").textContent = settings.language === "en" ? `${orders.length} orders` : `${orders.length} 单`;
  $("#playerOrdersPanel").innerHTML = orders.length ? orders.map(order => `
    <div class="player-order-row">
      <span>${localizedGood(order.itemKey).name}<small>${formatNumber(order.amount)} × ${formatNumber(order.price)} ISK</small></span>
      <button data-cancel-order="${order.id}">${settings.language === "en" ? "Cancel" : "撤单"}</button>
    </div>
  `).join("") : `<div class="player-order-empty">${settings.language === "en" ? "No active sell orders for this item." : "当前商品暂无挂单。"}</div>`;
  $$("[data-cancel-order]").forEach(button => button.addEventListener("click", () => cancelPlayerOrder(button.dataset.cancelOrder)));
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
  const systemId = marketViewSystem();
  const history = [...state.markets[systemId][itemKey].history];
  while (history.length < 24) history.unshift(history[0] || GOODS[itemKey].base);
  history[history.length - 1] = marketPrice(systemId, itemKey);
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
    y: pad.t + (height - pad.t - pad.b) * (1 - (value - min) / Math.max(1, max - min)),
    value,
    index
  }));
  const stock = Math.floor(state.markets[systemId][itemKey].stock);
  marketChartCache = { systemId, itemKey, history, points, pad, width, height, min, max, stock };
  const gradient = c.createLinearGradient(0, pad.t, 0, height - pad.b);
  gradient.addColorStop(0, `${color}35`);
  gradient.addColorStop(1, `${color}00`);
  c.fillStyle = "rgba(137,165,215,.08)";
  points.forEach((point, index) => {
    const previous = history[index - 1] || point.value;
    const volumeSeed = Math.abs(point.value - previous) / Math.max(1, point.value) + (stock % 11) / 80;
    const barHeight = clamp(volumeSeed * 70, 5, 34);
    c.fillRect(point.x - 2, height - pad.b - barHeight, 4, barHeight);
  });
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
  if (marketChartHover?.active && marketChartHover.systemId === systemId && marketChartHover.itemKey === itemKey) {
    const point = points[marketChartHover.index] || points[points.length - 1];
    c.save();
    c.strokeStyle = "rgba(164,243,255,.45)";
    c.lineWidth = 1;
    c.setLineDash([3, 5]);
    c.beginPath(); c.moveTo(point.x, pad.t); c.lineTo(point.x, height - pad.b); c.stroke();
    c.beginPath(); c.moveTo(pad.l, point.y); c.lineTo(width - pad.r, point.y); c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#031521";
    c.strokeStyle = "rgba(164,243,255,.85)";
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(point.x, point.y, 4.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
    updateChartTooltip(point);
  } else {
    $("#chartTooltip")?.classList.add("hidden");
  }
}

function fittingPreviewMetrics(pluginId) {
  const plugin = PLUGINS[pluginId];
  if (!plugin) return [];
  const before = shipStats();
  const fitting = { ...(state.fittedPlugins || defaultState().fittedPlugins), [plugin.slot]: pluginId };
  const after = calculateShipStats(fitting, plugin.slot === "weapon" ? "fitted" : state.activeWeapon);
  const metric = (label, current, next, formatter = value => `${Math.round(value)}`, higherIsBetter = true) => {
    const delta = next - current;
    const threshold = Math.max(.0001, Math.abs(current) * .001);
    const direction = Math.abs(delta) <= threshold ? "neutral" : (delta * (higherIsBetter ? 1 : -1) > 0 ? "better" : "tradeoff");
    const deltaText = Math.abs(delta) <= threshold ? "—" : `${delta > 0 ? "+" : "−"}${formatter(Math.abs(delta))}`;
    return { label, value: formatter(next), deltaText, direction };
  };
  const metricMap = {
    weapon: [
      metric("单发", before.damage, after.damage),
      metric("射速", 1 / before.fireRate, 1 / after.fireRate, value => value.toFixed(1)),
      metric("热量", before.weaponHeatPerShot, after.weaponHeatPerShot, value => value.toFixed(1), false)
    ],
    defense: [
      metric("护盾", before.maxShield, after.maxShield),
      metric("装甲", before.maxHull, after.maxHull),
      metric("速度", before.speed, after.speed)
    ],
    engineering: [
      metric("速度", before.speed, after.speed),
      metric("推进恢复", before.boostRecovery, after.boostRecovery, value => value.toFixed(1))
    ],
    industrial: [
      metric("货舱", before.cargo, after.cargo),
      metric("采矿", before.miningRate, after.miningRate, value => value.toFixed(2)),
      metric("速度", before.speed, after.speed)
    ],
    electronic: [
      metric("弹道距离", before.projectileSpeed * before.bulletLife, after.projectileSpeed * after.bulletLife),
      metric("散布", before.spread * 1000, after.spread * 1000, value => value.toFixed(1), false)
    ]
  };
  return metricMap[plugin.slot] || [];
}

function renderFittingPreview(pluginId) {
  return `<div class="fitting-preview" aria-label="${settings.language === "en" ? "Simulated fitting changes" : "模拟安装变化"}">
    ${fittingPreviewMetrics(pluginId).map(item => `
      <span class="${item.direction}"><small>${item.label}</small><b>${item.value}</b><em>${item.deltaText}</em></span>
    `).join("")}
  </div>`;
}

function hullMaterialText(hull) {
  const entries = Object.entries(hull.inputs);
  if (!entries.length) return settings.language === "en" ? "Starter hull" : "初始舰体";
  return entries.map(([key, amount]) => {
    const current = localItemAmount(key);
    return `<span class="${current >= amount ? "" : "missing"}">${localizedGood(key).name} ${current}/${amount}</span>`;
  }).join(" · ");
}

function shipLocationText(shipId) {
  if (shipId === state.activeShip) return settings.language === "en" ? "ACTIVE" : "当前舰船";
  const location = state.ownedShips?.[shipId];
  if (!location) return settings.language === "en" ? "BLUEPRINT" : "蓝图";
  return location === state.currentSystem
    ? (settings.language === "en" ? "LOCAL HANGAR" : "本站机库")
    : localizedSystem(location).station;
}

function renderShipHullRoster() {
  const previewId = SHIP_HULLS[selectedHullPreview] ? selectedHullPreview : state.activeShip;
  const preview = SHIP_HULLS[previewId];
  $("#shipyardShipTitle").textContent = `${settings.language === "en" ? preview.en : preview.name} · ${settings.language === "en" ? preview.roleEn : preview.role}`;
  const previewOnly = previewId !== state.activeShip;
  $("#shipyardShipDescription").textContent = `${settings.language === "en" ? preview.descriptionEn : preview.description}${previewOnly ? (settings.language === "en" ? " Preview only; the fitting panel still belongs to your active ship." : " 当前仅预览舰体；右侧插件区仍属于正在使用的舰船。") : ""}`;
  $("#shipyardHullModel").dataset.hull = previewId;
  $("#shipHullRoster").innerHTML = Object.entries(SHIP_HULLS).map(([id, hull]) => {
    const active = id === state.activeShip;
    const owned = !!state.ownedShips?.[id];
    const local = state.ownedShips?.[id] === state.currentSystem;
    const canBuild = canCommissionShip(id);
    const action = active
      ? `<button disabled>${settings.language === "en" ? "Active" : "使用中"}</button>`
      : owned
        ? `<button data-switch-ship="${id}" ${local ? "" : "disabled"}>${local ? (settings.language === "en" ? "Activate" : "切换舰船") : (settings.language === "en" ? "Remote" : "异地停放")}</button>`
        : `<button data-commission-ship="${id}" ${canBuild ? "" : "disabled"}>${settings.language === "en" ? "Commission" : "建造委托"} · ${formatNumber(hull.cost)}</button>`;
    return `
      <article class="ship-hull-card ${active ? "active" : ""} ${previewId === id ? "previewing" : ""}" style="--hull-color:${hull.color}">
        <button class="ship-hull-select" data-preview-hull="${id}">
          <i>${hull.visual.model === "courier" ? "➤" : hull.visual.model === "prospector" ? "◆" : hull.visual.model === "vanguard" ? "⬢" : "△"}</i>
          <span><strong>${settings.language === "en" ? hull.en : hull.name}</strong><small>${settings.language === "en" ? hull.roleEn : hull.role}</small></span>
          <b>${shipLocationText(id)}</b>
        </button>
        <div class="hull-stat-strip"><span>盾 ${hull.stats.maxShield}</span><span>甲 ${hull.stats.maxHull}</span><span>舱 ${hull.stats.cargo}</span><span>速 ${hull.stats.speed}</span></div>
        <div class="hull-materials">${hullMaterialText(hull)}</div>
        ${action}
      </article>`;
  }).join("");
  $$("[data-preview-hull]").forEach(button => button.addEventListener("click", () => {
    selectedHullPreview = button.dataset.previewHull;
    renderShipHullRoster();
  }));
  $$("[data-commission-ship]").forEach(button => button.addEventListener("click", () => commissionShip(button.dataset.commissionShip)));
  $$("[data-switch-ship]").forEach(button => button.addEventListener("click", () => switchShip(button.dataset.switchShip)));
}

function renderUpgrades() {
  const store = pluginStore();
  const fitted = state.fittedPlugins || defaultState().fittedPlugins;
  renderShipHullRoster();
  $("#fittingPanel").innerHTML = `
    <div class="terminal-section-head"><strong>${settings.language === "en" ? "Ship Plugin Slots" : "舰船插件槽"}</strong><span>${settings.language === "en" ? "Station-local inventory" : "插件库存属于当前空间站"}</span></div>
    <div class="slot-grid">
      ${Object.entries(SHIP_SLOTS).map(([slot, slotInfo]) => {
        const pluginId = fitted[slot];
        const plugin = localizedPlugin(pluginId);
        return `
          <article class="slot-card ${plugin ? "filled" : ""}">
            <i>${slotInfo.icon}</i>
            <span><small>${settings.language === "en" ? slotInfo.en : slotInfo.name}</small><strong>${plugin ? plugin.name : (settings.language === "en" ? "Empty Slot" : "空槽位")}</strong></span>
            ${plugin ? `<button data-uninstall-plugin="${slot}">${settings.language === "en" ? "Remove" : "拆下"}</button>` : `<b>${settings.language === "en" ? "Ready" : "待安装"}</b>`}
          </article>`;
      }).join("")}
    </div>`;

  $("#pluginForge").innerHTML = `
    <div class="terminal-section-head"><strong>${settings.language === "en" ? "Plugin Blueprints" : "插件制造蓝图"}</strong><span>${settings.language === "en" ? "Craft before fitting" : "先制造，再安装"}</span></div>
    <div class="plugin-grid">
      ${Object.entries(PLUGINS).map(([id, raw]) => {
        const plugin = localizedPlugin(id);
        const canCraft = canCraftPlugin(id);
        const count = store[id] || 0;
        const installed = fitted[raw.slot] === id;
        const quote = procurementQuote(raw.inputs);
        return `
          <article class="plugin-card" style="--plugin-color:${raw.color}">
            <header><i>${raw.icon}</i><span><small>${plugin.slotName} · ${raw.rarity}</small><strong>${plugin.name}</strong></span><b>${count}</b></header>
            <p>${settings.language === "en" ? raw.description : raw.description}</p>
            ${renderFittingPreview(id)}
            <div class="craft-recipe">${pluginInputText(raw.inputs)}</div>
            <footer>
              <button class="procurement-button" data-procure-plugin="${id}" ${quote.canPurchase ? "" : "disabled"} title="${procurementButtonLabel(quote)}">⌑ ${procurementButtonLabel(quote)}</button>
              <button data-craft-plugin="${id}" ${canCraft ? "" : "disabled"}>${settings.language === "en" ? "Manufacture" : "制造"}</button>
              <button data-install-plugin="${id}" ${count > 0 && !installed ? "" : "disabled"}>${installed ? (settings.language === "en" ? "Installed" : "已安装") : (settings.language === "en" ? "Fit" : "安装")}</button>
            </footer>
          </article>`;
      }).join("")}
    </div>`;

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
  $$("[data-procure-plugin]").forEach(button => button.addEventListener("click", () => {
    const plugin = PLUGINS[button.dataset.procurePlugin];
    if (plugin) procureMaterials(plugin.inputs, localizedPlugin(button.dataset.procurePlugin).name);
  }));
  $$("[data-craft-plugin]").forEach(button => button.addEventListener("click", () => craftPlugin(button.dataset.craftPlugin)));
  $$("[data-install-plugin]").forEach(button => button.addEventListener("click", () => installPlugin(button.dataset.installPlugin)));
  $$("[data-uninstall-plugin]").forEach(button => button.addEventListener("click", () => uninstallPlugin(button.dataset.uninstallPlugin)));
}

function storyMetric(checkId) {
  const isEn = settings.language === "en";
  const upgradeLevel = Object.values(state.upgrades || {}).reduce((sum, value) => sum + value, 0);
  const visitedCount = new Set(state.visitedSystems || ["aurora"]).size;
  const dockedOnce = !!(state.story?.dockedOnce || state.docked);
  const metrics = {
    dockedOnce: {
      label: isEn ? "Dock at any station" : "完成一次空间站停靠",
      current: dockedOnce ? 1 : 0,
      target: 1,
      action: "hub",
      actionLabel: isEn ? "Open hub" : "查看中枢",
      guidance: isEn ? "The station is a concourse, not the market itself." : "空间站是入口，市场、仓库、改装和情报是不同模块。"
    },
    firstMining: {
      label: isEn ? "Mine 3 units of resources" : "采集 3 单位资源",
      current: state.stats.mined,
      target: 3,
      action: "undock",
      actionLabel: isEn ? "Undock to mine" : "离站采矿",
      guidance: isEn ? "Resources enter your ship cargo as real items." : "采集物会进入飞船货舱，属于真实物品。"
    },
    firstSale: {
      label: isEn ? "Sell any carried goods locally" : "在本地市场卖出货物",
      current: state.stats.tradeRevenue > 0 ? 1 : 0,
      target: 1,
      action: "market",
      actionLabel: isEn ? "Open market" : "打开市场",
      guidance: isEn ? "Selling adds stock to this station and moves price through supply." : "出售会增加本站库存，价格只由供需变化推动。"
    },
    regionalQuote: {
      label: isEn ? "Inspect another station quote" : "查看其他空间站行情",
      current: state.story?.viewedRemoteMarket ? 1 : 0,
      target: 1,
      action: "market",
      actionLabel: isEn ? "Quote browser" : "查看行情",
      guidance: isEn ? "Remote quotes are read-only. To buy, fly there." : "远程行情只读；要买便宜货，必须驾驶战舰前往当地。"
    },
    contractReputation: {
      label: isEn ? "Complete one public contract" : "完成 1 个公开合约",
      current: state.reputation,
      target: 1,
      action: "contracts",
      actionLabel: isEn ? "Contract hall" : "查看合约",
      guidance: isEn ? "Contracts are optional work orders, not market control." : "合约只是可选工作订单，不会直接操控市场价格。"
    },
    shipUpgrade: {
      label: isEn ? "Install any ship upgrade" : "安装任意舰船升级",
      current: upgradeLevel,
      target: 1,
      action: "shipyard",
      actionLabel: isEn ? "Ship fitting" : "舰船改装",
      guidance: isEn ? "Upgrade the ship to support your chosen profession." : "改装舰船，用来支撑你选择的职业路线。"
    },
    systemVisited: {
      label: isEn ? "Physically visit 2 systems" : "实际访问 2 个星系",
      current: visitedCount,
      target: 2,
      action: "map",
      actionLabel: isEn ? "Star map" : "打开星图",
      guidance: isEn ? "Prices differ because distance and transport matter." : "不同市场之间有距离，价格差需要真实运输来兑现。"
    },
    combatRecord: {
      label: isEn ? "Destroy one hostile ship" : "击毁 1 艘敌对舰船",
      current: state.stats.kills,
      target: 1,
      action: "undock",
      actionLabel: isEn ? "Undock" : "离站出航",
      guidance: isEn ? "Combat creates risk, loot and demand without forcing prices." : "战斗带来风险、战利品和消耗，但不直接改价。"
    },
    intelRecord: {
      label: isEn ? "Recover pirate intel" : "取得 1 份海盗情报",
      current: state.stats.intel,
      target: 1,
      action: "undock",
      actionLabel: isEn ? "Hunt intel" : "寻找情报",
      guidance: isEn ? "Intel comes from combat and outpost activity." : "情报来自战斗和据点活动。"
    },
    outpostRecord: {
      label: isEn ? "Clear one pirate outpost" : "清除 1 个海盗据点",
      current: state.stats.outposts,
      target: 1,
      action: "map",
      actionLabel: isEn ? "Risk map" : "查看星图",
      guidance: isEn ? "High-risk systems are more likely to expose outposts." : "高风险星系更容易出现海盗据点。"
    }
  };
  return { id: checkId, ...(metrics[checkId] || { label: checkId, current: 0, target: 1, action: "contracts", actionLabel: isEn ? "Open" : "查看", guidance: "" }) };
}

function chapterMetrics(chapter) {
  return chapter.checks.map(storyMetric);
}

function chapterDone(chapter) {
  return chapterMetrics(chapter).every(metric => metric.current >= metric.target);
}

function activeStoryChapter() {
  return STORY_CHAPTERS.find(chapter => !chapterDone(chapter)) || STORY_CHAPTERS[STORY_CHAPTERS.length - 1];
}

function currentStoryFocus() {
  const chapter = activeStoryChapter();
  const metrics = chapterMetrics(chapter);
  const next = metrics.find(metric => metric.current < metric.target) || metrics[metrics.length - 1];
  const completeCount = metrics.filter(metric => metric.current >= metric.target).length;
  const allDone = STORY_CHAPTERS.every(chapterDone);
  return {
    chapter,
    metrics,
    next,
    allDone,
    pct: clamp(completeCount / metrics.length * 100, 0, 100)
  };
}

function storyTitle(chapter, allDone) {
  if (allDone) return settings.language === "en" ? "Open Frontier" : "自由边境已开放";
  if (settings.language !== "en") return chapter.title;
  const titles = {
    license: "Chapter 1: Frontier Pilot License",
    contractor: "Chapter 2: Independent Contractor",
    frontier: "Chapter 3: Frontier Dossier"
  };
  return titles[chapter.id] || chapter.title;
}

function storySummary(chapter, allDone) {
  if (allDone) {
    return settings.language === "en"
      ? "You have proven the core loop. Continue as trader, miner, mercenary, explorer or industrialist."
      : "你已经打通核心循环。接下来可以作为商人、矿工、佣兵、探索者或制造商自由发展。";
  }
  if (settings.language !== "en") return chapter.summary;
  return "This dossier gives direction only. It does not calculate profits or manipulate markets.";
}

function storyRuleText() {
  return settings.language === "en"
    ? "Economy rule: story never forces prices. Prices move through stock, trades, production, loss and transport."
    : "经济规则：剧情不直接改价。价格只由库存、交易、生产、损耗与运输自然推动。";
}

function renderStoryPanel() {
  const panel = $("#storyPanel");
  if (!panel) return;
  const focus = currentStoryFocus();
  panel.classList.toggle("completed", focus.allDone);
  const nextText = focus.allDone
    ? (settings.language === "en" ? "Free development unlocked" : "自由发展已开放")
    : `${settings.language === "en" ? "Next" : "下一步"}：${focus.next.label}`;
  panel.innerHTML = `
    <div>
      <span class="story-kicker">${settings.language === "en" ? "FRONTIER DOSSIER" : "边境档案"}</span>
      <h3>${storyTitle(focus.chapter, focus.allDone)}</h3>
      <p>${storySummary(focus.chapter, focus.allDone)}</p>
      <div class="story-next"><span>${nextText}</span><button data-story-action="${focus.next.action}" ${focus.allDone ? "disabled" : ""}>${focus.allDone ? (settings.language === "en" ? "Unlocked" : "已开放") : focus.next.actionLabel}</button></div>
      <span class="story-rule">${storyRuleText()}</span>
    </div>
    <div class="story-objectives">
      ${focus.metrics.map(metric => {
        const done = metric.current >= metric.target;
        const value = `${formatNumber(Math.min(metric.current, metric.target))}/${formatNumber(metric.target)}`;
        return `<div class="story-objective ${done ? "done" : ""}"><span>${metric.label}<small>${metric.guidance}</small></span><b>${done ? "✓" : value}</b></div>`;
      }).join("")}
      <div class="story-meter"><i style="width:${focus.pct}%"></i></div>
    </div>`;
}

function renderContracts() {
  renderCareerJournal();
  renderStoryPanel();
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

function renderHangar() {
  const stats = shipStats();
  const used = cargoUsed();
  const entries = Object.entries(state.cargo).filter(([, amount]) => amount > 0);
  const totalValue = entries.reduce((sum, [key, amount]) => sum + marketPrice(state.currentSystem, key, "sell") * amount, 0);
  $("#hangarTitle").textContent = settings.language === "en" ? "Hangar & Cargo" : "仓库与货舱";
  $("#hangarCargoGrid").innerHTML = entries.length ? entries.map(([key, amount]) => {
    const item = GOODS[key];
    const label = localizedGood(key);
    const unitValue = marketPrice(state.currentSystem, key, "sell");
    return `
      <article class="hangar-cargo-item" style="--item-color:${item.color}">
        <i>${item.icon}</i>
        <span><strong>${label.name}</strong><span>${settings.language === "en" ? "Unit sell" : "本地卖出"} ${formatNumber(unitValue)} ISK · ${settings.language === "en" ? "Weight" : "重量"} ${item.weight}</span></span>
        <b>× ${amount}</b>
      </article>`;
  }).join("") : `<div class="hangar-empty">${settings.language === "en" ? "Cargo hold empty · find a route, mine ore, or loot wreckage." : "货舱为空 · 可以跑商、采矿或回收残骸。"}</div>`;
  $("#hangarUsageLabel").textContent = settings.language === "en" ? "Cargo Usage" : "货舱占用";
  $("#hangarValueLabel").textContent = settings.language === "en" ? "Local Sell Estimate" : "本地卖出估值";
  $("#hangarCargoUsage").textContent = `${used} / ${stats.cargo}`;
  $("#hangarCargoBar").style.width = `${clamp(used / stats.cargo * 100, 0, 100)}%`;
  $("#hangarHoldValue").textContent = `${formatNumber(totalValue)} ISK`;
  const shipRows = settings.language === "en"
    ? [["Shield", `${Math.ceil(state.shield)} / ${stats.maxShield}`], ["Hull", `${Math.ceil(state.hull)} / ${stats.maxHull}`], ["Damage", Math.round(stats.damage)], ["Mining Rate", `${stats.miningRate.toFixed(1)}x`], ["Speed", Math.round(stats.speed)], ["Jump Fuel", `${state.fuel} / ${state.maxFuel}`]]
    : [["护盾", `${Math.ceil(state.shield)} / ${stats.maxShield}`], ["装甲", `${Math.ceil(state.hull)} / ${stats.maxHull}`], ["火力", Math.round(stats.damage)], ["采矿效率", `${stats.miningRate.toFixed(1)}x`], ["速度", Math.round(stats.speed)], ["跃迁燃料", `${state.fuel} / ${state.maxFuel}`]];
  $("#hangarShipStats").innerHTML = shipRows.map(([name, value]) => `<div><span>${name}</span><b>${value}</b></div>`).join("");
  $("#hangarNotice").textContent = settings.language === "en"
    ? "Cargo travels with your ship. Regional prices move with inventory, AI trading and hostile activity."
    : "货物会随玩家移动，地区市场价格会根据库存、AI交易与敌对活动波动。";
}

function renderHangar() {
  const stats = shipStats();
  const used = cargoUsed();
  const store = stationStore();
  const cargoEntries = Object.entries(state.cargo).filter(([, amount]) => amount > 0);
  const storageEntries = Object.entries(store).filter(([, amount]) => amount > 0);
  const totalValue = [...cargoEntries, ...storageEntries].reduce((sum, [key, amount]) => sum + marketPrice(state.currentSystem, key, "sell") * amount, 0);
  $("#hangarTitle").textContent = settings.language === "en" ? "Local Station Storage" : "本地仓库与货舱";
  $("#shipCargoTitle").textContent = settings.language === "en" ? "Ship Cargo Hold" : "飞船货舱";
  $("#stationStorageTitle").textContent = settings.language === "en" ? `${localizedSystem(state.currentSystem).station} Storage` : `${localizedSystem(state.currentSystem).station} 仓库`;
  $("#craftingTitle").textContent = settings.language === "en" ? "Workshop" : "制作工坊";

  const cargoCard = ([key, amount]) => {
    const item = GOODS[key];
    const label = localizedGood(key);
    const unitValue = marketPrice(state.currentSystem, key, "sell");
    return `
      <article class="hangar-cargo-item" style="--item-color:${item.color}">
        <i>${item.icon}</i>
        <span><strong>${label.name}</strong><span>${settings.language === "en" ? "Local sell" : "本地卖出"} ${formatNumber(unitValue)} ISK · ${settings.language === "en" ? "Weight" : "重量"} ${item.weight}</span></span>
        <b>× ${amount}</b>
        <div class="hangar-actions"><button data-deposit-item="${key}">${settings.language === "en" ? "Store All" : "全部存入"}</button></div>
      </article>`;
  };
  const storageCard = ([key, amount]) => {
    const item = GOODS[key];
    const label = localizedGood(key);
    const room = cargoSpaceFor(key);
    return `
      <article class="hangar-cargo-item" style="--item-color:${item.color}">
        <i>${item.icon}</i>
        <span><strong>${label.name}</strong><span>${settings.language === "en" ? "Stored at this station" : "仅存放于当前空间站"} · ${settings.language === "en" ? "Can load" : "可装载"} ${room}</span></span>
        <b>× ${amount}</b>
        <div class="hangar-actions"><button data-withdraw-item="${key}" ${room <= 0 ? "disabled" : ""}>${settings.language === "en" ? "Load to Ship" : "装入飞船"}</button></div>
      </article>`;
  };
  $("#hangarCargoGrid").innerHTML = cargoEntries.length
    ? cargoEntries.map(cargoCard).join("")
    : `<div class="hangar-empty">${settings.language === "en" ? "Ship cargo is empty." : "飞船货舱为空。"}</div>`;
  $("#stationStorageGrid").innerHTML = storageEntries.length
    ? storageEntries.map(storageCard).join("")
    : `<div class="hangar-empty">${settings.language === "en" ? "This station storage is empty. Bought overflow and crafted goods stay here." : "本站仓库为空。货舱装不下的购买物和制作产物会留在这里。"}</div>`;

  $("#craftingGrid").innerHTML = CRAFTING_RECIPES.map(recipe => {
    const inputText = Object.entries(recipe.inputs).map(([key, amount]) => {
      const enough = localItemAmount(key) >= amount;
      return `<span class="${enough ? "" : "missing"}">${localizedGood(key).name} ${localItemAmount(key)}/${amount}</span>`;
    }).join(" · ");
    const canCraft = Object.entries(recipe.inputs).every(([key, amount]) => localItemAmount(key) >= amount);
    const outputAmount = craftedOutputAmount(recipe);
    const outputBonus = outputAmount - recipe.output.amount;
    const industry = STATION_INDUSTRY[state.currentSystem];
    const quote = procurementQuote(recipe.inputs);
    return `
      <article class="craft-card">
        <h4>${recipe.name}</h4>
        <p>${recipe.description}</p>
        <div class="craft-recipe">${inputText}<br><b>→ ${localizedGood(recipe.output.item).name} × ${outputAmount}</b></div>
        <small class="station-craft-bonus ${outputBonus > 0 ? "active" : ""}">${settings.language === "en" ? industry.en : industry.name}${outputBonus > 0 ? ` · +${outputBonus} ${settings.language === "en" ? "local yield" : "本地产出"}` : ""}</small>
        <div class="craft-actions">
          <button class="procurement-button" data-procure-recipe="${recipe.id}" ${quote.canPurchase ? "" : "disabled"} title="${procurementButtonLabel(quote)}">⌑ ${procurementButtonLabel(quote)}</button>
          <button data-craft-recipe="${recipe.id}" ${canCraft ? "" : "disabled"}>${settings.language === "en" ? "Craft to Storage" : "制作到仓库"}</button>
        </div>
      </article>`;
  }).join("");

  $("#hangarUsageLabel").textContent = settings.language === "en" ? "Cargo Usage" : "货舱占用";
  $("#hangarValueLabel").textContent = settings.language === "en" ? "Local Asset Estimate" : "本站资产估值";
  $("#hangarCargoUsage").textContent = `${used} / ${stats.cargo}`;
  $("#hangarCargoBar").style.width = `${clamp(used / stats.cargo * 100, 0, 100)}%`;
  $("#hangarHoldValue").textContent = `${formatNumber(totalValue)} ISK`;
  const shipRows = settings.language === "en"
    ? [["Shield", `${Math.ceil(state.shield)} / ${stats.maxShield}`], ["Hull", `${Math.ceil(state.hull)} / ${stats.maxHull}`], ["Damage", Math.round(stats.damage)], ["Mining Rate", `${stats.miningRate.toFixed(1)}x`], ["Speed", Math.round(stats.speed)], ["Jump Fuel", `${state.fuel} / ${state.maxFuel}`]]
    : [["护盾", `${Math.ceil(state.shield)} / ${stats.maxShield}`], ["装甲", `${Math.ceil(state.hull)} / ${stats.maxHull}`], ["火力", Math.round(stats.damage)], ["采矿效率", `${stats.miningRate.toFixed(1)}x`], ["速度", Math.round(stats.speed)], ["跃迁燃料", `${state.fuel} / ${state.maxFuel}`]];
  $("#hangarShipStats").innerHTML = shipRows.map(([name, value]) => `<div><span>${name}</span><b>${value}</b></div>`).join("");
  $("#hangarNotice").textContent = settings.language === "en"
    ? "Items physically exist at their location. Station storage is local; moving goods requires loading them into your ship and flying there."
    : "物品真实存在于所在地。空间站仓库彼此独立，搬运货物必须装入飞船并实际飞往目标站。";

  $$("[data-deposit-item]").forEach(button => button.addEventListener("click", () => depositCargo(button.dataset.depositItem)));
  $$("[data-withdraw-item]").forEach(button => button.addEventListener("click", () => withdrawCargo(button.dataset.withdrawItem)));
  $$("[data-procure-recipe]").forEach(button => button.addEventListener("click", () => {
    const recipe = CRAFTING_RECIPES.find(item => item.id === button.dataset.procureRecipe);
    if (recipe) procureMaterials(recipe.inputs, recipe.name);
  }));
  $$("[data-craft-recipe]").forEach(button => button.addEventListener("click", () => craftItem(button.dataset.craftRecipe)));
}

function renderIntel() {
  const current = state.currentSystem;
  const signals = collectMarketSignals();
  const synced = Object.keys(SYSTEMS).filter(id => id === current || state.marketMemory[id]).length;
  $("#marketSignals").innerHTML = signals.length ? `
    <div class="market-signals-main">
      <strong>${settings.language === "en" ? "Market Journal" : "市场手账"}</strong>
      <span>${settings.language === "en" ? "Signals show pressure, not guaranteed profit. You decide what to haul." : "这里只显示市场压力，不直接给出利润答案；倒卖价值由玩家自行判断。"}</span>
    </div>
    <div class="market-signal-metric"><span>${settings.language === "en" ? "Synced Stations" : "已同步市场"}</span><b>${synced}/${Object.keys(SYSTEMS).length}</b></div>
    <div class="market-signal-metric"><span>${settings.language === "en" ? "Pressure Signals" : "市场信号"}</span><b>${signals.length}</b></div>
    <div class="market-signal-metric risk"><span>${settings.language === "en" ? "Route Risk" : "航线风险"}</span><b>${stationThreatText(state.systemThreat[current] || 0)}</b></div>
  ` : `<div class="market-signals-empty">${settings.language === "en" ? "Dock at more stations to build a market journal." : "停靠更多空间站后，会逐步形成市场手账。"}</div>`;
  $("#tradeIntel").innerHTML = `<div class="intel-list">${signals.slice(0, 8).map(signal => `
    <div class="intel-row"><span>${localizedSystem(signal.systemId).station} · ${localizedGood(signal.itemKey).name} · ${signal.tags.join(" / ")} · ${signal.age}</span><b>${signal.live ? (settings.language === "en" ? "LIVE" : "实时") : (settings.language === "en" ? "LOG" : "手账")}</b></div>`).join("") || `<div class="intel-row"><span>${settings.language === "en" ? "No pressure signals in synced markets" : "已同步市场暂无压力信号"}</span><b>—</b></div>`}</div>`;
  $("#riskIntel").innerHTML = `<div class="intel-list">${SYSTEMS[current].links.map(id => {
    const system = SYSTEMS[id];
    return `<div class="intel-row"><span>${system.name} · ${system.securityText}</span><b class="${system.security < .5 ? "risk" : ""}">${system.risk}</b></div>`;
  }).join("")}</div>`;
}

function updateSystemHud() {
  const system = SYSTEMS[state.currentSystem];
  const label = localizedSystem(state.currentSystem);
  $("#systemName").textContent = label.name;
  $("#locationName").textContent = state.docked ? label.station : (settings.language === "en" ? "System Space" : "星系空间");
  const badge = $("#securityBadge");
  badge.textContent = system.securityText;
  badge.className = `security ${system.security >= .7 ? "safe" : system.security > 0 ? "low" : "null"}`;
}

function updateHud() {
  const stats = shipStats();
  const hull = activeShipHull();
  state.shield = Math.min(state.shield, stats.maxShield);
  state.hull = Math.min(state.hull, stats.maxHull);
  $("#credits").textContent = formatNumber(state.credits);
  $("#shipName").textContent = settings.language === "en" ? hull.en : hull.name;
  $("#shipVitals").dataset.hull = state.activeShip;
  $("#shieldText").textContent = `${Math.ceil(state.shield)} / ${stats.maxShield}`;
  $("#hullText").textContent = `${Math.ceil(state.hull)} / ${stats.maxHull}`;
  $("#fuelText").textContent = `${state.fuel} / ${state.maxFuel}`;
  const shieldPct = Math.round(state.shield / stats.maxShield * 100);
  const hullPct = Math.round(state.hull / stats.maxHull * 100);
  $("#shieldOrb").style.setProperty("--shield", `${shieldPct}%`);
  $("#shieldOrb").style.setProperty("--hull", `${hullPct}%`);
  $("#shieldOrbValue").textContent = shieldPct;
  $("#hullOrbValue").textContent = hullPct;
  $("#cargoStat").textContent = `${cargoUsed()}/${stats.cargo}`;
  const capacitorPct = clamp(state.capacitor / stats.maxCapacitor * 100, 0, 100);
  const heatPct = clamp(player.weaponHeat, 0, 100);
  $("#capacitorBar").style.width = `${capacitorPct}%`;
  $("#capacitorText").textContent = Math.round(capacitorPct);
  $("#weaponHeatBar").style.width = `${heatPct}%`;
  $("#weaponHeatText").textContent = Math.round(heatPct);
  const vitalStatus = $("#shipVitalStatus");
  if (hullPct <= 30) {
    vitalStatus.className = "critical";
    vitalStatus.innerHTML = "<i></i>危险";
  } else if (shieldPct <= 25) {
    vitalStatus.className = "warning";
    vitalStatus.innerHTML = "<i></i>护盾低";
  } else {
    vitalStatus.className = "";
    vitalStatus.innerHTML = `<i></i>${settings.language === "en" ? "Stable" : "稳定"}`;
  }
  $("#boostStatus").textContent = `${Math.round(player.boostEnergy)}%`;
  const weaponLabel = $("#activeWeaponName");
  const weaponButton = $("#weaponSwitchBtn");
  weaponButton?.classList.toggle("overheated", player.overheatLocked);
  weaponButton?.classList.toggle("alternate", state.activeWeapon === "fitted" && !!activeWeaponPlugin());
  const fireMode = FIRE_MODES[state.fireMode] || FIRE_MODES.balanced;
  if (weaponLabel) weaponLabel.textContent = `${stats.weaponLabel} · ${settings.language === "en" ? fireMode.en : fireMode.name}`;
  if (weaponButton) {
    weaponButton.title = settings.language === "en" ? "Q: switch weapon · R: fire mode" : "Q：切换武器 · R：切换射击模式";
    weaponButton.dataset.fireMode = state.fireMode;
  }
  const fireModeButton = $("#fireModeBtn");
  if (fireModeButton) {
    fireModeButton.dataset.fireMode = state.fireMode;
    fireModeButton.title = settings.language === "en" ? "Cycle fire mode (R)" : "切换射击模式（R）";
    fireModeButton.setAttribute("aria-label", `${settings.language === "en" ? "Fire mode" : "射击模式"}：${settings.language === "en" ? fireMode.en : fireMode.name}`);
  }
  $("#fireModeName").textContent = settings.language === "en" ? fireMode.en : fireMode.name;
  $("#weaponCooldown").textContent = player.overheatLocked
    ? (settings.language === "en" ? "OVERHEAT" : "过热锁定")
    : player.fireCooldown > 0
      ? `${player.fireCooldown.toFixed(1)}s`
      : stats.ammoItem
        ? `${localizedGood(stats.ammoItem).name} ${state.cargo[stats.ammoItem] || 0}`
        : (UI_TEXT[settings.language] || UI_TEXT.zh).ready;
  const combatFocused = !state.docked && (
    pve.alert > 0 ||
    world.enemies.some(enemy => enemy.state === "attack" || enemy.state === "locked" || enemy.state === "chase")
  );
  document.body.classList.toggle("combat-focus", combatFocused);
  updateSystemHud();
  updateAIPopulationHud();
  updateCargoHud();
  updateMissionHud();
  updateTutorial();
}

function updateCargoHud() {
  const entries = Object.entries(state.cargo).filter(([, amount]) => amount > 0);
  $("#cargoList").innerHTML = entries.length ? entries.map(([key, amount]) => `
    <div class="cargo-row"><i style="background:${GOODS[key].color}"></i><span>${localizedGood(key).name}</span><b>× ${amount}</b></div>`).join("") : `<div class="cargo-empty">${settings.language === "en" ? "Cargo is empty · Find your first opportunity" : "货舱为空 · 去寻找第一笔生意"}</div>`;
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
  world.combatText.forEach(drawCombatText);
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

  const depthFactor = settings.depthFx === "off" ? .55 : settings.depthFx === "enhanced" ? 1.28 : 1;
  const parallaxFactor = settings.depthFx === "off" ? .45 : settings.depthFx === "enhanced" ? 1.45 : 1;
  for (let layer = 0; layer < 3; layer++) {
    const qualityFactor = settings.quality === "low" ? .38 : settings.quality === "medium" ? .68 : 1;
    const count = Math.round((70 + layer * 30) * qualityFactor * depthFactor);
    const parallax = (.03 + layer * .04) * parallaxFactor;
    for (let i = 0; i < count; i++) {
      const seedX = ((i * 193 + layer * 71) % 997) / 997;
      const seedY = ((i * 389 + layer * 43) % 991) / 991;
      const x = ((seedX * innerWidth - camera.x * parallax) % innerWidth + innerWidth) % innerWidth;
      const y = ((seedY * innerHeight - camera.y * parallax) % innerHeight + innerHeight) % innerHeight;
      ctx.globalAlpha = (.22 + layer * .18) * (settings.depthFx === "off" ? .72 : 1);
      ctx.fillStyle = i % 13 === 0 ? systemColor : "#d7e7ff";
      ctx.beginPath();
      ctx.arc(x, y, .45 + layer * .35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (settings.depthFx !== "off" && settings.quality !== "low") {
    const drift = performance.now() * .000025;
    ctx.globalAlpha = settings.depthFx === "enhanced" ? .18 : .1;
    ctx.strokeStyle = systemColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = ((innerWidth * (.18 + i * .32) - camera.x * (.012 + i * .006)) % innerWidth + innerWidth) % innerWidth;
      const y = innerHeight * (.22 + i * .18) + Math.sin(drift * (i + 1) * 160) * 16;
      ctx.beginPath();
      ctx.ellipse(x, y, 140 + i * 34, 26 + i * 7, drift * (i + 1), 0, Math.PI * 2);
      ctx.stroke();
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
  const hull = activeShipHull();
  const visual = hull.visual;
  const model = visual.model;
  const depthMode = settings.depthFx || "standard";
  const boosting = keys.shift && player.boostEnergy > 0;
  const strafe = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0);
  const bank = depthMode === "off" ? 0 : strafe * .08;
  const glow = depthMode === "enhanced" ? 1.35 : depthMode === "off" ? .55 : 1;

  if (depthMode !== "off") {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(player.angle + Math.PI / 2);
    ctx.fillStyle = `rgba(2,7,15,${.28 * glow})`;
    ctx.beginPath();
    ctx.ellipse(0, 18, player.radius * 1.7, player.radius * .6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(player.angle + Math.PI / 2);
  if (bank) ctx.transform(1, bank, bank * .12, 1, 0, 0);
  ctx.scale(visual.scale, visual.scale);

  const enginePulse = .82 + Math.sin(performance.now() * .018) * .18;
  const flameLength = boosting ? 43 + Math.random() * 12 : 16 + enginePulse * 7;
  visual.engines.forEach(offset => {
    const flame = ctx.createLinearGradient(offset, 17, offset, 17 + flameLength);
    flame.addColorStop(0, `rgba(238,253,255,${.96 * glow})`);
    flame.addColorStop(.35, `${hull.color}bb`);
    flame.addColorStop(1, `${hull.color}00`);
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(offset - 4, 16);
    ctx.lineTo(offset, 17 + flameLength);
    ctx.lineTo(offset + 4, 16);
    ctx.closePath();
    ctx.fill();
  });
  if (boosting && depthMode === "enhanced") {
    ctx.globalAlpha = .32;
    ctx.strokeStyle = "#39ddff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-18, 16); ctx.lineTo(-30, 44);
    ctx.moveTo(18, 16); ctx.lineTo(30, 44);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.shadowColor = hull.color;
  ctx.shadowBlur = 16 * glow;
  const wingGradient = ctx.createLinearGradient(-34, -4, 34, 28);
  wingGradient.addColorStop(0, hull.color);
  wingGradient.addColorStop(.45, "#21354f");
  wingGradient.addColorStop(1, "#080f1c");
  ctx.fillStyle = wingGradient;
  ctx.beginPath();
  if (model === "courier") {
    ctx.moveTo(-5, -10); ctx.lineTo(-28, 8); ctx.lineTo(-20, 31); ctx.lineTo(-3, 17); ctx.closePath();
    ctx.moveTo(5, -10); ctx.lineTo(28, 8); ctx.lineTo(20, 31); ctx.lineTo(3, 17); ctx.closePath();
  } else if (model === "prospector") {
    ctx.moveTo(-9, -5); ctx.lineTo(-42, 1); ctx.lineTo(-39, 25); ctx.lineTo(-7, 23); ctx.closePath();
    ctx.moveTo(9, -5); ctx.lineTo(42, 1); ctx.lineTo(39, 25); ctx.lineTo(7, 23); ctx.closePath();
  } else if (model === "vanguard") {
    ctx.moveTo(-7, -16); ctx.lineTo(-39, 1); ctx.lineTo(-34, 29); ctx.lineTo(-4, 20); ctx.closePath();
    ctx.moveTo(7, -16); ctx.lineTo(39, 1); ctx.lineTo(34, 29); ctx.lineTo(4, 20); ctx.closePath();
  } else {
    ctx.moveTo(-8, -5); ctx.lineTo(-35, 12); ctx.lineTo(-29, 30); ctx.lineTo(-4, 18); ctx.closePath();
    ctx.moveTo(8, -5); ctx.lineTo(35, 12); ctx.lineTo(29, 30); ctx.lineTo(4, 18); ctx.closePath();
  }
  ctx.fill();

  ctx.shadowBlur = 10 * glow;
  const podGradient = ctx.createLinearGradient(-16, 6, 16, 28);
  podGradient.addColorStop(0, "#0b1322");
  podGradient.addColorStop(.48, "#365671");
  podGradient.addColorStop(1, "#09111f");
  visual.engines.forEach(offset => {
    ctx.fillStyle = podGradient;
    ctx.beginPath();
    ctx.roundRect(offset - 4, 5, 8, model === "vanguard" ? 24 : 22, 4);
    ctx.fill();
    ctx.fillStyle = hull.color;
    ctx.globalAlpha = .55 * glow;
    ctx.beginPath(); ctx.arc(offset, 25, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  const hullGradient = ctx.createLinearGradient(-18, -31, 18, 30);
  hullGradient.addColorStop(0, hull.accent);
  hullGradient.addColorStop(.2, hull.color);
  hullGradient.addColorStop(.52, "#2f5877");
  hullGradient.addColorStop(1, "#142238");
  ctx.fillStyle = hullGradient;
  ctx.beginPath();
  if (model === "courier") {
    ctx.moveTo(0, -40); ctx.lineTo(10, -5); ctx.lineTo(7, 31); ctx.lineTo(0, 36); ctx.lineTo(-7, 31); ctx.lineTo(-10, -5);
  } else if (model === "prospector") {
    ctx.moveTo(0, -29); ctx.lineTo(18, -11); ctx.lineTo(21, 21); ctx.lineTo(9, 32); ctx.lineTo(-9, 32); ctx.lineTo(-21, 21); ctx.lineTo(-18, -11);
  } else if (model === "vanguard") {
    ctx.moveTo(0, -34); ctx.lineTo(23, -8); ctx.lineTo(20, 25); ctx.lineTo(8, 33); ctx.lineTo(-8, 33); ctx.lineTo(-20, 25); ctx.lineTo(-23, -8);
  } else {
    ctx.moveTo(0, -33); ctx.lineTo(15, -3); ctx.lineTo(12, 23); ctx.lineTo(4, 30); ctx.lineTo(-4, 30); ctx.lineTo(-12, 23); ctx.lineTo(-15, -3);
  }
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(219,250,255,.36)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, 27); ctx.stroke();
  ctx.strokeStyle = "rgba(57,221,255,.22)";
  ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.moveTo(-8, 16); ctx.lineTo(8, 16); ctx.stroke();

  const cockpit = ctx.createRadialGradient(0, -10, 1, 0, -6, 12);
  cockpit.addColorStop(0, "#f1ffff");
  cockpit.addColorStop(.38, "#65e6ff");
  cockpit.addColorStop(1, "#10223a");
  ctx.fillStyle = cockpit;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(8, -6);
  ctx.lineTo(4, 8);
  ctx.lineTo(-4, 8);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(147,239,255,${.8 * glow})`;
  ctx.beginPath(); ctx.arc(0, -28, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  if (state.shield > 0) {
    const ratio = state.shield / shipStats().maxShield;
    const shieldRadius = player.radius * 1.75;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(performance.now() * .00018);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = depthMode === "enhanced" ? 1.55 : 1.2;
    ctx.strokeStyle = `rgba(57,221,255,${.12 + ratio * .18})`;
    ctx.beginPath(); ctx.arc(0, 0, shieldRadius - 5, -.5, Math.PI * 1.42); ctx.stroke();
    ctx.rotate(-performance.now() * .00036);
    ctx.strokeStyle = `rgba(147,239,255,${.08 + ratio * .12})`;
    ctx.beginPath(); ctx.arc(0, 0, shieldRadius, 1.2, Math.PI * 2.15); ctx.stroke();
    if (depthMode === "enhanced") {
      ctx.globalAlpha = .06 + ratio * .06;
      ctx.fillStyle = "#39ddff";
      ctx.beginPath(); ctx.arc(0, 0, shieldRadius + 1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.setLineDash([]);
    if (shieldImpact > 0) {
      ctx.rotate(shieldHitAngle - player.angle);
      const impactGradient = ctx.createRadialGradient(shieldRadius - 7, 0, 0, shieldRadius - 7, 0, 18);
      impactGradient.addColorStop(0, `rgba(220,252,255,${shieldImpact})`);
      impactGradient.addColorStop(.35, `rgba(57,221,255,${shieldImpact * .8})`);
      impactGradient.addColorStop(1, "rgba(57,221,255,0)");
      ctx.fillStyle = impactGradient;
      ctx.beginPath(); ctx.arc(shieldRadius - 5, 0, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(215,252,255,${shieldImpact})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, shieldRadius - 2, -.34, .34); ctx.stroke();
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
  if (enemy.shield > 0) {
    ctx.rotate(-(enemy.angle + Math.PI / 2));
    ctx.strokeStyle = "rgba(83,232,255,.58)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(0, 0, enemy.r + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.shadowBlur = 0; ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(p.x - 22, p.y - enemy.r - 17, 44, 3);
  ctx.fillStyle = "#53e8ff"; ctx.fillRect(p.x - 22, p.y - enemy.r - 17, 44 * (enemy.maxShield ? enemy.shield / enemy.maxShield : 0), 3);
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(p.x - 22, p.y - enemy.r - 12, 44, 3);
  ctx.fillStyle = spec.color; ctx.fillRect(p.x - 22, p.y - enemy.r - 12, 44 * enemy.hp / enemy.maxHp, 3);
  if (enemy.state !== "patrol") {
    ctx.textAlign = "center"; ctx.font = "7px Microsoft YaHei"; ctx.fillStyle = spec.color;
    ctx.fillText(enemy.state === "attack" ? "攻击" : enemy.state === "retreat" ? "撤退" : "锁定", p.x, p.y + enemy.r + 14);
  }
}

function drawBullet(bullet, color) {
  const p = worldToScreen(bullet.x, bullet.y);
  const bulletColor = bullet.color || color;
  ctx.fillStyle = bulletColor;
  ctx.shadowColor = bulletColor;
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

function drawCombatText(text) {
  const p = worldToScreen(text.x, text.y);
  const alpha = clamp(text.life / text.maxLife, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = `${text.critical ? 700 : 600} ${text.critical ? 13 : 11}px ui-monospace, monospace`;
  ctx.fillStyle = text.color;
  ctx.shadowColor = text.color;
  ctx.shadowBlur = text.critical ? 9 : 5;
  ctx.fillText(`${text.layer === "shield" ? "◇" : "▰"} ${text.amount}`, p.x, p.y);
  ctx.restore();
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
  $("#localCount").textContent = `${world.enemies.length + world.asteroids.length + localPilots.length} ${(UI_TEXT[settings.language] || UI_TEXT.zh).signals}`;
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
  const stats = shipStats();
  const targetSpec = isOutpost
    ? { shieldResist: { thermal: .18, explosive: .1 }, hullResist: { kinetic: .22, explosive: .16 } }
    : (ENEMY_TYPES[target.type] || ENEMY_TYPES.interceptor);
  $("#targetType").textContent = isOutpost ? "敌对设施" : `敌对舰船 · ${target.state === "patrol" ? "巡逻" : "交战"}`;
  $("#targetName").textContent = target.name;
  const shieldRatio = target.maxShield ? target.shield / target.maxShield : 0;
  const hullRatio = target.maxHp ? target.hp / target.maxHp : 0;
  $("#targetShieldBar").style.width = `${clamp(shieldRatio * 100, 0, 100)}%`;
  $("#targetHealthBar").style.width = `${clamp(hullRatio * 100, 0, 100)}%`;
  $("#targetShieldValue").textContent = `${Math.ceil(target.shield || 0)} / ${target.maxShield || 0}`;
  $("#targetHullValue").textContent = `${Math.ceil(target.hp || 0)} / ${target.maxHp || 0}`;
  const activeLayer = target.shield > 0 ? "shield" : "hull";
  const activeDamage = DAMAGE_TYPES[stats.damageType] || DAMAGE_TYPES.plasma;
  const effectiveness = damageLayerMultiplier(stats.damageType, activeLayer, targetSpec);
  $("#targetDefenseProfile").textContent = activeLayer === "shield" ? "当前护盾 · 热能有效" : "当前装甲 · 动能有效";
  $("#targetWeaponAdvice").textContent = `${activeDamage.name} ×${effectiveness.toFixed(2)}`;
  $("#targetWeaponAdvice").style.color = effectiveness >= 1.15 ? "#51e7a6" : effectiveness < .9 ? "#ff9d66" : "#ffd36d";
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
    const textEntry = event.target instanceof HTMLElement && event.target.matches("input, textarea, select, [contenteditable='true']");
    if (textEntry && key !== "escape") return;
    keys[key] = true;
    $$(`[data-control-key="${key}"]`).forEach(element => element.classList.add("control-pressed"));
    if (key === "e" && !event.repeat) handleInteractionAction();
    if (key === "q" && !event.repeat && !state.docked) toggleWeapon();
    if (key === "r" && !event.repeat && !state.docked) cycleFireMode();
    if (key === "m" && !event.repeat && $("#helpPanel").classList.contains("hidden") && $("#deathPanel").classList.contains("hidden")) {
      if ($("#mapPanel").classList.contains("hidden")) openMap(); else closeMap();
    }
    if (key === "escape") {
      if (!$("#settingsPanel").classList.contains("hidden")) closeSettings();
      else if (!$("#mapPanel").classList.contains("hidden")) closeMap();
      else if (!$("#helpPanel").classList.contains("hidden")) $("#helpPanel").classList.add("hidden");
    }
  });
  addEventListener("keyup", event => {
    const key = event.key.toLowerCase();
    keys[key] = false;
    $$(`[data-control-key="${key}"]`).forEach(element => element.classList.remove("control-pressed"));
  });
  canvas.addEventListener("mousemove", event => { mouse.x = event.clientX; mouse.y = event.clientY; });
  canvas.addEventListener("mousedown", event => { if (event.button === 0) mouse.down = true; });
  addEventListener("mouseup", event => { if (event.button === 0) mouse.down = false; });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  addEventListener("pointerdown", event => {
    audioEngine.ensure();
    if (!event.target.closest("button")) return;
    audioEngine.play("click");
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 520);
  });

  $("#undockBtn").addEventListener("click", undock);
  $("#hubUndockBtn")?.addEventListener("click", undock);
  $("#weaponSwitchBtn")?.addEventListener("click", toggleWeapon);
  $("#fireModeBtn")?.addEventListener("click", cycleFireMode);
  $("#contextActionBtn")?.addEventListener("click", handleInteractionAction);
  $("#repairBtn").addEventListener("click", repairShip);
  $("#settingsBtn").addEventListener("click", openSettings);
  $$("[data-open-settings]").forEach(button => button.addEventListener("click", openSettings));
  $("#closeSettingsBtn").addEventListener("click", closeSettings);
  $("#settingsDoneBtn").addEventListener("click", closeSettings);
  $("#helpBtn").addEventListener("click", () => { $("#helpPanel").classList.remove("hidden"); paused = true; });
  $("#closeHelpBtn").addEventListener("click", () => { $("#helpPanel").classList.add("hidden"); paused = state.docked; });
  $("#startBtn").addEventListener("click", () => { $("#helpPanel").classList.add("hidden"); if (state.docked) openStation(); });
  $("#skipTutorialBtn").addEventListener("click", () => {
    state.tutorial.active = false;
    state.tutorial.completed = true;
    state.tutorial.step = TUTORIAL_STEPS.length;
    renderTutorial(null, 0);
    saveGame();
  });
  $$("[data-ui-size-choice]").forEach(button => button.addEventListener("click", () => setSetting("uiSize", button.dataset.uiSizeChoice)));
  $$("[data-font-choice]").forEach(button => button.addEventListener("click", () => setSetting("font", button.dataset.fontChoice)));
  $$("[data-quality-choice]").forEach(button => button.addEventListener("click", () => setSetting("quality", button.dataset.qualityChoice)));
  $$("[data-depth-choice]").forEach(button => button.addEventListener("click", () => setSetting("depthFx", button.dataset.depthChoice)));
  $$("[data-language-choice]").forEach(button => button.addEventListener("click", () => setSetting("language", button.dataset.languageChoice)));
  $("#masterVolume").addEventListener("input", event => setSetting("masterVolume", Number(event.target.value)));
  $("#musicVolume").addEventListener("input", event => setSetting("musicVolume", Number(event.target.value)));
  $("#sfxVolume").addEventListener("input", event => setSetting("sfxVolume", Number(event.target.value), true));
  $("#musicToggle").addEventListener("click", () => setSetting("musicEnabled", !settings.musicEnabled));
  $("#sfxToggle").addEventListener("click", () => {
    setSetting("sfxEnabled", !settings.sfxEnabled);
    if (settings.sfxEnabled) { audioEngine.ensure(); audioEngine.play("trade"); }
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
  $$(".station-tabs button").forEach(button => button.addEventListener("click", () => activateStationTab(button.dataset.stationTab)));
  $$("[data-hub-module]").forEach(button => button.addEventListener("click", () => openHubModule(button.dataset.hubModule)));
  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-story-action]");
    if (button && !button.disabled) handleStoryAction(button.dataset.storyAction);
  });
  $$("[data-market-mode]").forEach(button => button.addEventListener("click", () => {
    marketMode = button.dataset.marketMode;
    $$("[data-market-mode]").forEach(item => item.classList.toggle("active", item === button));
    renderMarket();
  }));
  $("#marketSearch").addEventListener("input", event => {
    marketSearchText = event.target.value.trim();
    renderMarket();
  });
  $("#marketSystemSelect").addEventListener("change", event => {
    selectedMarketSystem = event.target.value;
    if (selectedMarketSystem !== state.currentSystem) {
      state.story = { ...(state.story || {}), viewedRemoteMarket: true };
      saveGame();
    }
    renderMarket();
  });
  $("#tradeQuantity").addEventListener("input", updateTradeTicket);
  $("#limitSellPrice").addEventListener("input", event => {
    event.target.dataset.edited = "1";
    updateTradeTicket();
  });
  $("#marketChart").addEventListener("mousemove", handleChartHover);
  $("#marketChart").addEventListener("mouseleave", hideChartTooltip);
  $$(".quantity-presets button").forEach(button => button.addEventListener("click", () => {
    const available = marketMode === "buy"
      ? Math.floor(state.markets[marketViewSystem()][selectedMarketItem].stock)
      : (canTradeViewedMarket() ? localItemAmount(selectedMarketItem) : 0);
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
  if (!SHIP_HULLS[state.activeShip]) state.activeShip = "pioneer";
  state.ownedShips = { pioneer: state.activeShip === "pioneer" ? "active" : (state.ownedShips?.pioneer || state.currentSystem), ...(state.ownedShips || {}), [state.activeShip]: "active" };
  const activeHull = activeShipHull();
  state.maxFuel = activeHull.stats.fuel;
  state.fuel = Math.min(state.fuel, state.maxFuel);
  player.radius = activeHull.stats.radius;
  const stats = shipStats();
  if (!Number.isFinite(state.shield)) state.shield = stats.maxShield;
  if (!Number.isFinite(state.hull)) state.hull = stats.maxHull;
  if (!Number.isFinite(state.capacitor)) state.capacitor = stats.maxCapacitor;
  if (state.activeWeapon === "fitted" && !state.fittedPlugins?.weapon) state.activeWeapon = "pulse";
  if (!FIRE_MODES[state.fireMode]) state.fireMode = "balanced";
  resize();
  setupEvents();
  resetWorld();
  applySettings();
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
  get settings() { return settings; },
  get audioEngine() { return audioEngine; },
  systems: SYSTEMS,
  goods: GOODS,
  enemyTypes: ENEMY_TYPES,
  damageTypes: DAMAGE_TYPES,
  stationIndustry: STATION_INDUSTRY,
  undock,
  dock,
  jumpTo,
  buyItem,
  sellItem,
  spawnEnemy,
  shootPlayer,
  toggleWeapon,
  cycleFireMode,
  spawnAsteroid,
  createAIPilots,
  runAIEconomicAction,
  damagePlayer,
  applyDamageToEnemy,
  damageOutpost,
  destroyOutpost,
  spawnPirateOutpost,
  shipStats,
  craftedOutputAmount,
  resetSave() { localStorage.removeItem(SAVE_KEY); location.reload(); },
  simulateMarkets,
  renderStation
};

init();

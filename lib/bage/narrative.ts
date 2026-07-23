import type { BaziResult, ElementType } from '@/types/bazi';
import type { ExtractResult } from './extractPattern';
import type { AssessResult } from './assessOutcome';
import type { StrengthResult } from '@/lib/strength/determineStrength';
import type { LiuTongResult } from './liuTong';
import { getTenGod } from '@/lib/bazi-utils';

// ── 五行能力映射 ──
const EL_ABILITY: Record<string, string> = {
  '金': '纪律、执行力、技术深耕',
  '水': '情绪调节、变通力、智慧沉淀',
  '木': '人脉拓展、成长性、灵活性',
  '火': '表达力、展示力、感染力',
  '土': '稳定、储蓄、承载力',
};

// ── 天干合映射 ──
const STEM_COMBINE: Record<string, string> = {
  '甲己': '土', '己甲': '土',
  '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水',
  '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

const COMBINE_MEANING: Record<string, string> = {
  '甲己': '甲木被己土合住——本该向上生长的力量，被现实的考量拉住了',
  '乙庚': '乙木被庚金合住——柔韧被刚硬约束，温柔中多了原则',
  '丙辛': '丙火被辛金合住——热烈的光芒被冷静的规则包裹，外冷内热',
  '丁壬': '丁火被壬水合住——燃烧的热情被智慧调和，不会烧过头',
  '戊癸': '戊土被癸水合住——厚重的根基被柔情渗透，刚中有柔',
  '己甲': '甲木被己土合住——本该向上生长的力量，被现实的考量拉住了',
  '庚乙': '乙木被庚金合住——柔韧被刚硬约束，温柔中多了原则',
  '辛丙': '丙火被辛金合住——热烈的光芒被冷静的规则包裹，外冷内热',
  '壬丁': '丁火被壬水合住——燃烧的热情被智慧调和，不会烧过头',
  '癸戊': '戊土被癸水合住——厚重的根基被柔情渗透，刚中有柔',
};

// ── 数据类型 ──

interface Ctx {
  bazi: BaziResult;
  pattern: ExtractResult;
  outcome: AssessResult;
  strength: StrengthResult;
  lt: LiuTongResult;
  dayEl: ElementType;
  dm: string;       // "戊土"
  isStrong: boolean;
  zero: string[];
  stems: string[];  // 4 heavenly stems
  branches: string[]; // 4 earthly branches
  tenGods: string[];
  hiddenAll: string[];
}

interface Feature {
  score: number;
  text: string;
}

// ── 上下文构建 ──

function buildCtx(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
  lt: LiuTongResult,
): Ctx {
  const p = bazi.pillars;
  const stems = [p.year.stem, p.month.stem, p.day.stem, p.hour.stem];
  const branches = [p.year.branch, p.month.branch, p.day.branch, p.hour.branch];
  const tenGods = [bazi.tenGods.yearStem, bazi.tenGods.monthStem, '日主', bazi.tenGods.hourStem];
  const hiddenAll: string[] = [];
  for (const br of branches) {
    for (const h of bazi.pillars.year.hiddenStems) {
      // Use getHiddenStemsSpec indirectly via the pillars
    }
  }
  // Get all hidden stems from pillars
  for (const key of ['year', 'month', 'day', 'hour'] as const) {
    for (const h of p[key].hiddenStems) hiddenAll.push(h);
  }

  const zero = (['金', '木', '水', '火', '土'] as ElementType[])
    .filter((el) => bazi.elementCount[el] === 0);

  return {
    bazi, pattern, outcome, strength, lt,
    dayEl: bazi.dayMasterElement,
    dm: `${bazi.dayMaster}${bazi.dayMasterElement}`,
    isStrong: strength.level === '身强',
    zero,
    stems,
    branches,
    tenGods,
    hiddenAll,
  };
}

// ── 特征扫描器：返回 (score, text) ──

function scanFeatures(ctx: Ctx): Feature[] {
  const features: Feature[] = [];
  const { bazi, stems, branches, lt, pattern, outcome, zero } = ctx;
  const p = bazi.pillars;

  // ── 1. 天干合 ──
  const stemPairs: [number, number, string, string][] = [
    [0, 1, '年', '月'], [1, 2, '月', '日'], [2, 3, '日', '时'],
    [0, 2, '年', '日'], [0, 3, '年', '时'], [1, 3, '月', '时'],
  ];
  for (const [i, j, la, lb] of stemPairs) {
    const key = stems[i] + stems[j];
    if (COMBINE_MEANING[key]) {
      const tgI = ctx.tenGods[i];
      const tgJ = ctx.tenGods[j];
      // 用神被合 → 高分
      const isYongShen = tgI === '七杀' || tgJ === '七杀' || tgI === '正官' || tgJ === '正官';
      const baseScore = isYongShen ? 90 : 65;
      // 确定谁是七杀/正官
      const guanShaTG = tgI === '七杀' || tgI === '正官' ? tgI : (tgJ === '七杀' || tgJ === '正官' ? tgJ : '');
      const otherTG = tgI === guanShaTG ? tgJ : tgI;
      const yongShenText = guanShaTG === '七杀'
        ? `七杀本是你的鞭子，催你前进，但它被${otherTG}合住了。野心刚冒出来，就被一股更舒服的力量按回去。你不是没有冲劲——是那股冲劲不够疼。`
        : guanShaTG === '正官'
        ? `正官代表规矩和方向，但它被${otherTG}牵走了。你被要求走一条很正的路，但你内在的${otherTG}力量让你不愿意乖乖就范。`
        : '用神被合，格局的力量打了一个折扣。你有这个底子，但发力的时候总觉得被什么东西绊了一下。';
      features.push({
        score: baseScore,
        text: `${la}干${stems[i]}（${tgI}）与${lb}干${stems[j]}（${tgJ}）相合。${isYongShen ? yongShenText : `${tgI}和${tgJ}绑在一起——这两个特质在你身上不是分开的，而是互相拉扯的。`}`,
      });
    }
  }

  // ── 2. 月干坐支被泄（正官/七杀坐支被泄 → 高分） ──
  const monthStem = stems[1];
  const monthBranch = branches[1];
  const monthMainQi = p.month.hiddenStems[0];
  if (monthMainQi) {
    const rel = getTenGod(monthStem, monthMainQi);
    const monthTG = ctx.tenGods[1];
    if (rel === '食神' || rel === '伤官') {
      const isGuanSha = monthTG === '正官' || monthTG === '七杀';
      features.push({
        score: isGuanSha ? 85 : 50,
        text: `月干${monthStem}（${monthTG}）坐${monthBranch}火——${monthStem === '甲' ? '木' : monthStem}被${monthBranch}支所泄。${isGuanSha ? `你被要求走过一条正统的路——读书、体制、或者家里安排的方向。但${monthTG}坐支被泄，规矩在你身上立不住。你大概率已经从那条路上跑偏了。` : `你对外展现的${monthTG}特质，其实在内部被消解了一部分。表面看到的样子，不是全部的你。`}`,
      });
    }
    // 坐支生干（印生身/官生印等）
    if (rel === '正印' || rel === '偏印') {
      const isRiZhu = stems[1] === bazi.dayMaster;
      features.push({
        score: 55,
        text: `月干${monthStem}坐${monthBranch}——${monthBranch}支的${monthMainQi}气生扶${monthStem}。${isRiZhu ? '日主在月令得生，你天然有一种被保护的感觉，成长环境对你不错。' : `这种「坐支来生」让${monthStem}的力量更扎实，不是虚浮在天干上的。`}`,
      });
    }
  }

  // ── 3. 日主坐支关系 ──
  const dayStem = stems[2];
  const dayBranch = branches[2];
  const dayMainQi = p.day.hiddenStems[0];
  if (dayMainQi) {
    const rel = getTenGod(dayStem, dayMainQi);
    if (rel === '七杀') {
      features.push({
        score: 55,
        text: `${ctx.dm}坐${dayBranch}——日支本气为七杀，你内心深处有一个严厉的自我审判者。对自己要求很高，别人看到的你已经不错了，你自己觉得不够。`,
      });
    }
    if (rel === '正印' || rel === '偏印') {
      features.push({
        score: 50,
        text: `${ctx.dm}坐${dayBranch}印星——日主本身被保护得很好。${dayBranch}火贴身相生，让你有一种天然的安逸感。这既是好事（你不容易焦虑），也是限制（你缺少那种「不拼不行」的紧迫感）。`,
      });
    }
    if (rel === '正财' || rel === '偏财') {
      features.push({
        score: 50,
        text: `${ctx.dm}坐${dayBranch}财星——你对价值和回报有天生的敏感。钱和资源对你来说不是身外之物，是你安全感的来源之一。`,
      });
    }
  }

  // ── 4. 五行缺失 ──
  if (zero.length > 0) {
    const parts = zero.map((el) => `${el}（${EL_ABILITY[el]}）`);
    const missingTexts: Record<string, string> = {
      '金': '金代表纪律和执行——你不是懒，是把土的能量转化成金的那种机制没建立起来。能熬大夜赶一个感兴趣的项目，但很难每天固定时间做同一件事',
      '水': '水代表情绪调节和变通——你是那种「看起来没事，其实一直在内耗」的人。压力来了硬扛，不消化',
      '木': '木代表灵活性和成长——你可能在某些方面过于固执，缺少变通，这不是缺点，但会让你在一些路口多绕几圈',
      '火': '火代表表达和感染力——你可能做了很多事但不善于展示自己。不是没有才华，是才华没有被别人看见的渠道',
      '土': '土代表稳定和承载力——你或许缺一点脚踏实地的耐心。想法跑得比行动快，但不总能落地',
    };
    let score = 60;
    // 金水双缺 → 重要
    if (zero.includes('金') && zero.includes('水')) score = 80;
    const desc = zero.map((el) => missingTexts[el] || '').filter(Boolean).join('。');
    features.push({
      score,
      text: `全局缺${parts.join('、')}。${desc}。`,
    });
  }

  // ── 5. 五行过旺 ──
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    if (bazi.elementCount[el] >= 4 && el === ctx.dayEl) {
      features.push({
        score: 50,
        text: `${el}气在命局中占了${bazi.elementCount[el]}席——根基深厚，但也意味着你过于依赖${el}所代表的${EL_ABILITY[el].split('、')[0]}。凡事靠自己，不习惯开口求助。`,
      });
    }
  }

  // ── 6. 流通断崖 ──
  if (lt.blockage && lt.tongGuan && lt.drop >= 4) {
    const elAct = EL_ABILITY[lt.tongGuan]?.split('、')[0] || lt.tongGuan;
    features.push({
      score: 70,
      text: `五行流通在${lt.blockage}→${lt.tongGuan}出现断崖，落差${lt.drop}。你的${lt.blockage}能量积累极多，但转化不成${lt.tongGuan}所代表的产出——${elAct}是你命局最缺的一环。问题不是不够努力，是努力的方向被卡住了。`,
    });
  }

  // ── 7. 火炎土燥 ──
  const ec = bazi.elementCount;
  if (ec['火'] >= 2 && ec['土'] >= 3 && ec['水'] === 0) {
    features.push({
      score: 65,
      text: `火炎土燥——你心里常年像烧着一锅快干的水，越搅越焦。${ctx.isStrong ? '身强让你扛得住，但扛得住不等于消化得了。' : ''}你没有情绪冷却机制，压力堆积如山，表面上还跟没事人一样。`,
    });
  }

  // ── 8. 伤官佩印 / 官杀生印 等十神制衡组合 ──
  const patternCat = pattern.category;
  const monthBranchQi = p.month.hiddenStems[0];
  const monthQiTG = monthBranchQi ? getTenGod(bazi.dayMaster, monthBranchQi) : '';
  // 伤官佩印：伤官格 + 印星透干
  if ((patternCat === '伤官格' || monthQiTG === '伤官') && (ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印' || ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印')) {
    const yinPos: string[] = [];
    if (ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印') yinPos.push('年');
    if (ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印') yinPos.push('时');
    const yinDesc = yinPos.join('、');
    features.push({
      score: 80,
      text: `伤官佩印——月令伤官是你的才华和表达欲，${yinDesc ? yinDesc + '的印星帮你刹车' : '印星帮你刹车'}。你知道什么时候该说，什么时候该停。这点比大多数伤官格的人都强——不是被规则管住，是被智慧管住。`,
    });
  }
  // 官杀生印：官杀透干 + 印格
  if ((patternCat === '印格' || pattern.displayName.includes('印')) && (ctx.tenGods[0] === '正官' || ctx.tenGods[0] === '七杀' || ctx.tenGods[1] === '正官' || ctx.tenGods[1] === '七杀' || ctx.tenGods[3] === '正官' || ctx.tenGods[3] === '七杀')) {
    features.push({
      score: 65,
      text: `官杀生印——月令印星是你的根基，${ctx.tenGods[1] === '正官' || ctx.tenGods[1] === '七杀' ? '月干' : '天干'}透出的官杀是来「助攻」的。压力不会压垮你，反而会转化成智慧和沉淀。这是典型的「越挫越稳」体质。`,
    });
  }

  // ── 9. 天干相生（偏财生杀/杀生印 等关键生扶链）──
  const stemElements = stems.map((s) => {
    const elMap: Record<string, string> = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    return elMap[s] || '';
  });
  const generating: Record<string, string> = { '水':'木', '木':'火', '火':'土', '土':'金', '金':'水' };
  for (const [i, j, la, lb] of stemPairs) {
    if (generating[stemElements[i]] === stemElements[j] && i !== j) {
      const tgI = ctx.tenGods[i];
      const tgJ = ctx.tenGods[j];
      // 偏财生七杀 或 杀生印 — 高分
      const isKeySheng = (tgI === '偏财' && tgJ === '七杀') || (tgI === '七杀' && tgJ === '偏印') || (tgI === '正官' && tgJ === '正印');
      if (isKeySheng && i !== 2 && j !== 2) {
        features.push({
          score: 70,
          text: `${la}干${stems[i]}（${tgI}）生${lb}干${stems[j]}（${tgJ}）——${tgI === '偏财' && tgJ === '七杀' ? '偏财生七杀：你对机会的嗅觉天生敏锐，而这种敏锐会直接转化为冲劲。钱和资源对你来说不是目的——是引擎。' : tgI === '七杀' && tgJ === '偏印' ? '七杀生偏印：压力在你这里不会白费——每一次压榨都会转化成独特的智慧和洞察。别人被压力压垮，你被压力喂大。' : '这种天干之间的生扶让你的格局更稳——不是单打独斗，而是有来有往。'}`,
        });
      }
    }
  }

  // ── 10. 天干双透 ──
  const tgCount: Record<string, number> = {};
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue; // skip day master
    const tg = ctx.tenGods[i];
    tgCount[tg] = (tgCount[tg] || 0) + 1;
  }
  for (const [tg, count] of Object.entries(tgCount)) {
    if (count >= 2) {
      // Find which positions
      const positions: string[] = [];
      const posLabels = ['年', '月', '日', '时'];
      for (let i = 0; i < 4; i++) {
        if (i === 2) continue;
        if (ctx.tenGods[i] === tg) positions.push(posLabels[i]);
      }
      features.push({
        score: 55,
        text: `${tg}双透——${positions.join('、')}两头都有。${tg === '偏印' ? '像左右两个护卫，替你把局势兜住了。你不缺智慧，甚至有时候想得比做得快太多。' : tg === '正印' ? '你的学习能力和贵人运天然比别人多一倍。但印星过旺也会让你安于被保护的状态。' : tg === '七杀' ? '压力来自四面八方——但两只老虎如果方向一致，反而比一只更容易驾驭。' : tg === '正官' ? '规矩和责任感在你身上加倍——你不是不想放松，是不知道该对谁放松。' : `你身上${tg}的特质比一般人更明显——这是双倍的礼物，也可能是双倍的负担。`}`,
      });
    }
  }

  // ── 11. 格局成/破/不成 ──
  if (outcome.outcome === '成格') {
    features.push({
      score: 40,
      text: `格局「${outcome.outcome}」——命局的顶层设计完整，${pattern.displayName}的底子扎实。`,
    });
  } else if (outcome.outcome === '破格') {
    const reason = outcome.reason.split(';')[0] || '';
    features.push({
      score: 75,
      text: `格局「破格」——${reason ? `原因是${reason}。` : ''}破碎不是终点。很多人看到破格两个字觉得命不好，但恰恰相反——破格的人经历了更多摔打，而摔打本身就是锻造。破而后立，重建的往往比原来的更坚固。`,
    });
  } else if (outcome.outcome === '不成格') {
    features.push({
      score: 65,
      text: `格局「不成格」——${pattern.displayName}的底子是有的，只是火候还差一点。大运流转，属于你的时机还在后头。竹子前四年只长三厘米，第五年冲天而起。你不是不行，是时候未到。`,
    });
  }

  // ── 12. 地支特殊 — 重复地支 ──
  const brCount: Record<string, number> = {};
  for (const br of branches) brCount[br] = (brCount[br] || 0) + 1;
  for (const [br, count] of Object.entries(brCount)) {
    if (count >= 2) {
      const el = p.year.branchElement || '';
      features.push({
        score: 45,
        text: `地支双${br}——${el ? `${el}气在你命局中被放大了一倍。` : ''}${br === '午' ? '午火双现，热情和焦躁同时翻倍。你内心比外表看起来热烈得多。' : br === '子' ? '子水双现，智慧和敏感同时放大。你想得比别人深，也容易想得比别人多。' : ''}`,
      });
    }
  }

  // ── 13. 身强/身弱 ──
  if (ctx.isStrong) {
    features.push({
      score: 35,
      text: `${ctx.dm}身强，${ctx.strength.deLing ? '得令' : ''}${ctx.strength.deDi ? '得地' : ''}${ctx.strength.deShi === '得势' ? '得势' : ''}——你的能量在线，${ctx.dm === '戊土' || ctx.dm === '己土' ? '像一座山，扛得住事。' : ctx.dayEl === '火' ? '像一团火，热情和感染力是你的武器。' : ctx.dayEl === '金' ? '像一把刀，干脆利落不拖泥带水。' : ctx.dayEl === '水' ? '像一条江，表面平静底下暗流涌动。' : '像一棵树，有自己生长的方向和节奏。'}`,
    });
  } else {
    features.push({
      score: 35,
      text: `${ctx.dm}${ctx.strength.level === '中和' ? '中和平衡' : '身弱'}——你不是硬扛型的人。${ctx.strength.level === '身弱' ? '但你比身强的人更懂借力——知道自己的局限在哪里，反而能用巧劲化解很多问题。' : '不多不少，刚好够用。你有自己的节奏，不疾不徐。'}`,
    });
  }

  return features;
}

// ── 主入口 ──

export function generateNarrative(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
  lt: LiuTongResult,
): string {
  const ctx = buildCtx(bazi, pattern, outcome, strength, lt);
  const features = scanFeatures(ctx);

  // 按分数降序，取 top 4
  const top = features.sort((a, b) => b.score - a.score).slice(0, 4);

  if (top.length === 0) {
    return `${ctx.dm}日主，${pattern.displayName}，格局${outcome.outcome}。${ctx.isStrong ? '身强有力' : '中和平衡'}。顺势而行，自有出路。`;
  }

  // 组合：top[0]详细叙事 + top[1]转折 + top[2]补充 + top[3]收尾
  const parts: string[] = [];

  // 第一段 — 核心特征（完整展开）
  parts.push(top[0].text);

  // 第二段 — 如果有第二个特征，作为转折或深化
  if (top.length >= 2) {
    // 去掉和第一段重复的信息，做承接
    parts.push(top[1].text);
  }

  // 第三段 — 补充特征（如果有≥3）
  if (top.length >= 3) {
    parts.push(top[2].text);
  }

  // 第四段 — 收尾（如果有第4个特征，用它收尾；否则用第3个）
  if (top.length >= 4) {
    parts.push(top[3].text);
  }

  return parts.join('\n\n');
}

import type { BaziResult, ElementType } from '@/types/bazi';
import type { ExtractResult } from './extractPattern';
import type { AssessResult } from './assessOutcome';
import type { StrengthResult } from '@/lib/strength/determineStrength';
import type { LiuTongResult } from './liuTong';
import { getTenGod } from '@/lib/bazi-utils';

const EL_ABILITY: Record<string, string> = {
  '金': '纪律、执行力、技术深耕',
  '水': '情绪调节、变通力、智慧沉淀',
  '木': '人脉拓展、成长性、灵活性',
  '火': '表达力、展示力、感染力',
  '土': '稳定、储蓄、承载力',
};

const STEM_COMBINE: Record<string, string> = {
  '甲己': '土', '己甲': '土', '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水', '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

const GENERATING: Record<string, string> = { '水':'木', '木':'火', '火':'土', '土':'金', '金':'水' };

// ── 三合局 & 三会局 ──
const SAN_HE: Record<string, string[]> = {
  '申子辰': ['水'], '亥卯未': ['木'], '寅午戌': ['火'], '巳酉丑': ['金'],
};
const SAN_HUI: Record<string, string[]> = {
  '寅卯辰': ['木'], '巳午未': ['火'], '申酉戌': ['金'], '亥子丑': ['水'],
};

function detectSanHe(branches: string[]): string[] {
  const br = [...branches].sort().join('');
  for (const [key, els] of Object.entries(SAN_HE)) {
    const chars = key.split('');
    if (chars.every((c) => br.includes(c))) return els;
  }
  return [];
}
function detectSanHui(branches: string[]): string[] {
  const br = [...branches].sort().join('');
  for (const [key, els] of Object.entries(SAN_HUI)) {
    const chars = key.split('');
    if (chars.every((c) => br.includes(c))) return els;
  }
  return [];
}

// ── 类型 ──

interface Ctx {
  bazi: BaziResult;
  pattern: ExtractResult;
  outcome: AssessResult;
  strength: StrengthResult;
  lt: LiuTongResult;
  dayEl: ElementType;
  dm: string;
  isStrong: boolean;
  zero: string[];
  stems: string[];
  branches: string[];
  tenGods: string[];
}

interface Feature { score: number; text: string; }

function buildCtx(
  bazi: BaziResult, pattern: ExtractResult, outcome: AssessResult,
  strength: StrengthResult, lt: LiuTongResult,
): Ctx {
  const p = bazi.pillars;
  return {
    bazi, pattern, outcome, strength, lt,
    dayEl: bazi.dayMasterElement,
    dm: `${bazi.dayMaster}${bazi.dayMasterElement}`,
    isStrong: strength.level === '身强',
    zero: (['金','木','水','火','土'] as ElementType[]).filter((el) => bazi.elementCount[el] === 0),
    stems: [p.year.stem, p.month.stem, p.day.stem, p.hour.stem],
    branches: [p.year.branch, p.month.branch, p.day.branch, p.hour.branch],
    tenGods: [bazi.tenGods.yearStem, bazi.tenGods.monthStem, '日主', bazi.tenGods.hourStem],
  };
}

// ── 去重工具：同一天干只保留最优合 ──

interface CombineHit { i: number; j: number; la: string; lb: string; tgI: string; tgJ: string; key: string; involvesDay: boolean; }
function deduplicateCombines(hits: CombineHit[]): CombineHit[] {
  // 按优先级排：日主参与 > 官杀参与 > 其他；分数相同时取位置更近的
  const scoreHit = (h: CombineHit) => (h.involvesDay ? 3 : 0) + (h.tgI === '七杀' || h.tgJ === '七杀' || h.tgI === '正官' || h.tgJ === '正官' ? 2 : 0);
  const seen = new Set<string>();
  const kept: CombineHit[] = [];
  // 收集所有被合的天干
  const allInvolved = new Set<number>();
  for (const h of hits) { allInvolved.add(h.i); allInvolved.add(h.j); }
  // 找出被多次合的天干 → 去重：只保留分数最高的
  const stemHitCount = new Map<number, CombineHit[]>();
  for (const h of hits) {
    if (!stemHitCount.has(h.i)) stemHitCount.set(h.i, []);
    stemHitCount.get(h.i)!.push(h);
    if (!stemHitCount.has(h.j)) stemHitCount.set(h.j, []);
    stemHitCount.get(h.j)!.push(h);
  }
  const deduped = new Set<number>(); // 已处理过的 hit index
  for (let idx = 0; idx < hits.length; idx++) {
    if (deduped.has(idx)) continue;
    const h = hits[idx];
    // 找到所有和 h.i 或 h.j 相关的合
    const related: number[] = [idx];
    for (let k = idx + 1; k < hits.length; k++) {
      const hk = hits[k];
      if (hk.i === h.i || hk.j === h.i || hk.i === h.j || hk.j === h.j) related.push(k);
    }
    // 选取最优
    let bestIdx = related[0];
    let bestScore = scoreHit(hits[bestIdx]);
    for (let r = 1; r < related.length; r++) {
      const s = scoreHit(hits[related[r]]);
      if (s > bestScore) { bestScore = s; bestIdx = related[r]; }
    }
    kept.push(hits[bestIdx]);
    for (const r of related) deduped.add(r);
  }
  return kept;
}

// ── 特征扫描 ──

function scanFeatures(ctx: Ctx): Feature[] {
  const features: Feature[] = [];
  const { bazi, stems, branches, lt, pattern, outcome, zero } = ctx;
  const p = bazi.pillars;
  const ec = bazi.elementCount;

  // ── 1. 天干合（去重+日主加权）──
  const posLabels = ['年', '月', '日', '时'];
  const combineHits: CombineHit[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const key = stems[i] + stems[j];
      if (STEM_COMBINE[key]) {
        combineHits.push({ i, j, la: posLabels[i], lb: posLabels[j], tgI: ctx.tenGods[i], tgJ: ctx.tenGods[j], key, involvesDay: i === 2 || j === 2 });
      }
    }
  }
  const keptCombines = deduplicateCombines(combineHits);
  for (const h of keptCombines) {
    const guanShaTG = h.tgI === '七杀' || h.tgI === '正官' ? h.tgI : (h.tgJ === '七杀' || h.tgJ === '正官' ? h.tgJ : '');
    const otherTG = h.tgI === guanShaTG ? h.tgJ : h.tgI;
    const isYongShen = !!guanShaTG;
    const dayBonus = h.involvesDay ? 25 : 0;
    const yongShenText = guanShaTG === '七杀'
      ? `七杀本是你的鞭子，催你前进，但它被${otherTG}合住了。野心刚冒出来，就被一股更舒服的力量按回去。你不是没有冲劲——是那股冲劲不够疼。`
      : guanShaTG === '正官'
      ? `正官代表规矩和方向，但它被${otherTG}牵走了。你被要求走一条很正的路，但你内在的${otherTG}力量让你不愿意乖乖就范。`
      : `${h.tgI}和${h.tgJ}绑在一起——这两个特质在你身上不是分开的，而是互相拉扯的。`;
    features.push({
      score: (isYongShen ? 90 : 55) + dayBonus,
      text: `${h.la}干${stems[h.i]}（${h.tgI}）与${h.lb}干${stems[h.j]}（${h.tgJ}）相合。${yongShenText}`,
    });
  }

  // ── 2. 月干坐支关系（被泄/被克）──
  const monthStem = stems[1];
  const monthBranch = branches[1];
  const monthMainQi = p.month.hiddenStems[0];
  if (monthMainQi) {
    const rel = getTenGod(monthStem, monthMainQi);
    const monthTG = ctx.tenGods[1];
    // 被泄（食伤）
    if (rel === '食神' || rel === '伤官') {
      const isGuanSha = monthTG === '正官' || monthTG === '七杀';
      const branchEl = STEM_ELEMENT[monthMainQi] || '';
      features.push({
        score: isGuanSha ? 85 : 50,
        text: `月干${monthStem}（${monthTG}）坐${monthBranch}——${STEM_ELEMENT[monthStem] || ''}被${monthBranch}支${branchEl ? '的' + branchEl + '气' : ''}所泄。${isGuanSha ? `你被要求走过一条正统的路——读书、体制、或者家里安排的方向。但${monthTG}坐支被泄，规矩在你身上立不住。你大概率已经从那条路上跑偏了。` : `你对外展现的${monthTG}特质，其实在内部被消解了一部分。表面看到的样子，不是全部的你。`}`,
      });
    }
    // 被克（财/官坐支克干）
    const reverseRel = getTenGod(monthMainQi, monthStem);
    if (reverseRel === '正财' || reverseRel === '偏财' || reverseRel === '正官' || reverseRel === '七杀') {
      const monthTG2 = ctx.tenGods[1];
      const isKey = monthTG2 === '伤官' || monthTG2 === '七杀';
      features.push({
        score: isKey ? 70 : 50,
        text: `月干${monthStem}（${monthTG2}）坐${monthBranch}——${monthBranch}支的本气克制${monthStem}。${isKey && monthTG2 === '伤官' ? `伤官本应制杀、生财，但它坐支被克——你的才华和手段，在关键时刻使不上劲。不是你不会打，是拳还没到就被卸了力。` : `月干的力量被坐支削减——向外展现的特质，在根部就被压制了一部分。`}`,
      });
    }
    // 坐支来生
    if (rel === '正印' || rel === '偏印') {
      features.push({
        score: 50,
        text: `月干${monthStem}坐${monthBranch}——${monthBranch}支生扶${monthStem}。这种「坐支来生」让${monthStem}的力量更扎实，不是虚浮在天干上的。`,
      });
    }
  }

  // ── 3. 日支深度画像 ──
  const dayBranch = branches[2];
  const dayMainQi = p.day.hiddenStems[0];
  const dayStem = stems[2];
  if (dayMainQi) {
    const rel = getTenGod(dayStem, dayMainQi);
    const reverseRel = getTenGod(dayMainQi, dayStem);
    // 坐七杀
    if (rel === '七杀') {
      const isYou = dayBranch === '酉';
      features.push({
        score: 65,
        text: isYou
          ? `乙酉日柱——乙木坐在刀刃上。日支酉金七杀直接贴着日主，你的内在审判者不是「对自己要求高」那种温和的程度。你对自己说过最狠的话，别人一辈子都不会对你说。`
          : `${ctx.dm}坐${dayBranch}七杀——日支本气为七杀，你内心深处有一个严厉的自我审判者。表面随和，但你自己知道——那个标准很高，别人觉得你够好了，你自己觉得不够。`,
      });
    }
    // 坐正官
    if (rel === '正官') {
      features.push({
        score: 60,
        text: `${ctx.dm}坐${dayBranch}正官——日支正官贴身。你对自己有天然的约束力，不需要别人给你立规矩——你心里的那条线，比外部的规则更清晰。`,
      });
    }
    // 坐禄（日主同五行+临官位）
    const luMap: Record<string, string> = { '甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子' };
    if (luMap[dayStem] === dayBranch) {
      const isYiMao = dayStem === '乙' && dayBranch === '卯';
      const isDingWu = dayStem === '丁';
      features.push({
        score: 60,
        text: isYiMao
          ? `乙卯日柱——乙木自坐禄地，外面看起来柔顺，骨子里硬得很。乙木是藤萝，卯木是它的根——你对「靠自己」有一种近乎本能的信念。别人帮你是锦上添花，不帮你也照走不误。`
          : isDingWu
          ? `丁火坐巳火禄地——日主有根，你不是浮萍。丁火是灯烛之火，不靠爆发力，靠的是持续燃烧。`
          : `${ctx.dm}自坐禄地——日主有根有底，不是虚浮的。你有一种不需要外界认可的内在底气。`,
      });
    }
    // 坐刃
    const renMap: Record<string, string> = { '甲':'卯','丙':'午','戊':'午','庚':'酉','壬':'子' };
    if (renMap[dayStem] === dayBranch) {
      features.push({
        score: 55,
        text: `${ctx.dm}坐羊刃——日主自坐刃地，内在有一股不服输的狠劲。你比看起来更刚烈，只是平常不显。`,
      });
    }
    // 坐印
    if (rel === '正印' || rel === '偏印') {
      features.push({
        score: 55,
        text: `${ctx.dm}坐${dayBranch}印星——日主被保护得很好。${dayBranch}贴身相生，让你有一种天然的安逸感。这是好事（你不容易焦虑），也是限制（你缺少那种紧迫感）。`,
      });
    }
    // 坐财
    if (rel === '正财' || rel === '偏财') {
      features.push({
        score: 50,
        text: `${ctx.dm}坐${dayBranch}财星——你对价值和回报有天生的敏感。财富对你来说不是身外之物，是安全感的一部分。`,
      });
    }
  }

  // ── 4. 五行缺失（单缺 vs 多缺）──
  if (zero.length > 0) {
    const missingTexts: Record<string, string> = {
      '金': '金代表纪律和执行——你不是懒，是把能量转化成金的那种机制没建立起来。能熬大夜赶感兴趣的事，但很难每天固定时间做同一件事',
      '水': '水代表情绪调节和变通——你是那种「看起来没事，其实一直在内耗」的人。压力来了硬扛，不消化',
      '木': '木代表灵活性和成长——你可能在某些方面过于固执，缺少变通。这不是缺点，但会让你在一些路口多绕几圈',
      '火': '火代表表达和感染力——你可能做了很多事但不善于展示自己。不是没有才华，是才华没有被别人看见的渠道',
      '土': '土代表稳定和承载力——你或许缺一点脚踏实地的耐心。想法跑得比行动快，但不总能落地',
    };
    let score = 60;
    if (zero.length >= 2) score = 80;
    const parts = zero.map((el) => `${el}（${EL_ABILITY[el]}）`);
    const desc = zero.map((el) => missingTexts[el] || '').filter(Boolean).join('。');
    let text = `全局缺${parts.join('、')}。${desc}。`;
    // 单缺 + 有其他五行旺 → 强化解释
    if (zero.length === 1) {
      const missingEl = zero[0];
      const parent = Object.entries(GENERATING).find(([, child]) => child === missingEl)?.[0];
      if (parent && ec[parent as ElementType] >= 2) {
        text += ` 缺${missingEl}不是孤立问题——${parent}气虽旺，但${parent}生${missingEl}的链条断了，${parent}的能量没有去处。补上${missingEl}，${parent}的潜力才能释放。`;
      }
    }
    features.push({ score, text });
  }

  // ── 5. 五行过旺 ──
  for (const el of ['金','木','水','火','土'] as ElementType[]) {
    if (ec[el] >= 4 && el === ctx.dayEl) {
      features.push({
        score: 50,
        text: `${el}气在命局中占了${ec[el]}席——根基深厚，但也意味着你过于依赖${el}所代表的${EL_ABILITY[el].split('、')[0]}。凡事靠自己，不习惯开口求助。`,
      });
    }
  }

  // ── 6. 流通断崖 ──
  if (lt.blockage && lt.tongGuan && lt.drop >= 4) {
    const elAct = EL_ABILITY[lt.tongGuan]?.split('、')[0] || lt.tongGuan;
    features.push({
      score: 70,
      text: `五行流通在${lt.blockage}→${lt.tongGuan}出现断崖，落差${lt.drop}。你的${lt.blockage}能量积累极多，但转化不成${lt.tongGuan}所代表的产出——${elAct}是你命局最缺的一环。问题不是不够努力，是方向被卡住了。`,
    });
  }

  // ── 7. 火炎土燥/金寒水冷 ──
  if (ec['火'] >= 2 && ec['土'] >= 3 && ec['水'] === 0) {
    features.push({
      score: 65,
      text: `火炎土燥——你心里常年像烧着一锅快干的水，越搅越焦。${ctx.isStrong ? '身强让你扛得住，但扛得住不等于消化得了。' : ''}你没有情绪冷却机制，压力堆积如山，表面还跟没事人一样。`,
    });
  }
  if (ec['金'] >= 2 && ec['水'] >= 3 && ec['火'] === 0) {
    features.push({
      score: 65,
      text: `金寒水冷——你的理性远远强于感性，想法冷静、判断精准，但也容易陷入过度分析的漩涡。缺火意味着缺少热情和行动力——你知道该做什么，但迟迟不动。`,
    });
  }

  // ── 8. 伤官佩印 / 伤官生财 / 官杀生印 ──
  const patternCat = pattern.category;
  const monthQi = p.month.hiddenStems[0];
  const monthQiTG = monthQi ? getTenGod(bazi.dayMaster, monthQi) : '';
  const hasYinTou = ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印' || ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印';
  const hasCaiTou = ctx.tenGods[0] === '正财' || ctx.tenGods[0] === '偏财' || ctx.tenGods[1] === '正财' || ctx.tenGods[1] === '偏财' || ctx.tenGods[3] === '正财' || ctx.tenGods[3] === '偏财';
  const isShangShi = patternCat === '伤官格' || patternCat === '食神格' || monthQiTG === '伤官' || monthQiTG === '食神';

  // 伤官佩印
  if ((patternCat === '伤官格' || monthQiTG === '伤官') && hasYinTou) {
    const yinPos: string[] = [];
    if (ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印') yinPos.push('年');
    if (ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印') yinPos.push('时');
    features.push({
      score: 80,
      text: `伤官佩印——月令伤官是你的才华和表达欲，${yinPos.length > 0 ? yinPos.join('、') + '的印星帮你刹车' : '印星帮你刹车'}。你知道什么时候该说，什么时候该停。这点比大多数伤官格的人都强——不是被规则管住，是被智慧管住。`,
    });
  }
  // 伤官生财
  if (isShangShi && hasCaiTou) {
    const caiPos: string[] = [];
    if (ctx.tenGods[0] === '正财' || ctx.tenGods[0] === '偏财') caiPos.push('年');
    if (ctx.tenGods[1] === '正财' || ctx.tenGods[1] === '偏财') caiPos.push('月');
    if (ctx.tenGods[3] === '正财' || ctx.tenGods[3] === '偏财') caiPos.push('时');
    features.push({
      score: 80,
      text: `伤官生财——月令伤官是你的创造力，${caiPos.length > 0 ? caiPos.join('、') + '干' : '天干'}透出的财星是出口。你的才华天然能变现。伤官生财的人有一个特点：不会只为了兴趣做事——创造力自带商业嗅觉，做什么都会不自觉想「这个东西有没有价值」。`,
    });
  }
  // 官杀生印
  if ((patternCat === '印格' || pattern.displayName.includes('印')) &&
      (ctx.tenGods[0] === '正官' || ctx.tenGods[0] === '七杀' || ctx.tenGods[1] === '正官' || ctx.tenGods[1] === '七杀' || ctx.tenGods[3] === '正官' || ctx.tenGods[3] === '七杀')) {
    features.push({
      score: 65,
      text: `官杀生印——月令印星是你的根基，天干透出的官杀是来「助攻」的。压力不会压垮你，反而会转化成智慧和沉淀。这是典型的「越挫越稳」体质。`,
    });
  }

  // ── 9. 三合/三会局 ──
  const heEls = detectSanHe(branches);
  const huiEls = detectSanHui(branches);
  if (huiEls.length > 0) {
    const el = huiEls[0];
    const isGuanSha = el === '金' && patternCat === '杀格';
    features.push({
      score: isGuanSha ? 90 : 75,
      text: isGuanSha
        ? `地支${branches.filter((b, i, a) => a.indexOf(b) !== i || ['申','酉','戌'].includes(b)).join('')}三会金局——七杀不是一颗星，是一片天。申酉戌三会成形，杀势极旺。没有食神制它、没有印星化它，七杀在你的命局里是失控的。你不是被压力追赶——你是活在压力里面。`
        : `地支三会${el}局——${el}气在你的命局中被放大到了极致。这是一种极端的力量——不是加分就是减分，没有中间地带。`,
    });
  }
  if (heEls.length > 0 && huiEls.length === 0) {
    const el = heEls[0];
    features.push({
      score: 70,
      text: `地支三合${el}局——${el}气在暗中成形。三合不像三会那样直接碾压，而是一种暗中凝聚的力量。你知道自己身上有某种倾向，但不一定说得清楚——它在地下，但一直在。`,
    });
  }

  // ── 10. 天干相生（关键生扶链）──
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i === j) continue;
      if (GENERATING[STEM_ELEMENT[stems[i]] || ''] === STEM_ELEMENT[stems[j]]) {
        const tgI = ctx.tenGods[i];
        const tgJ = ctx.tenGods[j];
        const isKey = (tgI === '偏财' && tgJ === '七杀') || (tgI === '七杀' && tgJ === '偏印') || (tgI === '正官' && tgJ === '正印') || (tgI === '伤官' && tgJ === '偏财') || (tgI === '伤官' && tgJ === '正财');
        if (isKey && i !== 2 && j !== 2) {
          features.push({
            score: 70,
            text: `${posLabels[i]}干${stems[i]}（${tgI}）生${posLabels[j]}干${stems[j]}（${tgJ}）——${tgI === '偏财' && tgJ === '七杀' ? '偏财生七杀：你对机会的嗅觉天生敏锐，而这种敏锐会直接转化为冲劲。钱和资源对你来说不是目的——是引擎。' : tgI === '七杀' && tgJ === '偏印' ? '七杀生偏印：压力在你这里不会白费——每一次压榨都会转化成独特的智慧和洞察。别人被压力压垮，你被压力喂大。' : tgI === '伤官' && (tgJ === '偏财' || tgJ === '正财') ? `伤官生财：你的创造力（伤官）直接通向变现（财星）——这是八字里最直接的才华变现通道。你天生知道怎么把想法变成价值。` : '这种天干之间的生扶让你的格局更稳——不是单打独斗，而是有来有往。'}`,
          });
        }
      }
    }
  }

  // ── 11. 天干双透 ──
  const tgCount: Record<string, number> = {};
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue;
    tgCount[ctx.tenGods[i]] = (tgCount[ctx.tenGods[i]] || 0) + 1;
  }
  // 双透时的具体描述
  const doubleTexts: Record<string, string> = {
    '劫财': '周围不是没有人帮你——你有兄弟、朋友、同伴。但劫财帮身不帮杀——在旁边，但没人替你扛。',
    '偏印': '像左右两个护卫，替你把局势兜住了。你不缺智慧，甚至有时候想得比做得快太多。',
    '正印': '你的学习能力和贵人运天然比别人多一倍。但印星过旺也会让你安于被保护的状态。',
    '七杀': '压力来自四面八方——但两只老虎如果方向一致，反而比一只更容易驾驭。',
    '正官': '规矩和责任感在你身上加倍——你不是不想放松，是不知道该对谁放松。',
    '偏财': '商业嗅觉和机会捕捉能力是别人的两倍——但财多不稳，机会来得快去得也快。',
    '正财': '对财富的敏感度翻倍——你赚钱的方式不是一条，而是两条并行。',
    '食神': '创造力是天生的——你比一般人有双倍的表达欲和审美力。',
    '伤官': '才华横溢但锋芒也双倍——你的才华是礼物，但控制不好也会伤到自己。',
  };
  for (const [tg, count] of Object.entries(tgCount)) {
    if (count >= 2) {
      const positions: string[] = [];
      for (let i = 0; i < 4; i++) {
        if (i === 2) continue;
        if (ctx.tenGods[i] === tg) positions.push(posLabels[i]);
      }
      const desc = doubleTexts[tg] || `你身上${tg}的特质比一般人更明显——这是双倍的礼物，也可能是双倍的负担。`;
      features.push({
        score: 55,
        text: `${tg}双透——${positions.join('、')}两头都有。${desc}`,
      });
    }
  }

  // ── 12. 格局成/破/不成 ──
  const reasonShort = outcome.reason.split(';')[0].trim() || '';
  if (outcome.outcome === '破格') {
    // 七杀格破格 → 强调制化失败
    const isShaPo = patternCat === '杀格' || pattern.displayName.includes('七杀');
    features.push({
      score: isShaPo ? 85 : 75,
      text: isShaPo
        ? `七杀格破格。${reasonShort ? `原因是${reasonShort}。` : ''}你的命局里有很强的压力源——但你没有制它的工具（食神），也没有化它的渠道（印星）。七杀在你的命局里是失控的。破碎不是终点——破格的人经历了更多摔打，摔打本身就是锻造。`
        : `格局「破格」——${reasonShort ? `原因是${reasonShort}。` : ''}破碎不是终点。破格的人经历了更多摔打，而摔打本身就是锻造。破而后立，重建的往往比原来的更坚固。`,
    });
  } else if (outcome.outcome === '不成格') {
    const isSha = patternCat === '杀格' || pattern.displayName.includes('七杀');
    features.push({
      score: isSha ? 75 : 65,
      text: isSha
        ? `七杀格不成格。${reasonShort ? `原因是${reasonShort}。` : ''}你有压力，但没有处理好压力的手段——七杀在你命局里是需要被驯服的力量，目前还没完全驯服。大运流转会补齐缺失的条件。你不是不行，是时候未到。`
        : `格局「不成格」——${pattern.displayName}的底子是有的，火候还差一点。大运流转，属于你的时机还在后头。你不是不行，是时候未到。`,
    });
  } else {
    features.push({
      score: 35,
      text: `格局「成格」——命局的顶层设计完整，${pattern.displayName}的底子扎实。`,
    });
  }

  // ── 13. 地支重复 ──
  const brCount: Record<string, number> = {};
  for (const br of branches) brCount[br] = (brCount[br] || 0) + 1;
  for (const [br, count] of Object.entries(brCount)) {
    if (count >= 2) {
      const brTexts: Record<string, string> = {
        '午': '午火双现，热情和焦躁同时翻倍。你内心比外表看起来热烈得多。',
        '子': '子水双现，智慧和敏感同时放大。你想得比别人深，也容易想得比别人多。',
        '卯': '卯木双现，柔韧加倍。你擅长在夹缝中找到出路，但也容易过度迁就环境。',
        '酉': '酉金双现，锋利加倍。你的决断力和边界感比一般人强得多。',
        '辰': '辰土双现，内在厚重感翻倍。你藏得比别人深——能看到的只是冰山一角。',
      };
      features.push({
        score: 45,
        text: `地支双${br}——${brTexts[br] || `${br}气在你命局中被放大了一倍。`}`,
      });
    }
  }

  // ── 14. 身强/身弱 ──
  if (ctx.isStrong) {
    const elMetaphor = ctx.dm === '戊土' || ctx.dm === '己土' ? '像一座山，扛得住事' :
      ctx.dayEl === '火' ? '像一团火，热情和感染力是你的武器' :
      ctx.dayEl === '金' ? '像一把刀，干脆利落不拖泥带水' :
      ctx.dayEl === '水' ? '像一条江，表面平静底下暗流涌动' :
      '像一棵树，有自己生长的方向和节奏';
    features.push({
      score: 30,
      text: `${ctx.dm}身强，${ctx.strength.deLing ? '得令' : ''}${ctx.strength.deDi ? '得地' : ''}${ctx.strength.deShi === '得势' ? '得势' : ''}——${elMetaphor}。`,
    });
  } else {
    features.push({
      score: 30,
      text: `${ctx.dm}${ctx.strength.level === '中和' ? '中和平衡' : '身弱'}——${ctx.strength.level === '身弱' ? '你不是硬扛型的人。但你比身强的人更懂借力——知道自己的局限在哪里，反而能用巧劲化解很多问题。' : '不多不少，刚好够用。你有自己的节奏，不疾不徐。'}`,
    });
  }

  // ── 15. 缺单一元素的深度补丁 ──
  if (zero.length === 1) {
    const missingEl = zero[0];
    const parent = Object.entries(GENERATING).find(([, child]) => child === missingEl)?.[0];
    if (parent && ec[parent as ElementType] >= 2 && lt.blockage && lt.tongGuan && lt.blockage === parent) {
      // 这个已经在五行缺失中处理了
    }
  }

  return features;
}

// ── 主入口 ──

export function generateNarrative(
  bazi: BaziResult, pattern: ExtractResult, outcome: AssessResult,
  strength: StrengthResult, lt: LiuTongResult,
): string {
  const ctx = buildCtx(bazi, pattern, outcome, strength, lt);
  const features = scanFeatures(ctx);
  const top = features.sort((a, b) => b.score - a.score).slice(0, 4);
  if (top.length === 0) {
    return `${ctx.dm}日主，${pattern.displayName}，格局${outcome.outcome}。顺势而行，自有出路。`;
  }
  const parts = [top[0].text];
  if (top.length >= 2) parts.push(top[1].text);
  if (top.length >= 3) parts.push(top[2].text);
  if (top.length >= 4) parts.push(top[3].text);
  return parts.join('\n\n');
}

import type { BaziResult, ElementType } from '@/types/bazi';
import type { ExtractResult } from './extractPattern';
import type { AssessResult } from './assessOutcome';
import type { StrengthResult } from '@/lib/strength/determineStrength';
import type { LiuTongResult } from './liuTong';
import { getTenGod } from '@/lib/bazi-utils';
import { getTiaoHouNarrative } from './tiaoHou';

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

interface Feature { score: number; text: string; tags?: string[]; }

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

// ── 判断句变体选择 ──
function variant(n: number, ...options: string[]): string {
  return options[n % options.length];
}

// ── 特征扫描 ──

function scanFeatures(ctx: Ctx): Feature[] {
  const features: Feature[] = [];
  const { bazi, stems, branches, lt, pattern, outcome, zero } = ctx;
  const p = bazi.pillars;
  const ec = bazi.elementCount;

  // 判断句变体种子：基于日支+日干组合
  const dayBranch = branches[2];
  const dayStem = stems[2];
  const variantSeed = (dayStem.charCodeAt(0) + dayBranch.charCodeAt(0)) % 3;

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
    const dayBonus = h.involvesDay ? 25 : 0;
    const posText = `${h.la}干${stems[h.i]}（${h.tgI}）与${h.lb}干${stems[h.j]}（${h.tgJ}）相合。`;

    // 确定被合的「主角」十神，优先级：杀 > 官 > 财 > 食伤 > 印
    const pickLead = (...types: string[]): string | null => {
      for (const t of types) {
        if (h.tgI === t) return h.tgI;
        if (h.tgJ === t) return h.tgJ;
      }
      return null;
    };
    const leadTG = pickLead('七杀', '正官')
      || pickLead('正财', '偏财')
      || pickLead('食神', '伤官')
      || pickLead('正印', '偏印')
      || h.tgI;
    const otherTG = h.tgI === leadTG ? h.tgJ : h.tgI;
    const dayInvolve = h.involvesDay ? '而且这组合在你自己的日柱上——你不是在经历冲突，你是长在冲突里。' : '';

    let text: string;
    let score = 55;
    let tags: string[] = ['info'];

    if (leadTG === '七杀') {
      score = 90;
      tags = ['main'];
      text = `七杀本是你的鞭子，催你前进，但它被${otherTG}合住了。野心刚冒出来，就被一股更舒服的力量按回去。你不是没有冲劲——是那股冲劲不够疼。${variant(variantSeed, '那个野心没有消失——它一直在压着。你最需要的不是更努力，是让那根鞭子重新疼起来。', '野心压在角落里，等一个不能回头的机会。你不是没有动力，是动力还没疼到让你动。', '你不是缺冲劲——是缺一个让你没有退路的局面。找到它，你会比谁都猛。')}`;
    } else if (leadTG === '正官') {
      score = 90;
      tags = ['main'];
      text = `正官代表规矩和方向，但它被${otherTG}牵走了。${variant(variantSeed, `你被要求走一条很正的路，但你内在的${otherTG}力量让你不愿意乖乖就范。规矩在你身上立住了——但立得不太稳。`, `正官被${otherTG}合住——规矩和自由在你身上一直在谈判。该守规矩的时候，${otherTG}冒出来说「破一次」；该放肆的时候，正官又让你过意不去。你不是左右为难——你是两样都要。`, `正官代表你对秩序的渴望，${otherTG}代表你不想被管的那部分。它们合在一起——结果是你在规矩里找漏洞，在放纵里找框架。这不是虚伪，是你在试图两全。`)}`;
    } else if (leadTG === '正财' || leadTG === '偏财') {
      score = 70;
      tags = ['main'];
      text = `${leadTG}被${otherTG}合住了——你对机会和资源的嗅觉被打了个结。${variant(variantSeed, `不是没有赚钱的能力，是那股追逐的动力被${otherTG}抵消了。钱不是不来——是你在追的半路上被别的东西吸引了。`, `${leadTG}本该是你的引擎，但${otherTG}把它合住了——引擎在空转。你对价值的直觉还在，但落到行动上总差一步。不是你不够想——是想的方向被拽偏了一下。`, `合财在命理里叫「财被合走」——不一定是坏事。${leadTG}被${otherTG}牵制，意味着你对钱的执念不会失控。但反过来，该你赚的时候也容易被心情、人情或别的事岔开。`)}`;
    } else if (leadTG === '食神' || leadTG === '伤官') {
      score = 65;
      tags = ['deep'];
      text = `${leadTG}是你的才华和表达欲，但它被${otherTG}合住了。${variant(variantSeed, `你不是没有才，是输出的时候总有个东西在拽你。想法在脑子里跑完了全程，说出来却只有一半。`, `${leadTG}被${otherTG}牵着——你的创造力不是消失了，是被转译成了另一种形式。你可能不擅长直接表达，但你做的事里有你的才华——只是换了条路出来。`, `合食伤的人有一个特点：肚子里有货，但倒出来的方式和别人不一样。${leadTG}被${otherTG}合住，你的才华不走直路——拐个弯，反而更有深度。`)}`;
    } else if (leadTG === '正印' || leadTG === '偏印') {
      score = 60;
      tags = ['info'];
      text = `${leadTG}是你的学习和沉淀能力，但被${otherTG}合住了。${variant(variantSeed, `想静下来的时候总有别的事找你，想思考的时候总被打断。不是你不想沉淀——是沉淀的节奏一直被${otherTG}打乱。`, `印星被合的人有一种「知道很多但说不清从哪来」的气质。你的知识不是系统性的——是散装的、实战的、不按章节来的。这不是低效，是你的天赋选择了另一条路。`, `${leadTG}被${otherTG}牵制——你的学习方式不是坐在那里啃书。你是在碰撞中学、在关系中学。这条吸收知识的路径虽然绕，但学到的东西别人拿不走。`)}`;
    } else {
      score = 55;
      tags = ['info'];
      text = `${h.tgI}和${h.tgJ}绑在一起——这两个特质在你身上不是分开的，是互相拉扯的。${variant(variantSeed, '你自己可能都分不清哪个才是真的自己——但其实两个都是，只是不同时候主导权不一样。', '两股力量在你命局里共生——不是有你没我，而是在商量。有时候一方主导，有时候另一方。你就是在这种动态平衡里长大的。', '结果是你在两个方向上都走不到极端。不会太' + h.tgI + '，也不会太' + h.tgJ + '——这是一种被动的平衡感，但平衡本身也是你的武器。')}`;
    }

    features.push({
      score: score + dayBonus,
      tags,
      text: `${posText}${text}${dayInvolve}`,
    });
  }

  // ── 2. 月干坐支关系（被泄/被克/来生/同气/坐财）──
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
        tags: isGuanSha ? ['main'] : ['info'],
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
        tags: isKey ? ['main'] : ['info'],
        text: `月干${monthStem}（${monthTG2}）坐${monthBranch}——${monthBranch}支的本气克制${monthStem}。${isKey && monthTG2 === '伤官' ? `伤官本应制杀、生财，但它坐支被克——你的才华和手段，在关键时刻使不上劲。不是你不会打，是拳还没到就被卸了力。` : `月干的力量被坐支削减——向外展现的特质，在根部就被压制了一部分。`}`,
      });
    }
    // 坐支来生
    if (rel === '正印' || rel === '偏印') {
      features.push({
        score: 50,
        tags: ['info'],
        text: `月干${monthStem}坐${monthBranch}——${monthBranch}支生扶${monthStem}。这种「坐支来生」让${monthStem}的力量更扎实，不是虚浮在天干上的。`,
      });
    }
    // 坐比劫（同气）
    if (rel === '比肩' || rel === '劫财') {
      const isKey = monthTG === '七杀' || monthTG === '伤官' || monthTG === '正官';
      features.push({
        score: isKey ? 55 : 45,
        tags: isKey ? ['main'] : ['info'],
        text: `月干${monthStem}（${monthTG}）坐${monthBranch}同气——天干和地支同一五行，${monthTG}不是虚浮的，有根有底。${isKey ? `这本该是好事——有根就有力量。但同气也意味着${monthTG}的能量被坐支分走了一部分：你对外展现的${monthTG}特质，背后有一个和你抢资源的力量在并行。你并不孤独——但也不完全自由。` : `月干有根是一件好事——你的${monthTG}特质不是演出来的，是骨子里的。`}`,
      });
    }
    // 坐财被耗
    if (rel === '正财' || rel === '偏财') {
      const isKey = monthTG === '伤官' || monthTG === '七杀';
      features.push({
        score: isKey ? 65 : 45,
        tags: isKey ? ['main'] : ['info'],
        text: `月干${monthStem}（${monthTG}）坐${monthBranch}财星——天干克制地支之财，${isKey && monthTG === '伤官' ? '伤官坐财，才华天然能变现。你的表达欲和创造力下面垫着对价值的判断——不是瞎说，是有商业嗅觉的表达。' : isKey && monthTG === '七杀' ? '七杀坐财，你的冲劲和魄力下面垫着对资源的掌控欲。不是蛮干——每一次冲锋背后都有一笔账在算。' : `${monthTG}被坐支财星消耗——对外展现的样子是需要你用内在能量去喂养的。你看起来的状态，背后一直有一个持续的输出在支撑。`}`,
      });
    }
  }

  // ── 2.5 年干/时干坐支（精简版，只抓最显著的坐支关系）──
  const auxStems = [
    { i: 0, label: '年', stem: stems[0], branch: branches[0], tg: ctx.tenGods[0], pillar: p.year },
    { i: 3, label: '时', stem: stems[3], branch: branches[3], tg: ctx.tenGods[3], pillar: p.hour },
  ];
  for (const aux of auxStems) {
    const auxQi = aux.pillar.hiddenStems[0];
    if (!auxQi) continue;
    const auxRel = getTenGod(aux.stem, auxQi);
    // 被克（支克干）— 年干被克=出身压制，时干被克=晚年受限
    if (auxRel === '正官' || auxRel === '七杀') {
      features.push({
        score: 45,
        tags: ['info'],
        text: aux.label === '年'
          ? `${aux.label}干${aux.stem}（${aux.tg}）坐${aux.branch}被克——你最早展现的${aux.tg}特质，在根部就被环境压制了。不是你不想表达，是从小的环境不鼓励你这样。`
          : `${aux.label}干${aux.stem}（${aux.tg}）坐${aux.branch}被克——你的行动力和产出在根部受到约束。不是能力不够，是释放的出口不够畅通。`,
      });
    }
    // 来生（支生干）— 年干得生=家庭滋养，时干得生=晚年有靠
    if (auxRel === '正印' || auxRel === '偏印') {
      features.push({
        score: 40,
        tags: ['info'],
        text: aux.label === '年'
          ? `${aux.label}干${aux.stem}（${aux.tg}）坐${aux.branch}得生——你的${aux.tg}特质从根部就有滋养。早期环境给了你展现自己的底气。`
          : `${aux.label}干${aux.stem}（${aux.tg}）坐${aux.branch}得生——你晚年的${aux.tg}特质被坐支托着，不是越走越弱，是越走越稳。`,
      });
    }
    // 同气（干支同五行）
    if (auxRel === '比肩' || auxRel === '劫财') {
      features.push({
        score: 40,
        tags: ['info'],
        text: aux.label === '年'
          ? `${aux.label}干${aux.stem}坐${aux.branch}同气——你身上${aux.tg}的特质是带着根来的，不是后天学的，是从小的环境里长出来的。`
          : `${aux.label}干${aux.stem}坐${aux.branch}同气——你的${aux.tg}特质一以贯之。早年什么样，晚年还是什么样——不容易被时间改变。`,
      });
    }
    // 坐财（干克支）
    if (auxRel === '正财' || auxRel === '偏财') {
      features.push({
        score: 40,
        tags: ['info'],
        text: aux.label === '年'
          ? `${aux.label}干${aux.stem}坐着财星——你从小对价值和资源就敏感。这种直觉是天生的，不是后天培训出来的。`
          : `${aux.label}干${aux.stem}坐着财星——你的行动天然带着目标感。做事不会只为了爽——每件事背后都有一个价值判断。`,
      });
    }
  }

  // ── 2.6 调候叙事 ──
  const tiaoHouText = getTiaoHouNarrative(bazi);
  if (tiaoHouText) {
    features.push({
      score: 55,
      tags: ['info'],
      text: tiaoHouText,
    });
  }

  // ── 3. 日支深度画像（if-else 链，只取一个，优先级：杀>官>印>财>伤>食>禄>刃）──
  const dayMainQi = p.day.hiddenStems[0];
  const luMap: Record<string, string> = { '甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子' };
  const renMap: Record<string, string> = { '甲':'卯','丙':'午','戊':'午','庚':'酉','壬':'子' };
  if (dayMainQi) {
    const rel = getTenGod(dayStem, dayMainQi);
    // 坐七杀（最高优先级）
    if (rel === '七杀') {
      const isYou = dayBranch === '酉';
      const dmChar = ctx.dm.includes('壬') ? '表面随和、好说话——壬水天生擅长融入，跟谁都能聊。' :
        ctx.dm.includes('己') ? '己土本来就偏柔，不习惯正面对抗。' : '';
      features.push({
        score: 72,
        text: isYou
          ? `乙酉日柱——乙木坐在刀刃上。日支酉金七杀直接贴着日主，你的内在审判者不是「对自己要求高」那种温和的程度。你对自己说过最狠的话，别人一辈子都不会对你说。`
          : `${ctx.dm}坐${dayBranch}七杀——你有两副面孔。${dmChar}但日支七杀贴身——内心深处有一个很严的自我标准，别人觉得你够好了，你不觉得。这种内外反差是你最累的地方——对外你在迁就，对内你在审判。${variant(variantSeed, '你花在跟自己较劲上的力气，够做好几件事了。', '学会对自己松一寸，比对外赢一仗更重要。你最大的对手不是别人——是你心里的那个审判者。', '那个内在的审判者不会消失——但你可以学会和它谈判。标准可以高，但不需要高到把自己压垮。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (rel === '正官') {
      const isBingZi = dayStem === '丙' && dayBranch === '子';
      features.push({
        score: 65,
        text: isBingZi
          ? `丙子日柱——丙火坐子水正官，水火既济。热情和分寸感在你身上不矛盾——你知道什么时候该热，什么时候该收。这种平衡感不是练出来的，是天生的。`
          : `${ctx.dm}坐${dayBranch}正官——日支正官贴身。你对自己有天然的约束力，不需要别人给你立规矩——你心里的那条线，比外部的规则更清晰。你被架在「对的位置」上，做正经事、走正经路。但骨子里那个不被约束的自己，一直在。${variant(variantSeed, '这种自律不是压抑——是你选择了规则，不是规则选择了你。你知道什么时候遵守，什么时候在心里偷偷打破它。', '日坐正官的人有一种「不需要人管」的气质——不是叛逆，是你自己管自己已经够严了。别人对你提要求是多余的——你对自己的标准比谁都高。', '那条心里的线一直在——但它也是你的安全区。有时候跨过去一步，不是你变了，是你长大了。规矩是用来服务的，不是用来困住自己的。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (rel === '正印' || rel === '偏印') {
      features.push({
        score: 60,
        text: `${ctx.dm}坐${dayBranch}印星——日主被保护得很好。${ctx.dm.includes('戊') ? '成长环境给了你安稳的底气，但也让你少了那种' + "'" + '不拼不行' + "'" + '的紧迫感。日子可以过得不错，但不错不等于对。' : `这种安逸感让你不容易焦虑，但也让你在面对挑战时倾向于等一等、看一看——不是不敢动，是太习惯舒服的状态了。${variant(variantSeed, '你不是没有冲劲——是冲之前会先问自己「值不值得」。这不是犹豫，是印星给你的判断力。但偶尔放下判断、直接冲一次，会有惊喜。', '被保护得很好的人，往往不知道自己有多强。舒适区待久了，你会低估自己的战斗能力。你不是不能打——是太久没打了。', '日坐印星的人有一个隐藏技能：在混乱中找到安全感。不管环境多糟，你心里总有一个角落是稳的。这是你的天赋——但也别让它变成你拒绝变化的借口。')}`}`,
        tags: ['personality', 'deep'],
      });
    } else if (rel === '正财' || rel === '偏财') {
      features.push({
        score: 55,
        text: `${ctx.dm}坐${dayBranch}财星——你对价值和回报有天生的敏感。财富对你来说不是身外之物，是安全感的一部分。你对价值的判断在骨子里，不是后天学会的。${variant(variantSeed, '这种对价值的直觉不是贪——是你天生知道什么东西值钱、什么东西值得。别人还在算，你已经感觉到了。', '日坐财星的人有一种「不将就」的底色。你对自己的时间和精力有定价——免费的不一定不好，但你会本能地计算投入产出比。', '财富不只是钱——对你来说，任何形式的回报都是「财」。认可、尊重、安全感——这些都在你心里的那本账上。关键是学会给无形的东西也标一个合理的价。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (rel === '伤官') {
      const isGengZi = dayStem === '庚' && dayBranch === '子';
      const isXinHai = dayStem === '辛' && dayBranch === '亥';
      const isShuiShang = ['庚','辛'].includes(dayStem) && ['子','亥'].includes(dayBranch);
      features.push({
        score: 52,
        text: isGengZi
          ? `庚子日柱——金生水，伤官吐秀。庚金刀剑坐子水伤官，刀入水中，锋芒不减但多了一层智慧的包浆。你不是没有脾气——是脑子比嘴快，想清楚了才出手。`
          : isXinHai
          ? `辛亥日柱——辛金珠宝坐亥水伤官，金水相生。表面冷、内心深，看事情比别人多两层。你不轻易开口，开口往往一针见血。`
          : isShuiShang
          ? `${ctx.dm}坐${dayBranch}伤官——金水伤官，聪明在骨子里。你的才华不是学来的，是天生的洞察力。但也因为想得太快、太深，容易跟周围人产生距离感。`
          : `${ctx.dm}坐${dayBranch}伤官——骨子里有一股不服管教的才气。你最深的那个自己被伤官主宰——表面可以配合规则，内心在不停地说「凭什么」。${variant(variantSeed, '这种不服从不是叛逆，是你创造力的原始燃料。管好它，它会是你最大的武器。', '你不是不愿意被管——是需要一个让你服气的理由。说不服你，谁说都没用。', '才华在骨子里的人，注定不会走所有人都走的路。那不是问题——那是方向。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (rel === '食神') {
      const isGuiMao = dayStem === '癸' && dayBranch === '卯';
      features.push({
        score: 50,
        text: isGuiMao
          ? `癸卯日柱——癸水坐卯木食神，水木清华。灵气内敛，温和而有深度。你不是那种大声说话的人——但你开口的时候，别人会听。这是一种不张扬的存在感。`
          : `${ctx.dm}坐${dayBranch}食神——日支食神是你的内在平和区。你不是没有野心，而是不会被野心烧到自己。心里有一个很舒服的角落——不管外面多乱，那块地方一直很安静。${variant(variantSeed, '这种平和不是软弱——是在任何环境里都能找到自己的节奏。', '食神在日支的人，擅长把日子过出滋味。不是大起大落的精彩，是细水长流的质地。', '你比大多数人更懂得怎么对自己好——这不是自私，是你天生的自愈力。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (luMap[dayStem] === dayBranch) {
      const isYiMao = dayStem === '乙' && dayBranch === '卯';
      const isDingHuo = dayStem === '丁';
      features.push({
        score: 50,
        text: isYiMao
          ? `乙卯日柱——乙木自坐禄地，外面看起来柔顺，骨子里硬得很。乙木是藤萝，卯木是它的根——你对「靠自己」有一种近乎本能的信念。别人帮你是锦上添花，不帮你也照走不误。这是乙卯的自尊，也是乙卯的孤独。`
          : isDingHuo
          ? `丁巳日柱——丁火自坐巳火禄地。有根有底，不是浮萍。丁火坐巳是「自燃」属性——不依赖外部能源，自己就能发光。时干丁火比肩再帮一把，你不是一个人在撑，别人看到的你只是你的一半。`
          : `${ctx.dm}自坐禄地——日主有根有底，不是虚浮的。你有一种不需要外界认可的内在底气。${variant(variantSeed, '这种底气不是骄傲——是你知道自己是谁。不需要别人的评价来校准自己，你的坐标系在内部。', '自坐禄地的人，骨子里有一股「我自己来」的本能。不是不信任别人——是你习惯了自己搞定一切。', '禄是你的根——有根的人不容易被风吹倒。但根太深了也会让你不想动——不是不能改变，是不觉得需要改变。')}`,
        tags: ['personality', 'deep'],
      });
    } else if (renMap[dayStem] === dayBranch) {
      features.push({
        score: 45,
        text: `${ctx.dm}坐羊刃——日主自坐刃地，内在有一股不服输的狠劲。你比看起来更刚烈，只是平常不显。${variant(variantSeed, '这股狠劲平时藏得很好——但关键时候它会替你做决定。比你自己更果决、更不犹豫。', '坐刃的人有一个特点：对自己狠得下心。别人觉得苦的事，你咬咬牙就过去了。但对自己太狠了，久了也会累——偶尔允许自己不扛。', '羊刃是你的武器——但也容易误伤自己。那股不服输的劲推你走了很远，但记得偶尔停下来问：这场仗还要不要继续打。')}`,
        tags: ['personality', 'deep'],
      });
    } else {
      // 兜底：劫财、比肩等不在优先级的日支关系
      const branchQiEl = STEM_ELEMENT[dayMainQi] || '';
      const dmEl = ctx.dayEl;
      if (branchQiEl === dmEl) {
        features.push({
          score: 48,
          text: `${ctx.dm}坐${dayBranch}——日支与日主同气，内在有一股自给自足的底气。你不需要太多外界的认可来确认自己的价值——自己知道自己几斤几两。${variant(variantSeed, '这种自给自足是你的出厂设置——不是练出来的，是天生的。别人在找自己，你在做自己。', '同气意味着你跟自己之间没有太多内耗。想要什么、想去哪里，心里一直有数——不需要往外找答案。', '你知道自己几斤几两——但有时候太清楚了也不好。偶尔允许自己高估一次、冒一次看起来「不像你」的险，会发现你不知道的另外一面。')}`,
          tags: ['personality', 'deep'],
        });
      }
    }
  }

  // ── 4. 五行缺失（单缺 vs 多缺）──
  if (zero.length > 0) {
    const missingTexts: Record<string, string> = {
      '金': `金代表纪律和执行——你不是懒，是把能量转化成金的那种机制没建立起来。能熬大夜赶感兴趣的事，但很难每天固定时间做同一件事。${variant(variantSeed, '给你结构感的人或系统，比给你deadline的人更有用。', '不是更努力就能解决的——你需要的是一个能把想法变成行动的外部框架。', '执行力不是逼出来的，是被系统托起来的。找到一个能替你把想法落地的人或流程。')}`,
      '水': `水代表情绪调节和变通——你是那种「看起来没事，其实一直在内耗」的人。压力来了硬扛，不消化。你需要的不是更强大的抗压能力——你需要的是一个能让你卸下来的地方。${variant(variantSeed, '学会给自己留白——不是每件事都需要你硬扛到底。情绪是水，堵住了会变味。找到一个能让你倒出来的人或出口。', '你的抗压能力已经很强了——强到忘了怎么放松。卸下来不是弱，是你对自己的一种诚实。累了就说累了，不用假装没事。', '缺水的你像一台没有冷却系统的引擎——跑得快，但容易过热。给自己定一个「停下来」的时间，比定一个「跑更快」的目标重要得多。')}`,
      '木': `木代表灵活性和成长——你可能在某些方面过于固执，缺少变通。这不是缺点，但会让你在一些路口多绕几圈。${variant(variantSeed, '试着在坚持和变通之间找一个平衡。不是每个路口都需要你亲自撞一次——有些人走过的路，值得信一次。', '多绕的几圈不是白走的——每一步都算数。但走完一圈之后要记得抬头看看，是不是有更短的那条路了。', '固执和坚定是同一枚硬币的两面——区别在于你是主动选择方向，还是被动防守位置。问自己一个问题：你在坚持的是目标，还是习惯。')}`,
      '火': `火代表表达和感染力——你可能做了很多事但不善于展示自己。不是没有才华，是才华没有被别人看见的渠道。${variant(variantSeed, '好的东西不需要大声喊——但至少得让别人知道你在哪里。学会展示不是炫耀，是让你的才华被对的人看到，而不是等别人来发现。', '你做事的深度够了，差的是一束光。找到一个能把你的成果照亮的人或平台——不是锦上添花，是物归其位。', '不擅长表达不是问题——问题是因此错过了本该属于你的机会。不需要变成社交达人，只需要在关键时刻站出来说一声「这个是我做的」。')}`,
      '土': `土代表稳定和承载力——你或许缺一点脚踏实地的耐心。想法跑得比行动快，但不总能落地。${variant(variantSeed, '找到一个能把你的想法接住的人或系统——不是不想落地，是缺了最后那一步的推力。热情来了跑得很快，但跑到一半就拐弯了。学会把一件事做透，比开十个头更有用。', '你缺的不是能力——是把能量聚焦到一个地方的纪律。选对一件事，先把它做穿。后面的路，做穿第一件之后再走。', '想法多是天赋，但落地是能力。给自己一个「先做完再判断」的习惯——有时候最好的想法在第六步，但你没有走完前五步。')}`,
    };
    let score = 60;
    if (zero.length >= 2) score = 80;
    const parts = zero.map((el) => `${el}（${EL_ABILITY[el]}）`);
    const desc = zero.map((el) => missingTexts[el] || '').filter(Boolean).join('。');
    let text = `全局缺${parts.join('、')}。${desc}`;
    // 单缺 + 有其他五行旺 → 强化解释
    if (zero.length === 1) {
      const missingEl = zero[0];
      const parent = Object.entries(GENERATING).find(([, child]) => child === missingEl)?.[0];
      if (parent && ec[parent as ElementType] >= 2) {
        text += ` 缺${missingEl}不是孤立问题——${parent}气虽旺，但${parent}生${missingEl}的链条断了，${parent}的能量没有去处。补上${missingEl}，${parent}的潜力才能释放。`;
      }
    }
    features.push({ score, text, tags: ['gap'] });
  }

  // ── 5. 五行过旺 ──
  for (const el of ['金','木','水','火','土'] as ElementType[]) {
    if (ec[el] >= 4 && el === ctx.dayEl) {
      features.push({
        score: 50,
        tags: ['info'],
        text: `${el}气在命局中占了${ec[el]}席——根基深厚，但也意味着你过于依赖${el}所代表的${EL_ABILITY[el].split('、')[0]}。凡事靠自己，不习惯开口求助。`,
      });
    } else if (ec[el] >= 4 && el !== ctx.dayEl) {
      const elAb = EL_ABILITY[el]?.split('、')[0] || el;
      const controllingEl = Object.entries(GENERATING).find(([, child]) => child === el)?.[0] || '';
      const drainEl = GENERATING[el] || '';
      features.push({
        score: 55,
        tags: ['info'],
        text: `${el}气在命局中占了${ec[el]}席，但日主并非${el}——这股${el}的能量是你命局中的「外来势力」。${elAb}是你的环境里挥之不去的主旋律，但你不一定是它的主人。${controllingEl && drainEl ? `你本能地想用${drainEl}去泄它、或用${controllingEl}去克它——找到那个平衡点，${el}就从负担变成了资源。` : `学会和这股${el}气相处——它不是你的核心，但处理好了就是你的加分项。`}`,
      });
    }
  }

  // ── 6. 流通断崖 ──
  if (lt.blockage && lt.tongGuan && lt.drop >= 4) {
    const elAct = EL_ABILITY[lt.tongGuan]?.split('、')[0] || lt.tongGuan;
    features.push({
      score: 70,
      tags: ['info'],
      text: `五行流通在${lt.blockage}→${lt.tongGuan}出现断崖，落差${lt.drop}。你的${lt.blockage}能量积累极多，但转化不成${lt.tongGuan}所代表的产出——${elAct}是你命局最缺的一环。问题不是不够努力，是方向被卡住了。${variant(variantSeed, '找到能把你的想法执行出来的人或系统，比一个人死磕更有效。', '你的问题是出口不够，不是源头不够。把能量引导到对的渠道，比继续增加输入重要得多。', '一个人扛着所有事的结果，不是更强——是更累。找到那个能帮你把想法变成现实的人。')}`,
    });
  }

  // ── 7. 火炎土燥/金寒水冷/水多木漂/木多火塞/土多金埋 ──
  if (ec['火'] >= 2 && ec['土'] >= 3 && ec['水'] === 0) {
    features.push({
      score: 65,
      tags: ['info'],
      text: `火炎土燥——你心里常年像烧着一锅快干的水，越搅越焦。${ctx.isStrong ? '身强让你扛得住，但扛得住不等于消化得了。' : ''}你没有情绪冷却机制，压力堆积如山，表面还跟没事人一样。`,
    });
  }
  if (ec['金'] >= 2 && ec['水'] >= 3 && ec['火'] === 0) {
    features.push({
      score: 65,
      tags: ['info'],
      text: `金寒水冷——你的理性远远强于感性，想法冷静、判断精准，但也容易陷入过度分析的漩涡。缺火意味着缺少热情和行动力——你知道该做什么，但迟迟不动。`,
    });
  }
  if (ec['水'] >= 3 && ec['木'] >= 2 && (ec['土'] ?? 0) <= 1) {
    features.push({
      score: 60,
      tags: ['info'],
      text: `水多木漂——想法和灵感像水一样多，但木没有土来扎根。你不是没有方向，是方向太多——一个想法还没落地，下一个已经来了。缺的不是才华，是把才华固定下来的那个「锚」。你需要一个能帮你把想法钉到地上的人或结构。`,
    });
  }
  if (ec['木'] >= 3 && ec['火'] >= 2) {
    features.push({
      score: 60,
      tags: ['info'],
      text: `木多火塞——木是燃料，火是火焰。但燃料太多反而把火闷住了——你不是没有热情，是热情被过多的念头裹住了。想做的事太多，反而哪一件都烧不旺。你需要的是减法——少想一个，多做一步。`,
    });
  }
  if (ec['土'] >= 3 && ec['金'] >= 2) {
    features.push({
      score: 60,
      tags: ['info'],
      text: `土多金埋——土本该生金，但土太重反而把金埋住了。你的稳重和谨慎本来是优点，但过了头就变成了迟疑和保守。金被埋在土里——锋利是有的，就是没亮出来。你需要的是一个能把你从「再想想」里推出来的人或环境。`,
    });
  }

  // ── 8. 伤官佩印 / 伤官生财 / 食神生财 / 食神制杀 / 印绶化杀 / 官杀生印 ──
  const patternCat = pattern.category;
  const monthQi = p.month.hiddenStems[0];
  const monthQiTG = monthQi ? getTenGod(bazi.dayMaster, monthQi) : '';
  const hasYinTou = ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印' || ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印';
  const hasCaiTou = ctx.tenGods[0] === '正财' || ctx.tenGods[0] === '偏财' || ctx.tenGods[1] === '正财' || ctx.tenGods[1] === '偏财' || ctx.tenGods[3] === '正财' || ctx.tenGods[3] === '偏财';
  const hasShiShenTou = ctx.tenGods[0] === '食神' || ctx.tenGods[1] === '食神' || ctx.tenGods[3] === '食神';
  const hasShangGuanTou = ctx.tenGods[0] === '伤官' || ctx.tenGods[1] === '伤官' || ctx.tenGods[3] === '伤官';
  const hasShaTou = ctx.tenGods[0] === '七杀' || ctx.tenGods[1] === '七杀' || ctx.tenGods[3] === '七杀';
  const hasGuanTou = ctx.tenGods[0] === '正官' || ctx.tenGods[1] === '正官' || ctx.tenGods[3] === '正官';
  const isShaGe = patternCat === '杀格' || pattern.displayName.includes('七杀');
  const isShangGe = patternCat === '伤官格' || monthQiTG === '伤官';
  const isShiGe = patternCat === '食神格' || monthQiTG === '食神';

  // 伤官佩印
  if (isShangGe && hasYinTou) {
    const yinPos: string[] = [];
    if (ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印') yinPos.push('年');
    if (ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印') yinPos.push('时');
    features.push({
      score: 80,
      tags: ['main'],
      text: `伤官佩印——月令伤官是你的才华和表达欲，${yinPos.length > 0 ? yinPos.join('、') + '的印星帮你刹车' : '印星帮你刹车'}。你知道什么时候该说，什么时候该停。这点比大多数伤官格的人都强——不是被规则管住，是被智慧管住。`,
    });
  }
  // 伤官生财（仅伤官格）
  if (isShangGe && hasCaiTou) {
    const caiPos: string[] = [];
    if (ctx.tenGods[0] === '正财' || ctx.tenGods[0] === '偏财') caiPos.push('年');
    if (ctx.tenGods[1] === '正财' || ctx.tenGods[1] === '偏财') caiPos.push('月');
    if (ctx.tenGods[3] === '正财' || ctx.tenGods[3] === '偏财') caiPos.push('时');
    features.push({
      score: 80,
      tags: ['main'],
      text: `伤官生财——月令伤官是你的创造力，${caiPos.length > 0 ? caiPos.join('、') + '干' : '天干'}透出的财星是出口。你的才华天然能变现。伤官生财的人有一个特点：不会只为了兴趣做事——创造力自带商业嗅觉，做什么都会不自觉想「这个东西有没有价值」。`,
    });
  }
  // 食神生财
  if (isShiGe && hasCaiTou) {
    const caiPos: string[] = [];
    if (ctx.tenGods[0] === '正财' || ctx.tenGods[0] === '偏财') caiPos.push('年');
    if (ctx.tenGods[1] === '正财' || ctx.tenGods[1] === '偏财') caiPos.push('月');
    if (ctx.tenGods[3] === '正财' || ctx.tenGods[3] === '偏财') caiPos.push('时');
    features.push({
      score: 75,
      tags: ['main'],
      text: `食神生财——月令食神是你的内在创造力，${caiPos.length > 0 ? caiPos.join('、') + '干' : '天干'}透出的财星是出口。和伤官生财不一样——你的才华变现是温和的、持续的，不靠锋芒毕露。食神生财的人有一种「把日子过成生意」的天赋——不用太用力，钱会自己来找你。`,
    });
  }
  // 食神制杀
  if (isShaGe && hasShiShenTou) {
    const shiPos: string[] = [];
    if (ctx.tenGods[0] === '食神') shiPos.push('年');
    if (ctx.tenGods[1] === '食神') shiPos.push('月');
    if (ctx.tenGods[3] === '食神') shiPos.push('时');
    features.push({
      score: 85,
      tags: ['main'],
      text: `食神制杀——七杀是你的压力源，${shiPos.length > 0 ? shiPos.join('、') + '干' : '天干'}透出的食神是解药。你不是被压力追着跑——你有工具反过来驾驭它。食神制杀是八字里最漂亮的组合之一：温和但有力量，不动声色地化解危机。别人看到的你是从容的——他们不知道你已经在脑子里把七杀打趴下了。`,
    });
  }
  // 印绶化杀
  if (isShaGe && hasYinTou) {
    const yinPos: string[] = [];
    if (ctx.tenGods[0] === '偏印' || ctx.tenGods[0] === '正印') yinPos.push('年');
    if (ctx.tenGods[3] === '偏印' || ctx.tenGods[3] === '正印') yinPos.push('时');
    features.push({
      score: 80,
      tags: ['main'],
      text: `印绶化杀——七杀是压在你命局里的重担，${yinPos.length > 0 ? yinPos.join('、') + '的印星' : '印星'}把它转化成了智慧和深度。食神制杀是「制服」，印绶化杀是「转化」——你把压力吸收、消化，变成了别人拿不走的见识。你是那种越被打压越有厚度的人。`,
    });
  }
  // 官杀生印
  if ((patternCat === '印格' || pattern.displayName.includes('印')) && (hasShaTou || hasGuanTou)) {
    features.push({
      score: 65,
      tags: ['main'],
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
      tags: isGuanSha ? ['main'] : ['info'],
      text: isGuanSha
        ? `地支${branches.filter((b, i, a) => a.indexOf(b) !== i || ['申','酉','戌'].includes(b)).join('')}三会金局——七杀不是一颗星，是一片天。申酉戌三会成形，杀势极旺。没有食神制它、没有印星化它，七杀在你的命局里是失控的。你不是被压力追赶——你是活在压力里面。`
        : `地支三会${el}局——${el}气在你的命局中被放大到了极致。这是一种极端的力量——不是加分就是减分，没有中间地带。`,
    });
  }
  if (heEls.length > 0 && huiEls.length === 0) {
    const el = heEls[0];
    features.push({
      score: 70,
      tags: ['info'],
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
            tags: ['info'],
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
    '比肩': '你身上有双倍的自我意识和独立精神——这让你不依赖别人，但也让你不太容易让别人进来。靠自己已经成了肌肉记忆。',
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
        tags: ['deep'],
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
      tags: isShaPo ? ['main'] : ['main'],
      text: isShaPo
        ? `七杀格破格。${reasonShort ? `原因是${reasonShort}。` : ''}你的命局里有很强的压力源——但你没有制它的工具（食神），也没有化它的渠道（印星）。七杀在你的命局里是失控的。破碎不是终点——破格的人经历了更多摔打，摔打本身就是锻造。`
        : `格局「破格」——${reasonShort ? `原因是${reasonShort}。` : ''}破碎不是终点。破格的人经历了更多摔打，而摔打本身就是锻造。破而后立，重建的往往比原来的更坚固。`,
    });
  } else if (outcome.outcome === '不成格') {
    const isSha = patternCat === '杀格' || pattern.displayName.includes('七杀');
    features.push({
      score: isSha ? 75 : 65,
      tags: isSha ? ['main'] : ['info'],
      text: isSha
        ? `七杀格不成格。${reasonShort ? `原因是${reasonShort}。` : ''}你有压力，但没有处理好压力的手段——七杀在你命局里是需要被驯服的力量，目前还没完全驯服。大运流转会补齐缺失的条件。你不是不行，是时候未到。`
        : `格局「不成格」——${pattern.displayName}的底子是有的，火候还差一点。大运流转，属于你的时机还在后头。你不是不行，是时候未到。`,
    });
  } else {
    features.push({
      score: 35,
      tags: ['info'],
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
        '寅': '寅木双现，生机和开拓欲翻倍。你不是安于现状的人——骨子里有一团不停往前拱的劲，但也容易同时追好几个方向。',
        '巳': '巳火双现，变化和适应力同时放大。你很擅长在不同环境中切换状态，但偶尔也会找不到「哪个才是真的自己」。',
        '申': '申金双现，好动和思变翻倍。你不是坐得住的人——身体或脑子总有一个在路上。不停留是你的天赋，也是你的代价。',
        '亥': '亥水双现，直觉和想象力加倍。你的第六感比一般人敏锐得多——有时候不需要理由就知道该往哪走。但也容易想得太多、做得太少。',
        '丑': '丑土双现，固执和耐力同步放大。你是那种走得很慢但从不回头的人。稳是最大的优点——但偶尔也要抬头看，这条路还是不是你要的。',
        '未': '未土双现，包容力和收纳欲翻倍。你喜欢收集——不管是信息、关系还是资源。但也容易什么都想要、什么都不舍得扔。',
        '戌': '戌土双现，守护和边界感加倍。你对自己认定的人或事有极强的忠诚度。外面的世界可以乱，你的核心圈必须稳。',
      };
      features.push({
        score: 45,
        tags: ['deep'],
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
      tags: ['info'],
      text: `${ctx.dm}身强，${ctx.strength.deLing ? '得令' : ''}${ctx.strength.deDi ? '得地' : ''}${ctx.strength.deShi === '得势' ? '得势' : ''}——${elMetaphor}。`,
    });
  } else {
    features.push({
      score: 30,
      tags: ['info'],
      text: `${ctx.dm}${ctx.strength.level === '中和' ? '中和平衡' : '身弱'}——${ctx.strength.level === '身弱' ? '你不是硬扛型的人。但你比身强的人更懂借力——知道自己的局限在哪里，反而能用巧劲化解很多问题。' : '不多不少，刚好够用。你有自己的节奏，不疾不徐。'}`,
    });
  }

  // ── 15. 日主性格画像（必有，身强/身弱两版）──
  const dmPersonalityStrong: Record<string, string> = {
    '甲木': '甲木是参天大树——你不是那种可以低调的人，天生向上，目标感强、不习惯低头。走到哪里都有自己的节奏，别人很难左右你。',
    '乙木': '乙木是藤萝——柔韧善变，擅长在夹缝中找到出路。表面随和好相处，骨子里有一股不认输的韧劲。不是最强的那一个，但往往是最久的那一个。',
    '丙火': '丙火是太阳——热情和感染力是天生的，走到哪里都能照亮一片。但太阳也有落山的时候——能量是外放型的，独处太久会枯萎。',
    '丁火': '丁火是灯烛之火——不靠爆发力，靠长久的恒温。不显眼，但熄不掉——这才是最可怕的地方。',
    '戊土': '戊土是城墙之土——厚重、能扛，任何事到了你这里都会变得扎实。问题是太稳了——稳到有时候缺少「动起来」的紧迫感。',
    '己土': '己土是田园之土——不靠体量取胜，靠涵养和吸收力。天生懂得滋养别人，也善于从环境里汲取养分。比戊土更灵活、更善于变通。',
    '庚金': '庚金是刀剑——干脆利落，不拖泥带水。有天然的行动力和决断力。问题是太硬了——砍得太快，没给人留余地，也没给自己留余地。',
    '辛金': '辛金是珠宝之金——精致、敏感，有天然的审美和分寸感。不像庚金大刀阔斧，但更懂细节和品质。对自己和身边的人都有不低的标准。',
    '壬水': '壬水是江河——水性流动、适应力极强。不是待在原地等答案的人，会自己去找。走到哪里都能融入，但也容易流得太快、停不下来。',
    '癸水': '癸水是雨露——细腻、渗透力强、润物无声。不像壬水奔腾，但更能深入到细节里。敏感、直觉好，是那种「不用说太多就懂了」的类型。',
  };
  const dmPersonalityWeak: Record<string, string> = {
    '甲木': '甲木本该参天，但你的根基不如表面看起来扎实。有向上的心气，但力量需要更精准地使用——不是每一阵风都值得迎上去。',
    '乙木': '乙木的柔韧是你最大的武器——身不强让你更懂得迂回和借力。你不会硬碰硬，但你知道怎么绕过去。',
    '丙火': '丙火的光芒还在，但燃料需要省着用。你不是不能照亮别人，是先要照亮自己。独处不是枯萎，是充电。',
    '丁火': '丁火的恒温在身弱时更珍贵——不耀眼但稳定。你不靠能量压制别人，靠的是持续输出。一盏灯在风里能亮，才是真的亮。',
    '戊土': '戊土本该厚重稳当，但根基比你想的薄——表面稳，内里在撑。扛得太多的时候，学会放下不是软弱。',
    '己土': '己土的涵养在身弱时更内敛。你不急于表现，但吸收力很强。别人看不见的时候恰是你长得最快的时候。',
    '庚金': '庚金的锋利需要精准发力——身不强意味着不能乱砍。每一刀都省着用，反而比乱挥更有威慑力。',
    '辛金': '辛金的精致在身弱时更知道分寸。不追求大刀阔斧的痛快，但每一处细节都经得起推敲。',
    '壬水': '壬水流动不止，但身不强时水流容易被截断。你需要找到对的河道——不是所有的方向都值得去。',
    '癸水': '癸水本就细腻，身不强时更懂得渗透而非冲击。水滴石穿不需要力气大，需要的是持续和精准。',
  };
  const dmKey = (['甲','乙'].includes(bazi.dayMaster)) ? (bazi.dayMaster === '甲' ? '甲木' : '乙木') :
    (['丙','丁'].includes(bazi.dayMaster)) ? (bazi.dayMaster === '丙' ? '丙火' : '丁火') :
    (['戊','己'].includes(bazi.dayMaster)) ? (bazi.dayMaster === '戊' ? '戊土' : '己土') :
    (['庚','辛'].includes(bazi.dayMaster)) ? (bazi.dayMaster === '庚' ? '庚金' : '辛金') :
    (bazi.dayMaster === '壬' ? '壬水' : '癸水');
  const dmText = ctx.isStrong
    ? (dmPersonalityStrong[dmKey] || `${ctx.dm}身强，能量在线，能扛事、有底气。`)
    : (dmPersonalityWeak[dmKey] || `${ctx.dm}身不强，让你更懂得借力和迂回——知道自己的局限在哪里，反而能用巧劲化解很多问题。`);
  features.push({
    score: 85,
    text: dmText,
    tags: ['identity'],
  });

  // ── 16. 职业方向（必有，放最后）──
  const patName = pattern.displayName;
  const careerParts: string[] = [];

  // 第一段：格局决定适合的赛道
  const patternInsights: Record<string, string> = {
    '伤官格': '伤官格的人天生适合把才华变成价值——内容创作、品牌策划、产品设计，任何需要「输出」的工作都是你的主场',
    '食神格': '食神格天生适合把创造力变成日常产出——设计、教育、手工艺，需要持续输出品质感的方向',
    '七杀格': '七杀格天然适合有挑战的环境——中层管理、专业技术、风控分析，需要压力但不用独自扛全部',
    '正官格': '正官格天然适合规则明确的组织——体制内、大公司、标准化流程，框架不是束缚而是你的保护层',
    '偏印格': '偏印格适合需要独特视角的领域——文化研究、教育创新、深度内容，消化复杂信息是你的天赋',
    '正印格': '正印格适合需要学习和沉淀的方向——教育、研究、知识服务，你的吸收力天然比别人强',
    '正财格': '正财格适合稳定增值的赛道——财务管理、投资分析、实业经营，稳扎稳打比快进快出更适合你',
    '偏财格': '偏财格适合机会驱动的领域——商务拓展、投资、创业，嗅觉敏锐是你的核心武器',
    '建禄月劫格': '建禄格适合自己主导——管理、创业、独立执业，掌控感比稳定感更重要',
    '阳刃格': '阳刃格适合需要决断力的方向——危机处理、竞标谈判、快节奏行业，你的果决是稀缺资源',
  };
  const insight = patternInsights[patName]
    || patternInsights[patternCat]
    || `${patName}决定了你的核心方向——顺势而为比逆流而上更有效`;
  careerParts.push(insight);

  // 第二段：五行缺口决定需要什么搭档或补丁
  const gapAdvice: string[] = [];
  if (zero.includes('金')) gapAdvice.push('缺金意味着你需要一个有执行力的搭档或系统来帮你落地——而不是自己硬逼自己变勤奋');
  if (zero.includes('水')) gapAdvice.push('缺水意味着你需要刻意给自己留缓冲——不是更拼，是更会停');
  if (zero.includes('木')) gapAdvice.push('缺木意味着你需要经营人脉和学习渠道——找能给你背书的人，比自己开路快得多');
  if (zero.includes('火')) gapAdvice.push('缺火意味着不适合台前表演型工作——幕后深耕，让作品替你说话');
  if (zero.includes('土')) gapAdvice.push('缺土意味着需要一个稳定的外部结构——固定流程、长期项目、可靠的团队');
  if (lt.blockage && lt.tongGuan) {
    const dirMap: Record<string, string> = { '金': '技术', '水': '学习', '木': '人脉', '火': '展示', '土': '稳固' };
    gapAdvice.push(`五行流通堵在${lt.blockage}→${lt.tongGuan}，补${lt.tongGuan}（${dirMap[lt.tongGuan] || lt.tongGuan}方向）能帮你把能量释放出来`);
  }
  if (gapAdvice.length > 0) {
    careerParts.push(gapAdvice.join('。'));
  }

  features.push({
    score: 75,
    text: careerParts.join('\n\n'),
    tags: ['career'],
  });

  return features;
}

// ── 主入口 ──

export function generateNarrative(
  bazi: BaziResult, pattern: ExtractResult, outcome: AssessResult,
  strength: StrengthResult, lt: LiuTongResult,
): string {
  const ctx = buildCtx(bazi, pattern, outcome, strength, lt);
  const features = scanFeatures(ctx);

  // 故事弧排序：identity → main(1) → deep(1) → gap(1) → career
  const career = features.filter((f) => f.tags?.includes('career'));
  const identity = features.filter((f) => f.tags?.includes('identity'));

  const main = features.filter((f) => f.tags?.includes('main')).sort((a, b) => b.score - a.score);
  const deep = features.filter((f) => f.tags?.includes('deep')).sort((a, b) => b.score - a.score);
  const gap = features.filter((f) => f.tags?.includes('gap')).sort((a, b) => b.score - a.score);
  const info = features.filter((f) => f.tags?.includes('info')).sort((a, b) => b.score - a.score);

  const picked: Feature[] = [];
  // 1. 日主性格（必有）
  if (identity.length > 0) picked.push(identity[0]);
  // 2. 主线故事（选2个最强的，主故事往往是复合的）
  if (main.length > 0) picked.push(main[0]);
  if (main.length > 1) picked.push(main[1]);
  // 3. 深层性格（选1个最强的）
  if (deep.length > 0) picked.push(deep[0]);
  // 4. 结构性缺口（选1个最强的）
  if (gap.length > 0) picked.push(gap[0]);
  // 5. 补充信息（如果角色不够7个，用 info 补位，最多补2个）
  if (picked.length < 7 && info.length > 0) picked.push(info[0]);
  if (picked.length < 7 && info.length > 1) picked.push(info[1]);
  // 6. 职业方向（必有，放最后）
  if (career.length > 0) picked.push(career[0]);

  if (picked.length === 0) {
    return `${ctx.dm}日主，${pattern.displayName}，格局${outcome.outcome}。顺势而行，自有出路。`;
  }

  return picked.map((f) => f.text).join('\n\n');
}

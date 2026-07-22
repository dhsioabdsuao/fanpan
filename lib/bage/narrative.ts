import type { BaziResult, ElementType } from '@/types/bazi';
import type { ExtractResult } from './extractPattern';
import type { AssessResult } from './assessOutcome';
import type { StrengthResult } from '@/lib/strength/determineStrength';
import type { LiuTongResult } from './liuTong';
import { getTenGod } from '@/lib/bazi-utils';

// ── 五行→能力映射 ──
const ELEMENT_ABILITY: Record<string, string> = {
  '金': '纪律、执行力、技术深耕',
  '水': '情绪调节、变通力、智慧沉淀',
  '木': '人脉拓展、成长性、灵活性',
  '火': '表达力、展示力、感染力',
  '土': '稳定、储蓄、承载力',
};

const ELEMENT_DIRECTION: Record<string, string> = {
  '金': '技术、专业技能方向',
  '水': '学习、沟通方向',
  '木': '社交、人脉方向',
  '火': '展示、分享方向',
  '土': '稳固、储蓄方向',
};

// ── 辅助判断 ──

function zeroElements(bazi: BaziResult): string[] {
  return (['金', '木', '水', '火', '土'] as ElementType[])
    .filter((el) => bazi.elementCount[el] === 0);
}

function isFireEarthDry(bazi: BaziResult): boolean {
  const ec = bazi.elementCount;
  return ec['火'] >= 2 && ec['土'] >= 3 && ec['水'] === 0;
}

function hasMonthStemLeaked(pattern: ExtractResult, bazi: BaziResult): boolean {
  // 月干是否被坐支泄气（月支本气生月干？相反，月支本气是月干所生则泄）
  const monthStem = bazi.pillars.month.stem;
  const monthBranchMainQi = bazi.pillars.month.hiddenStems[0];
  if (!monthBranchMainQi) return false;
  const relation = getTenGod(monthStem, monthBranchMainQi);
  return relation === '食神' || relation === '伤官'; // 月干生月支本气 = 泄气
}

function getMonthTenGod(bazi: BaziResult): string {
  return bazi.tenGods?.monthStem ?? getTenGod(bazi.dayMaster, bazi.pillars.month.stem);
}

// ── 原型匹配 ──

interface Archetype {
  name: string;
  match: (ctx: ArchetypeInput) => number; // 返回匹配分数 0-100
  narrative: (ctx: ArchetypeInput) => string;
}

interface ArchetypeInput {
  bazi: BaziResult;
  pattern: ExtractResult;
  outcome: AssessResult;
  strength: StrengthResult;
  liuTong: LiuTongResult;
  zero: string[];
  dry: boolean;
  monthLeaked: boolean;
  monthTenGod: string;
  blockage: ElementType | null;
  tongGuan: ElementType | null;
  drop: number;
  missing: string;
  tongGuanDir: string;
  isStrong: boolean;
}

function buildContext(bazi: BaziResult, pattern: ExtractResult, outcome: AssessResult, strength: StrengthResult, liuTong: LiuTongResult): ArchetypeInput {
  const zero = zeroElements(bazi);
  const missing = zero.length > 0 ? zero.join('和') : '';
  const blockage = liuTong.blockage;
  const tongGuan = liuTong.tongGuan;
  const drop = liuTong.drop;
  return {
    bazi, pattern, outcome, strength, liuTong, zero,
    dry: isFireEarthDry(bazi),
    monthLeaked: hasMonthStemLeaked(pattern, bazi),
    monthTenGod: getMonthTenGod(bazi),
    blockage,
    tongGuan,
    drop,
    missing,
    tongGuanDir: tongGuan ? (ELEMENT_DIRECTION[tongGuan] ?? tongGuan) : '',
    isStrong: strength.level === '身强',
  };
}

// ── 8个原型 ──

const ARCHETYPES: Archetype[] = [

  // 1. 正统叛逃者 — 偏印/伤官 + 正官透被泄 + 身强
  {
    name: '正统叛逃者',
    match(ctx) {
      let s = 0;
      if (ctx.pattern.displayName.includes('偏印') || ctx.pattern.displayName.includes('伤官')) s += 40;
      if (ctx.monthTenGod === '正官' && ctx.monthLeaked) s += 30;
      if (ctx.isStrong) s += 20;
      return s;
    },
    narrative(ctx) {
      const dm = `${ctx.bazi.dayMaster}${ctx.bazi.dayMasterElement}`;
      return `${ctx.pattern.displayName}，骨子里不是走寻常路的人。但月干透出${ctx.monthTenGod}，你大概率被要求走过一条「正路」——读书、体制、或者家里安排的方向。${ctx.monthTenGod}坐支被泄，规矩在你身上立不住，你多半已经从那条路上跑偏了。

${dm}身强，${ctx.missing ? `全局缺${ctx.missing}——` : ''}表面扛得住事，但${ctx.dry ? '没有情绪冷却机制。压力来了硬扛，不消化' : '内在的自己未必像外在看起来那么稳'}。${ctx.dry ? '像烈日下烤干的泥巴，表面硬，敲一下直接碎掉。' : ''}

${ctx.blockage && ctx.tongGuan ? `五行流通在${ctx.blockage}→${ctx.tongGuan}处断裂${ctx.drop > 0 ? `，落差${ctx.drop}` : ''}。这意味着你的能量在${ctx.blockage}这一环积累了很多，但无法顺畅转化为${ctx.tongGuan}所代表的${ctx.tongGuanDir}。${ctx.drop >= 4 ? '问题不是不够努力，是努力的方向卡住了。' : '稍加疏通就能改善。'}` : '五行流通顺畅，你的能量转换效率很高——这是难得的优势，善用它。'}

你需要${ctx.tongGuan ? ctx.tongGuan + '来' + (ctx.tongGuan === '金' ? '泄土生水' : ctx.tongGuan === '水' ? '流通全局' : ctx.tongGuan === '木' ? '疏通堵点' : ctx.tongGuan === '火' ? '点燃动力' : '稳住根基') + '。' + ctx.tongGuanDir + '，是你命局中关键的突破口。' : '找到那个能让你把才华兑现的出口。'}`;
    },
  },

  // 2. 地下的岩浆 — 成格+堵塞≥3+火炎土燥
  {
    name: '地下的岩浆',
    match(ctx) {
      let s = 0;
      if (ctx.outcome.outcome === '成格') s += 30;
      if (ctx.drop >= 3) s += 30;
      if (ctx.dry) s += 30;
      return s;
    },
    narrative(ctx) {
      const dm = `${ctx.bazi.dayMaster}${ctx.bazi.dayMasterElement}`;
      return `格局「${ctx.outcome.outcome}」——命局的顶层设计是完整的。但成格不代表顺畅，恰恰相反：${ctx.dry ? '火炎土燥，全局缺水，你心里常年像烧着一锅快干的水，越搅越焦。' : ''}

${dm}${ctx.isStrong ? '身强，内在能量充沛，但问题出在出口上' : '中和偏弱，好在格局给你兜了底'}。${ctx.blockage && ctx.tongGuan ? `五行流通在${ctx.blockage}→${ctx.tongGuan}出现断崖${ctx.drop >= 4 ? '——不是微堵，是严重断裂' : '——明显受阻'}。` + (ctx.tongGuan === '金' ? '你有很多想法（土），但难以转化为持续的行动和作品（金）。想法➔行动的转化链路断了。不是你懒，是五行结构决定的。' : ctx.tongGuan === '水' ? '你的行动力（金）转化不成智慧沉淀（水），做事容易停留在表面，难以深入。' : `能量在${ctx.blockage}处积累但到${ctx.tongGuan}时卡住，你的${ctx.blockage}特质过于突出而${ctx.tongGuan}迟迟发展不起来。`) : '五行流通没有明显卡点，你的能量转化效率还不错。'}

${ctx.missing ? `另外，全局缺${ctx.missing}。${ctx.missing.includes('金') ? '金代表纪律和深耕——你不是不能吃苦，是吃不了枯燥的苦。能熬大夜赶一个感兴趣的项目，但很难每天固定时间做同一件事。' : ''}${ctx.missing.includes('水') ? '水代表情绪调节和智慧沉淀——你是那种「看起来没事，其实一直在内耗」的人。' : ''}${ctx.missing.includes('木') ? '木代表灵活性和成长——你可能在某些方面过于固执，缺少变通。' : ''}${ctx.missing.includes('火') ? '火代表表达和感染力——你可能做了很多事但不善于展示自己。' : ''}${ctx.missing.includes('土') ? '土代表稳定和承载力——你或许缺一点脚踏实地的耐心。' : ''}` : ''}

${ctx.tongGuan ? `\n\n${ctx.tongGuanDir}是你的补丁。不是让你变成另一个人，是给现有的能量找个对的方向出口。` : ''}`;
    },
  },

  // 3. 迟开的花 — 不成格+印格/印星无根
  {
    name: '迟开的花',
    match(ctx) {
      let s = 0;
      if (ctx.outcome.outcome === '不成格') s += 40;
      if (ctx.pattern.category === '印格' || ctx.pattern.displayName.includes('印')) s += 30;
      return s;
    },
    narrative(ctx) {
      return `格局「不成格」——这三个字不是对你的否定。${ctx.pattern.displayName}的底子摆在那里，只是时辰未到。大运流转会补齐缺失的条件。你不是不行，是时候未到。

${ctx.outcome.reason ? `具体来说：${ctx.outcome.reason.split(';').slice(0, 2).join('；')}。这些问题不是你的错——是你命局的时间线还没走到那一步。` : ''}

${ctx.isStrong ? '身强的你，能量其实在线，只是格局的拼图还缺一块。' : '身弱的你，能量确实需要更多时间和环境来积蓄。'}${ctx.missing ? ` 全局缺${ctx.missing}，这既是一个短板，也是一个明确的信号——你需要从缺失的方向补上。` : ''}

你还在蓄力期。在这个阶段，与其急于求成，不如把精力放在${ctx.tongGuanDir || '打磨自己的核心能力'}上。竹子前四年只长三厘米，第五年冲天而起。你的「第五年」还没到，但根已经在扎了。`;
    },
  },

  // 4. 孤军奋战 — 建禄/阳刃+身强+比劫多
  {
    name: '孤军奋战',
    match(ctx) {
      let s = 0;
      if (ctx.pattern.displayName.includes('建禄') || ctx.pattern.displayName.includes('阳刃')) s += 40;
      if (ctx.isStrong) s += 30;
      if (ctx.bazi.elementCount[ctx.bazi.dayMasterElement] >= 3) s += 20;
      return s;
    },
    narrative(ctx) {
      const dm = `${ctx.bazi.dayMaster}${ctx.bazi.dayMasterElement}`;
      return `${ctx.pattern.displayName}，凡事喜欢靠自己。${dm}身强，${ctx.bazi.dayMasterElement}气在命局中占了三席以上——你不是没有帮手，是天生不习惯求助。

一个人扛了太多事情。走过的弯路、做过的错误决定、浪费的时间——大概率都是因为「不好意思开口」。${ctx.dry ? '加上全局缺水，你不会自我调节。压力堆积如山，表面上还跟没事人一样。' : ''}

${ctx.blockage && ctx.tongGuan ? `五行堵在${ctx.blockage}→${ctx.tongGuan}。` + (ctx.tongGuan === '木' ? '你需要的不只是做事能力（金），更是借力生长的智慧（木）。一个人走得快，一群人走得远——这句话对别人是鸡汤，对你来说是解药。' : `能量出口在${ctx.tongGuan}方向——${ctx.tongGuanDir}是你需要补上的一环。`) : ''}

${ctx.tongGuanDir ? `试着从${ctx.tongGuanDir}打开局面。找到几个你真正信得过的人，学会把后背交给他们。` : '试着找到你能信得过的人——不是让你变软弱，是让你变强。'}`;
    },
  },

  // 5. 缺水的鱼 — 金水缺失+火土旺+身强
  {
    name: '缺水的鱼',
    match(ctx) {
      let s = 0;
      if (ctx.zero.includes('金') && ctx.zero.includes('水')) s += 40;
      if (ctx.bazi.elementCount['火'] >= 2 && ctx.bazi.elementCount['土'] >= 3) s += 30;
      if (ctx.isStrong) s += 20;
      return s;
    },
    narrative(ctx) {
      return `全局金水双缺，火土独旺——你就像一个被烈日烤着的炉子，火力充沛但没有冷却系统。${ctx.isStrong ? '身强说明你确实能扛' : ''}，但扛得住不等于消化得了。

${ctx.missing.includes('金') ? '缺金意味着缺乏执行力出口。土的能量无法泄到金，所有念头都在内部打转——你脑子里的想法比手头做的事多十倍。' : ''}
${ctx.missing.includes('水') ? '缺水意味着缺乏情绪调节。水主智慧和流通——没有水，情绪没有出口，压力没有化解渠道。你不是脆弱，是没有缓冲层。' : ''}

${ctx.blockage && ctx.tongGuan ? `流通在${ctx.blockage}→${ctx.tongGuan}堵了${ctx.drop >= 4 ? '——而且是明显堵塞' : ''}。${ctx.tongGuan}是通关用神，${ctx.tongGuanDir}是破局的方向。` : ''}

你需要的不是「更努力」。你已经够努力了。你需要的是给这台过热的引擎加一套冷却系统。${ctx.tongGuanDir ? `从${ctx.tongGuanDir}入手——不是一夜之间改变，是给自己一个缓慢但持续的出口。` : '找到一个能让你安静下来的习惯——哪怕只是每天散步半小时，让水汽慢慢渗透进来。'}`;
    },
  },

  // 6. 锋芒藏鞘 — 伤官格+印有根+身强
  {
    name: '锋芒藏鞘',
    match(ctx) {
      let s = 0;
      if (ctx.pattern.displayName.includes('伤官')) s += 40;
      if (ctx.isStrong) s += 25;
      return s;
    },
    narrative(ctx) {
      return `${ctx.pattern.displayName}——你的才华是刀锋，但刀不总是要出鞘的。你天性直言，思维锐利，能看到别人看不到的盲点。但伤官最大的问题是「杀伤力过大时伤人也伤己」。

${ctx.isStrong ? '身强让你有底气去冲撞，但世界不总是按照你的逻辑运转的。' : ''}${ctx.outcome.outcome === '成格' ? '好在你格局成立，说明你的才华有承载——不是无的放矢。' : '格局还没完全成立，说明才华需要更多打磨才能兑现。'}

${ctx.blockage && ctx.tongGuan ? `五行堵在${ctx.blockage}→${ctx.tongGuan}。你的表达欲（${ctx.blockage}）需要转化为${ctx.tongGuan}的输出——${ctx.tongGuanDir}是你该走的路。` : ''}

学会「收得住」比学会「放得开」更难。但一旦学会，你的锐利会变成精准，而非泛泛的杀伤。选对战场，比你赢多少场都重要。`;
    },
  },

  // 7. 蜕皮成长 — 化格
  {
    name: '蜕皮成长',
    match(ctx) {
      return ctx.pattern.displayName.includes('化') ? 80 : 0;
    },
    narrative(ctx) {
      const dm = `${ctx.bazi.dayMaster}${ctx.bazi.dayMasterElement}`;
      return `化格——你正在经历一次脱胎换骨的蜕变。${dm}化为${ctx.bazi.dayMasterElement === '土' ? '另一种土的形态' : '新的五行方向'}，这个过程本身就是一场自我重塑。

旧壳裂了，新壳还没硬。这段时间你可能觉得自己既不像过去的自己，也不确定未来的自己是怎样的——这种感觉是对的。化格就是如此：你不再是你，但你正在成为一个更坚固的版本。

${ctx.outcome.outcome === '成格' ? '格局成立，说明蜕变正在往对的方向前进。' : '格局还需要时间打磨——蜕变不是一蹴而就的。'}

${ctx.blockage && ctx.tongGuan ? `能量在${ctx.blockage}→${ctx.tongGuan}有淤堵，说明你的转变过程中${ctx.blockage}太重而${ctx.tongGuan}不足。${ctx.tongGuanDir}是当下最关键的突破点。` : ''}

别着急。蜕变途中的人不需要跑起来。站稳了，壳裂了没关系——新壳在长。`;
    },
  },

  // 8. 逆风翻盘 — 破格+身弱/中和
  {
    name: '逆风翻盘',
    match(ctx) {
      let s = 0;
      if (ctx.outcome.outcome === '破格') s += 50;
      if (ctx.strength.level !== '身强') s += 30;
      return s;
    },
    narrative(ctx) {
      return `格局「破格」——很多人在看到这两个字时会觉得命不好，但恰恰相反。破格的人往往经历了更多摔打，但摔打本身就是锻造。

${ctx.outcome.reason ? `破格的原因：${ctx.outcome.reason.split(';').slice(0, 2).join('；')}。这些问题暴露了你的短板，但也正因为暴露，你才比别人更清楚自己需要补什么。` : ''}

${ctx.isStrong ? '' : '身不强——你不是天生的强者，但你有后天磨出来的韧性。'}${ctx.blockage && ctx.tongGuan ? `五行堵在${ctx.blockage}→${ctx.tongGuan}，${ctx.tongGuanDir}是你的翻盘点。你缺的不是方向，是补上那一块关键的拼图。` : ''}

格局破损不是终点。破而后立——破碎之后重建的，往往比原来的更坚固。你比别人更早经历了风浪，这意味着你比别人更早知道什么叫「站住了」。`;
    },
  },
];

// ── 默认叙事（不匹配任何原型时的兜底） ──

function fallbackNarrative(ctx: ArchetypeInput): string {
  const dm = `${ctx.bazi.dayMaster}${ctx.bazi.dayMasterElement}`;
  const lines: string[] = [];

  lines.push(`${ctx.pattern.displayName}，${dm}日主，${ctx.isStrong ? '身强有力' : ctx.strength.level === '中和' ? '中和平衡' : '身弱需扶'}。格局「${ctx.outcome.outcome}」——${ctx.outcome.outcome === '成格' ? '命局的顶层设计完整，基础扎实。' : ctx.outcome.outcome === '不成格' ? '火候尚欠，但方向是明确的。' : '有破损，但破损本身也是一种结构。'}`);

  if (ctx.missing) {
    const parts: string[] = [];
    for (const el of ctx.zero) {
      parts.push(`${el}（${ELEMENT_ABILITY[el]}）`);
    }
    lines.push(`全局缺${parts.join('、')}。这不是缺陷，是明确的信号——你需要从这些方向补上。`);
  }

  if (ctx.blockage && ctx.tongGuan) {
    lines.push(`五行流通在${ctx.blockage}→${ctx.tongGuan}处受阻${ctx.drop > 0 ? `（落差${ctx.drop}）` : ''}。能量卡在${ctx.blockage}这一环，${ctx.tongGuan}是你当下的通关关键——建议从${ctx.tongGuanDir}方向调整。`);
  } else {
    lines.push('五行流通顺畅，能量转换没有明显卡点。这是一个好的基本面。');
  }

  lines.push(`${ctx.pattern.displayName}不是终点——它是你理解自己的起点。顺势而行，自有出路。`);

  return lines.join('\n\n');
}

// ── 主入口 ──

export function generateNarrative(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
  liuTong: LiuTongResult,
): string {
  const ctx = buildContext(bazi, pattern, outcome, strength, liuTong);

  // 找匹配度最高的原型
  let best: Archetype | null = null;
  let bestScore = 0;
  for (const archetype of ARCHETYPES) {
    const score = archetype.match(ctx);
    if (score > bestScore) {
      bestScore = score;
      best = archetype;
    }
  }

  if (best && bestScore >= 60) {
    return best.narrative(ctx);
  }

  return fallbackNarrative(ctx);
}

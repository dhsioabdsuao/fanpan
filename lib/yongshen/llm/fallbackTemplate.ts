import type { YongShenFactPack } from './types'
import type { ElementType } from '@/types/bazi'

const ELEMENT_LABEL: Record<ElementType, string> = {
  '木': '木',
  '火': '火',
  '土': '土',
  '金': '金',
  '水': '水',
}

function formatGanList(
  items: Array<{ gan: string; element: ElementType; tenGod: string }>,
): string {
  return items.map((g) => `${g.gan}（${ELEMENT_LABEL[g.element]}${g.tenGod}）`).join('、')
}

function fmtGanOnly(items: Array<{ gan: string }>): string {
  return items.map((g) => g.gan).join('、')
}

// ── 调候 pattern → 人话映射（不引用算法 detail）──

const TIAOHOU_PLAIN: Record<string, string> = {
  '火炎土燥': '命局偏燥偏热，需要水的润泽来降温，所以水的力量对你格外重要',
  '金水寒滞': '命局偏寒偏滞，需要火的温暖和木的生发来活络，所以木和火是关键',
  '水冷土湿': '命局偏湿偏冷，需要火来烘暖、土来稳固，所以火和土的能量很珍贵',
  '木火通明': '命局木火通明，本身气象不错，顺势发展即可',
}

// ── 五行 → 具体建议（fallback 用 2 条即可）──

function pickSuggestions(
  yongElements: ElementType[],
): string {
  const suggestions: Record<ElementType, string[]> = {
    '木': [
      '每天早晨晒一会儿太阳，让身体和头脑先暖起来',
      '培养一项需要长期投入的爱好，比如学一门乐器或语言',
    ],
    '火': [
      '主动跟朋友保持联系，定期聚会或一起做些事情',
      '每天做一件让自己兴奋的小事，保持表达和输出的习惯',
    ],
    '土': [
      '建立固定的作息和饮食习惯，让生活有一个稳定的框架',
      '培养记账或整理的习惯，把积累变成可见的东西',
    ],
    '金': [
      '训练自己做决定的能力——给每个选择设一个截止时间',
      '定期清理不需要的物品和人情往来，保持精简',
    ],
    '水': [
      '每天给自己留一段不排任何事的空白时间，让头脑放空',
      '培养阅读、写日记等安静沉淀的习惯',
    ],
  }

  const picked: string[] = []
  for (const el of yongElements) {
    const opts = suggestions[el]
    if (opts && picked.length < 4) {
      for (const s of opts) {
        if (!picked.includes(s) && picked.length < 4) {
          picked.push(s)
        }
      }
    }
  }
  // 兜底：至少有 2 条
  if (picked.length < 2) {
    picked.push('每天给自己留一段安静的时间，让念头自然流过')
    picked.push('保持规律作息，专注在已经擅长的事情上深耕')
  }
  return picked.slice(0, 4).join('；')
}

// ── 扶抑法 fallback ──

function buildFuYiFallback(fp: YongShenFactPack): string {
  const yongGan = fmtGanOnly(fp.yongShen)
  const jiGan = fmtGanOnly(fp.jiShen)
  const yongDetail = formatGanList(fp.yongShen)
  const jiDetail = formatGanList(fp.jiShen)

  let tiaoHouLine = ''
  if (fp.tiaoHou.active && fp.tiaoHou.pattern) {
    const plain = TIAOHOU_PLAIN[fp.tiaoHou.pattern]
    if (plain) {
      tiaoHouLine = `命局气质上，古籍称为「${fp.tiaoHou.pattern}」——${plain}，所以喜用神的方向也跟调候需求一致。`
    }
  }

  let tongGuanLine = ''
  if (fp.tongGuan.active && fp.tongGuan.mediator) {
    const pair = fp.tongGuan.clashingPair?.join('与') || '两行'
    tongGuanLine = `命局中${pair}两行力量对峙，以${fp.tongGuan.mediator}通关调和，所以${fp.tongGuan.mediator}是你的关键用神。`
  }

  const suggestions = pickSuggestions(
    [...new Set(fp.yongShen.map((g) => g.element))],
  )

  return `你的命局喜用神是${yongGan}——${yongDetail}。这些是你命局最需要的能量：它们帮你平衡过旺的力量、补足稀缺的方向，让你在不同的选择和场景中，都有更完整的支撑。${tiaoHouLine}${tongGuanLine}

反过来说，${jiGan}是你需要多留意的方向——${jiDetail}。这不意味着它们是「不好」的，而是提醒你：在跟${jiGan}相关的特质上，你可能会天然地偏向某一边，需要在生活中有意识地去留意和调整。不过这也不全是负担——忌神所在之处，往往也是你比一般人更了解、更敏感的地方。

你可以从具体的小事开始：${suggestions}。知道自己的倾向，就是调整的第一步。`
}

// ── 从格 fallback ──

function buildCongGeFallback(fp: YongShenFactPack): string {
  const yongGan = fmtGanOnly(fp.yongShen)
  const yongDetail = formatGanList(fp.yongShen)
  const jiGan = fmtGanOnly(fp.jiShen)
  const jiDetail = formatGanList(fp.jiShen)

  const suggestions = pickSuggestions(
    [...new Set(fp.yongShen.map((g) => g.element))],
  )

  return `你的命局走从格路线——命局中某一种或几种力量特别旺盛，日主${fp.dayMaster}顺势而从。这种情况下，喜用神是${yongGan}——${yongDetail}。它们是你命局中最强的能量方向，顺着这股力量走，反而比硬要去平衡更自然。

需要留意的是${jiGan}——${jiDetail}。在从格中，日主自己的五行反而是忌神，因为它会"破格"——打破命局已经形成的顺势结构。这不是说日主本身的特质不好，而是在这个特定的命局结构下，顺着旺势走的策略更适合你。

你可以从具体的小事开始：${suggestions}。保持规律作息、专注在已经擅长的领域深耕，不必勉强自己逆势而为。`
}

// ── 化格 fallback ──

function buildHuaGeFallback(fp: YongShenFactPack): string {
  const yongGan = fmtGanOnly(fp.yongShen)
  const yongDetail = formatGanList(fp.yongShen)
  const jiGan = fmtGanOnly(fp.jiShen)
  const jiDetail = formatGanList(fp.jiShen)

  const suggestions = pickSuggestions(
    [...new Set(fp.yongShen.map((g) => g.element))],
  )

  return `你的命局走化格路线——日主${fp.dayMaster}与命局中的另一个天干发生了合化，形成了一个新的主导力量（化神）。这种结构下，喜用神是${yongGan}——${yongDetail}。化神是你命局的中心，生扶化神的能量是第二层支撑。它们帮你的命局维持化神的稳定，让整个结构持续运转。

需要留意的是${jiGan}——${jiDetail}。在化格中，克制化神的五行会成为干扰——不是这些天干本身"不好"，而是它们在化格结构中容易打破已经形成的合化状态。

你可以从具体的小事开始：${suggestions}。保持稳定的节奏、专注一两件长期的事，比频繁切换更适合你。`
}

// ── 通关 fallback ──

function buildTongGuanFallback(fp: YongShenFactPack): string {
  const yongGan = fmtGanOnly(fp.yongShen)
  const yongDetail = formatGanList(fp.yongShen)
  const jiGan = fmtGanOnly(fp.jiShen)
  const jiDetail = formatGanList(fp.jiShen)
  const pair = fp.tongGuan.clashingPair?.join('与') || '两行'
  const mediator = fp.tongGuan.mediator || ''

  const suggestions = pickSuggestions(
    [...new Set(fp.yongShen.map((g) => g.element))],
  )

  return `你的命局中${pair}两行力量对峙、互不相让，形成了传统命书所说的"交战"结构。这种情况下，${mediator}成为关键的"通关"五行——它能在${pair}之间架一座桥，让冲突的力量找到共处的路径。所以你的喜用神是${yongGan}——${yongDetail}。${mediator}的力量是你命局中最关键的调和剂。

需要留意的是${jiGan}——${jiDetail}。在交战结构中，跟交战双方无关或加重冲突的力量，不太容易帮你找到平衡。它们不是"坏的"，只是在你的命局结构里不是最顺手的方向。不过这也不全是劣势——这种结构往往意味着你有更丰富的内在层次，能在不同情境下调用不同的力量。

你可以从具体的小事开始：${suggestions}。${mediator}是你命局的"桥梁"——有了它，${pair}两股力量才能从对峙变成合力。`
}

const FALLBACK_MAP: Record<string, (fp: YongShenFactPack) => string> = {
  '扶抑': buildFuYiFallback,
  '从格': buildCongGeFallback,
  '化格': buildHuaGeFallback,
  '通关': buildTongGuanFallback,
}

export function generateYongShenFallback(fp: YongShenFactPack): string {
  const builder = FALLBACK_MAP[fp.primaryMethod]
  if (builder) {
    return builder(fp)
  }
  return buildFuYiFallback(fp)
}

import { LunarUtil } from 'lunar-typescript'
import type { ElementType } from '@/types/bazi'

// 天干
export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
// 地支
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
// 生肖
export const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const
// 天干五行
const GAN_WU_XING: Record<string, ElementType> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}
// 地支本气五行
const ZHI_WU_XING: Record<string, ElementType> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

export function getGanIndex(gan: string): number {
  return GAN.indexOf(gan as typeof GAN[number])
}

export function getZhiIndex(zhi: string): number {
  return ZHI.indexOf(zhi as typeof ZHI[number])
}

export function getStemElement(stem: string): ElementType {
  return GAN_WU_XING[stem]
}

export function getBranchElement(branch: string): ElementType {
  return ZHI_WU_XING[branch]
}

export function getHiddenStems(branch: string): string[] {
  const value = LunarUtil.ZHI_HIDE_GAN[branch]
  if (value && value.length > 0 && value[0] !== '') {
    return [...value]
  }
  // 兜底硬编码
  const fallback: Record<string, string[]> = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'],
    卯: ['乙'], 辰: ['乙', '戊', '癸'], 巳: ['丙', '庚', '戊'],
    午: ['丁', '己'], 未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'],
    酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
  }
  return [...fallback[branch]]
}

export function getNaYin(stem: string, branch: string): string {
  const ganZhi = stem + branch
  const value = LunarUtil.NAYIN[ganZhi]
  if (value && value !== '') return value
  // 兜底硬编码 60甲子纳音
  const nayinList: [string, string][] = [
    ['甲子', '海中金'], ['乙丑', '海中金'], ['丙寅', '炉中火'], ['丁卯', '炉中火'],
    ['戊辰', '大林木'], ['己巳', '大林木'], ['庚午', '路旁土'], ['辛未', '路旁土'],
    ['壬申', '剑锋金'], ['癸酉', '剑锋金'], ['甲戌', '山头火'], ['乙亥', '山头火'],
    ['丙子', '涧下水'], ['丁丑', '涧下水'], ['戊寅', '城头土'], ['己卯', '城头土'],
    ['庚辰', '白蜡金'], ['辛巳', '白蜡金'], ['壬午', '杨柳木'], ['癸未', '杨柳木'],
    ['甲申', '泉中水'], ['乙酉', '泉中水'], ['丙戌', '屋上土'], ['丁亥', '屋上土'],
    ['戊子', '霹雳火'], ['己丑', '霹雳火'], ['庚寅', '松柏木'], ['辛卯', '松柏木'],
    ['壬辰', '长流水'], ['癸巳', '长流水'], ['甲午', '沙中金'], ['乙未', '沙中金'],
    ['丙申', '山下火'], ['丁酉', '山下火'], ['戊戌', '平地木'], ['己亥', '平地木'],
    ['庚子', '壁上土'], ['辛丑', '壁上土'], ['壬寅', '金箔金'], ['癸卯', '金箔金'],
    ['甲辰', '覆灯火'], ['乙巳', '覆灯火'], ['丙午', '天河水'], ['丁未', '天河水'],
    ['戊申', '大驿土'], ['己酉', '大驿土'], ['庚戌', '钗钏金'], ['辛亥', '钗钏金'],
    ['壬子', '桑柘木'], ['癸丑', '桑柘木'], ['甲寅', '大溪水'], ['乙卯', '大溪水'],
    ['丙辰', '沙中土'], ['丁巳', '沙中土'], ['戊午', '天上火'], ['己未', '天上火'],
    ['庚申', '石榴木'], ['辛酉', '石榴木'], ['壬戌', '大海水'], ['癸亥', '大海水'],
  ]
  for (const [k, v] of nayinList) {
    if (k === ganZhi) return v
  }
  return ''
}

export function getZodiac(yearBranch: string): string {
  const idx = getZhiIndex(yearBranch)
  if (idx >= 0 && idx < 12) return SHENG_XIAO[idx]
  return ''
}

/**
 * 五鼠遁：根据日干和时支计算时干
 * 甲己起甲子，乙庚起丙子，丙辛起戊子，丁壬起庚子，戊癸起壬子
 */
export function getHourGan(dayStem: string, hourZhi: string): string {
  const dayIdx = getGanIndex(dayStem)
  const zhiIdx = getZhiIndex(hourZhi)
  // 子时天干 = (日干索引 % 5) * 2
  const ziShiStemIdx = (dayIdx % 5) * 2
  const hourStemIdx = (ziShiStemIdx + zhiIdx) % 10
  return GAN[hourStemIdx]
}

/**
 * 时辰对应：0→子, 1,2→丑, 3,4→寅, ..., 21,22→亥, 23→子
 */
export function getHourZhi(hour: number): string {
  const idx = Math.floor(((hour + 1) % 24) / 2)
  return ZHI[idx]
}

/**
 * 十神：otherStem 相对于 dayMasterStem 的关系
 * 以日主为"我"，根据天干生克关系判定
 */
export function getTenGod(dayMasterStem: string, otherStem: string): string {
  const shiShen = [
    '比肩', '劫财', '食神', '伤官', '偏财',
    '正财', '七杀', '正官', '偏印', '正印',
  ]
  const myIdx = getGanIndex(dayMasterStem)
  const otherIdx = getGanIndex(otherStem)
  const offset = (otherIdx - myIdx + 10) % 10
  return shiShen[offset]
}

/**
 * 统计四柱天干和地支本气（共 8 个）的五行个数
 */
export function countElements(
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
): Record<ElementType, number> {
  const count: Record<ElementType, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  const stems = [yearStem, monthStem, dayStem, hourStem]
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  for (const s of stems) {
    count[getStemElement(s)]++
  }
  for (const b of branches) {
    count[getBranchElement(b)]++
  }
  return count
}

/**
 * 计算日柱所在旬
 */
export function getXun(dayGanZhi: string): string {
  const jiaZi = [
    '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
    '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
    '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
    '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
    '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
    '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥',
  ]
  const idx = jiaZi.indexOf(dayGanZhi)
  if (idx < 0) return ''
  const xunStart = idx - (idx % 10)
  const xunEnd = xunStart + 9
  return `${jiaZi[xunStart]}～${jiaZi[xunEnd]}`
}

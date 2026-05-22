import { Solar, Lunar } from 'lunar-typescript'
import type { BaziInput, BaziResult, Pillar } from '@/types/bazi'
import type { SolarTimeAdjustment } from '@/lib/solarTime/types'
import { adjustToSolarTime } from '@/lib/solarTime'
import {
  getStemElement,
  getBranchElement,
  getHiddenStems,
  getNaYin,
  getZodiac,
  getTenGod,
  countElements,
} from './bazi-utils'

function validateInput(input: BaziInput): void {
  if (input.year < 1900 || input.year > 2100) {
    throw new Error('年份必须在 1900-2100 之间')
  }
  if (input.month < 1 || input.month > 12) {
    throw new Error('月份必须在 1-12 之间')
  }
  if (input.day < 1 || input.day > 31) {
    throw new Error('日期必须在 1-31 之间')
  }
  if (input.hour < 0 || input.hour > 23) {
    throw new Error('小时必须在 0-23 之间')
  }
  if (input.minute < 0 || input.minute > 59) {
    throw new Error('分钟必须在 0-59 之间')
  }
}

function buildPillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    stemElement: getStemElement(stem),
    branchElement: getBranchElement(branch),
    hiddenStems: getHiddenStems(branch),
  }
}

function createLunarFromInput(input: BaziInput): Lunar {
  if (input.isLunar) {
    // lunar-typescript 用负数月份表示闰月，如 -4 = 闰四月，4 = 普通四月
    const month = input.isLeapMonth ? -input.month : input.month
    return Lunar.fromYmdHms(input.year, month, input.day, input.hour, input.minute, 0)
  }
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0)
  return solar.getLunar()
}

export function calculateBazi(input: BaziInput): BaziResult {
  validateInput(input)

  // ── 真太阳时换算 ──
  // 如果提供了完整出生地(省+市)，将标准时间换算为真太阳时
  let solarTimeAdjustment: SolarTimeAdjustment | null = null

  if (input.birthPlace?.province && input.birthPlace?.city) {
    // 先确定标准时间：农历输入需先转公历获取对应的 solar date
    const originalLunar = createLunarFromInput(input)
    const standardSolar = originalLunar.getSolar()
    const standardTime = new Date(
      standardSolar.getYear(),
      standardSolar.getMonth() - 1,
      standardSolar.getDay(),
      input.hour,
      input.minute,
      0,
    )
    solarTimeAdjustment = adjustToSolarTime(standardTime, input.birthPlace)
  }

  // 使用换算后的时间创建 Lunar 对象
  const lunar = solarTimeAdjustment
    ? Solar.fromDate(solarTimeAdjustment.solarTime).getLunar()
    : createLunarFromInput(input)

  const solar = lunar.getSolar()

  // 年柱：以立春精确时刻为界
  const yearStem = lunar.getYearGanExact()
  const yearBranch = lunar.getYearZhiExact()

  // 月柱：以节气精确时刻为界
  const monthStem = lunar.getMonthGanExact()
  const monthBranch = lunar.getMonthZhiExact()

  // 日柱：精确计算。
  // getDayGanExact() 在 23:00-23:59 返回次日日柱，
  // 实现流派选择：晚子时（23点后）日柱进位算次日
  const dayStem = lunar.getDayGanExact()
  const dayBranch = lunar.getDayZhiExact()

  // 时柱：lunar-typescript 内部已根据日柱（含晚子时处理）计算时干
  const hourStem = lunar.getTimeGan()
  const hourBranch = lunar.getTimeZhi()

  const yearPillar = buildPillar(yearStem, yearBranch)
  const monthPillar = buildPillar(monthStem, monthBranch)
  const dayPillar = buildPillar(dayStem, dayBranch)
  const hourPillar = buildPillar(hourStem, hourBranch)

  const dayMaster = dayStem

  // solarDate 显示真太阳时(如有换算)或原始输入时间
  const displayHour = solarTimeAdjustment
    ? solarTimeAdjustment.solarTime.getHours()
    : input.hour
  const displayMinute = solarTimeAdjustment
    ? solarTimeAdjustment.solarTime.getMinutes()
    : input.minute

  return {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    dayMaster,
    dayMasterElement: getStemElement(dayMaster),
    zodiac: getZodiac(yearBranch),
    naYin: {
      year: getNaYin(yearStem, yearBranch),
      month: getNaYin(monthStem, monthBranch),
      day: getNaYin(dayStem, dayBranch),
      hour: getNaYin(hourStem, hourBranch),
    },
    elementCount: countElements(
      yearStem, yearBranch, monthStem, monthBranch,
      dayStem, dayBranch, hourStem, hourBranch,
    ),
    tenGods: {
      yearStem: getTenGod(dayMaster, yearStem),
      monthStem: getTenGod(dayMaster, monthStem),
      hourStem: getTenGod(dayMaster, hourStem),
      yearBranch: yearPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      monthBranch: monthPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      dayBranch: dayPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      hourBranch: hourPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
    },
    solarDate: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${String(displayHour).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`,
    lunarDate: `${lunar.getYearInGanZhiByLiChun()}年${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`,
    inputInfo: { ...input },
    solarTimeAdjustment,
  }
}

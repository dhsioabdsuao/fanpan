import { calculateBazi } from '@/lib/bazi'
import { determineStrength } from '@/lib/strength/determineStrength'
import type { BaziInput } from '@/types/bazi'

const cases: { label: string; input: BaziInput; expectedLevel?: string }[] = [
  {
    label: 'Case3: 壬午 甲辰 戊午 庚申 (日主戊土)',
    input: {
      year: 2002, month: 4, day: 20, hour: 15, minute: 38,
      gender: 'male', isLunar: false,
      birthPlace: { province: '河南省', city: '洛阳市', district: '栾川县' },
    },
  },
  {
    label: 'Case1: 甲申 甲戌 乙酉 辛巳 (日主乙木)',
    input: {
      year: 2004, month: 11, day: 2, hour: 9, minute: 40,
      gender: 'male', isLunar: false,
      birthPlace: { province: '河南省', city: '洛阳市', district: '涧西区' },
    },
  },
  {
    label: 'SZ: 甲申 甲戌 庚午 辛巳 (日主庚金,深圳)',
    input: {
      year: 2004, month: 10, day: 18, hour: 9, minute: 30,
      gender: 'female', isLunar: false,
      birthPlace: { province: '广东省', city: '深圳市', district: '福田区' },
    },
  },
  {
    label: 'Case2: 壬午 丙午 甲戌 壬申 (日主甲木)',
    input: {
      year: 2002, month: 7, day: 5, hour: 15, minute: 38,
      gender: 'male', isLunar: false,
      birthPlace: { province: '山东省', city: '威海市', district: '环翠区' },
    },
  },
]

for (const c of cases) {
  const bazi = calculateBazi(c.input)
  const p = bazi.pillars
  const baziStr = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`

  const result = determineStrength(bazi)

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  ${c.label}`)
  console.log(`  八字: ${baziStr}  日主: ${bazi.dayMaster}(${bazi.dayMasterElement})`)
  console.log(`${'═'.repeat(70)}`)
  console.log(`  得令: ${result.deLing}  得地: ${result.deDi}  得势: ${result.deShi}`)
  console.log(`  → 强弱: ${result.level}`)
  console.log(`  理由:`)
  // 按分号拆分逐条打印
  for (const line of result.reason.split('; ')) {
    console.log(`    ${line}`)
  }
}

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import { getAllShenSha } from '../bage/shensha'

describe('diagnose-luoyang', () => {
  it('洛阳女命神煞排查', () => {
    const bazi = calculateBazi({
      year: 2004, month: 11, day: 2, hour: 9, minute: 40,
      isLunar: false, gender: 'female',
      birthPlace: { province: '河南', city: '洛阳', district: '涧西区' },
    })

    const p = bazi.pillars
    console.log('\n=== 八字排盘 ===')
    console.log(`年柱: ${p.year.stem}${p.year.branch} (${p.year.stemElement}${p.year.branchElement})`)
    console.log(`月柱: ${p.month.stem}${p.month.branch} (${p.month.stemElement}${p.month.branchElement})`)
    console.log(`日柱: ${bazi.dayMaster}${p.day.branch} (${bazi.dayMasterElement}${p.day.branchElement})`)
    console.log(`时柱: ${p.hour.stem}${p.hour.branch} (${p.hour.stemElement}${p.hour.branchElement})`)
    console.log(`日主: ${bazi.dayMaster}`)
    console.log(`月支: ${p.month.branch}`)
    console.log(`年支: ${p.year.branch}`)
    console.log(`日支: ${p.day.branch}`)

    // Current shensha
    const shensha = getAllShenSha(bazi)
    const byPillar = (pillar: string) => shensha.filter(s => s.pillar === pillar)

    console.log('\n=== 当前神煞输出 ===')
    for (const label of ['年柱','月柱','日柱','时柱']) {
      const stars = byPillar(label)
      console.log(`${label} (${stars.length}颗): ${stars.map(s => s.name + '[' + s.category + ']').join(', ') || '(无)'}`)
    }

    // Now do a COMPLETE star-by-star check of ALL 25 stars
    console.log('\n===== 逐颗排查所有25颗神煞 =====')

    const stems = { year: p.year.stem, month: p.month.stem, day: bazi.dayMaster, hour: p.hour.stem }
    const branches = { year: p.year.branch, month: p.month.branch, day: p.day.branch, hour: p.hour.branch }
    const allBranches = [p.year.branch, p.month.branch, p.day.branch, p.hour.branch]
    const allStems = [p.year.stem, p.month.stem, bazi.dayMaster, p.hour.stem]

    // 断言版:独立预言机(本文件内重实现的查法表) vs 应用实现,逐星对柱位
    function checkStar(name: string, expectedPillars: string[], actualPillars: string[]) {
      expect([...actualPillars].sort(), `${name} 柱位(缺失/多余即应用实现与预言机不符)`).toEqual([...expectedPillars].sort())
    }

    const actualPillars = (name: string) => shensha.filter(s => s.name === name).map(s => s.pillar)

    // --- 1. 天乙贵人 ---
    // 日干查 + 年干查
    const tianYiDay: Record<string, string[]> = { '甲': ['丑','未'], '乙': ['子','申'], '丙': ['亥','酉'], '丁': ['亥','酉'], '戊': ['丑','未'], '己': ['子','申'], '庚': ['丑','未'], '辛': ['寅','午'], '壬': ['卯','巳'], '癸': ['卯','巳'] }
    const tianYiTargets = new Set([...(tianYiDay[bazi.dayMaster] || []), ...(tianYiDay[p.year.stem] || [])])
    const tianYiPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (tianYiTargets.has(branches[key])) tianYiPillars.push(label)
    }
    console.log(`\n[天乙贵人] 日主${bazi.dayMaster}→${tianYiDay[bazi.dayMaster]?.join('/')}, 年干${p.year.stem}→${tianYiDay[p.year.stem]?.join('/')}`)
    console.log(`  地支: ${allBranches.join(',')} → 命中: ${[...tianYiTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${tianYiPillars.join(',') || '无'}`)
    checkStar('天乙贵人', tianYiPillars, actualPillars('天乙贵人'))

    // --- 2. 天德贵人 ---
    const tianDeStem: Record<string, string> = { '寅': '丁', '辰': '壬', '巳': '辛', '未': '甲', '申': '癸', '戌': '丙', '亥': '乙', '丑': '庚' }
    const tianDeBranch: Record<string, string> = { '卯': '申', '午': '亥', '酉': '寅', '子': '巳' }
    const tdStemTarget = tianDeStem[p.month.branch]
    const tdBranchTarget = tianDeBranch[p.month.branch]
    const tianDePillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if ((tdStemTarget && stems[key] === tdStemTarget) || (tdBranchTarget && branches[key] === tdBranchTarget)) {
        tianDePillars.push(label)
      }
    }
    console.log(`\n[天德贵人] 月支${p.month.branch} → stemTarget=${tdStemTarget || '无'}, branchTarget=${tdBranchTarget || '无'}`)
    console.log(`  期望柱位: ${tianDePillars.join(',') || '无'}`)
    checkStar('天德贵人', tianDePillars, actualPillars('天德贵人'))

    // --- 3. 月德贵人 ---
    const yueDeMap: Record<string, string> = {
      '寅': '丙', '午': '丙', '戌': '丙',
      '亥': '甲', '卯': '甲', '未': '甲',
      '申': '壬', '子': '壬', '辰': '壬',
      '巳': '庚', '酉': '庚', '丑': '庚',
    }
    const ydTarget = yueDeMap[p.month.branch]
    const yueDePillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (ydTarget && stems[key] === ydTarget) yueDePillars.push(label)
    }
    console.log(`\n[月德贵人] 月支${p.month.branch} → target stem=${ydTarget}`)
    console.log(`  期望柱位: ${yueDePillars.join(',') || '无'}`)
    checkStar('月德贵人', yueDePillars, actualPillars('月德贵人'))

    // --- 4. 太极贵人 ---
    const taiJiMap: Record<string, string[]> = {
      '甲': ['子','午'], '乙': ['子','午'], '丙': ['卯','酉'], '丁': ['卯','酉'],
      '戊': ['辰','戌','丑','未'], '己': ['辰','戌','丑','未'],
      '庚': ['寅','亥'], '辛': ['寅','亥'], '壬': ['巳','申'], '癸': ['巳','申'],
    }
    const tjTargets = new Set([...(taiJiMap[bazi.dayMaster] || []), ...(taiJiMap[p.year.stem] || [])])
    const taiJiPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (tjTargets.has(branches[key])) taiJiPillars.push(label)
    }
    console.log(`\n[太极贵人] 日干${bazi.dayMaster}→${taiJiMap[bazi.dayMaster]}, 年干${p.year.stem}→${taiJiMap[p.year.stem]}`)
    console.log(`  期望柱位: ${taiJiPillars.join(',') || '无'}`)
    checkStar('太极贵人', taiJiPillars, actualPillars('太极贵人'))

    // --- 5. 福星贵人 ---
    const fuXingMap: Record<string, string> = {
      '甲': '寅', '丙': '寅', '戊': '寅', '乙': '丑', '丁': '丑', '己': '丑',
      '庚': '午', '辛': '巳', '壬': '辰', '癸': '卯',
    }
    const fxTargets = new Set([fuXingMap[bazi.dayMaster], fuXingMap[p.year.stem]].filter(Boolean))
    const fxPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (fxTargets.has(branches[key])) fxPillars.push(label)
    }
    console.log(`\n[福星贵人] 日干${bazi.dayMaster}→${fuXingMap[bazi.dayMaster]}, 年干${p.year.stem}→${fuXingMap[p.year.stem]}`)
    console.log(`  地支: ${allBranches.join(',')} → 命中: ${[...fxTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${fxPillars.join(',') || '无'}`)
    checkStar('福星贵人', fxPillars, actualPillars('福星贵人'))

    // --- 6. 文昌贵人 ---
    const wenChangMap: Record<string, string> = {
      '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
      '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
    }
    const wcTargets = new Set([wenChangMap[bazi.dayMaster], wenChangMap[p.year.stem]].filter(Boolean))
    const wcPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (wcTargets.has(branches[key])) wcPillars.push(label)
    }
    console.log(`\n[文昌贵人] 日干${bazi.dayMaster}→${wenChangMap[bazi.dayMaster]}, 年干${p.year.stem}→${wenChangMap[p.year.stem]}`)
    console.log(`  命中: ${[...wcTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${wcPillars.join(',') || '无'}`)
    checkStar('文昌贵人', wcPillars, actualPillars('文昌贵人'))

    // --- 7. 德秀贵人 ---
    const deXiuMap: Record<string, { de: string[], xiu: string[] }> = {
      '寅': { de: ['丙','丁'], xiu: ['戊','癸'] }, '午': { de: ['丙','丁'], xiu: ['戊','癸'] }, '戌': { de: ['丙','丁'], xiu: ['戊','癸'] },
      '申': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] }, '子': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] }, '辰': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] },
      '巳': { de: ['庚','辛'], xiu: ['乙','庚'] }, '酉': { de: ['庚','辛'], xiu: ['乙','庚'] }, '丑': { de: ['庚','辛'], xiu: ['乙','庚'] },
      '亥': { de: ['甲','乙'], xiu: ['丁','壬'] }, '卯': { de: ['甲','乙'], xiu: ['丁','壬'] }, '未': { de: ['甲','乙'], xiu: ['丁','壬'] },
    }
    const deXiuSanHe: Record<string, string[]> = {
      '寅': ['寅','午','戌'], '午': ['寅','午','戌'], '戌': ['寅','午','戌'],
      '申': ['申','子','辰'], '子': ['申','子','辰'], '辰': ['申','子','辰'],
      '巳': ['巳','酉','丑'], '酉': ['巳','酉','丑'], '丑': ['巳','酉','丑'],
      '亥': ['亥','卯','未'], '卯': ['亥','卯','未'], '未': ['亥','卯','未'],
    }
    const dxEntry = deXiuMap[p.month.branch]
    const dxStemTargets = dxEntry ? [...dxEntry.de, ...dxEntry.xiu] : []
    const dxBranchTargets = deXiuSanHe[p.month.branch] || []
    const dxPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (dxStemTargets.includes(stems[key]) || dxBranchTargets.includes(branches[key])) dxPillars.push(label)
    }
    console.log(`\n[德秀贵人] 月支${p.month.branch} stemTargets=${dxStemTargets.join(',')} branchTargets=${dxBranchTargets.join(',')}`)
    console.log(`  期望柱位: ${dxPillars.join(',') || '无'}`)
    checkStar('德秀贵人', dxPillars, actualPillars('德秀贵人'))

    // --- 8. 国印贵人 ---
    const guoYinMap: Record<string, string> = {
      '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
      '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申',
    }
    const gyTargets = new Set([guoYinMap[bazi.dayMaster], guoYinMap[p.year.stem]].filter(Boolean))
    const gyPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (gyTargets.has(branches[key])) gyPillars.push(label)
    }
    console.log(`\n[国印贵人] 日干${bazi.dayMaster}→${guoYinMap[bazi.dayMaster]}, 年干${p.year.stem}→${guoYinMap[p.year.stem]}`)
    console.log(`  命中: ${[...gyTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${gyPillars.join(',') || '无'}`)
    checkStar('国印贵人', gyPillars, actualPillars('国印贵人'))

    // --- 9. 金舆 ---
    const jinYuMap: Record<string, string> = {
      '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
      '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅',
    }
    const jyTargets = new Set([jinYuMap[bazi.dayMaster], jinYuMap[p.year.stem]].filter(Boolean))
    const jyPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (jyTargets.has(branches[key])) jyPillars.push(label)
    }
    console.log(`\n[金舆] 日干${bazi.dayMaster}→${jinYuMap[bazi.dayMaster]}, 年干${p.year.stem}→${jinYuMap[p.year.stem]}`)
    console.log(`  命中: ${[...jyTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${jyPillars.join(',') || '无'}`)
    checkStar('金舆', jyPillars, actualPillars('金舆'))

    // --- 10. 羊刃 ---
    const yangRenMap: Record<string, string> = {
      '甲': '卯', '乙': '寅', '丙': '午', '丁': '未', '戊': '午',
      '己': '未', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
    }
    const yrTarget = yangRenMap[bazi.dayMaster]
    const yrPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (yrTarget && branches[key] === yrTarget) yrPillars.push(label)
    }
    console.log(`\n[羊刃] 日干${bazi.dayMaster}→${yrTarget || '?'}`)
    console.log(`  期望柱位: ${yrPillars.join(',') || '无'}`)
    checkStar('羊刃', yrPillars, actualPillars('羊刃'))

    // --- 11. 孤鸾煞 ---
    const guLuanSet = new Set(['甲寅','乙卯','丙午','丁巳','戊午','己巳','庚申','辛酉','壬子','癸亥'])
    const glCombo = bazi.dayMaster + p.day.branch
    console.log(`\n[孤鸾煞] 日柱=${glCombo} → ${guLuanSet.has(glCombo) ? '命中' : '不命中'}`)
    checkStar('孤鸾煞', guLuanSet.has(glCombo) ? ['日柱'] : [], actualPillars('孤鸾煞'))

    // --- 12. 寡宿 ---
    const guaSuMap: Record<string, string> = {
      '亥': '戌', '子': '戌', '丑': '戌', '寅': '丑', '卯': '丑', '辰': '丑',
      '巳': '辰', '午': '辰', '未': '辰', '申': '未', '酉': '未', '戌': '未',
    }
    const gsTargets = new Set([guaSuMap[p.year.branch], guaSuMap[p.day.branch]].filter(Boolean))
    const gsPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (gsTargets.has(branches[key])) gsPillars.push(label)
    }
    console.log(`\n[寡宿] 年支${p.year.branch}→${guaSuMap[p.year.branch]}, 日支${p.day.branch}→${guaSuMap[p.day.branch]}`)
    console.log(`  期望柱位: ${gsPillars.join(',') || '无'}`)
    checkStar('寡宿', gsPillars, actualPillars('寡宿'))

    // --- 13. 劫煞 ---
    const jieShaMap: Record<string, string> = {
      '申': '巳', '子': '巳', '辰': '巳', '亥': '申', '卯': '申', '未': '申',
      '寅': '亥', '午': '亥', '戌': '亥', '巳': '寅', '酉': '寅', '丑': '寅',
    }
    const jsTargets = new Set([jieShaMap[p.year.branch], jieShaMap[p.day.branch]].filter(Boolean))
    const jsPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (jsTargets.has(branches[key])) jsPillars.push(label)
    }
    console.log(`\n[劫煞] 年支${p.year.branch}→${jieShaMap[p.year.branch]}, 日支${p.day.branch}→${jieShaMap[p.day.branch]}`)
    console.log(`  期望柱位: ${jsPillars.join(',') || '无'}`)
    checkStar('劫煞', jsPillars, actualPillars('劫煞'))

    // --- 14. 吊客 ---
    const diaoKeMap: Record<string, string> = {
      '子': '戌', '丑': '亥', '寅': '子', '卯': '丑',
      '辰': '寅', '巳': '卯', '午': '辰', '未': '巳',
      '申': '午', '酉': '未', '戌': '申', '亥': '酉',
    }
    const dkTarget = diaoKeMap[p.year.branch]
    const dkPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (dkTarget && branches[key] === dkTarget) dkPillars.push(label)
    }
    console.log(`\n[吊客] 年支${p.year.branch}→${dkTarget}`)
    console.log(`  期望柱位: ${dkPillars.join(',') || '无'}`)
    checkStar('吊客', dkPillars, actualPillars('吊客'))

    // --- 15. 九丑 ---
    const jiuChouSet = new Set(['戊子','戊午','壬子','壬午','丁酉','丁卯','己酉','己卯','辛酉','辛卯'])
    const jcCombo = bazi.dayMaster + p.day.branch
    console.log(`\n[九丑] 日柱=${jcCombo} → ${jiuChouSet.has(jcCombo) ? '命中' : '不命中'}`)
    checkStar('九丑', jiuChouSet.has(jcCombo) ? ['日柱'] : [], actualPillars('九丑'))

    // --- 16. 童子煞 ---
    const tongZiCombos: Record<string, string[]> = {
      '寅': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
      '卯': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
      '辰': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
      '巳': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
      '午': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
      '未': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
      '申': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
      '酉': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
      '戌': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
      '亥': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
      '子': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
      '丑': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
    }
    const tzCombos = tongZiCombos[p.month.branch]
    const dayCombo = bazi.dayMaster + p.day.branch
    console.log(`\n[童子煞] 月支${p.month.branch}, 日柱=${dayCombo} → ${tzCombos && tzCombos.includes(dayCombo) ? '命中' : '不命中'}`)
    checkStar('童子煞', (tzCombos && tzCombos.includes(dayCombo)) ? ['日柱'] : [], actualPillars('童子煞'))

    // --- 17. 空亡 ---
    const kongWangMap: Record<string, string[]> = {
      '甲子': ['戌','亥'], '乙丑': ['戌','亥'], '丙寅': ['戌','亥'], '丁卯': ['戌','亥'],
      '戊辰': ['戌','亥'], '己巳': ['戌','亥'], '庚午': ['戌','亥'], '辛未': ['戌','亥'],
      '壬申': ['戌','亥'], '癸酉': ['戌','亥'],
      '甲戌': ['申','酉'], '乙亥': ['申','酉'], '丙子': ['申','酉'], '丁丑': ['申','酉'],
      '戊寅': ['申','酉'], '己卯': ['申','酉'], '庚辰': ['申','酉'], '辛巳': ['申','酉'],
      '壬午': ['申','酉'], '癸未': ['申','酉'],
      '甲申': ['午','未'], '乙酉': ['午','未'], '丙戌': ['午','未'], '丁亥': ['午','未'],
      '戊子': ['午','未'], '己丑': ['午','未'], '庚寅': ['午','未'], '辛卯': ['午','未'],
      '壬辰': ['午','未'], '癸巳': ['午','未'],
      '甲午': ['辰','巳'], '乙未': ['辰','巳'], '丙申': ['辰','巳'], '丁酉': ['辰','巳'],
      '戊戌': ['辰','巳'], '己亥': ['辰','巳'], '庚子': ['辰','巳'], '辛丑': ['辰','巳'],
      '壬寅': ['辰','巳'], '癸卯': ['辰','巳'],
      '甲辰': ['寅','卯'], '乙巳': ['寅','卯'], '丙午': ['寅','卯'], '丁未': ['寅','卯'],
      '戊申': ['寅','卯'], '己酉': ['寅','卯'], '庚戌': ['寅','卯'], '辛亥': ['寅','卯'],
      '壬子': ['寅','卯'], '癸丑': ['寅','卯'],
      '甲寅': ['子','丑'], '乙卯': ['子','丑'], '丙辰': ['子','丑'], '丁巳': ['子','丑'],
      '戊午': ['子','丑'], '己未': ['子','丑'], '庚申': ['子','丑'], '辛酉': ['子','丑'],
      '壬戌': ['子','丑'], '癸亥': ['子','丑'],
    }
    const kwTargets = kongWangMap[dayCombo] || []
    const kwPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (key !== 'day' && kwTargets.includes(branches[key])) kwPillars.push(label)
    }
    console.log(`\n[空亡] 日柱${dayCombo} → 旬空=${kwTargets.join(',')}`)
    console.log(`  命中: ${kwTargets.filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${kwPillars.join(',') || '无'} (日柱自身不设空亡)`)
    checkStar('空亡', kwPillars, actualPillars('空亡'))

    // --- 18. 孤辰 ---
    const guChenMap: Record<string, string> = {
      '亥': '寅', '子': '寅', '丑': '寅', '寅': '巳', '卯': '巳', '辰': '巳',
      '巳': '申', '午': '申', '未': '申', '申': '亥', '酉': '亥', '戌': '亥',
    }
    const gcTarget = guChenMap[p.year.branch]
    const gcPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (key !== 'year' && gcTarget && branches[key] === gcTarget) gcPillars.push(label)
    }
    console.log(`\n[孤辰] 年支${p.year.branch}→${gcTarget}`)
    console.log(`  期望柱位: ${gcPillars.join(',') || '无'} (年柱自身不设孤辰)`)
    checkStar('孤辰', gcPillars, actualPillars('孤辰'))

    // --- 19. 桃花 ---
    const taoHuaMap: Record<string, string> = {
      '寅': '卯', '午': '卯', '戌': '卯', '亥': '子', '卯': '子', '未': '子',
      '申': '酉', '子': '酉', '辰': '酉', '巳': '午', '酉': '午', '丑': '午',
    }
    const thTargets = new Set([taoHuaMap[p.year.branch], taoHuaMap[p.day.branch]].filter(Boolean))
    const thPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (thTargets.has(branches[key])) thPillars.push(label)
    }
    console.log(`\n[桃花] 年支${p.year.branch}→${taoHuaMap[p.year.branch]}, 日支${p.day.branch}→${taoHuaMap[p.day.branch]}`)
    console.log(`  期望柱位: ${thPillars.join(',') || '无'}`)
    checkStar('桃花', thPillars, actualPillars('桃花'))

    // --- 20. 驿马 ---
    const yiMaMap: Record<string, string> = {
      '寅': '申', '午': '申', '戌': '申', '亥': '巳', '卯': '巳', '未': '巳',
      '申': '寅', '子': '寅', '辰': '寅', '巳': '亥', '酉': '亥', '丑': '亥',
    }
    const ymTargets = new Set([yiMaMap[p.year.branch], yiMaMap[p.day.branch]].filter(Boolean))
    const ymPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (ymTargets.has(branches[key])) ymPillars.push(label)
    }
    console.log(`\n[驿马] 年支${p.year.branch}→${yiMaMap[p.year.branch]}, 日支${p.day.branch}→${yiMaMap[p.day.branch]}`)
    console.log(`  期望柱位: ${ymPillars.join(',') || '无'}`)
    checkStar('驿马', ymPillars, actualPillars('驿马'))

    // --- 21. 华盖 ---
    const huaGaiMap: Record<string, string> = {
      '寅': '戌', '午': '戌', '戌': '戌', '亥': '未', '卯': '未', '未': '未',
      '申': '辰', '子': '辰', '辰': '辰', '巳': '丑', '酉': '丑', '丑': '丑',
    }
    const hgTargets = new Set([huaGaiMap[p.year.branch], huaGaiMap[p.day.branch]].filter(Boolean))
    const hgPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (hgTargets.has(branches[key])) hgPillars.push(label)
    }
    console.log(`\n[华盖] 年支${p.year.branch}→${huaGaiMap[p.year.branch]}, 日支${p.day.branch}→${huaGaiMap[p.day.branch]}`)
    console.log(`  期望柱位: ${hgPillars.join(',') || '无'}`)
    checkStar('华盖', hgPillars, actualPillars('华盖'))

    // --- 22. 将星 ---
    const jiangXingMap: Record<string, string> = {
      '申': '子', '子': '子', '辰': '子', '亥': '卯', '卯': '卯', '未': '卯',
      '寅': '午', '午': '午', '戌': '午', '巳': '酉', '酉': '酉', '丑': '酉',
    }
    const jxTargets = new Set([jiangXingMap[p.year.branch], jiangXingMap[p.day.branch]].filter(Boolean))
    const jxPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (jxTargets.has(branches[key])) jxPillars.push(label)
    }
    console.log(`\n[将星] 年支${p.year.branch}→${jiangXingMap[p.year.branch]}, 日支${p.day.branch}→${jiangXingMap[p.day.branch]}`)
    console.log(`  命中: ${[...jxTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${jxPillars.join(',') || '无'}`)
    checkStar('将星', jxPillars, actualPillars('将星'))

    // --- 23. 红艳 ---
    const hongYanMap: Record<string, string> = {
      '甲': '午', '乙': '申', '丙': '寅', '丁': '未', '戊': '辰',
      '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申',
    }
    const hyTargets = new Set([hongYanMap[bazi.dayMaster], hongYanMap[p.year.stem]].filter(Boolean))
    const hyPillars: string[] = []
    for (const [key, label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']] as const) {
      if (hyTargets.has(branches[key])) hyPillars.push(label)
    }
    console.log(`\n[红艳] 日干${bazi.dayMaster}→${hongYanMap[bazi.dayMaster]}, 年干${p.year.stem}→${hongYanMap[p.year.stem]}`)
    console.log(`  命中: ${[...hyTargets].filter(b => allBranches.includes(b)).join(',') || '无'}`)
    console.log(`  期望柱位: ${hyPillars.join(',') || '无'}`)
    checkStar('红艳', hyPillars, actualPillars('红艳'))

    // --- 24. 十灵 ---
    const shiLingSet = new Set(['甲辰','乙亥','丙辰','丁酉','戊午','庚午','庚戌','辛亥','壬寅','癸未','甲戌'])
    console.log(`\n[十灵] 日柱=${dayCombo} → ${shiLingSet.has(dayCombo) ? '命中' : '不命中'}`)
    checkStar('十灵', shiLingSet.has(dayCombo) ? ['日柱'] : [], actualPillars('十灵'))

    // --- 25. 六秀 ---
    const liuXiuSet = new Set(['丙午','丁未','戊子','戊午','己丑','己未'])
    console.log(`\n[六秀] 日柱=${dayCombo} → ${liuXiuSet.has(dayCombo) ? '命中' : '不命中'}`)
    checkStar('六秀', liuXiuSet.has(dayCombo) ? ['日柱'] : [], actualPillars('六秀'))

    // ===== SUMMARY =====
    console.log('\n\n===== 汇总：所有⚠️标记即为问题 =====')
  })
})

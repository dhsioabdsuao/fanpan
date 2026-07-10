import { describe, it } from 'vitest'
import { calculateBazi } from '../bazi'
import { getAllShenSha } from '../bage/shensha'

// ═══════════════════════════════════════════════════════════════
// 四个命局
// ═══════════════════════════════════════════════════════════════

const CHARTS = [
  {
    name: '【命局A】𡈼午 甲辰 戊午 己未',
    input: { year: 2002, month: 4, day: 20, hour: 13, minute: 0, isLunar: false, gender: 'male' as const },
  },
  {
    name: '【命局B】威海男命',
    input: { year: 2002, month: 7, day: 5, hour: 15, minute: 32, isLunar: false, gender: 'male' as const },
  },
  {
    name: '【命局C】洛阳女命',
    input: {
      year: 2004, month: 11, day: 2, hour: 9, minute: 40, isLunar: false, gender: 'female' as const,
      birthPlace: { province: '河南', city: '洛阳', district: '涧西区' },
    },
  },
]

// ═══════════════════════════════════════════════════════════════
// 当前25颗神煞的查表（从 shensha.ts 复制，用于独立验证）
// ═══════════════════════════════════════════════════════════════

const PILLAR_KEYS = ['year','month','day','hour'] as const
const PILLAR_LABEL: Record<string, string> = { year:'年柱', month:'月柱', day:'日柱', hour:'时柱' }
const BRANCH_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

// 六冲
const CLASH_PAIRS: [string,string][] = [
  ['子','午'],['丑','未'],['寅','申'],['卯','酉'],['辰','戌'],['巳','亥'],
]
function sixClash(a: string): string {
  for (const [x,y] of CLASH_PAIRS) {
    if (a===x) return y
    if (a===y) return x
  }
  return ''
}

// 六合
const HE_PAIRS: [string,string][] = [
  ['子','丑'],['寅','亥'],['卯','戌'],['辰','酉'],['巳','申'],['午','未'],
]
function sixHe(a: string): string {
  for (const [x,y] of HE_PAIRS) {
    if (a===x) return y
    if (a===y) return x
  }
  return ''
}

// 天干五合
const STEM_HE: Record<string, string> = { '甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊' }

function branchIndex(b: string) { return BRANCH_ORDER.indexOf(b) }

// ═══════════════════════════════════════
// 1. 天乙贵人
// ═══════════════════════════════════════
const TIAN_YI: Record<string,string[]> = {
  '甲':['丑','未'],'戊':['丑','未'],'庚':['丑','未'],
  '乙':['子','申'],'己':['子','申'],
  '丙':['亥','酉'],'丁':['亥','酉'],
  '壬':['卯','巳'],'癸':['卯','巳'],
  '辛':['寅','午'],
}
function checkTianYi(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set<string>()
  for (const s of [stems.day, stems.year]) if (TIAN_YI[s]) TIAN_YI[s].forEach(x=>t.add(x))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 2. 天德贵人
// ═══════════════════════════════════════
const TIAN_DE_STEM: Record<string,string> = { '寅':'丁','辰':'壬','巳':'辛','未':'甲','申':'癸','戌':'丙','亥':'乙','丑':'庚' }
const TIAN_DE_BRANCH: Record<string,string> = { '卯':'申','午':'亥','酉':'寅','子':'巳' }
function checkTianDe(monthBranch: string, stems: Record<string,string>, branches: Record<string,string>): string[] {
  const r: string[] = []
  const ts = TIAN_DE_STEM[monthBranch]
  const tb = TIAN_DE_BRANCH[monthBranch]
  for (const k of PILLAR_KEYS) {
    if ((ts && stems[k]===ts) || (tb && branches[k]===tb)) r.push(k)
  }
  return r
}

// ═══════════════════════════════════════
// 3. 月德贵人
// ═══════════════════════════════════════
const YUE_DE: Record<string,string> = {
  '寅':'丙','午':'丙','戌':'丙', '亥':'甲','卯':'甲','未':'甲',
  '申':'壬','子':'壬','辰':'壬', '巳':'庚','酉':'庚','丑':'庚',
}
function checkYueDe(monthBranch: string, stems: Record<string,string>): string[] {
  const t = YUE_DE[monthBranch]
  return t ? PILLAR_KEYS.filter(k=>stems[k]===t) : []
}

// ═══════════════════════════════════════
// 4. 太极贵人
// ═══════════════════════════════════════
const TAI_JI: Record<string,string[]> = {
  '甲':['子','午'],'乙':['子','午'],'丙':['卯','酉'],'丁':['卯','酉'],
  '戊':['辰','戌','丑','未'],'己':['辰','戌','丑','未'],
  '庚':['寅','亥'],'辛':['寅','亥'],'壬':['巳','申'],'癸':['巳','申'],
}
function checkTaiJi(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set<string>()
  for (const s of [stems.day, stems.year]) if (TAI_JI[s]) TAI_JI[s].forEach(x=>t.add(x))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 5. 福星贵人
// ═══════════════════════════════════════
const FU_XING: Record<string,string> = {
  '甲':'寅','丙':'寅','戊':'寅','乙':'丑','丁':'丑','己':'丑',
  '庚':'午','辛':'巳','壬':'辰','癸':'卯',
}
function checkFuXing(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set([FU_XING[stems.day], FU_XING[stems.year]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 6. 文昌贵人
// ═══════════════════════════════════════
const WEN_CHANG: Record<string,string> = {
  '甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯',
}
function checkWenChang(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set([WEN_CHANG[stems.day], WEN_CHANG[stems.year]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 7. 德秀贵人
// ═══════════════════════════════════════
const DE_XIU: Record<string,{de:string[],xiu:string[]}> = {
  '寅':{de:['丙','丁'],xiu:['戊','癸']},'午':{de:['丙','丁'],xiu:['戊','癸']},'戌':{de:['丙','丁'],xiu:['戊','癸']},
  '申':{de:['壬','癸','戊','己'],xiu:['丙','辛','甲','己']},'子':{de:['壬','癸','戊','己'],xiu:['丙','辛','甲','己']},'辰':{de:['壬','癸','戊','己'],xiu:['丙','辛','甲','己']},
  '巳':{de:['庚','辛'],xiu:['乙','庚']},'酉':{de:['庚','辛'],xiu:['乙','庚']},'丑':{de:['庚','辛'],xiu:['乙','庚']},
  '亥':{de:['甲','乙'],xiu:['丁','壬']},'卯':{de:['甲','乙'],xiu:['丁','壬']},'未':{de:['甲','乙'],xiu:['丁','壬']},
}
const SAN_HE: Record<string,string[]> = {
  '申':['申','子','辰'],'子':['申','子','辰'],'辰':['申','子','辰'],
  '亥':['亥','卯','未'],'卯':['亥','卯','未'],'未':['亥','卯','未'],
  '寅':['寅','午','戌'],'午':['寅','午','戌'],'戌':['寅','午','戌'],
  '巳':['巳','酉','丑'],'酉':['巳','酉','丑'],'丑':['巳','酉','丑'],
}
function checkDeXiu(monthBranch: string, stems: Record<string,string>, branches: Record<string,string>): string[] {
  const e = DE_XIU[monthBranch]; if (!e) return []
  const sT = [...e.de, ...e.xiu]
  const bT = SAN_HE[monthBranch] ?? []
  return PILLAR_KEYS.filter(k=>sT.includes(stems[k])||bT.includes(branches[k]))
}

// ═══════════════════════════════════════
// 8. 国印贵人
// ═══════════════════════════════════════
const GUO_YIN: Record<string,string> = {
  '甲':'戌','乙':'亥','丙':'丑','丁':'寅','戊':'丑','己':'寅','庚':'辰','辛':'巳','壬':'未','癸':'申',
}
function checkGuoYin(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set([GUO_YIN[stems.day], GUO_YIN[stems.year]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 9. 金舆
// ═══════════════════════════════════════
const JIN_YU: Record<string,string> = {
  '甲':'辰','乙':'巳','丙':'未','丁':'申','戊':'未','己':'申','庚':'戌','辛':'亥','壬':'丑','癸':'寅',
}
function checkJinYu(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set([JIN_YU[stems.day], JIN_YU[stems.year]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 10. 羊刃 (当前代码版本：阴阳干各有刃)
// ═══════════════════════════════════════
const YANG_REN: Record<string,string> = {
  '甲':'卯','乙':'寅','丙':'午','丁':'未','戊':'午','己':'未','庚':'酉','辛':'申','壬':'子','癸':'亥',
}
function checkYangRen(dayStem: string, branches: Record<string,string>): string[] {
  const t = YANG_REN[dayStem]
  return t ? PILLAR_KEYS.filter(k=>branches[k]===t) : []
}

// ═══════════════════════════════════════
// 11. 孤鸾煞
// ═══════════════════════════════════════
const GU_LUAN = new Set(['甲寅','乙卯','丙午','丁巳','戊午','己巳','庚申','辛酉','壬子','癸亥'])
function checkGuLuan(dayCombo: string): boolean { return GU_LUAN.has(dayCombo) }

// ═══════════════════════════════════════
// 12. 寡宿
// ═══════════════════════════════════════
const GUA_SU: Record<string,string> = {
  '亥':'戌','子':'戌','丑':'戌','寅':'丑','卯':'丑','辰':'丑',
  '巳':'辰','午':'辰','未':'辰','申':'未','酉':'未','戌':'未',
}
function checkGuaSu(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([GUA_SU[yearBranch], GUA_SU[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 13. 劫煞 (当前：年支+日支)
// ═══════════════════════════════════════
const JIE_SHA: Record<string,string> = {
  '申':'巳','子':'巳','辰':'巳','亥':'申','卯':'申','未':'申',
  '寅':'亥','午':'亥','戌':'亥','巳':'寅','酉':'寅','丑':'寅',
}
function checkJieSha(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([JIE_SHA[yearBranch], JIE_SHA[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 14. 吊客 (当前：仅年支)
// ═══════════════════════════════════════
const DIAO_KE: Record<string,string> = {
  '子':'戌','丑':'亥','寅':'子','卯':'丑','辰':'寅','巳':'卯','午':'辰','未':'巳',
  '申':'午','酉':'未','戌':'申','亥':'酉',
}
function checkDiaoKe(yearBranch: string, branches: Record<string,string>): string[] {
  const t = DIAO_KE[yearBranch]
  return t ? PILLAR_KEYS.filter(k=>branches[k]===t) : []
}

// ═══════════════════════════════════════
// 15. 九丑
// ═══════════════════════════════════════
const JIU_CHOU = new Set(['戊子','戊午','壬子','壬午','丁酉','丁卯','己酉','己卯','辛酉','辛卯'])
function checkJiuChou(dayCombo: string): boolean { return JIU_CHOU.has(dayCombo) }

// ═══════════════════════════════════════
// 16. 童子煞 (当前：月支+日柱组合表)
// ═══════════════════════════════════════
const TONG_ZI: Record<string,string[]> = {
  '寅':['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '卯':['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '辰':['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '巳':['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '午':['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '未':['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '申':['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '酉':['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '戌':['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '亥':['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
  '子':['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
  '丑':['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
}
function checkTongZi(monthBranch: string, dayCombo: string): boolean {
  const c = TONG_ZI[monthBranch]
  return c ? c.includes(dayCombo) : false
}

// ═══════════════════════════════════════
// 17. 空亡 (当前：日柱定旬)
// ═══════════════════════════════════════
const KONG_WANG: Record<string,string[]> = {
  '甲子':['戌','亥'],'乙丑':['戌','亥'],'丙寅':['戌','亥'],'丁卯':['戌','亥'],
  '戊辰':['戌','亥'],'己巳':['戌','亥'],'庚午':['戌','亥'],'辛未':['戌','亥'],
  '壬申':['戌','亥'],'癸酉':['戌','亥'],
  '甲戌':['申','酉'],'乙亥':['申','酉'],'丙子':['申','酉'],'丁丑':['申','酉'],
  '戊寅':['申','酉'],'己卯':['申','酉'],'庚辰':['申','酉'],'辛巳':['申','酉'],
  '壬午':['申','酉'],'癸未':['申','酉'],
  '甲申':['午','未'],'乙酉':['午','未'],'丙戌':['午','未'],'丁亥':['午','未'],
  '戊子':['午','未'],'己丑':['午','未'],'庚寅':['午','未'],'辛卯':['午','未'],
  '壬辰':['午','未'],'癸巳':['午','未'],
  '甲午':['辰','巳'],'乙未':['辰','巳'],'丙申':['辰','巳'],'丁酉':['辰','巳'],
  '戊戌':['辰','巳'],'己亥':['辰','巳'],'庚子':['辰','巳'],'辛丑':['辰','巳'],
  '壬寅':['辰','巳'],'癸卯':['辰','巳'],
  '甲辰':['寅','卯'],'乙巳':['寅','卯'],'丙午':['寅','卯'],'丁未':['寅','卯'],
  '戊申':['寅','卯'],'己酉':['寅','卯'],'庚戌':['寅','卯'],'辛亥':['寅','卯'],
  '壬子':['寅','卯'],'癸丑':['寅','卯'],
  '甲寅':['子','丑'],'乙卯':['子','丑'],'丙辰':['子','丑'],'丁巳':['子','丑'],
  '戊午':['子','丑'],'己未':['子','丑'],'庚申':['子','丑'],'辛酉':['子','丑'],
  '壬戌':['子','丑'],'癸亥':['子','丑'],
}
function checkKongWang(dayCombo: string, branches: Record<string,string>): string[] {
  const t = KONG_WANG[dayCombo]; if (!t) return []
  return PILLAR_KEYS.filter(k=>k!=='day' && t.includes(branches[k]))
}

// ═══════════════════════════════════════
// 18. 孤辰 (当前：仅年支)
// ═══════════════════════════════════════
const GU_CHEN: Record<string,string> = {
  '亥':'寅','子':'寅','丑':'寅','寅':'巳','卯':'巳','辰':'巳',
  '巳':'申','午':'申','未':'申','申':'亥','酉':'亥','戌':'亥',
}
function checkGuChen(yearBranch: string, branches: Record<string,string>): string[] {
  const t = GU_CHEN[yearBranch]
  return t ? PILLAR_KEYS.filter(k=>k!=='year' && branches[k]===t) : []
}

// ═══════════════════════════════════════
// 19. 桃花 (当前：年支+日支)
// ═══════════════════════════════════════
const TAO_HUA: Record<string,string> = {
  '寅':'卯','午':'卯','戌':'卯','亥':'子','卯':'子','未':'子',
  '申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午',
}
function checkTaoHua(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([TAO_HUA[yearBranch], TAO_HUA[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 20. 驿马 (当前：年支+日支)
// ═══════════════════════════════════════
const YI_MA: Record<string,string> = {
  '寅':'申','午':'申','戌':'申','亥':'巳','卯':'巳','未':'巳',
  '申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥',
}
function checkYiMa(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([YI_MA[yearBranch], YI_MA[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 21. 华盖 (当前：年支+日支)
// ═══════════════════════════════════════
const HUA_GAI: Record<string,string> = {
  '寅':'戌','午':'戌','戌':'戌','亥':'未','卯':'未','未':'未',
  '申':'辰','子':'辰','辰':'辰','巳':'丑','酉':'丑','丑':'丑',
}
function checkHuaGai(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([HUA_GAI[yearBranch], HUA_GAI[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 22. 将星 (当前：年支+日支)
// ═══════════════════════════════════════
const JIANG_XING: Record<string,string> = {
  '申':'子','子':'子','辰':'子','亥':'卯','卯':'卯','未':'卯',
  '寅':'午','午':'午','戌':'午','巳':'酉','酉':'酉','丑':'酉',
}
function checkJiangXing(yearBranch: string, dayBranch: string, branches: Record<string,string>): string[] {
  const t = new Set([JIANG_XING[yearBranch], JIANG_XING[dayBranch]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 23. 红艳 (当前：日干+年干)
// ═══════════════════════════════════════
const HONG_YAN: Record<string,string> = {
  '甲':'午','乙':'申','丙':'寅','丁':'未','戊':'辰','己':'辰','庚':'戌','辛':'酉','壬':'子','癸':'申',
}
function checkHongYan(stems: Record<string,string>, branches: Record<string,string>): string[] {
  const t = new Set([HONG_YAN[stems.day], HONG_YAN[stems.year]].filter(Boolean))
  return PILLAR_KEYS.filter(k=>t.has(branches[k]))
}

// ═══════════════════════════════════════
// 24. 十灵
// ═══════════════════════════════════════
const SHI_LING = new Set(['甲辰','乙亥','丙辰','丁酉','戊午','庚午','庚戌','辛亥','壬寅','癸未','甲戌'])
function checkShiLing(dayCombo: string): boolean { return SHI_LING.has(dayCombo) }

// ═══════════════════════════════════════
// 25. 六秀
// ═══════════════════════════════════════
const LIU_XIU = new Set(['丙午','丁未','戊子','戊午','己丑','己未'])
function checkLiuXiu(dayCombo: string): boolean { return LIU_XIU.has(dayCombo) }

// ═══════════════════════════════════════
// 纳音表 (用于童子煞验证和天罗地网等)
// ═══════════════════════════════════════
const NA_YIN: Record<string,string> = {
  '甲子':'金','乙丑':'金','丙寅':'火','丁卯':'火','戊辰':'木','己巳':'木',
  '庚午':'土','辛未':'土','壬申':'金','癸酉':'金','甲戌':'火','乙亥':'火',
  '丙子':'水','丁丑':'水','戊寅':'土','己卯':'土','庚辰':'金','辛巳':'金',
  '壬午':'木','癸未':'木','甲申':'水','乙酉':'水','丙戌':'土','丁亥':'土',
  '戊子':'火','己丑':'火','庚寅':'木','辛卯':'木','壬辰':'水','癸巳':'水',
  '甲午':'金','乙未':'金','丙申':'火','丁酉':'火','戊戌':'木','己亥':'木',
  '庚子':'土','辛丑':'土','壬寅':'金','癸卯':'金','甲辰':'火','乙巳':'火',
  '丙午':'水','丁未':'水','戊申':'土','己酉':'土','庚戌':'金','辛亥':'金',
  '壬子':'木','癸丑':'木','甲寅':'水','乙卯':'水','丙辰':'土','丁巳':'土',
  '戊午':'火','己未':'火','庚申':'木','辛酉':'木','壬戌':'水','癸亥':'水',
}

// ═══════════════════════════════════════
// 诊断主逻辑
// ═══════════════════════════════════════

describe('shensha-full-diagnostic', () => {
  for (const chart of CHARTS) {
    it(chart.name, () => {
      const bazi = calculateBazi(chart.input)
      const p = bazi.pillars
      const stems = { year: p.year.stem, month: p.month.stem, day: bazi.dayMaster, hour: p.hour.stem }
      const branches = { year: p.year.branch, month: p.month.branch, day: p.day.branch, hour: p.hour.branch }
      const dayCombo = bazi.dayMaster + p.day.branch
      const yearCombo = p.year.stem + p.year.branch
      const allBr = Object.values(branches)
      const allSt = Object.values(stems)
      const nayin = NA_YIN[yearCombo] ?? '?'

      console.log(`\n${'═'.repeat(70)}`)
      console.log(`${chart.name}`)
      console.log(`${'═'.repeat(70)}`)
      console.log(`八字: ${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${bazi.dayMaster}${p.day.branch} ${p.hour.stem}${p.hour.branch}`)
      console.log(`日主: ${bazi.dayMaster}  月支: ${p.month.branch}  年支: ${p.year.branch}  日支: ${p.day.branch}`)
      console.log(`年柱纳音: ${nayin}  性别: ${chart.input.gender}`)

      // ── 当前25星输出 ──
      const actual = getAllShenSha(bazi)
      console.log(`\n── 当前引擎输出 (${actual.length}颗) ──`)
      for (const label of ['年柱','月柱','日柱','时柱']) {
        const stars = actual.filter(s=>s.pillar===label)
        console.log(`  ${label}: ${stars.map(s=>s.name).join(', ') || '(无)'}`)
      }

      // ── 独立验证25星，逐颗对比 ──
      console.log(`\n── 逐颗独立验证 ──`)

      interface Check { name: string; category: string; expected: string[]; actual: string[] }
      const checks: Check[] = []

      const toCN = (k: string) => PILLAR_LABEL[k] ?? k
      function addCheck(name: string, category: string, expected: string[]) {
        const act = actual.filter(s=>s.name===name).map(s=>s.pillar)
        checks.push({ name, category, expected: expected.map(toCN), act })
      }

      addCheck('天乙贵人', '贵人', checkTianYi(stems, branches))
      addCheck('天德贵人', '贵人', checkTianDe(p.month.branch, stems, branches))
      addCheck('月德贵人', '贵人', checkYueDe(p.month.branch, stems))
      addCheck('太极贵人', '贵人', checkTaiJi(stems, branches))
      addCheck('福星贵人', '贵人', checkFuXing(stems, branches))
      addCheck('文昌贵人', '贵人', checkWenChang(stems, branches))
      addCheck('德秀贵人', '贵人', checkDeXiu(p.month.branch, stems, branches))
      addCheck('国印贵人', '贵人', checkGuoYin(stems, branches))
      addCheck('金舆', '贵人', checkJinYu(stems, branches))
      addCheck('羊刃', '凶星', checkYangRen(bazi.dayMaster, branches))
      addCheck('孤鸾煞', '凶星', checkGuLuan(dayCombo) ? ['日柱'] : [])
      addCheck('寡宿', '凶星', checkGuaSu(p.year.branch, p.day.branch, branches))
      addCheck('劫煞', '凶星', checkJieSha(p.year.branch, p.day.branch, branches))
      addCheck('吊客', '凶星', checkDiaoKe(p.year.branch, branches))
      addCheck('九丑', '凶星', checkJiuChou(dayCombo) ? ['日柱'] : [])
      addCheck('童子煞', '凶星', checkTongZi(p.month.branch, dayCombo) ? ['日柱'] : [])
      addCheck('空亡', '凶星', checkKongWang(dayCombo, branches))
      addCheck('孤辰', '凶星', checkGuChen(p.year.branch, branches))
      addCheck('桃花', '泛星', checkTaoHua(p.year.branch, p.day.branch, branches))
      addCheck('驿马', '泛星', checkYiMa(p.year.branch, p.day.branch, branches))
      addCheck('华盖', '泛星', checkHuaGai(p.year.branch, p.day.branch, branches))
      addCheck('将星', '泛星', checkJiangXing(p.year.branch, p.day.branch, branches))
      addCheck('红艳', '泛星', checkHongYan(stems, branches))
      addCheck('十灵', '泛星', checkShiLing(dayCombo) ? ['日柱'] : [])
      addCheck('六秀', '泛星', checkLiuXiu(dayCombo) ? ['日柱'] : [])

      const mismatches: string[] = []
      const matches: string[] = []
      for (const c of checks) {
        const exp = c.expected.sort().join(',') || '(无)'
        const act = c.act.sort().join(',') || '(无)'
        if (exp !== act) {
          mismatches.push(`  ⚠️  ${c.name}: 期望[${exp}] ≠ 实际[${act}]`)
        } else {
          matches.push(`  ✓ ${c.name}: [${exp}]`)
        }
      }

      // 只输出不匹配的
      if (mismatches.length > 0) {
        console.log(`  ⚠️⚠️⚠️ 不一致 (${mismatches.length}颗):`)
        for (const m of mismatches) console.log(m)
      } else {
        console.log(`  ✅ 全部25颗一致`)
      }

      // 输出全部详情 (折叠)
      console.log(`\n── 全部25颗详情 ──`)
      for (const c of checks) {
        const exp = c.expected.sort().join(',') || '(无)'
        const status = c.expected.sort().join(',') === c.act.sort().join(',') ? '✓' : '⚠️'
        console.log(`  ${status} ${c.name}[${c.category}]: ${exp}`)
      }

      // ── 22颗缺失星，手工检查是否命中 ──
      console.log(`\n── 22颗缺失神煞（按规格书）命中检查 ──`)

      // 26. 天厨贵人
      const tianChu: Record<string,string> = {
        '甲':'巳','乙':'午','丙':'巳','丁':'午','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯',
      }
      const tcT = new Set([tianChu[stems.day], tianChu[stems.year]].filter(Boolean))
      const tcHit = PILLAR_KEYS.filter(k=>tcT.has(branches[k]))
      console.log(`  ${tcHit.length ? '✦':'─'} 天厨贵人: ${tcHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (${[...tcT].join(',')} vs ${allBr.join(',')})`)

      // 27-28. 学堂/词馆
      const xueTang: Record<string,string> = {
        '甲':'亥','乙':'午','丙':'寅','丁':'酉','戊':'寅','己':'酉','庚':'巳','辛':'子','壬':'申','癸':'卯',
      }
      const ciGuan: Record<string,string> = {
        '甲':'申','乙':'酉','丙':'亥','丁':'子','戊':'亥','己':'子','庚':'寅','辛':'卯','壬':'巳','癸':'午',
      }
      const xtT = new Set([xueTang[stems.day], xueTang[stems.year]].filter(Boolean))
      const cgT = new Set([ciGuan[stems.day], ciGuan[stems.year]].filter(Boolean))
      const xtHit = PILLAR_KEYS.filter(k=>xtT.has(branches[k]))
      const cgHit = PILLAR_KEYS.filter(k=>cgT.has(branches[k]))
      console.log(`  ${xtHit.length ? '✦':'─'} 学堂: ${xtHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)
      console.log(`  ${cgHit.length ? '✦':'─'} 词馆: ${cgHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 29. 禄神
      const luShen: Record<string,string> = {
        '甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子',
      }
      const lsT = new Set([luShen[stems.day], luShen[stems.year]].filter(Boolean))
      const lsHit = PILLAR_KEYS.filter(k=>lsT.has(branches[k]))
      console.log(`  ${lsHit.length ? '✦':'─'} 禄神: ${lsHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 30. 魁罡
      const kuiGang = new Set(['壬辰','庚戌','戊戌','庚辰'])
      const kgHit = kuiGang.has(dayCombo)
      console.log(`  ${kgHit ? '✦':'─'} 魁罡: ${kgHit ? '日柱' : '不命中'}`)

      // 31. 天赦
      const season = Math.floor(branchIndex(p.month.branch) / 3) // 0=春 1=夏 2=秋 3=冬
      const tianShe: Record<number,string> = { 0:'戊寅', 1:'甲午', 2:'戊申', 3:'甲子' }
      const tsHit = tianShe[season] === dayCombo
      console.log(`  ${tsHit ? '✦':'─'} 天赦: ${tsHit ? '日柱' : '不命中'}  (季节=${['春','夏','秋','冬'][season]}, 天赦日=${tianShe[season]}, 日柱=${dayCombo})`)

      // 32. 天罗地网
      const tlwCheck = (): string[] => {
        const r: string[] = []
        if (nayin === '火') {
          for (const k of PILLAR_KEYS) { if (branches[k]==='戌'||branches[k]==='亥') r.push(k) }
        } else if (nayin === '水' || nayin === '土') {
          for (const k of PILLAR_KEYS) { if (branches[k]==='辰'||branches[k]==='巳') r.push(k) }
        }
        return r
      }
      const tlwHit = tlwCheck()
      console.log(`  ${tlwHit.length ? '✦':'─'} 天罗地网: ${tlwHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年纳音=${nayin})`)

      // 33. 十恶大败
      const shiEBai = new Set(['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥'])
      const sebHit = shiEBai.has(dayCombo)
      console.log(`  ${sebHit ? '✦':'─'} 十恶大败: ${sebHit ? '日柱' : '不命中'}`)

      // 34. 三奇贵人
      const allStemsArr = [stems.year, stems.month, stems.day, stems.hour]
      const sanQiCheck = (): boolean => {
        for (let i=0; i<=1; i++) {
          const s = allStemsArr.slice(i,i+3).join('')
          if (s==='甲戊庚'||s==='壬癸辛'||s==='乙丙丁') return true
        }
        return false
      }
      const sqHit = sanQiCheck()
      console.log(`  ${sqHit ? '✦':'─'} 三奇贵人: ${sqHit ? '命中' : '不命中'}  (四柱干: ${allStemsArr.join('·')})`)

      // 35. 金神
      const jinShen = new Set(['癸酉','己巳','乙丑'])
      const jsHit = jinShen.has(p.hour.stem + p.hour.branch)
      console.log(`  ${jsHit ? '✦':'─'} 金神: ${jsHit ? '时柱' : '不命中'}`)

      // 36. 日德
      const riDe = new Set(['甲寅','戊辰','丙辰','庚辰','壬戌'])
      const rdHit = riDe.has(dayCombo)
      console.log(`  ${rdHit ? '✦':'─'} 日德: ${rdHit ? '日柱' : '不命中'}`)

      // 37. 天德合
      const tdhCheck = (): string[] => {
        const ts = TIAN_DE_STEM[p.month.branch]
        const tb = TIAN_DE_BRANCH[p.month.branch]
        const r: string[] = []
        if (ts) {
          const he = STEM_HE[ts]
          for (const k of PILLAR_KEYS) { if (stems[k]===he) r.push(k) }
        }
        if (tb) {
          const he = sixHe(tb)
          for (const k of PILLAR_KEYS) { if (branches[k]===he) r.push(k) }
        }
        return r
      }
      const tdhHit = tdhCheck()
      console.log(`  ${tdhHit.length ? '✦':'─'} 天德合: ${tdhHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 38. 月德合
      const ydhCheck = (): string[] => {
        const yd = YUE_DE[p.month.branch]; if (!yd) return []
        const he = STEM_HE[yd]; if (!he) return []
        return PILLAR_KEYS.filter(k=>stems[k]===he)
      }
      const ydhHit = ydhCheck()
      console.log(`  ${ydhHit.length ? '✦':'─'} 月德合: ${ydhHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 39. 亡神 (年支+日支+月支)
      const wangShen: Record<string,string> = {
        '申':'亥','子':'亥','辰':'亥','寅':'巳','午':'巳','戌':'巳',
        '巳':'申','酉':'申','丑':'申','亥':'寅','卯':'寅','未':'寅',
      }
      const wsT = new Set([wangShen[p.year.branch], wangShen[p.day.branch], wangShen[p.month.branch]].filter(Boolean))
      const wsHit = PILLAR_KEYS.filter(k=>wsT.has(branches[k]))
      console.log(`  ${wsHit.length ? '✦':'─'} 亡神: ${wsHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (查${[...wsT].join(',')})`)

      // 40. 灾煞
      const zaiSha: Record<string,string> = {
        '申':'午','子':'午','辰':'午','寅':'子','午':'子','戌':'子',
        '巳':'卯','酉':'卯','丑':'卯','亥':'酉','卯':'酉','未':'酉',
      }
      const zsT = new Set([zaiSha[p.year.branch], zaiSha[p.day.branch], zaiSha[p.month.branch]].filter(Boolean))
      const zsHit = PILLAR_KEYS.filter(k=>zsT.has(branches[k]))
      console.log(`  ${zsHit.length ? '✦':'─'} 灾煞: ${zsHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 41. 六厄
      const liuE: Record<string,string> = {
        '申':'卯','子':'卯','辰':'卯','寅':'酉','午':'酉','戌':'酉',
        '亥':'午','卯':'午','未':'午','巳':'子','酉':'子','丑':'子',
      }
      const leT = new Set([liuE[p.year.branch], liuE[p.day.branch], liuE[p.month.branch]].filter(Boolean))
      const leHit = PILLAR_KEYS.filter(k=>leT.has(branches[k]))
      console.log(`  ${leHit.length ? '✦':'─'} 六厄: ${leHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 42. 飞刃 (羊刃对冲，用经典禄前一位羊刃表)
      const yrClassic: Record<string,string> = {
        '甲':'卯','乙':'辰','丙':'午','丁':'未','戊':'午','己':'未','庚':'酉','辛':'戌','壬':'子','癸':'丑',
      }
      const yrT = new Set<string>()
      for (const s of [stems.day, stems.year]) {
        const yr = yrClassic[s]
        if (yr) yrT.add(sixClash(yr))
      }
      const feiRenHit = PILLAR_KEYS.filter(k=>yrT.has(branches[k]))
      console.log(`  ${feiRenHit.length ? '✦':'─'} 飞刃: ${feiRenHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (羊刃对冲: ${[...yrT].join(',')})`)

      // 43. 天医
      const tianYiBranch = BRANCH_ORDER[(branchIndex(p.month.branch) - 1 + 12) % 12]
      const tyHit = PILLAR_KEYS.filter(k=>branches[k]===tianYiBranch)
      console.log(`  ${tyHit.length ? '✦':'─'} 天医: ${tyHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (月${p.month.branch}→${tianYiBranch})`)

      // 44. 流霞
      const liuXia: Record<string,string> = {
        '甲':'酉','乙':'戌','丙':'未','丁':'申','戊':'巳','己':'午','庚':'辰','辛':'卯','壬':'亥','癸':'寅',
      }
      const lxT = new Set([liuXia[stems.day], liuXia[stems.year]].filter(Boolean))
      const lxHit = PILLAR_KEYS.filter(k=>lxT.has(branches[k]))
      console.log(`  ${lxHit.length ? '✦':'─'} 流霞: ${lxHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 45. 披麻 (年支逆三位)
      const piMa = BRANCH_ORDER[(branchIndex(p.year.branch) - 3 + 12) % 12]
      const pmHit = PILLAR_KEYS.filter(k=>branches[k]===piMa)
      console.log(`  ${pmHit.length ? '✦':'─'} 披麻: ${pmHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年${p.year.branch}→${piMa})`)

      // 46. 丧门 (年支顺二位)
      const sangMen = BRANCH_ORDER[(branchIndex(p.year.branch) + 2) % 12]
      const smHit = PILLAR_KEYS.filter(k=>branches[k]===sangMen)
      console.log(`  ${smHit.length ? '✦':'─'} 丧门: ${smHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年${p.year.branch}→${sangMen})`)

      // 47. 病符 (年支逆一位)
      const bingFu = BRANCH_ORDER[(branchIndex(p.year.branch) - 1 + 12) % 12]
      const bfHit = PILLAR_KEYS.filter(k=>branches[k]===bingFu)
      console.log(`  ${bfHit.length ? '✦':'─'} 病符: ${bfHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年${p.year.branch}→${bingFu})`)

      // 阴差阳错
      const yinYangChaCuo = new Set(['丙子','丁丑','戊寅','辛卯','壬辰','癸巳','丙午','丁未','戊申','辛酉','壬戌','癸亥'])
      const yyccHit = yinYangChaCuo.has(dayCombo)
      console.log(`  ${yyccHit ? '✦':'─'} 阴差阳错: ${yyccHit ? '日柱' : '不命中'}`)

      // 元辰
      const yuanChenCheck = (): string[] => {
        const isYang = ['甲','丙','戊','庚','壬'].includes(p.year.stem)
        const isMale = chart.input.gender === 'male'
        const yangNanYinNv = (isYang && isMale) || (!isYang && !isMale)
        const chong = sixClash(p.year.branch)
        const ycBr = yangNanYinNv
          ? BRANCH_ORDER[(branchIndex(chong) + 1) % 12]   // 阳男阴女: 冲后一
          : BRANCH_ORDER[(branchIndex(chong) - 1 + 12) % 12]  // 阴男阳女: 冲前一
        return PILLAR_KEYS.filter(k=>branches[k]===ycBr)
      }
      const ycHit = yuanChenCheck()
      console.log(`  ${ycHit.length ? '✦':'─'} 元辰(大耗): ${ycHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 勾绞
      const isYangNian = ['甲','丙','戊','庚','壬'].includes(p.year.stem)
      const isMale2 = chart.input.gender === 'male'
      const yangNanYinNv2 = (isYangNian && isMale2) || (!isYangNian && !isMale2)
      const gou = yangNanYinNv2
        ? BRANCH_ORDER[(branchIndex(p.year.branch) + 3) % 12]   // 阳男阴女: 命前三=勾
        : BRANCH_ORDER[(branchIndex(p.year.branch) - 3 + 12) % 12]
      const jiao = yangNanYinNv2
        ? BRANCH_ORDER[(branchIndex(p.year.branch) - 3 + 12) % 12]  // 阳男阴女: 命后三=绞
        : BRANCH_ORDER[(branchIndex(p.year.branch) + 3) % 12]
      const gouHit = PILLAR_KEYS.filter(k=>branches[k]===gou)
      const jiaoHit = PILLAR_KEYS.filter(k=>branches[k]===jiao)
      console.log(`  ${gouHit.length ? '✦':'─'} 勾: ${gouHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年${p.year.branch}→${gou})`)
      console.log(`  ${jiaoHit.length ? '✦':'─'} 绞: ${jiaoHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}  (年${p.year.branch}→${jiao})`)

      // 暗金的煞
      const anjinCheck = (): string[] => {
        const set = new Set(['子','午','卯','酉'])
        let target = ''
        if (set.has(p.year.branch)) target = '巳'
        else if (['寅','申','巳','亥'].includes(p.year.branch)) target = '酉'
        else target = '丑'
        return PILLAR_KEYS.filter(k=>branches[k]===target)
      }
      const ajHit = anjinCheck()
      console.log(`  ${ajHit.length ? '✦':'─'} 暗金的煞: ${ajHit.map(k=>PILLAR_LABEL[k]).join(',') || '不命中'}`)

      // 童子煞 - 传统正确查法（季节+纳音双重）
      const tongZiTraditional = (): boolean => {
        // 规则一：季节
        const mIdx = branchIndex(p.month.branch)
        const season2 = Math.floor(mIdx / 3) // 0春 1夏 2秋 3冬
        const dayHrBr = [p.day.branch, p.hour.branch]
        if (season2 === 0 || season2 === 2) { // 春秋 → 寅/子
          if (dayHrBr.includes('寅') || dayHrBr.includes('子')) return true
        } else { // 夏冬 → 卯/未/辰
          if (dayHrBr.includes('卯') || dayHrBr.includes('未') || dayHrBr.includes('辰')) return true
        }
        // 规则二：纳音
        if (nayin === '金' || nayin === '木') {
          if (dayHrBr.includes('午') || dayHrBr.includes('卯')) return true
        } else if (nayin === '水' || nayin === '火') {
          if (dayHrBr.includes('酉') || dayHrBr.includes('戌')) return true
        } else if (nayin === '土') {
          if (dayHrBr.includes('辰') || dayHrBr.includes('巳')) return true
        }
        return false
      }
      console.log(`  ${tongZiTraditional() ? '✦ 童子煞(传统法)' : '  童子煞(传统法)'}: ${tongZiTraditional() ? '命中(日支或时支)' : '不命中'}`)

      // 汇总
      const totalHits = [tcHit,xtHit,cgHit,lsHit,kgHit,tsHit,tlwHit.length>0,sebHit,sqHit,jsHit,rdHit,
        tdhHit.length>0,ydhHit.length>0,wsHit.length>0,zsHit.length>0,leHit.length>0,
        feiRenHit.length>0,tyHit.length>0,lxHit.length>0,pmHit.length>0,smHit.length>0,
        bfHit.length>0,yyccHit,ycHit.length>0,gouHit.length>0,jiaoHit.length>0,ajHit.length>0].filter(Boolean).length
      console.log(`\n  → 缺失22星中命中: ${totalHits} 颗`)
      console.log(`  → 当前25星命中: ${actual.length} 颗`)
      console.log(`  → 补齐后预计: ~${actual.length + totalHits} 颗`)
    })
  }
})

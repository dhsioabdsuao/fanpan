import { describe, it, expect } from 'vitest'
import { getLiuNianAnnotations } from '@/lib/bage/liunian'

describe('流年注解', () => {
  it('壬午 甲辰 戊午 己未：2003癸未 → 日柱天合地合', () => {
    const result = getLiuNianAnnotations({
      liuNianGanZhi: '癸未',
      daYunGanZhi: '壬午',
      yearGanZhi: '壬午',
      monthGanZhi: '甲辰',
      dayGanZhi: '戊午',
      hourGanZhi: '己未',
    })
    const tianHeDiHe = result.find((a) => a.type === '天合地合')
    expect(tianHeDiHe).toBeDefined()
    expect(tianHeDiHe!.label).toContain('日柱')
  })

  it('天克地冲检测：甲子 vs 庚午', () => {
    const result = getLiuNianAnnotations({
      liuNianGanZhi: '庚午',
      daYunGanZhi: '壬午',
      yearGanZhi: '壬午',
      monthGanZhi: '甲辰',
      dayGanZhi: '甲子',
      hourGanZhi: '己未',
    })
    const tianKeDiChong = result.find((a) => a.type === '天克地冲')
    expect(tianKeDiChong).toBeDefined()
  })

  it('伏吟检测：流年与年柱相同', () => {
    const result = getLiuNianAnnotations({
      liuNianGanZhi: '壬午',
      daYunGanZhi: '癸未',
      yearGanZhi: '壬午',
      monthGanZhi: '甲辰',
      dayGanZhi: '戊午',
      hourGanZhi: '己未',
    })
    const fuYin = result.find((a) => a.type === '伏吟')
    expect(fuYin).toBeDefined()
    expect(fuYin!.label).toContain('年柱')
  })

  it('岁运并临检测', () => {
    const result = getLiuNianAnnotations({
      liuNianGanZhi: '甲子',
      daYunGanZhi: '甲子',
      yearGanZhi: '壬午',
      monthGanZhi: '甲辰',
      dayGanZhi: '戊午',
      hourGanZhi: '己未',
    })
    const suiYun = result.find((a) => a.type === '岁运并临')
    expect(suiYun).toBeDefined()
  })

  it('普通年无注解', () => {
    const result = getLiuNianAnnotations({
      liuNianGanZhi: '丙寅',
      daYunGanZhi: '壬午',
      yearGanZhi: '壬午',
      monthGanZhi: '甲辰',
      dayGanZhi: '戊午',
      hourGanZhi: '己未',
    })
    expect(result).toHaveLength(0)
  })
})

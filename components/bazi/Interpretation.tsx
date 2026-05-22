import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BaziResult } from '@/types/bazi'
import { DAY_MASTER_INTERPRETATIONS } from '@/lib/interpretations/dayMaster'
import { analyzeElements } from '@/lib/interpretations/elementBalance'
import { TEN_GODS } from '@/lib/interpretations/tenGods'
import { ZODIAC_TRAITS } from '@/lib/interpretations/zodiac'

export function Interpretation({
  result,
  hideHour = false,
}: {
  result: BaziResult
  hideHour?: boolean
}) {
  const interpretation = DAY_MASTER_INTERPRETATIONS[result.dayMaster]
  const elementBalances = analyzeElements(result.elementCount)

  // 五行总结句
  const deficient = elementBalances.filter((e) => e.state === '缺失').map((e) => e.element)
  const excess = elementBalances.filter(
    (e) => e.state === '过旺' || e.state === '偏旺',
  ).map((e) => e.element)
  const allBalanced = elementBalances.every((e) => e.state === '平和' || e.state === '偏弱')

  const summaryParts: string[] = []
  if (deficient.length > 0) {
    summaryParts.push(`五行缺${deficient.join('、')}`)
  }
  if (excess.length > 0) {
    summaryParts.push(`五行以${excess.join('、')}为主`)
  }
  if (allBalanced && deficient.length === 0 && excess.length === 0) {
    summaryParts.push('五行较为均衡')
  }

  // 非平和状态的五行
  const nonBalanced = elementBalances.filter((e) => e.state !== '平和')

  return (
    <div className="space-y-6">
      {/* 命主分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">命主分析</CardTitle>
          <p className="text-sm text-muted-foreground">
            日主：{result.dayMaster} {interpretation?.element ?? result.dayMasterElement}{' '}
            {interpretation?.yinYang ?? ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {interpretation ? (
            <>
              <section>
                <h3 className="font-semibold text-base mb-1">性格特点</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {interpretation.personality}
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">优势特质</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {interpretation.strength}
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">需要注意</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {interpretation.weakness}
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">适合方向</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {interpretation.career}
                </p>
              </section>
            </>
          ) : (
            <p className="text-base leading-relaxed text-muted-foreground">
              该日主解读尚在编写中
            </p>
          )}
        </CardContent>
      </Card>

      {/* 五行格局 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">五行格局</CardTitle>
          <p className="text-sm text-muted-foreground">{summaryParts.join('，')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {nonBalanced.map((item) => (
            <section key={item.element}>
              <h3 className="font-semibold text-base mb-1">
                {item.element} — {item.state}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              {item.suggestion && (
                <p className="text-sm text-muted-foreground/70 mt-1">{item.suggestion}</p>
              )}
            </section>
          ))}
        </CardContent>
      </Card>

      {/* 十神组合 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">十神组合</CardTitle>
          <p className="text-sm text-muted-foreground">
            仅列天干十神，地支藏干十神因关系较杂此处略去
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            // 收集各柱天干十神，按十神去重合并
            const entries: { pillar: string; stem: string; tenGod: string }[] = [
              { pillar: '年', stem: result.pillars.year.stem, tenGod: result.tenGods.yearStem },
              { pillar: '月', stem: result.pillars.month.stem, tenGod: result.tenGods.monthStem },
            ]
            if (!hideHour) {
              entries.push({
                pillar: '时',
                stem: result.pillars.hour.stem,
                tenGod: result.tenGods.hourStem,
              })
            }

            const grouped = new Map<string, { pillar: string; stem: string }[]>()
            for (const e of entries) {
              const list = grouped.get(e.tenGod) ?? []
              list.push({ pillar: e.pillar, stem: e.stem })
              grouped.set(e.tenGod, list)
            }

            return Array.from(grouped).map(([tenGod, locations]) => {
              const pillarList = locations
                .map((l) => `${l.pillar}柱${l.stem}干`)
                .join('、')
              return (
                <section key={tenGod}>
                  <h3 className="font-semibold text-base mb-1">
                    {tenGod} — 出现在{pillarList}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {TEN_GODS[tenGod]?.description ?? '暂无解读'}
                  </p>
                </section>
              )
            })
          })()}
        </CardContent>
      </Card>

      {/* 生肖特征 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">生肖特征</CardTitle>
          <p className="text-sm text-muted-foreground">生肖：{result.zodiac}</p>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-muted-foreground">
            {ZODIAC_TRAITS[result.zodiac]?.description ?? '暂无解读'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

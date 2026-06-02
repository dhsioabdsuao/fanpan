import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BaziResult } from '@/types/bazi'
import { DAY_MASTER_INTERPRETATIONS } from '@/lib/interpretations/dayMaster'
import { ZODIAC_TRAITS } from '@/lib/interpretations/zodiac'

export function Interpretation({
  result,
}: {
  result: BaziResult
  hideHour?: boolean
}) {
  const interpretation = DAY_MASTER_INTERPRETATIONS[result.dayMaster]

  return (
    <div className="space-y-6">
      {/* 命主分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">日主</CardTitle>
          <p className="text-sm text-muted-foreground">
            {result.dayMaster} {interpretation?.element ?? result.dayMasterElement}{' '}
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

      {/* 生肖特征 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">生肖</CardTitle>
          <p className="text-sm text-muted-foreground">{result.zodiac}</p>
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BaziResult } from '@/types/bazi'
import { DAY_MASTER_INTERPRETATIONS } from '@/lib/interpretations/dayMaster'

export function Interpretation({
  result,
}: {
  result: BaziResult
}) {
  const interpretation = DAY_MASTER_INTERPRETATIONS[result.dayMaster]

  return (
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

        {/* TODO: 五行强弱分析 section */}
        {/* TODO: 十神格局 section */}
        {/* TODO: 大运流年 section */}
      </CardContent>
    </Card>
  )
}

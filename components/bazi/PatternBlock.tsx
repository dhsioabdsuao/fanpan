import type { BaziResult } from '@/types/bazi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { extractPattern, assessOutcome } from '@/lib/bage'

const OUTCOME_LABEL: Record<string, string> = {
  '成格': '成格',
  '不成格': '不成格',
  '破格': '破格',
}

export function PatternBlock({ result }: { result: BaziResult }) {
  const pattern = extractPattern(result)
  const ao = assessOutcome(result, pattern)

  const reasons = ao.reason
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">格局</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 格名 + 成败 */}
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-semibold">{pattern.displayName}</span>
          <span className="rounded-md bg-stone-100 px-2.5 py-0.5 text-sm text-stone-600">
            {OUTCOME_LABEL[ao.outcome]}
          </span>
        </div>

        {/* 用神 */}
        <div className="text-sm text-stone-600">
          <span className="text-stone-400">用神 </span>
          <span className="font-medium">{pattern.yongShen}</span>
          {pattern.luJieYongShenTenGod && (
            <span className="text-stone-400">（{pattern.luJieYongShenTenGod}）</span>
          )}
        </div>

        {/* 相神：仅成格时展示 */}
        {ao.xiangShen && (
          <div className="text-sm text-stone-600">
            <span className="text-stone-400">相神 </span>
            <span className="font-medium">{ao.xiangShen.god}</span>
            <span className="text-stone-400">（{ao.xiangShen.role}）</span>
          </div>
        )}

        {/* 格神 */}
        <div className="text-sm text-stone-500">
          <span className="text-stone-400">格神 </span>
          {pattern.patternGod}
        </div>

        {/* 判定依据 */}
        <div className="space-y-1">
          <span className="text-xs text-stone-400">判定依据</span>
          <ul className="space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-sm text-stone-600 flex gap-2">
                <span className="text-stone-300 shrink-0">—</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

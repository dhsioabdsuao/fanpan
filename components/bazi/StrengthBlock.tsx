import type { FullAnalysis } from '@/lib/bage/analyze'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LEVEL_LABEL: Record<string, string> = {
  '身强': '身强',
  '中和': '中和',
  '身弱': '身弱',
}

export function StrengthBlock({ full }: { full: FullAnalysis }) {
  const s = full.strength

  const reasons = s.reason
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">日主强弱</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 强弱结果 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-400">强弱</span>
          <span className="font-serif text-xl font-semibold">
            {LEVEL_LABEL[s.level]}
          </span>
        </div>

        {/* 三要素 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md bg-stone-50 px-3 py-2">
            <div className="text-xs text-stone-400">得令</div>
            <div className="text-sm font-medium text-stone-700">
              {s.deLing ? '是' : '否'}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {s.deLing ? '月令帮扶日主' : '月令克泄耗日主'}
            </div>
          </div>
          <div className="rounded-md bg-stone-50 px-3 py-2">
            <div className="text-xs text-stone-400">得地</div>
            <div className="text-sm font-medium text-stone-700">
              {s.deDi ? '有根' : '无根'}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {s.deDi ? '地支有日主同五行' : '地支无日主同五行'}
            </div>
          </div>
          <div className="rounded-md bg-stone-50 px-3 py-2">
            <div className="text-xs text-stone-400">得势</div>
            <div className="text-sm font-medium text-stone-700">{s.deShi}</div>
            <div className="text-xs text-stone-500 mt-0.5">全局帮扶与克泄对比</div>
          </div>
        </div>

        {/* 判定理由 */}
        <div className="space-y-1">
          <span className="text-xs text-stone-400">判定理由</span>
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

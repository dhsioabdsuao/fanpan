import type { BaziResult } from '@/types/bazi'
import type { ElementType } from '@/types/bazi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ELEMENT_ORDER: ElementType[] = ['金', '木', '水', '火', '土']

const ELEMENT_BG: Record<string, string> = {
  金: 'bg-yellow-600',
  木: 'bg-emerald-700',
  水: 'bg-blue-700',
  火: 'bg-red-600',
  土: 'bg-amber-700',
}

export function ElementChart({ result }: { result: BaziResult }) {
  const { elementCount } = result

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">五行分布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ELEMENT_ORDER.map((el) => (
          <div key={el} className="flex items-center gap-3">
            <span className="w-16 text-sm font-medium shrink-0">
              {el} {elementCount[el]}
            </span>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${ELEMENT_BG[el]}`}
                style={{ width: `${(elementCount[el] / 8) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

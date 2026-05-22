import type { BaziResult } from '@/types/bazi'
import { Card, CardContent } from '@/components/ui/card'

const ELEMENT_COLORS: Record<string, string> = {
  金: 'text-yellow-600',
  木: 'text-emerald-700',
  水: 'text-blue-700',
  火: 'text-red-600',
  土: 'text-amber-700',
}

function StemBranch({
  stem,
  branch,
  stemElement,
  branchElement,
  stemClass,
  branchClass,
}: {
  stem: string
  branch: string
  stemElement: string
  branchElement: string
  stemClass?: string
  branchClass?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`${stemClass ?? 'text-5xl md:text-5xl text-4xl'} font-serif leading-tight ${ELEMENT_COLORS[stemElement] ?? ''}`}>
        {stem}
      </span>
      <span className={`${branchClass ?? 'text-5xl md:text-5xl text-4xl'} font-serif leading-tight ${ELEMENT_COLORS[branchElement] ?? ''}`}>
        {branch}
      </span>
    </div>
  )
}

export function PillarTable({ result, hideHour }: { result: BaziResult; hideHour?: boolean }) {
  const { pillars, tenGods, naYin } = result

  const columns = [
    { key: 'year' as const, label: '年柱', pillar: pillars.year, tenGod: tenGods.yearStem, naYin: naYin.year, highlight: false },
    { key: 'month' as const, label: '月柱', pillar: pillars.month, tenGod: tenGods.monthStem, naYin: naYin.month, highlight: false },
    { key: 'day' as const, label: '日柱', pillar: pillars.day, tenGod: '日主', naYin: naYin.day, highlight: true },
    { key: 'hour' as const, label: '时柱', pillar: pillars.hour, tenGod: tenGods.hourStem, naYin: naYin.hour, highlight: false },
  ]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-2 text-center">
          {columns.map((col) => {
            const isHourHidden = hideHour && col.key === 'hour'

            return (
              <div
                key={col.key}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-2 ${col.highlight ? 'bg-yellow-50 ring-1 ring-yellow-200' : ''}`}
              >
                {/* Column title */}
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-muted-foreground">{col.label}</span>
                  {col.highlight && (
                    <span className="rounded bg-yellow-200 px-1 py-0.5 text-[10px] font-medium text-yellow-800">
                      日主
                    </span>
                  )}
                </div>

                {isHourHidden ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-6 text-muted-foreground">
                    <span className="text-sm">未知</span>
                  </div>
                ) : (
                  <>
                    {/* Ten god above stem */}
                    <span className="text-xs text-muted-foreground">{col.tenGod}</span>

                    {/* Stem and branch large */}
                    <StemBranch
                      stem={col.pillar.stem}
                      branch={col.pillar.branch}
                      stemElement={col.pillar.stemElement}
                      branchElement={col.pillar.branchElement}
                    />

                    {/* Hidden stems */}
                    <span className="text-xs text-muted-foreground">
                      {col.pillar.hiddenStems.join(' ')}
                    </span>

                    {/* NaYin */}
                    <span className="text-xs text-muted-foreground">{col.naYin}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

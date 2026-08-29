import type { FullAnalysis } from '@/lib/bage/analyze'

const CATEGORY_LABEL: Record<string, string> = {
  '贵人': '贵人星',
  '凶星': '凶星',
  '泛星': '泛星',
}

export function ShenShaBlock({ full }: { full: FullAnalysis }) {
  const shenSha = full.shenSha
  const groups = (['贵人', '凶星', '泛星'] as const)
    .map((cat) => ({
      cat,
      stars: shenSha.filter((s) => s.category === cat),
    }))
    .filter((g) => g.stars.length > 0)

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400 text-center">
        神煞为传统民俗标注,不参与格局、强弱、喜忌判定【诊断流程 L9】
      </p>
      {groups.map((g) => (
        <div key={g.cat}>
          <h4 className="text-xs font-semibold text-stone-700 mb-2">{CATEGORY_LABEL[g.cat]}</h4>
          <div className="flex flex-wrap gap-2">
            {g.stars.map((s) => (
              <span
                key={s.name + s.pillar}
                className="inline-flex items-center gap-1 rounded-lg bg-stone-50 border border-stone-200 px-2.5 py-1 text-xs text-stone-600"
                title={s.description}
              >
                {s.name}
                <span className="text-stone-400">{s.pillar}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
      {shenSha.length === 0 && (
        <p className="text-sm text-stone-400 text-center">命局无神煞入格</p>
      )}
    </div>
  )
}

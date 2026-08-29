import type { FullAnalysis } from '@/lib/bage/analyze'

const EL_LABEL: Record<string, { label: string; color: string }> = {
  '木': { label: '木', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  '火': { label: '火', color: 'text-red-700 bg-red-50 border-red-200' },
  '土': { label: '土', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  '金': { label: '金', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  '水': { label: '水', color: 'text-blue-700 bg-blue-50 border-blue-200' },
}

export function XiYongBlock({ full }: { full: FullAnalysis }) {
  const xi = full.xiYong

  return (
    <div className="space-y-4">
      {/* 喜用(有序) */}
      <div>
        <h4 className="text-xs font-semibold text-stone-700 mb-2">喜用五行(有序,第一为最喜)</h4>
        <div className="flex flex-wrap gap-2">
          {xi.favorable.map((el, i) => (
            <span
              key={el}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${EL_LABEL[el].color}`}
            >
              <span className="text-xs text-stone-400">{i + 1}.</span>
              {EL_LABEL[el].label}
              {el === xi.primaryFavorable && <span className="text-xs opacity-70">·最喜</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 忌神 */}
      <div>
        <h4 className="text-xs font-semibold text-stone-700 mb-2">忌神</h4>
        <div className="flex flex-wrap gap-2">
          {xi.avoid.length > 0 ? (
            xi.avoid.map((el) => (
              <span
                key={el}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-stone-50 border-stone-300 text-stone-600"
              >
                {EL_LABEL[el].label}
              </span>
            ))
          ) : (
            <span className="text-sm text-stone-400">无明确忌神</span>
          )}
        </div>
      </div>

      {/* 机制用神与格神 */}
      <div className="text-sm text-stone-600 space-y-1">
        <p>
          机制用神：<span className="font-medium text-stone-800">{xi.yongShenTenGod ?? '无'}</span>
          {xi.patternGodTenGod && (
            <span className="text-stone-400">　格神：{xi.patternGodTenGod}</span>
          )}
        </p>
        {xi.tongGuan && <p>通关：{EL_LABEL[xi.tongGuan].label}</p>}
      </div>

      {/* 冲突说明(喜忌规格书 2.5 统一裁决) */}
      {xi.conflicts.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-1">
          {xi.conflicts.map((c) => (
            <p key={c.element + c.role} className="text-xs text-stone-500 leading-relaxed">
              {c.note}
            </p>
          ))}
        </div>
      )}

      {/* 规则轨迹(判定依据) */}
      <details className="text-xs text-stone-400">
        <summary className="cursor-pointer select-none hover:text-stone-500">
          判定依据(规则轨迹,可对照《喜忌规格书》核验)
        </summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
          {xi.ruleTrace.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      </details>
    </div>
  )
}

'use client'

import type { FullAnalysis } from '@/lib/bage/analyze'

import type { CareerGuidance } from '@/lib/bage/careerGuidance'

const ELEMENT_COLORS: Record<string, string> = {
  '金': 'bg-amber-50 border-amber-200 text-amber-800',
  '木': 'bg-emerald-50 border-emerald-200 text-emerald-800',
  '水': 'bg-blue-50 border-blue-200 text-blue-800',
  '火': 'bg-red-50 border-red-200 text-red-800',
  '土': 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const ELEMENT_DOT: Record<string, string> = {
  '金': 'bg-amber-500',
  '木': 'bg-emerald-500',
  '水': 'bg-blue-500',
  '火': 'bg-red-500',
  '土': 'bg-yellow-600',
}

const TIER_LABEL: Record<string, { label: string; style: string }> = {
  primary: { label: '首选', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  secondary: { label: '次选', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  avoid: { label: '避开', style: 'bg-red-50 text-red-500 border-red-100' },
}

function CareerGuidanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-3/4 rounded bg-stone-100 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-1/2 rounded bg-stone-100 animate-pulse" />
        <div className="h-16 w-full rounded bg-stone-50 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-1/3 rounded bg-stone-100 animate-pulse" />
        <div className="h-16 w-full rounded bg-stone-50 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-1/3 rounded bg-stone-100 animate-pulse" />
        <div className="h-12 w-full rounded bg-stone-50 animate-pulse" />
      </div>
    </div>
  )
}

function CareerGuidanceError() {
  return (
    <p className="text-sm text-stone-400 text-center py-4">
      暂无法生成事业指引，请确认排盘信息完整
    </p>
  )
}

export function CareerGuidanceBlock({ full }: { full: FullAnalysis }) {
  let guidance: CareerGuidance
  try {
    guidance = full.texts.career
  } catch {
    return <CareerGuidanceError />
  }

  if (!guidance || guidance.industries.length === 0) {
    return <CareerGuidanceError />
  }

  return (
    <div className="space-y-5">
      {/* ── 命局概述 ── */}
      <p className="text-sm leading-relaxed text-stone-600">
        {guidance.summary}
      </p>

      {/* ── 适合从事的领域 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">🎯 适合从事的领域</h3>
        <div className="space-y-3">
          {guidance.industries.map((group) => (
            <div key={group.element}>
              <p className="text-xs text-stone-500 mb-1.5">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${ELEMENT_DOT[group.element] || 'bg-stone-400'}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── 发展方位 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">🧭 发展方位</h3>

        <div className="space-y-2 text-sm text-stone-600">
          <p>{guidance.directionPrimary}</p>
          {guidance.directionSecondary && (
            <p>{guidance.directionSecondary}</p>
          )}
          <p className="text-red-600/70">{guidance.directionAvoid}</p>
        </div>

        {/* ── 城市推荐 ── */}
        {guidance.cities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guidance.cities.map((city) => {
              const tier = TIER_LABEL[city.tier]
              return (
                <div
                  key={city.name}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${tier.style}`}
                  title={city.reason}
                >
                  {city.name}
                  <span className="opacity-60">·</span>
                  <span className="opacity-70">{tier.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 具体建议 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">💡 具体建议</h3>
        <ol className="space-y-3">
          {guidance.actionSuggestions.map((suggestion, i) => (
            <li key={i} className="flex gap-2 text-sm text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-400 shrink-0">{i + 1}.</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── 喜忌冲突说明(喜忌规格书 2.5 统一裁决) ── */}
      {guidance.conflictNotes.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-1">
          {guidance.conflictNotes.map((note, i) => (
            <p key={i} className="text-xs text-stone-500 leading-relaxed">
              注意：{note}
            </p>
          ))}
        </div>
      )}

      {/* ── 免责 ── */}
      <p className="text-xs text-stone-400 leading-relaxed pt-1 border-t border-stone-100">
        以上为命理参考，请结合自身实际情况、兴趣和资源做选择。
      </p>
    </div>
  )
}

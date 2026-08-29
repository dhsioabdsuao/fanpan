'use client'

import type { FullAnalysis } from '@/lib/bage/analyze'
import { getStemElement } from '@/lib/bazi-utils'

const ELEMENT_ADVICE: Record<string, string> = {
  '金': '技术/专业技能',
  '水': '学习/沟通',
  '木': '社交/人脉',
  '火': '展示/分享',
  '土': '稳固/储蓄',
}

const TYPE_LABEL: Record<string, { text: string; style: string }> = {
  '火炎土燥': {
    text: '命局偏燥(火炎土燥)',
    style: 'bg-red-50 text-red-800 border-red-200',
  },
  '金寒水冷': {
    text: '命局偏寒(金寒水冷)',
    style: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  '寒暖适中': {
    text: '命局寒暖适中',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
}

export function TiaoHouBlock({ full }: { full: FullAnalysis }) {
  const { tiaoHou, xiYong, pattern } = full
  const gods = tiaoHou.gods
  const label = TYPE_LABEL[tiaoHou.type]

  const isHuaCong = pattern.category.startsWith('化') || pattern.category.startsWith('从')

  /** 该天干元素在喜忌裁决中的结果 */
  const conflictOf = (stem: string) => {
    const el = getStemElement(stem)
    return xiYong.conflicts.find((c) => c.element === el) ?? null
  }

  return (
    <div className="space-y-4">
      {/* 气候类型标签(只标气候,救治方向见喜忌总览) */}
      <div className="text-center">
        <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-medium border ${label.style}`}>
          {label.text}
        </span>
      </div>

      {gods.length > 0 && (
        <>
          <p className="text-sm text-stone-500 text-center">
            根据《穷通宝鉴》，{full.bazi.dayMaster}日主生于{full.bazi.pillars.month.branch}月，调候用神为：
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {gods.map((stem) => {
              const el = getStemElement(stem)
              const conflict = conflictOf(stem)
              const isFav = xiYong.favorable.includes(el)
              return (
                <div
                  key={stem}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                    conflict ? 'bg-stone-50 border-stone-300' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <span className="text-lg font-serif font-bold text-stone-700">
                    {stem}
                  </span>
                  <span className="text-sm text-stone-500">
                    {el}
                  </span>
                  <span className="text-xs text-stone-400">
                    · {ELEMENT_ADVICE[el] || el}
                  </span>
                  {conflict && (
                    <span className={`text-xs rounded px-1.5 py-0.5 ${
                      conflict.resolution === '气候已足不需补' || conflict.resolution === '格局优先剔除'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {conflict.resolution === '气候已足不需补' ? '已足·不补'
                        : conflict.resolution === '格局优先剔除' ? '格局优先·不补'
                        : '保留'}
                    </span>
                  )}
                  {!conflict && isFav && (
                    <span className="text-xs rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5">
                      在喜用中
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {isHuaCong && (
            <p className="text-xs text-stone-500 text-center">
              {pattern.displayName}只论{pattern.category.startsWith('化') ? '化' : '从'},调候仅作参考标注,不参与喜忌排序。
            </p>
          )}

          {xiYong.conflicts.length > 0 && (
            <div className="text-xs text-stone-500 leading-relaxed rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-1">
              {xiYong.conflicts.map((c) => (
                <p key={c.element + c.role}>{c.note}</p>
              ))}
            </div>
          )}
        </>
      )}

      {gods.length === 0 && (
        <p className="text-sm text-stone-400 text-center">
          《穷通宝鉴》未收录此组合的调候用神
        </p>
      )}

      <div className="text-xs text-stone-400 leading-relaxed space-y-1">
        <p>
          调候用神是《穷通宝鉴》的核心方法论：根据日主天干和出生月份的气候特征，
          确定命局最需要的五行调节方向。调候侧重于命局的"寒暖燥湿"平衡，
          是喜用神判定中的补充维度。
        </p>
      </div>
    </div>
  )
}

'use client'

import type { BaziResult } from '@/types/bazi'
import { generateHealthGuidance } from '@/lib/bage/healthGuidance'
import type { HealthGuidance } from '@/lib/bage/healthGuidance'

const STATUS_STYLE: Record<string, string> = {
  '偏旺': 'text-amber-700',
  '偏弱': 'text-blue-700',
  '适中': 'text-emerald-700',
}

const STATUS_DOT: Record<string, string> = {
  '偏旺': 'bg-amber-500',
  '偏弱': 'bg-blue-500',
  '适中': 'bg-emerald-500',
}

function HealthGuidanceError() {
  return (
    <p className="text-sm text-stone-400 text-center py-4">
      暂无法生成体质倾向，请确认排盘信息完整
    </p>
  )
}

export function HealthGuidanceBlock({ result }: { result: BaziResult }) {
  let guidance: HealthGuidance
  try {
    guidance = generateHealthGuidance(result)
  } catch {
    return <HealthGuidanceError />
  }

  if (!guidance) {
    return <HealthGuidanceError />
  }

  // 按关注度排序：有问题的在前
  const sortedOrgans = [...guidance.organs].sort((a, b) => {
    const order = { '偏旺': 0, '偏弱': 1, '适中': 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-5">
      {/* ── 体质综述 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">体质综述</h3>
        <p className="text-sm leading-relaxed text-stone-600">
          {guidance.summary}
        </p>
      </div>

      {/* ── 重点关注的方面 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">重点关注的方面</h3>
        <ul className="space-y-2.5">
          {sortedOrgans.map((o) => (
            <li key={o.element} className="flex items-start gap-2 text-sm">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${STATUS_DOT[o.status]}`} />
              <span className="text-stone-600">
                <span className={`font-medium ${STATUS_STYLE[o.status]}`}>
                  {o.organ}
                  {o.status === '适中' ? '' : `（${o.status}）`}
                </span>
                <span className="text-stone-400"> — </span>
                {o.advice}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 养生建议 ── */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">养生建议</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3.5 py-3">
            <span className="text-xs font-medium text-stone-500">运动</span>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{guidance.wellness.exercise}</p>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3.5 py-3">
            <span className="text-xs font-medium text-stone-500">作息</span>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{guidance.wellness.rest}</p>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3.5 py-3">
            <span className="text-xs font-medium text-stone-500">饮食</span>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{guidance.wellness.diet}</p>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3.5 py-3">
            <span className="text-xs font-medium text-stone-500">季节</span>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{guidance.wellness.seasonal}</p>
          </div>
        </div>
      </div>

      {/* ── 免责 ── */}
      <p className="text-xs text-stone-400 leading-relaxed pt-1 border-t border-stone-100">
        此为中国传统体质养生参考，非医学诊断。身体不适应及时就医，请勿据此自行诊断或用药。
      </p>
    </div>
  )
}

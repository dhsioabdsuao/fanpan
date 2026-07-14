'use client'

import type { BaziResult } from '@/types/bazi'
import { getTiaoHouYongShen, getTiaoHouType } from '@/lib/bage/tiaoHou'
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
    text: '命局偏燥，需水调候',
    style: 'bg-red-50 text-red-800 border-red-200',
  },
  '金寒水冷': {
    text: '命局偏寒，需火调候',
    style: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  '寒暖适中': {
    text: '命局寒暖适中，无需特殊调候',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
}

export function TiaoHouBlock({ result }: { result: BaziResult }) {
  const type = getTiaoHouType(result)
  const gods = getTiaoHouYongShen(result.dayMaster, result.pillars.month.branch)
  const label = TYPE_LABEL[type]

  return (
    <div className="space-y-4">
      {/* 调候类型标签 */}
      <div className="text-center">
        <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-medium border ${label.style}`}>
          {label.text}
        </span>
      </div>

      {gods.length > 0 && (
        <>
          <p className="text-sm text-stone-500 text-center">
            根据《穷通宝鉴》，{result.dayMaster}日主生于{result.pillars.month.branch}月，调候用神为：
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {gods.map((stem) => {
              const el = getStemElement(stem)
              return (
                <div
                  key={stem}
                  className="flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200 px-4 py-2"
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
                </div>
              )
            })}
          </div>
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

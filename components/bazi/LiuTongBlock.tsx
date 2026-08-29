import type { FullAnalysis } from '@/lib/bage/analyze'

export function LiuTongBlock({ full }: { full: FullAnalysis }) {
  const lt = full.liuTong

  return (
    <div className="space-y-3">
      <div className="text-sm text-stone-600 leading-relaxed">
        <p>
          五行源头：<span className="font-medium text-stone-800">{lt.source}</span>
          {lt.blockage && (
            <>
              {'　'}淤堵点：<span className="font-medium text-red-700">{lt.blockage}</span>
            </>
          )}
          {lt.tongGuan && (
            <>
              {'　'}通关元素：<span className="font-medium text-emerald-700">{lt.tongGuan}</span>
            </>
          )}
        </p>
      </div>
      <p className="text-sm text-stone-500 leading-relaxed">{lt.description}</p>
    </div>
  )
}

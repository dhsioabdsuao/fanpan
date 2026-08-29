'use client'

import { useState } from 'react'
import type { DaYunData, LiuNianAnnotation } from '@/types/bazi'
import type { FullAnalysis } from '@/lib/bage/analyze'
import { Card, CardContent } from '@/components/ui/card'
import { getTenGod, getStemElement, getBranchElement } from '@/lib/bazi-utils'

const ELEMENT_COLORS: Record<string, string> = {
  金: 'text-yellow-600',
  木: 'text-emerald-700',
  水: 'text-blue-700',
  火: 'text-red-600',
  土: 'text-amber-700',
}

const ANNOTATION_STYLES: Record<string, string> = {
  '天合地合': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  '天克地冲': 'bg-red-100 text-red-800 border-red-300',
  '伏吟': 'bg-amber-100 text-amber-800 border-amber-300',
  '岁运并临': 'bg-orange-100 text-orange-800 border-orange-300',
}

const CURRENT_YEAR = new Date().getFullYear()

function currentDaYunIndex(decades: DaYunData[]): number {
  for (let i = decades.length - 1; i >= 0; i--) {
    if (CURRENT_YEAR >= decades[i].startYear) return i
  }
  return 0
}

function DaYunRow({
  dy,
  dayMaster,
  isCurrent,
  expanded,
  onToggle,
}: {
  dy: DaYunData
  dayMaster: string
  isCurrent: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const stem = dy.ganZhi[0]
  const branch = dy.ganZhi[1]
  const tenGod = getTenGod(dayMaster, stem)
  const stemEl = getStemElement(stem)
  const branchEl = getBranchElement(branch)

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b transition-colors hover:bg-stone-50 ${isCurrent ? 'bg-amber-50' : ''}`}
      >
        <td className="px-2 py-2 text-center text-xs text-muted-foreground">
          {dy.index + 1}
        </td>
        <td className="px-2 py-2 text-center text-xs">
          {dy.startAge}–{dy.endAge}岁
        </td>
        <td className="px-2 py-2 text-center text-xs text-muted-foreground">
          {dy.startYear}–{dy.endYear}
        </td>
        <td className="px-2 py-2 text-center font-serif text-sm">
          <span className={ELEMENT_COLORS[stemEl] ?? ''}>{stem}</span>
          <span className={ELEMENT_COLORS[branchEl] ?? ''}>{branch}</span>
        </td>
        <td className="px-2 py-2 text-center text-xs text-muted-foreground">{tenGod}</td>
        <td className="px-2 py-2 text-center text-xs text-muted-foreground">{dy.xunKong}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-stone-50 px-2 py-1">
            <div className="space-y-1">
              <div className="grid grid-cols-5 gap-x-1 gap-y-0.5 text-[10px]">
                {dy.liuNian.map((ln) => {
                  const lnStem = ln.ganZhi[0]
                  const lnBranch = ln.ganZhi[1]
                  const lnStemEl = getStemElement(lnStem)
                  const lnBranchEl = getBranchElement(lnBranch)
                  const isLiuNianCurrent = ln.year === CURRENT_YEAR
                  const hasNotes = ln.annotations.length > 0

                  return (
                    <div
                      key={ln.year}
                      className={`flex items-center justify-between rounded px-1 py-0.5 ${isLiuNianCurrent ? 'bg-amber-100 font-medium' : ''} ${hasNotes ? 'ring-1 ring-inset ring-yellow-400/50' : ''}`}
                      title={hasNotes ? ln.annotations.map((a) => a.label).join('；') : undefined}
                    >
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        {ln.year}
                        {hasNotes && (
                          <span className="inline-block size-1 rounded-full bg-red-400" />
                        )}
                      </span>
                      <span>
                        <span className={ELEMENT_COLORS[lnStemEl] ?? ''}>{lnStem}</span>
                        <span className={ELEMENT_COLORS[lnBranchEl] ?? ''}>{lnBranch}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Annotation details */}
              {dy.liuNian.some((ln) => ln.annotations.length > 0) && (
                <div className="space-y-0.5 border-t border-stone-200 pt-1">
                  {dy.liuNian
                    .filter((ln) => ln.annotations.length > 0)
                    .map((ln) =>
                      ln.annotations.map((a, i) => (
                        <div
                          key={`${ln.year}-${i}`}
                          className={`rounded border px-1.5 py-0.5 text-[10px] leading-relaxed ${ANNOTATION_STYLES[a.type] ?? 'bg-stone-100 text-stone-600 border-stone-300'}`}
                        >
                          <span className="font-medium">{ln.year}年 · {a.label}</span>
                          <span className="ml-1">{a.detail}</span>
                        </div>
                      )),
                    )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function DaYunTable({ full }: { full: FullAnalysis }) {
  const result = full.bazi
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!result.daYun) return null

  const { daYun } = result
  const currentIdx = currentDaYunIndex(daYun.decades)

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-3 text-center font-serif text-lg font-semibold">大运流年</h2>

        {/* 起运信息 */}
        <div className="mb-3 text-center text-xs text-muted-foreground">
          起运：{daYun.startSolar.year}年{daYun.startSolar.month}月{daYun.startSolar.day}日
          {' · '}
          {daYun.isForward ? '顺行' : '逆行'}
          {' · '}当前{currentIdx + 1}步大运
        </div>

        {/* 大运表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-2 py-1 font-medium">步</th>
                <th className="px-2 py-1 font-medium">年龄</th>
                <th className="px-2 py-1 font-medium">年份</th>
                <th className="px-2 py-1 font-medium">干支</th>
                <th className="px-2 py-1 font-medium">十神</th>
                <th className="px-2 py-1 font-medium">旬空</th>
              </tr>
            </thead>
            <tbody>
              {daYun.decades.map((dy) => (
                <DaYunRow
                  key={dy.index}
                  dy={dy}
                  dayMaster={result.dayMaster}
                  isCurrent={dy.index === currentIdx}
                  expanded={expandedIndex === dy.index}
                  onToggle={() =>
                    setExpandedIndex(expandedIndex === dy.index ? null : dy.index)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          点击大运行查看流年
        </p>
      </CardContent>
    </Card>
  )
}

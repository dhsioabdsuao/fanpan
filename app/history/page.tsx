'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  loadRecords,
  deleteRecord,
  clearRecords,
  historyParamsToQuery,
} from '@/lib/history-storage'
import type { SavedRecord } from '@/lib/history-storage'

export default function HistoryPage() {
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setRecords(loadRecords())
    setLoaded(true)
  }, [])

  const removeOne = (id: string) => {
    deleteRecord(id)
    setRecords(loadRecords())
  }

  const clearAll = () => {
    if (window.confirm('确定清空全部历史排盘吗?此操作不可恢复。')) {
      clearRecords()
      setRecords([])
    }
  }

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-white">
              <ArrowLeft className="mr-1 size-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-stone-700">历史排盘</h1>
          <div className="w-[92px]" />
        </div>

        <p className="text-center text-sm text-stone-500">
          最近 {records.length} / 20 条,同一出生时间只保留最新一次
        </p>

        {/* 列表 */}
        {records.length === 0 && loaded && (
          <Card className="border-stone-200">
            <CardContent className="py-16 text-center">
              <p className="font-serif text-lg text-stone-500">排过的命盘会在这里</p>
              <p className="mt-2 text-sm text-stone-400">
                回到首页输入出生信息,排盘后自动存入历史
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="mt-6">
                  去排盘
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="border-stone-200 overflow-hidden">
              <CardContent className="p-0">
                <Link href={`/result?${historyParamsToQuery(r.birthParams)}`} className="block">
                  <div className="flex items-center justify-between px-4 pt-4">
                    <span className="font-serif text-lg text-stone-700">{r.summary.baziBrief}</span>
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-800">
                      {r.summary.patternDisplay}·{r.summary.patternOutcome}
                    </span>
                  </div>
                  <div className="px-4 py-2 text-sm text-stone-500">
                    <p>日主 {r.summary.dayMaster} · {r.summary.patternResult}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      排盘于 {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </Link>
                <div className="flex justify-end border-t border-stone-100 px-3 py-1.5">
                  <button
                    onClick={() => removeOne(r.id)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 清空 */}
        {records.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={clearAll}
              className="text-xs text-stone-400 hover:text-red-600 transition-colors"
            >
              清空全部历史
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

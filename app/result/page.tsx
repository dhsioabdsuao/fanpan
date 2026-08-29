'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { parseSearchParams } from '@/lib/bazi-input-adapter'
import { calculateBazi } from '@/lib/bazi'
import { analyze } from '@/lib/bage/analyze'
import { PillarTable } from '@/components/bazi/PillarTable'
import { DaYunTable } from '@/components/bazi/DaYunTable'
import { BasicInfo } from '@/components/bazi/BasicInfo'
import { ElementChart } from '@/components/bazi/ElementChart'
import { DAY_MASTER_INTERPRETATIONS } from '@/lib/interpretations/dayMaster'
import { ZODIAC_TRAITS } from '@/lib/interpretations/zodiac'
import { PatternBlock } from '@/components/bazi/PatternBlock'
import { StrengthBlock } from '@/components/bazi/StrengthBlock'
import { AnalysisBlock } from '@/components/bazi/AnalysisBlock'
import { TiaoHouBlock } from '@/components/bazi/TiaoHouBlock'
import { CareerGuidanceBlock } from '@/components/bazi/CareerGuidanceBlock'
import { HealthGuidanceBlock } from '@/components/bazi/HealthGuidanceBlock'
import { XiYongBlock } from '@/components/bazi/XiYongBlock'
import { LiuTongBlock } from '@/components/bazi/LiuTongBlock'
import { ShenShaBlock } from '@/components/bazi/ShenShaBlock'
import { History } from 'lucide-react'
import { saveRecord } from '@/lib/history-storage'

function SkeletonResult() {
  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-9 w-32" />
          <div className="w-24" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6 space-y-4">
          <p className="text-destructive font-medium">{message}</p>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function Methodology() {
  const [open, setOpen] = useState(false)

  return (
    <Card className="border-stone-200">
      <CardContent className="pt-4 pb-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm text-stone-500">关于本站方法论</span>
          <ChevronDown
            className={`size-4 text-stone-500 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          className={`grid transition-all duration-200 ${
            open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="text-sm text-stone-500 leading-relaxed space-y-2">
              <p>
                本站的四柱八字、干支五行、藏干十神、纳音、真太阳时等排盘数据
                均由代码按传统子平派算法计算，每次结果一致。
              </p>
              <p>
                本站仅作命理参考，不预测具体事件，请勿据此做出重大人生决策。
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultContent() {
  const searchParams = useSearchParams()

  const input = parseSearchParams(searchParams)

  if (!input) {
    return <ErrorMessage message="参数有误" />
  }

  let result
  try {
    result = calculateBazi(input)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    return <ErrorMessage message={`排盘失败：${msg}`} />
  }

  // 【诊断流程】全页只算一次统一管线,所有卡片消费同一结果
  const full = useMemo(() => analyze(result), [result])

  // 自动保存历史(同参数去重,上限 20 条)
  useEffect(() => {
    try {
      saveRecord(
        {
          calendar: input.isLunar ? 'lunar' : 'solar',
          year: input.year,
          month: input.month,
          day: input.day,
          hour: input.hour,
          minute: input.minute,
          gender: input.gender,
          isLeapMonth: searchParams.get('isLeapMonth') ?? undefined,
          province: searchParams.get('province') ?? undefined,
          city: searchParams.get('city') ?? undefined,
          district: searchParams.get('district') ?? undefined,
        },
        {
          baziBrief: `${full.bazi.pillars.year.stem}${full.bazi.pillars.year.branch} ${full.bazi.pillars.month.stem}${full.bazi.pillars.month.branch} ${full.bazi.pillars.day.stem}${full.bazi.pillars.day.branch} ${full.bazi.pillars.hour.stem}${full.bazi.pillars.hour.branch}`,
          patternDisplay: full.pattern.displayName,
          patternOutcome: full.outcome.outcome,
          patternResult: full.outcome.reason.split(';')[0].trim(),
          dayMaster: full.bazi.dayMaster,
        },
      )
    } catch {
      // 静默失败,不影响排盘
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const noHour = searchParams.get('noHour')

  const [openId, setOpenId] = useState<string | null>(null)

  // 新排版(诊断流程.md 第二节):①命盘总览→⑬生肖
  const sections = [
    {
      id: 'zonglan',
      title: '命盘总览',
      render: () => (
        <div className="space-y-4">
          <BasicInfo full={full} />
          <ElementChart full={full} />
        </div>
      ),
    },
    { id: 'pattern', title: '格局定位', render: () => <PatternBlock full={full} /> },
    { id: 'strength', title: '日主强弱', render: () => <StrengthBlock full={full} /> },
    {
      id: 'outcome',
      title: '格局成败',
      render: () => {
        const conditions = full.outcome.conditions
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-stone-400">结论</span>
              <span className="font-medium text-stone-800">{full.outcome.outcome}</span>
              {full.outcome.xiangShen && (
                <span className="text-xs text-stone-500">
                  相神：{full.outcome.xiangShen.god}（{full.outcome.xiangShen.role}）
                </span>
              )}
              {full.outcome.tiaoHouSpecial && (
                <span className="text-xs rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">
                  {full.outcome.tiaoHouSpecial}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {conditions.map((c) => (
                <li key={c.label + c.desc} className="flex gap-2 text-sm text-stone-600">
                  <span className={c.met ? 'text-emerald-600' : 'text-red-500'}>
                    {c.met ? '✓' : '✗'}
                  </span>
                  <span>
                    <span className="font-medium">{c.label}</span>
                    <span className="text-stone-400"> — {c.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      },
    },
    { id: 'tiaoHou', title: '调候', render: () => <TiaoHouBlock full={full} /> },
    { id: 'liuTong', title: '五行流通', render: () => <LiuTongBlock full={full} /> },
    { id: 'xiyong', title: '喜忌总览', render: () => <XiYongBlock full={full} /> },
    { id: 'analysis', title: '综合解析', render: () => <AnalysisBlock full={full} /> },
    { id: 'dayun', title: '大运流年', render: () => <DaYunTable full={full} /> },
    { id: 'career', title: '事业指引', render: () => <CareerGuidanceBlock full={full} /> },
    { id: 'health', title: '体质倾向', render: () => <HealthGuidanceBlock full={full} /> },
    { id: 'shensha', title: '神煞(标注)', render: () => <ShenShaBlock full={full} /> },
    {
      id: 'daymaster',
      title: '日主解析',
      render: () => {
        const i = DAY_MASTER_INTERPRETATIONS[result.dayMaster]
        return i ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold">{result.dayMaster}</div>
              <div className="text-sm text-stone-500">{i.element} {i.yinYang}</div>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">性格特点</h3>
              <p className="text-base leading-relaxed text-stone-600">{i.personality}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">优势特质</h3>
              <p className="text-base leading-relaxed text-stone-600">{i.strength}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">需要注意</h3>
              <p className="text-base leading-relaxed text-stone-600">{i.weakness}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">适合方向</h3>
              <p className="text-base leading-relaxed text-stone-600">{i.career}</p>
            </div>
          </div>
        ) : (
          <p className="text-base text-stone-500">该日主解读尚在编写中</p>
        )
      },
    },
    {
      id: 'zodiac',
      title: '生肖特征',
      render: () => (
        <>
          <div className="text-center mb-4">
            <div className="text-2xl">{result.zodiac}</div>
          </div>
          <p className="text-base leading-relaxed text-stone-600">
            {ZODIAC_TRAITS[result.zodiac]?.description ?? '暂无解读'}
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-white">
              <ArrowLeft className="mr-1 size-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#aa9c82] drop-shadow-[0_0_20px_rgba(0,0,0,0.4)]">命盘</h1>
          <div className="w-[92px]" />
        </div>

        <PillarTable full={full} hideHour={noHour === '1'} />

        {/* ── 折叠面板区 ── */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = openId === section.id
            return (
              <Card key={section.id} className="border-stone-200 overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenId(isOpen ? null : section.id)}
                    className="flex w-full items-center justify-between py-3 px-4 text-left"
                  >
                    <span className={`text-sm font-medium ${isOpen ? 'text-amber-700' : 'text-stone-600'}`}>
                      {section.title}
                    </span>
                    <ChevronDown className={`size-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4">{section.render()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 历史排盘入口 */}
        <Link
          href="/history"
          className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50/60 px-5 py-3 text-sm text-stone-600 transition-colors hover:border-amber-300 hover:text-stone-700"
        >
          <History className="size-4 text-stone-400" />
          历史排盘
          <span className="text-xs text-stone-400">本次命盘已自动保存</span>
        </Link>

        <Methodology />

        {/* Disclaimer */}
        <Card className="bg-stone-100 border-stone-200">
          <CardContent className="py-10 text-center">
            <div className="text-sm leading-relaxed text-stone-600">
              <p>本站排盘基于子平派传统命理学，</p>
              <p>可见人生大致方向、性格特质、五行分布。</p>
            </div>
            <div className="my-6 font-serif text-2xl text-stone-500">
              知命而不认命，但行好事，莫问前程
            </div>
            <div className="text-sm text-stone-600">
              命运掌握在自己手中，请勿据此做出重大人生决策。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<SkeletonResult />}>
      <ResultContent />
    </Suspense>
  )
}

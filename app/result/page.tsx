'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { parseSearchParams } from '@/lib/bazi-input-adapter'
import { calculateBazi } from '@/lib/bazi'
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

  const noHour = searchParams.get('noHour')

  const [openId, setOpenId] = useState<string | null>(null)

  const sections = [
    { id: 'basic', title: '日主信息', render: () => <BasicInfo result={result} /> },
    { id: 'dayun', title: '大运流年', render: () => <DaYunTable result={result} /> },
    { id: 'pattern', title: '格局', render: () => <PatternBlock result={result} /> },
    { id: 'strength', title: '日主强弱', render: () => <StrengthBlock result={result} /> },
    { id: 'analysis', title: '格局解析', render: () => <AnalysisBlock result={result} /> },
    { id: 'element', title: '五行分布', render: () => <ElementChart result={result} /> },
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
    {
      id: 'tiaoHou',
      title: '调候用神',
      render: () => <TiaoHouBlock result={result} />,
    },
    {
      id: 'career',
      title: '事业指引',
      render: () => <CareerGuidanceBlock result={result} />,
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

        <PillarTable result={result} hideHour={noHour === '1'} />

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

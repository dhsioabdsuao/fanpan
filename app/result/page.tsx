'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { parseSearchParams } from '@/lib/bazi-input-adapter'
import { calculateBazi } from '@/lib/bazi'
import { PillarTable } from '@/components/bazi/PillarTable'
import { BasicInfo } from '@/components/bazi/BasicInfo'
import { ElementChart } from '@/components/bazi/ElementChart'

function SkeletonResult() {
  return (
    <div className="min-h-full bg-stone-50 px-4 py-12">
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
    <div className="flex min-h-full flex-col items-center justify-center bg-stone-50 px-4 py-20">
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

  return (
    <div className="min-h-full bg-stone-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold">命盘解析</h1>
          <div className="w-[92px]" />
        </div>

        <BasicInfo result={result} />
        <PillarTable result={result} hideHour={noHour === '1'} />
        <ElementChart result={result} />

        {/* Disclaimer */}
        <Card className="bg-stone-100 border-stone-200">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>本站排盘与解读基于传统命理学，</p>
            <p>仅供文化研究与娱乐参考。</p>
            <p>命运掌握在自己手中，请勿据此做出重大人生决策。</p>
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

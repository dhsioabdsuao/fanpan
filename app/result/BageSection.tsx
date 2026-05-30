'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

export interface BageDisplayData {
  patternName: string
  outcomeType: string
  patternReason: string
  outcomeReason: string
}

export function BageSection({ data }: { data: BageDisplayData }) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">格局</CardTitle>
        <p className="text-base text-stone-600 mt-1">
          {data.patternName} · {data.outcomeType}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 取格原因 */}
        <div className="text-sm text-stone-600 leading-relaxed">
          {data.patternReason}
        </div>

        {/* 成败原因 + 折叠 */}
        <div className="border-t pt-4">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm text-stone-400">成败原因</span>
            <ChevronDown
              className={`size-4 text-stone-400 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`grid transition-all duration-200 ${
              open
                ? 'grid-rows-[1fr] opacity-100 mt-3'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <p className="text-sm text-stone-600 leading-relaxed">
                {data.outcomeReason}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

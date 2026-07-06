import type { BaziResult } from '@/types/bazi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { extractPattern, assessOutcome } from '@/lib/bage'
import { generateAnalysis } from '@/lib/bage/generateAnalysis'
import { determineStrength } from '@/lib/strength/determineStrength'

export function AnalysisBlock({ result }: { result: BaziResult }) {
  const pattern = extractPattern(result)
  const outcome = assessOutcome(result, pattern)
  const strength = determineStrength(result)
  const { summary, analysis } = generateAnalysis({ bazi: result, pattern, outcome, strength })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">格局解析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 第一层：一句话总结 */}
        <div className="rounded-lg bg-amber-50/60 border border-amber-200 px-4 py-3">
          <p className="text-sm font-medium text-amber-900 leading-relaxed">{summary}</p>
        </div>

        {/* 第二层：专业解析 */}
        <div className="text-sm text-stone-600 leading-relaxed space-y-4">
          {analysis.split('\n\n').map((section, i) => {
            // Parse markdown-style **heading** into styled heading + body
            const match = section.match(/^\*\*(.+?)\*\*[：:]?\s*([\s\S]*)$/)
            if (match) {
              return (
                <div key={i}>
                  <h4 className="text-xs font-semibold text-stone-700 tracking-wide mb-1.5">
                    {match[1]}
                  </h4>
                  <p>{match[2]}</p>
                </div>
              )
            }
            return <p key={i}>{section}</p>
          })}
        </div>
      </CardContent>
    </Card>
  )
}

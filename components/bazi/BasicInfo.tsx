import type { BaziResult } from '@/types/bazi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatMinutesOffset,
  formatChineseSolarDatetime,
  formatDateHM,
} from '@/lib/format-time'

const GENDER_LABEL: Record<string, string> = { male: '男', female: '女' }

export function BasicInfo({ result }: { result: BaziResult }) {
  const adj = result.solarTimeAdjustment

  const solarDateMain = adj
    ? `${formatChineseSolarDatetime(adj.solarTime)} (真太阳时)`
    : result.solarDate

  const solarDateSub = adj
    ? `北京时间 ${formatDateHM(adj.standardTime)}，偏差 ${formatMinutesOffset(adj.totalOffsetMinutes)}`
    : '未做真太阳时换算 — 出生地未填写'

  const items = [
    { label: '农历生日', value: result.lunarDate },
    { label: '生肖', value: result.zodiac },
    { label: '命主', value: `${result.dayMaster} ${result.dayMasterElement}` },
    { label: '性别', value: GENDER_LABEL[result.inputInfo.gender] ?? result.inputInfo.gender },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {/* 公历生日 — 主行 + 真太阳时副行 */}
          <div className="sm:col-span-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground shrink-0">公历生日</span>
              <span className="font-medium">{solarDateMain}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{solarDateSub}</p>
          </div>

          {items.map((item) => (
            <div key={item.label} className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

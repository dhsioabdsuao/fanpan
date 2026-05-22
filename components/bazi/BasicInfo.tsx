import type { BaziResult } from '@/types/bazi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const GENDER_LABEL: Record<string, string> = { male: '男', female: '女' }

export function BasicInfo({ result }: { result: BaziResult }) {
  const items = [
    { label: '公历生日', value: result.solarDate },
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

import { z } from 'zod'
import type { BaziInput } from '@/types/bazi'
import type { BirthPlace } from '@/lib/solarTime/types'
import { lookupCoordinates } from '@/lib/solarTime/cityLookup'

const SearchParamsSchema = z.object({
  calendar: z.enum(['solar', 'lunar']),
  year: z.coerce.number().int().min(1900).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
  gender: z.enum(['male', 'female']),
  isLeapMonth: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
})

export function parseSearchParams(params: URLSearchParams): BaziInput | null {
  const raw: Record<string, string | number> = {}
  for (const key of [
    'calendar', 'year', 'month', 'day', 'hour', 'minute', 'gender', 'isLeapMonth',
    'province', 'city', 'district',
  ]) {
    const v = params.get(key)
    if (v !== null) raw[key] = v
  }

  const result = SearchParamsSchema.safeParse(raw)
  if (!result.success) return null

  const { calendar, year, month, day, hour, minute, gender, isLeapMonth, province, city, district } = result.data

  // 构造出生地：三个参数齐全且能在数据库中查到坐标时才生效
  let birthPlace: BirthPlace | undefined
  if (province && city && district) {
    const coords = lookupCoordinates(province, city, district)
    if (coords) {
      birthPlace = { province, city, district }
    }
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    gender,
    isLunar: calendar === 'lunar',
    isLeapMonth: isLeapMonth === '1' ? true : undefined,
    birthPlace,
  }
}

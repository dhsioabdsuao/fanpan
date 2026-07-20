import { z } from 'zod';
import type { BaziInput } from '@/types/bazi';
import type { BirthPlace } from '@/lib/solarTime/types';
import { lookupCoordinates } from '@/lib/solarTime/cityLookup';

const MobileInputSchema = z.object({
  calendar: z.enum(['solar', 'lunar']),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  gender: z.enum(['male', 'female']),
  isLeapMonth: z.boolean().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
});

export type MobileBaziInputParams = z.infer<typeof MobileInputSchema>;

export function buildBaziInput(params: MobileBaziInputParams): BaziInput | null {
  const result = MobileInputSchema.safeParse(params);
  if (!result.success) return null;

  const { calendar, year, month, day, hour, minute, gender, isLeapMonth, province, city, district } = result.data;

  let birthPlace: BirthPlace | undefined;
  if (province && city && district) {
    const coords = lookupCoordinates(province, city, district);
    if (coords) {
      birthPlace = { province, city, district };
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
    isLeapMonth: isLeapMonth ?? undefined,
    birthPlace,
  };
}

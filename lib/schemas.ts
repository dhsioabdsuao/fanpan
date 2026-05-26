import { z } from 'zod';

export const BirthFormSchema = z
  .object({
    calendar: z.enum(['solar', 'lunar']),
    year: z
      .number()
      .int('年份必须为整数')
      .min(1900, '年份需在1900-2100之间')
      .max(2100, '年份需在1900-2100之间')
      .optional(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    isLeapMonth: z.boolean(),
    timeMode: z.enum(['precise', 'shichen', 'unknown']),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    shichen: z.string().optional(),
    gender: z.enum(['male', 'female'], { message: '请选择性别' }),
  })
  .superRefine((data, ctx) => {
    if (data.year === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: '请输入年份',
      });
      return;
    }

    if (data.month === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['month'],
        message: '请选择月份',
      });
      return;
    }

    if (data.day === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['day'],
        message: '请选择日期',
      });
      return;
    }

    const daysInMonth = new Date(data.year, data.month, 0).getDate();
    if (data.day > daysInMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['day'],
        message: `${data.year}年${data.month}月只有${daysInMonth}天`,
      });
    }

    if (data.timeMode === 'precise') {
      if (data.hour === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hour'],
          message: '请输入小时',
        });
      }
      if (data.minute === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['minute'],
          message: '请输入分钟',
        });
      }
    }

    if (data.timeMode === 'shichen' && !data.shichen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shichen'],
        message: '请选择时辰',
      });
    }
  });

export type BirthFormData = z.infer<typeof BirthFormSchema>;

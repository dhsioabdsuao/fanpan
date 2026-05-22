'use client';

import { useForm, Controller, type Resolver } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { BirthFormSchema, type BirthFormData } from '@/lib/schemas';

const resolver: Resolver<BirthFormData> = async (values) => {
  const result = BirthFormSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  const fieldErrors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors: fieldErrors };
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SHICHEN_OPTIONS = [
  { value: '子', label: '子时(23:00-00:59)', hour: 0 },
  { value: '丑', label: '丑时(01:00-02:59)', hour: 2 },
  { value: '寅', label: '寅时(03:00-04:59)', hour: 4 },
  { value: '卯', label: '卯时(05:00-06:59)', hour: 6 },
  { value: '辰', label: '辰时(07:00-08:59)', hour: 8 },
  { value: '巳', label: '巳时(09:00-10:59)', hour: 10 },
  { value: '午', label: '午时(11:00-12:59)', hour: 12 },
  { value: '未', label: '未时(13:00-14:59)', hour: 14 },
  { value: '申', label: '申时(15:00-16:59)', hour: 16 },
  { value: '酉', label: '酉时(17:00-18:59)', hour: 18 },
  { value: '戌', label: '戌时(19:00-20:59)', hour: 20 },
  { value: '亥', label: '亥时(21:00-22:59)', hour: 22 },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function BirthForm() {
  const router = useRouter();

  const form = useForm<BirthFormData>({
    resolver,
    defaultValues: {
      calendar: 'solar',
      year: 1990,
      month: 1,
      day: 1,
      isLeapMonth: false,
      timeMode: 'precise',
      hour: 12,
      minute: 0,
      shichen: undefined,
      gender: 'male',
    },
  });

  const calendar = form.watch('calendar');
  const year = form.watch('year');
  const month = form.watch('month');
  const timeMode = form.watch('timeMode');
  const daysInMonth = getDaysInMonth(year ?? 1990, month ?? 1);

  function onSubmit(data: BirthFormData) {
    const params = new URLSearchParams();
    params.set('calendar', data.calendar);
    params.set('year', String(data.year));
    params.set('month', String(data.month));
    params.set('day', String(data.day));
    params.set('gender', data.gender);

    if (data.calendar === 'lunar') {
      params.set('isLeapMonth', data.isLeapMonth ? '1' : '0');
    }

    if (data.timeMode === 'precise') {
      params.set('hour', String(data.hour ?? 12));
      params.set('minute', String(data.minute ?? 0));
    } else if (data.timeMode === 'shichen') {
      const entry = SHICHEN_OPTIONS.find((s) => s.value === data.shichen);
      params.set('hour', String(entry?.hour ?? 12));
      params.set('minute', '0');
    } else {
      params.set('hour', '12');
      params.set('minute', '0');
      params.set('noHour', '1');
    }

    router.push(`/result?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">输入您的出生信息</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Calendar type */}
          <div className="md:col-span-2">
            <Label className="mb-2 block">日历类型</Label>
            <Controller
              control={form.control}
              name="calendar"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={(v) => field.onChange(v as 'solar' | 'lunar')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="solar" className="flex-1">公历</TabsTrigger>
                    <TabsTrigger value="lunar" className="flex-1">农历</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>

          {/* Year */}
          <div>
            <Label htmlFor="year">年份</Label>
            <Controller
              control={form.control}
              name="year"
              render={({ field }) => (
                <Input
                  id="year"
                  type="number"
                  className="mt-1.5"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 1990)}
                  onBlur={field.onBlur}
                />
              )}
            />
            {form.formState.errors.year && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.year.message}</p>
            )}
          </div>

          {/* Month */}
          <div>
            <Label>月份</Label>
            <Controller
              control={form.control}
              name="month"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.month && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.month.message}</p>
            )}
          </div>

          {/* Day */}
          <div>
            <Label>日期</Label>
            <Controller
              control={form.control}
              name="day"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="选择日期" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}日
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.day && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.day.message}</p>
            )}
          </div>

          {/* Leap month checkbox (lunar only) */}
          {calendar === 'lunar' && (
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Controller
                  control={form.control}
                  name="isLeapMonth"
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="size-4 rounded border-input accent-primary"
                    />
                  )}
                />
                <span className="text-sm">闰月</span>
              </label>
            </div>
          )}

          {/* Time mode radio group */}
          <div className="md:col-span-2">
            <Label className="mb-2 block">出生时间</Label>
            <Controller
              control={form.control}
              name="timeMode"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as 'precise' | 'shichen' | 'unknown')}
                  className="flex flex-wrap gap-6"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="precise" />
                    <span className="text-sm">知道具体时间</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="shichen" />
                    <span className="text-sm">只知道时辰</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="unknown" />
                    <span className="text-sm">不知道时辰</span>
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          {/* Conditional time inputs */}
          {timeMode === 'precise' && (
            <>
              <div>
                <Label htmlFor="hour">小时 (0-23)</Label>
                <Controller
                  control={form.control}
                  name="hour"
                  render={({ field }) => (
                    <Input
                      id="hour"
                      type="number"
                      min={0}
                      max={23}
                      className="mt-1.5"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {form.formState.errors.hour && (
                  <p className="mt-1 text-sm text-destructive">{form.formState.errors.hour.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="minute">分钟 (0-59)</Label>
                <Controller
                  control={form.control}
                  name="minute"
                  render={({ field }) => (
                    <Input
                      id="minute"
                      type="number"
                      min={0}
                      max={59}
                      className="mt-1.5"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {form.formState.errors.minute && (
                  <p className="mt-1 text-sm text-destructive">{form.formState.errors.minute.message}</p>
                )}
              </div>
            </>
          )}

          {timeMode === 'shichen' && (
            <div className="md:col-span-2">
              <Label>时辰</Label>
              <Controller
                control={form.control}
                name="shichen"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="选择时辰" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHICHEN_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.shichen && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.shichen.message}</p>
              )}
            </div>
          )}

          {timeMode === 'unknown' && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">时柱将不计算，影响精度</p>
            </div>
          )}

          {/* Gender */}
          <div className="md:col-span-2">
            <Label className="mb-2 block">性别</Label>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as 'male' | 'female')}
                  className="flex gap-6"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="male" />
                    <span className="text-sm">男</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="female" />
                    <span className="text-sm">女</span>
                  </label>
                </RadioGroup>
              )}
            />
            {form.formState.errors.gender && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.gender.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              开始排盘
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-muted-foreground">本站内容仅供娱乐参考</p>
      </CardFooter>
    </Card>
  );
}

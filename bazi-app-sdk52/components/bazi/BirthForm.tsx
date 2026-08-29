import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BirthFormSchema, type BirthFormData } from '@/lib/schemas';
import type { BaziInput } from '@/types/bazi';
import type { BirthPlace } from '@/lib/solarTime/types';
import {
  getAllProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
  lookupCoordinates,
} from '@/lib/solarTime/cityLookup';

import type { RootStackParamList } from '../../navigation/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SegmentedControl from '../ui/SegmentedControl';
import RadioButton from '../ui/RadioButton';
import PickerModal from '../ui/PickerModal';
import SearchablePicker from '../ui/SearchablePicker';
import Checkbox from '../ui/Checkbox';
import { FontSize, FontWeight, Spacing, FONT_SERIF } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

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

export default function BirthForm() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const form = useForm<BirthFormData>({
    resolver,
    defaultValues: {
      calendar: 'solar',
      year: undefined,
      month: undefined,
      day: undefined,
      isLeapMonth: false,
      timeMode: 'precise',
      hour: undefined,
      minute: undefined,
      shichen: undefined,
      gender: 'male',
    },
  });

  const calendar = form.watch('calendar');
  const year = form.watch('year');
  const month = form.watch('month');
  const timeMode = form.watch('timeMode');
  const daysInMonth = year && month ? getDaysInMonth(year, month) : 31;

  // ── 出生地三级联动 ──
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  const provinceOptions = getAllProvinces();
  const cityOptions = province ? getCitiesByProvince(province) : [];
  const districtOptions = province && city ? getDistrictsByCity(province, city) : [];

  const isLocationValid = !!province && !!city && !!district;
  const canSubmit = timeMode !== 'precise' || isLocationValid;

  function handleProvinceChange(value: string) {
    setProvince(value);
    setCity('');
    setDistrict('');
  }

  function handleCityChange(value: string) {
    setCity(value);
    setDistrict('');
  }

  function buildBaziInput(data: BirthFormData): BaziInput {
    let hour: number;
    let minute: number;

    if (data.timeMode === 'precise') {
      hour = data.hour ?? 12;
      minute = data.minute ?? 0;
    } else if (data.timeMode === 'shichen') {
      const entry = SHICHEN_OPTIONS.find((s) => s.value === data.shichen);
      hour = entry?.hour ?? 12;
      minute = 0;
    } else {
      hour = 12;
      minute = 0;
    }

    let birthPlace: BirthPlace | undefined;
    if (province && city && district) {
      const coords = lookupCoordinates(province, city, district);
      if (coords) {
        birthPlace = { province, city, district };
      }
    }

    return {
      year: data.year!,
      month: data.month!,
      day: data.day!,
      hour,
      minute,
      gender: data.gender,
      isLunar: data.calendar === 'lunar',
      isLeapMonth: data.isLeapMonth || undefined,
      birthPlace,
    };
  }

  function onSubmit(data: BirthFormData) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const noHour = data.timeMode === 'unknown';

    const params = {
      calendar: data.calendar,
      year: data.year!,
      month: data.month!,
      day: data.day!,
      hour: data.timeMode === 'precise' ? (data.hour ?? 12) : data.timeMode === 'shichen' ? (SHICHEN_OPTIONS.find((s) => s.value === data.shichen)?.hour ?? 12) : 12,
      minute: data.timeMode === 'precise' ? (data.minute ?? 0) : 0,
      gender: data.gender,
      isLeapMonth: data.calendar === 'lunar' ? data.isLeapMonth : undefined,
      province: province || undefined,
      city: city || undefined,
      district: district || undefined,
    };

    navigation.navigate('Result', params);
  }

  // Build month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}月`,
  }));

  // Build day options
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}日`,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>输入您的出生信息</Text>

      <View style={styles.formContent}>
        {/* Calendar type */}
        <View style={styles.field}>
          <Text style={styles.label}>日历类型</Text>
          <Controller
            control={form.control}
            name="calendar"
            render={({ field }) => (
              <SegmentedControl
                options={[
                  { value: 'solar', label: '公历' },
                  { value: 'lunar', label: '农历' },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(v as 'solar' | 'lunar')}
              />
            )}
          />
        </View>

        {/* Year */}
        <View style={styles.field}>
          <Text style={styles.label}>年份</Text>
          <Controller
            control={form.control}
            name="year"
            render={({ field }) => (
              <Input
                keyboardType="number-pad"
                placeholder="例如 2002"
                value={field.value ? String(field.value) : ''}
                onChangeText={(text) => {
                  const raw = text.replace(/\D/g, '');
                  field.onChange(raw === '' ? undefined : Number(raw));
                }}
              />
            )}
          />
          {form.formState.errors.year && (
            <Text style={styles.error}>{form.formState.errors.year.message}</Text>
          )}
        </View>

        {/* Month & Day row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>月份</Text>
            <Controller
              control={form.control}
              name="month"
              render={({ field }) => (
                <PickerModal
                  options={monthOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(v) => field.onChange(Number(v))}
                  placeholder="选择月份"
                />
              )}
            />
            {form.formState.errors.month && (
              <Text style={styles.error}>{form.formState.errors.month.message}</Text>
            )}
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>日期</Text>
            <Controller
              control={form.control}
              name="day"
              render={({ field }) => (
                <PickerModal
                  options={dayOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(v) => field.onChange(Number(v))}
                  placeholder="选择日期"
                />
              )}
            />
            {form.formState.errors.day && (
              <Text style={styles.error}>{form.formState.errors.day.message}</Text>
            )}
          </View>
        </View>

        {/* Leap month checkbox (lunar only) */}
        {calendar === 'lunar' && (
          <View style={styles.field}>
            <Controller
              control={form.control}
              name="isLeapMonth"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  label="闰月"
                />
              )}
            />
          </View>
        )}

        {/* Time mode */}
        <View style={styles.field}>
          <Text style={styles.label}>出生时间</Text>
          <Controller
            control={form.control}
            name="timeMode"
            render={({ field }) => (
              <RadioButton
                options={[
                  { value: 'precise', label: '知道具体时间' },
                  { value: 'shichen', label: '只知道时辰' },
                  { value: 'unknown', label: '不知道时辰' },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(v as 'precise' | 'shichen' | 'unknown')}
              />
            )}
          />
        </View>

        {/* Conditional time inputs */}
        {timeMode === 'precise' && (
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>小时 (0-23)</Text>
              <Controller
                control={form.control}
                name="hour"
                render={({ field }) => (
                  <Input
                    keyboardType="number-pad"
                    placeholder="0-23"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChangeText={(text) => {
                      const raw = text.replace(/\D/g, '');
                      field.onChange(raw === '' ? undefined : Number(raw));
                    }}
                  />
                )}
              />
              {form.formState.errors.hour && (
                <Text style={styles.error}>{form.formState.errors.hour.message}</Text>
              )}
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>分钟 (0-59)</Text>
              <Controller
                control={form.control}
                name="minute"
                render={({ field }) => (
                  <Input
                    keyboardType="number-pad"
                    placeholder="0-59"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChangeText={(text) => {
                      const raw = text.replace(/\D/g, '');
                      field.onChange(raw === '' ? undefined : Number(raw));
                    }}
                  />
                )}
              />
              {form.formState.errors.minute && (
                <Text style={styles.error}>{form.formState.errors.minute.message}</Text>
              )}
            </View>
          </View>
        )}

        {timeMode === 'shichen' && (
          <View style={styles.field}>
            <Text style={styles.label}>时辰</Text>
            <Controller
              control={form.control}
              name="shichen"
              render={({ field }) => (
                <PickerModal
                  options={SHICHEN_OPTIONS}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="选择时辰"
                />
              )}
            />
            {form.formState.errors.shichen && (
              <Text style={styles.error}>{form.formState.errors.shichen.message}</Text>
            )}
          </View>
        )}

        {timeMode === 'unknown' && (
          <Text style={styles.hint}>时柱将不计算，影响精度</Text>
        )}

        {/* Birth location */}
        <View style={styles.divider}>
          <Text style={styles.label}>
            {timeMode === 'precise' ? '出生地（必填）' : '出生地（选填）'}
          </Text>
          <Text style={styles.hint}>
            {timeMode === 'precise'
              ? '精确时辰需要真太阳时换算'
              : timeMode === 'shichen'
                ? '此模式时辰粒度大，真太阳时影响较小'
                : '此模式不使用真太阳时'}
          </Text>

          <View style={styles.locationRow}>
            <View style={styles.thirdField}>
              <Text style={styles.sublabel}>省份</Text>
              <SearchablePicker
                options={provinceOptions}
                value={province}
                onChange={handleProvinceChange}
                placeholder="选择省份"
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.sublabel}>城市</Text>
              <SearchablePicker
                options={cityOptions}
                value={city}
                onChange={handleCityChange}
                placeholder={province ? '选择城市' : '请先选省份'}
                disabled={!province}
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.sublabel}>区县</Text>
              <SearchablePicker
                options={districtOptions}
                value={district}
                onChange={setDistrict}
                placeholder={city ? '选择区县' : '请先选城市'}
                disabled={!city}
              />
            </View>
          </View>

          {!canSubmit && (
            <Text style={styles.error}>请填写出生地（精确时辰模式必填）</Text>
          )}
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>性别</Text>
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <RadioButton
                options={[
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(v as 'male' | 'female')}
              />
            )}
          />
          {form.formState.errors.gender && (
            <Text style={styles.error}>{form.formState.errors.gender.message}</Text>
          )}
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Button
            variant="seal"
            title={form.formState.isSubmitting ? '排盘中...' : '开始排盘'}
            onPress={form.handleSubmit(onSubmit)}
            disabled={!canSubmit || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>本站内容仅供娱乐参考</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginTop: Spacing.xl,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
    gap: Spacing.xs,
  },
  thirdField: {
    flex: 1,
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: colors.textPrimary,
  },
  sublabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: colors.textSecondary,
  },
  error: {
    fontSize: FontSize.sm,
    color: colors.destructive,
    marginTop: 2,
  },
  hint: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  submitContainer: {
    paddingTop: Spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
});

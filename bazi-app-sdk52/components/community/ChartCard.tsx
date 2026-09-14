// 帖子内嵌命盘卡:从 PostDTO.draft(云上脱敏数据)渲染,
// 视觉沿用 PillarTable 的玻璃外框 + 金色双细线内框 + 日主金底高亮。
// 不依赖 FullAnalysis —— 帖子数据里没有出生原始信息,由构造保证脱敏。
//
// 区块:四柱(天干十神+纳音)→ 神煞 → 副星(藏干十神)→ 大运流年(showDaYun)。
// 副星十神由 dayMaster + 藏干本地推导(getTenGod),流年由 60 甲子本地
// 展开(community/dayunExpand),均不改 PostDraft 白名单、不加云端字段。
import { StyleSheet, View, Text } from 'react-native';
import { useMemo } from 'react';
import GlassCard from '../ui/GlassCard';
import { FontSize, FontWeight, Spacing, FONT_SERIF, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { ELEMENT_COLORS } from '@/lib/theme-tokens';
import { getTenGod } from '@/lib/bazi-utils';
import { buildDaYunTableData } from '@/community/dayunExpand';
import DaYunTable from '../bazi/DaYunTable';
import type { PostDraft } from '@/community';

interface Props {
  draft: PostDraft;
  /** 卡片流里隐藏时柱(详情页显示全四柱) */
  hideHour?: boolean;
  /** 底部附大运流年区块(详情/发布预览) */
  showDaYun?: boolean;
}

export default function ChartCard({ draft, hideHour, showDaYun }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const columns = [
    { key: 'year' as const, label: '年柱', pillar: draft.pillars.year, highlight: false },
    { key: 'month' as const, label: '月柱', pillar: draft.pillars.month, highlight: false },
    { key: 'day' as const, label: '日柱', pillar: draft.pillars.day, highlight: true },
    { key: 'hour' as const, label: '时柱', pillar: draft.pillars.hour, highlight: false },
  ];

  const shenshaPillars: { key: 'year' | 'month' | 'day' | 'hour'; label: string }[] = [
    { key: 'year', label: '年柱' },
    { key: 'month', label: '月柱' },
    { key: 'day', label: '日柱' },
    { key: 'hour', label: '时柱' },
  ];

  // 大运流年(由脱敏草稿本地展开,渲染与结果页同一个 DaYunTable)
  const daYunData = useMemo(
    () => (showDaYun && draft.daYun ? buildDaYunTableData(draft) : null),
    [showDaYun, draft],
  );

  return (
    <GlassCard intensity={28} contentStyle={styles.glassContent} style={styles.shell}>
      <View style={styles.innerFrame}>
        <View style={styles.grid}>
          {columns.map((col) => {
            const isHourHidden = hideHour && col.key === 'hour';
            const hourNull = col.key === 'hour' && col.pillar === null;
            if (isHourHidden || hourNull) {
              return (
                <View key={col.key} style={[styles.column, col.highlight && styles.columnHighlight]}>
                  <Text style={styles.columnLabel}>{col.label}</Text>
                  <View style={styles.hiddenPlaceholder}>
                    <Text style={styles.hiddenText}>未知</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={col.key} style={[styles.column, col.highlight && styles.columnHighlight]}>
                <Text style={styles.columnLabel}>{col.label}</Text>
                <Text style={styles.tenGod}>{col.pillar!.tenGod ?? ''}</Text>
                <View style={styles.stemBranchCol}>
                  <Text
                    style={[
                      styles.stemChar,
                      { color: ELEMENT_COLORS[col.pillar!.stemElement] ?? colors.textPrimary },
                    ]}
                  >
                    {col.pillar!.stem}
                  </Text>
                  <Text
                    style={[
                      styles.branchChar,
                      { color: ELEMENT_COLORS[col.pillar!.branchElement] ?? colors.textPrimary },
                    ]}
                  >
                    {col.pillar!.branch}
                  </Text>
                </View>
                <Text style={styles.subText}>{col.pillar!.naYin}</Text>
              </View>
            );
          })}
        </View>

        {/* 神煞(每柱完整多行展示,不截断) */}
        <Text style={styles.sectionLabel}>神煞</Text>
        <View style={styles.shenshaRow}>
          {shenshaPillars.map(({ key, label }) => {
            const hidden = hideHour && key === 'hour';
            const stars = draft.shensha.filter((s) => s.pillar === label);
            return (
              <View key={key} style={styles.shenshaCol}>
                {hidden ? (
                  <Text style={styles.shenshaNone}>—</Text>
                ) : stars.length === 0 ? (
                  <Text style={styles.shenshaNone}>无</Text>
                ) : (
                  <Text style={[styles.shenshaName, { color: colors.fanXing }]}>
                    {stars.map((s) => s.name).join(' ')}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* 副星(藏干十神):十神由 dayMaster + 藏干本地推导,标注展示 */}
        <Text style={styles.sectionLabel}>副星 · 藏干十神</Text>
        <View style={styles.shenshaRow}>
          {shenshaPillars.map(({ key, label }) => {
            const hidden = hideHour && key === 'hour';
            const pillar = draft.pillars[key];
            return (
              <View key={key} style={styles.fuXingCol}>
                {hidden || pillar === null ? (
                  <Text style={styles.shenshaNone}>—</Text>
                ) : (
                  <View style={styles.pairList}>
                    {pillar.hiddenStems.map((stem, i) => (
                      <View key={`${stem}-${i}`} style={styles.pairChip}>
                        <Text style={styles.pairStem}>{stem}</Text>
                        <Text style={styles.pairGod}>{getTenGod(draft.dayMaster, stem)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 大运流年(showDaYun):与结果页同一个 DaYunTable 组件 */}
        {daYunData && (
          <View style={styles.daYunWrap}>
            <DaYunTable data={daYunData} />
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shell: {
      borderRadius: BorderRadius.xl,
    },
    glassContent: {
      padding: 5,
    },
    innerFrame: {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.hairlineGold,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      padding: Spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.xs,
      paddingHorizontal: 2,
    },
    columnHighlight: {
      backgroundColor: colors.dayMasterBg,
      borderWidth: 1,
      borderColor: colors.dayMasterBorder,
    },
    columnLabel: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
      color: colors.textMuted,
    },
    tenGod: {
      fontSize: 10,
      color: colors.textMuted,
    },
    stemBranchCol: {
      alignItems: 'center',
      gap: 1,
    },
    stemChar: {
      fontFamily: FONT_SERIF,
      fontSize: 26,
      fontWeight: FontWeight.bold,
      lineHeight: 30,
    },
    branchChar: {
      fontFamily: FONT_SERIF,
      fontSize: 26,
      fontWeight: FontWeight.bold,
      lineHeight: 30,
    },
    subText: {
      fontSize: 9,
      color: colors.textMuted,
    },
    hiddenPlaceholder: {
      paddingVertical: Spacing.md,
      justifyContent: 'center',
    },
    hiddenText: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    sectionLabel: {
      marginTop: Spacing.sm,
      textAlign: 'center',
      fontSize: 9,
      color: colors.textMuted,
    },
    shenshaRow: {
      marginTop: Spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: colors.hairlineGold,
      paddingTop: Spacing.xs,
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    shenshaCol: {
      flex: 1,
      alignItems: 'center',
    },
    shenshaNone: {
      fontSize: 9,
      color: colors.textMuted,
      paddingVertical: 4,
    },
    shenshaName: {
      fontSize: 9,
      paddingVertical: 4,
      textAlign: 'center',
      lineHeight: 13,
    },
    fuXingCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    pairList: {
      gap: 3,
      paddingVertical: 4,
      alignItems: 'center',
    },
    pairChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    pairStem: {
      fontFamily: FONT_SERIF,
      fontSize: 10,
      fontWeight: FontWeight.medium,
      color: colors.goldDark,
    },
    pairGod: {
      fontSize: 9,
      color: colors.textMuted,
    },
    daYunWrap: {
      marginTop: Spacing.md,
    },
  });

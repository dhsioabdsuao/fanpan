import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import type { FullAnalysis } from '@/lib/bage/analyze';

import { getStemElement } from '@/lib/bazi-utils';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

const ELEMENT_ADVICE: Record<string, string> = {
  金: '技术/专业技能',
  水: '学习/沟通',
  木: '社交/人脉',
  火: '展示/分享',
  土: '稳固/储蓄',
};

const typeStylesOf = (colors: ThemeColors): Record<string, { text: string; bg: string; color: string; border: string }> => ({
  '火炎土燥': {
    text: '命局偏燥(火炎土燥)',
    bg: colors.dryHot,
    color: '#991b1b',
    border: '#fecaca',
  },
  '金寒水冷': {
    text: '命局偏寒(金寒水冷)',
    bg: colors.cold,
    color: '#1e3a5f',
    border: '#bfdbfe',
  },
  '寒暖适中': {
    text: '命局寒暖适中',
    bg: colors.balanced,
    color: '#064e3b',
    border: '#a7f3d0',
  },
});

interface Props {
  full: FullAnalysis;
}

export default function TiaoHouBlock({ full }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // 【诊断流程 L7】调候与喜忌冲突结论唯一来自喜忌引擎
  const { tiaoHou, xiYong, pattern } = full;
  const gods = tiaoHou.gods;
  const typeStyles = useMemo(() => typeStylesOf(colors), [colors]);
  const style = typeStyles[tiaoHou.type];

  const isHuaCong = pattern.category.startsWith('化') || pattern.category.startsWith('从');

  const conflictOf = (stem: string) => {
    const el = getStemElement(stem);
    return xiYong.conflicts.find((c) => c.element === el) ?? null;
  };

  return (
    <View style={styles.container}>
      {/* 气候类型徽章(只标气候,救治方向见喜忌总览) */}
      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: style?.bg, borderColor: style?.border }]}>
          <Text style={[styles.badgeText, { color: style?.color }]}>{style?.text}</Text>
        </View>
      </View>

      {gods.length > 0 && (
        <>
          <Text style={styles.desc}>
            根据《穷通宝鉴》，{full.bazi.dayMaster}日主生于{full.bazi.pillars.month.branch}月，调候用神为：
          </Text>

          <View style={styles.godsWrap}>
            {gods.map((stem) => {
              const el = getStemElement(stem);
              const conflict = conflictOf(stem);
              const isFav = xiYong.favorable.includes(el);
              return (
                <View key={stem} style={styles.godCard}>
                  <Text style={styles.godStem}>{stem}</Text>
                  <Text style={styles.godElement}>{el}</Text>
                  <Text style={styles.godAdvice}>· {ELEMENT_ADVICE[el] || el}</Text>
                  {conflict ? (
                    <Text style={[styles.tag, conflict.resolution === '气候已足不需补' || conflict.resolution === '格局优先剔除' ? styles.tagAmber : styles.tagGreen]}>
                      {conflict.resolution === '气候已足不需补' ? '已足·不补'
                        : conflict.resolution === '格局优先剔除' ? '格局优先·不补'
                        : '保留'}
                    </Text>
                  ) : isFav ? (
                    <Text style={[styles.tag, styles.tagGreen]}>在喜用中</Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          {isHuaCong && (
            <Text style={styles.huaCongNote}>
              {pattern.displayName}只论{pattern.category.startsWith('化') ? '化' : '从'},调候仅作参考标注,不参与喜忌排序。
            </Text>
          )}

          {xiYong.conflicts.length > 0 && (
            <View style={styles.conflictWrap}>
              {xiYong.conflicts.map((c) => (
                <Text key={c.element + c.role} style={styles.conflictText}>{c.note}</Text>
              ))}
            </View>
          )}
        </>
      )}

      {gods.length === 0 && (
        <Text style={styles.noData}>《穷通宝鉴》未收录此组合的调候用神</Text>
      )}

      {/* Explanation */}
      <View style={styles.explanation}>
        <Text style={styles.explanationText}>
          调候用神是《穷通宝鉴》的核心方法论：根据日主天干和出生月份的气候特征，
          确定命局最需要的五行调节方向。调候侧重于命局的"寒暖燥湿"平衡，
          是喜用神判定中的补充维度。
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  badgeWrap: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  desc: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  godsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  godCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  godStem: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: colors.textPrimary,
  },
  godElement: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  godAdvice: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  tag: {
    fontSize: FontSize.xs,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  tagAmber: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  tagGreen: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  noData: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  huaCongNote: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  conflictWrap: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  conflictText: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  explanation: {
    gap: Spacing.xs,
  },
  explanationText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

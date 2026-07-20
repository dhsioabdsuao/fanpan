import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import { getTiaoHouYongShen, getTiaoHouType } from '@/lib/bage/tiaoHou';
import { getStemElement } from '@/lib/bazi-utils';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';

const ELEMENT_ADVICE: Record<string, string> = {
  金: '技术/专业技能',
  水: '学习/沟通',
  木: '社交/人脉',
  火: '展示/分享',
  土: '稳固/储蓄',
};

const TYPE_STYLES: Record<string, { text: string; bg: string; color: string; border: string }> = {
  '火炎土燥': {
    text: '命局偏燥，需水调候',
    bg: Colors.dryHot,
    color: '#991b1b',
    border: '#fecaca',
  },
  '金寒水冷': {
    text: '命局偏寒，需火调候',
    bg: Colors.cold,
    color: '#1e3a5f',
    border: '#bfdbfe',
  },
  '寒暖适中': {
    text: '命局寒暖适中，无需特殊调候',
    bg: Colors.balanced,
    color: '#064e3b',
    border: '#a7f3d0',
  },
};

interface Props {
  result: BaziResult;
}

export default function TiaoHouBlock({ result }: Props) {
  const type = getTiaoHouType(result);
  const gods = getTiaoHouYongShen(result.dayMaster, result.pillars.month.branch);
  const style = TYPE_STYLES[type];

  return (
    <View style={styles.container}>
      {/* Type badge */}
      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: style?.bg, borderColor: style?.border }]}>
          <Text style={[styles.badgeText, { color: style?.color }]}>{style?.text}</Text>
        </View>
      </View>

      {gods.length > 0 && (
        <>
          <Text style={styles.desc}>
            根据《穷通宝鉴》，{result.dayMaster}日主生于{result.pillars.month.branch}月，调候用神为：
          </Text>

          <View style={styles.godsWrap}>
            {gods.map((stem) => {
              const el = getStemElement(stem);
              return (
                <View key={stem} style={styles.godCard}>
                  <Text style={styles.godStem}>{stem}</Text>
                  <Text style={styles.godElement}>{el}</Text>
                  <Text style={styles.godAdvice}>· {ELEMENT_ADVICE[el] || el}</Text>
                </View>
              );
            })}
          </View>
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

const styles = StyleSheet.create({
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  godStem: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: Colors.textPrimary,
  },
  godElement: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  godAdvice: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  noData: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  explanation: {
    gap: Spacing.xs,
  },
  explanationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});

import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';

import type { HealthGuidance } from '@/lib/bage/healthGuidance';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const STATUS_COLORS: Record<string, string> = {
  '偏旺': Colors.earth,
  '偏弱': Colors.water,
  '适中': Colors.wood,
};

interface Props {
  full: FullAnalysis;
}

export default function HealthGuidanceBlock({ full }: Props) {
  let guidance: HealthGuidance;
  try {
    guidance = full.texts.health;
  } catch {
    return (
      <Text style={styles.errorText}>暂无法生成体质倾向，请确认排盘信息完整</Text>
    );
  }

  if (!guidance) {
    return (
      <Text style={styles.errorText}>暂无法生成体质倾向，请确认排盘信息完整</Text>
    );
  }

  const sortedOrgans = [...guidance.organs].sort((a, b) => {
    const order: Record<string, number> = { '偏旺': 0, '偏弱': 1, '适中': 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <View style={styles.container}>
      {/* ── 体质综述 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>体质综述</Text>
        <Text style={styles.bodyText}>{guidance.summary}</Text>
      </View>

      {/* ── 重点关注的方面 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>重点关注的方面</Text>
        {sortedOrgans.map((o) => (
          <View key={o.element} style={styles.organItem}>
            <View style={[styles.dot, { backgroundColor: STATUS_COLORS[o.status] }]} />
            <Text style={styles.bodyText}>
              <Text style={[styles.organLabel, { color: STATUS_COLORS[o.status] }]}>
                {o.organ}{o.status === '适中' ? '' : `（${o.status}）`}
              </Text>
              <Text style={styles.bodyText}> — {o.advice}</Text>
            </Text>
          </View>
        ))}
      </View>

      {/* ── 养生建议 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>养生建议</Text>
        <View style={styles.adviceGrid}>
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>运动</Text>
            <Text style={styles.adviceText}>{guidance.wellness.exercise}</Text>
          </View>
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>作息</Text>
            <Text style={styles.adviceText}>{guidance.wellness.rest}</Text>
          </View>
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>饮食</Text>
            <Text style={styles.adviceText}>{guidance.wellness.diet}</Text>
          </View>
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>季节</Text>
            <Text style={styles.adviceText}>{guidance.wellness.seasonal}</Text>
          </View>
        </View>
      </View>

      {/* ── 免责 ── */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          此为中国传统体质养生参考，非医学诊断。身体不适应及时就医，请勿据此自行诊断或用药。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  organItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  organLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  adviceGrid: {
    gap: Spacing.sm,
  },
  adviceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  adviceLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  adviceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

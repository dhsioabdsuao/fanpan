import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import { generateCareerGuidance } from '@/lib/bage/careerGuidance';
import type { CareerGuidance } from '@/lib/bage/careerGuidance';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';

const ELEMENT_DOT: Record<string, string> = {
  '金': Colors.gold,
  '木': Colors.wood,
  '水': Colors.water,
  '火': Colors.fire,
  '土': Colors.earth,
};

const TIER_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  primary: { label: '首选', bg: '#ecfdf5', color: '#064e3b', border: '#a7f3d0' },
  secondary: { label: '次选', bg: '#eff6ff', color: '#1e3a5f', border: '#bfdbfe' },
  avoid: { label: '避开', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

interface Props {
  result: BaziResult;
}

export default function CareerGuidanceBlock({ result }: Props) {
  let guidance: CareerGuidance;
  try {
    guidance = generateCareerGuidance(result);
  } catch {
    return (
      <Text style={styles.errorText}>暂无法生成事业指引，请确认排盘信息完整</Text>
    );
  }

  if (!guidance || guidance.industries.length === 0) {
    return (
      <Text style={styles.errorText}>暂无法生成事业指引，请确认排盘信息完整</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 命局概述 ── */}
      <Text style={styles.summary}>{guidance.summary}</Text>

      {/* ── 适合从事的领域 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 适合从事的领域</Text>
        {guidance.industries.map((group) => (
          <View key={group.element} style={styles.industryGroup}>
            <Text style={styles.industryLabel}>{group.label}</Text>
            {group.items.map((item, i) => (
              <View key={i} style={styles.industryItem}>
                <View style={[styles.dot, { backgroundColor: ELEMENT_DOT[group.element] || Colors.textMuted }]} />
                <Text style={styles.industryText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* ── 发展方位 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧭 发展方位</Text>
        <Text style={styles.directionText}>{guidance.directionPrimary}</Text>
        {guidance.directionSecondary ? (
          <Text style={styles.directionText}>{guidance.directionSecondary}</Text>
        ) : null}
        <Text style={styles.directionAvoid}>{guidance.directionAvoid}</Text>

        {/* ── 城市推荐 ── */}
        {guidance.cities.length > 0 && (
          <View style={styles.cityWrap}>
            {guidance.cities.map((city) => {
              const tier = TIER_STYLES[city.tier];
              return (
                <View
                  key={city.name}
                  style={[styles.cityBadge, { backgroundColor: tier.bg, borderColor: tier.border }]}
                >
                  <Text style={[styles.cityName, { color: tier.color }]}>{city.name}</Text>
                  <Text style={[styles.cityTier, { color: tier.color }]}> · {tier.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── 具体建议 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 具体建议</Text>
        {guidance.actionSuggestions.map((suggestion, i) => (
          <View key={i} style={styles.suggestionItem}>
            <Text style={styles.suggestionNum}>{i + 1}.</Text>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      {/* ── 免责 ── */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          以上为命理参考，请结合自身实际情况、兴趣和资源做选择。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  summary: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    color: Colors.textSecondary,
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
  industryGroup: {
    gap: 4,
    marginBottom: Spacing.sm,
  },
  industryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  industryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  directionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  directionAvoid: {
    fontSize: FontSize.sm,
    color: Colors.destructive,
    lineHeight: 20,
  },
  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  cityName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  cityTier: {
    fontSize: FontSize.xs,
    opacity: 0.7,
  },
  suggestionItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  suggestionNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    width: 16,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
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

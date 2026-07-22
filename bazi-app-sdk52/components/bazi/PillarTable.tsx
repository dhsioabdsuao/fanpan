import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import { getAllShenSha } from '@/lib/bage/shensha';
import type { ShenSha } from '@/lib/bage/shensha';
import Card from '../ui/Card';
import { Colors, FontSize, FontWeight, Spacing, FONT_SERIF, BorderRadius } from '../../theme';

const ELEMENT_COLORS: Record<string, string> = {
  金: Colors.gold,
  木: Colors.wood,
  水: Colors.water,
  火: Colors.fire,
  土: Colors.earth,
};

const CATEGORY_COLORS: Record<string, string> = {
  '贵人': Colors.guiRen,
  '凶星': Colors.xiongXing,
  '泛星': Colors.fanXing,
};

const PILLAR_LABELS: Record<string, '年柱' | '月柱' | '日柱' | '时柱'> = {
  year: '年柱', month: '月柱', day: '日柱', hour: '时柱',
};

interface Props {
  result: BaziResult;
  hideHour?: boolean;
}

export default function PillarTable({ result, hideHour }: Props) {
  const { pillars, tenGods, naYin } = result;
  const shensha = getAllShenSha(result);
  const pillarKeys = ['year', 'month', 'day', 'hour'] as const;

  const columns = [
    { key: 'year' as const, label: '年柱', pillar: pillars.year, tenGod: tenGods.yearStem, naYin: naYin.year, highlight: false },
    { key: 'month' as const, label: '月柱', pillar: pillars.month, tenGod: tenGods.monthStem, naYin: naYin.month, highlight: false },
    { key: 'day' as const, label: '日柱', pillar: pillars.day, tenGod: '日主', naYin: naYin.day, highlight: true },
    { key: 'hour' as const, label: '时柱', pillar: pillars.hour, tenGod: tenGods.hourStem, naYin: naYin.hour, highlight: false },
  ];

  return (
    <View style={styles.classicalFrame}>
      <View style={styles.innerFrame}>
        <View style={styles.content}>
        {/* 4-column grid */}
        <View style={styles.grid}>
          {columns.map((col) => {
            const isHourHidden = hideHour && col.key === 'hour';

            return (
              <View
                key={col.key}
                style={[styles.column, col.highlight && styles.columnHighlight]}
              >
                {/* Column title */}
                <View style={styles.titleRow}>
                  <Text style={styles.columnLabel}>{col.label}</Text>
                  {col.highlight && (
                    <View style={styles.dayMasterBadge}>
                      <Text style={styles.dayMasterBadgeText}>日主</Text>
                    </View>
                  )}
                </View>

                {isHourHidden ? (
                  <View style={styles.hiddenPlaceholder}>
                    <Text style={styles.hiddenText}>未知</Text>
                  </View>
                ) : (
                  <>
                    {/* Ten god */}
                    <Text style={styles.tenGod}>{col.tenGod}</Text>

                    {/* Stem and branch */}
                    <View style={styles.stemBranchCol}>
                      <Text style={[styles.stemChar, col.pillar.stemElement ? { color: ELEMENT_COLORS[col.pillar.stemElement] || Colors.textPrimary } : {}]}>
                        {col.pillar.stem}
                      </Text>
                      <Text style={[styles.branchChar, col.pillar.branchElement ? { color: ELEMENT_COLORS[col.pillar.branchElement] || Colors.textPrimary } : {}]}>
                        {col.pillar.branch}
                      </Text>
                    </View>

                    {/* Hidden stems */}
                    <Text style={styles.subText}>
                      {col.pillar.hiddenStems.join(' ')}
                    </Text>

                    {/* NaYin */}
                    <Text style={styles.subText}>{col.naYin}</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>

        {/* Shensha row */}
        <View style={styles.shenshaContainer}>
          <View style={styles.shenshaGrid}>
            {pillarKeys.map((key) => {
              const label = PILLAR_LABELS[key];
              const stars = shensha.filter((s) => s.pillar === label);
              const isHourHidden = hideHour && key === 'hour';

              return (
                <View key={key} style={styles.shenshaCol}>
                  {isHourHidden ? (
                    <Text style={styles.shenshaNone}>—</Text>
                  ) : stars.length === 0 ? (
                    <Text style={styles.shenshaNone}>无</Text>
                  ) : (
                    <View style={styles.shenshaList}>
                      {stars.map((s, i) => (
                        <Text
                          key={i}
                          style={[styles.shenshaName, { color: CATEGORY_COLORS[s.category] || Colors.textMuted }]}
                        >
                          {s.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  classicalFrame: {
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: BorderRadius.lg,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  innerFrame: {
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  columnHighlight: {
    backgroundColor: '#fef2f0',
    borderWidth: 1,
    borderColor: '#f5c6c2',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  columnLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  dayMasterBadge: {
    backgroundColor: '#f5c6c2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dayMasterBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.medium,
    color: '#9b2c2c',
  },
  tenGod: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  stemBranchCol: {
    alignItems: 'center',
    gap: 0,
  },
  stemChar: {
    fontSize: FontSize.huge,
    fontFamily: FONT_SERIF,
    lineHeight: 52,
  },
  branchChar: {
    fontSize: FontSize.huge,
    fontFamily: FONT_SERIF,
    lineHeight: 52,
  },
  subText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  hiddenPlaceholder: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  shenshaContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.md,
  },
  shenshaGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  shenshaCol: {
    flex: 1,
    alignItems: 'center',
  },
  shenshaList: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  shenshaName: {
    fontSize: 10,
    lineHeight: 14,
  },
  shenshaNone: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

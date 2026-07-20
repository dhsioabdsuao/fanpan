import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, LayoutAnimation, FlatList } from 'react-native';
import type { BaziResult, DaYunData } from '@/types/bazi';
import { getTenGod, getStemElement, getBranchElement } from '@/lib/bazi-utils';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';

const ELEMENT_COLORS: Record<string, string> = {
  金: Colors.gold,
  木: Colors.wood,
  水: Colors.water,
  火: Colors.fire,
  土: Colors.earth,
};

const ANNOTATION_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  '天合地合': { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  '天克地冲': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  '伏吟': { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  '岁运并临': { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
};

const CURRENT_YEAR = new Date().getFullYear();

function currentDaYunIndex(decades: DaYunData[]): number {
  for (let i = decades.length - 1; i >= 0; i--) {
    if (CURRENT_YEAR >= decades[i].startYear) return i;
  }
  return 0;
}

interface Props {
  result: BaziResult;
}

export default function DaYunTable({ result }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!result.daYun) return null;

  const { daYun } = result;
  const currentIdx = currentDaYunIndex(daYun.decades);

  const handleToggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>大运流年</Text>

      {/* 起运信息 */}
      <Text style={styles.startInfo}>
        起运：{daYun.startSolar.year}年{daYun.startSolar.month}月{daYun.startSolar.day}日
        {' · '}
        {daYun.isForward ? '顺行' : '逆行'}
        {' · '}当前{currentIdx + 1}步大运
      </Text>

      {/* 表头 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.cellStep]}>步</Text>
            <Text style={[styles.headerCell, styles.cellAge]}>年龄</Text>
            <Text style={[styles.headerCell, styles.cellYear]}>年份</Text>
            <Text style={[styles.headerCell, styles.cellGZ]}>干支</Text>
            <Text style={[styles.headerCell, styles.cellTen]}>十神</Text>
            <Text style={[styles.headerCell, styles.cellXK]}>旬空</Text>
          </View>

          {/* Rows */}
          {daYun.decades.map((dy) => {
            const isCurrent = dy.index === currentIdx;
            const isExpanded = expandedIndex === dy.index;
            const stem = dy.ganZhi[0];
            const branch = dy.ganZhi[1];
            const tenGod = getTenGod(result.dayMaster, stem);
            const stemEl = getStemElement(stem);
            const branchEl = getBranchElement(branch);

            return (
              <View key={dy.index}>
                <Pressable
                  onPress={() => handleToggle(dy.index)}
                  style={[styles.row, isCurrent && styles.rowCurrent]}
                >
                  <Text style={[styles.cell, styles.cellStep]}>{dy.index + 1}</Text>
                  <Text style={[styles.cell, styles.cellAge]}>
                    {dy.startAge}–{dy.endAge}岁
                  </Text>
                  <Text style={[styles.cell, styles.cellYear]}>
                    {dy.startYear}–{dy.endYear}
                  </Text>
                  <View style={[styles.cellCenter, styles.cellGZ, styles.stemBranchRow]}>
                    <Text style={[styles.stemText, { color: ELEMENT_COLORS[stemEl] || Colors.textPrimary }]}>
                      {stem}
                    </Text>
                    <Text style={[styles.branchText, { color: ELEMENT_COLORS[branchEl] || Colors.textPrimary }]}>
                      {branch}
                    </Text>
                  </View>
                  <Text style={[styles.cell, styles.cellTen]}>{tenGod}</Text>
                  <Text style={[styles.cell, styles.cellXK]}>{dy.xunKong}</Text>
                </Pressable>

                {/* Expanded liuNian */}
                {isExpanded && (
                  <View style={styles.liuNianContainer}>
                    {/* 5-column liuNian grid */}
                    <View style={styles.liuNianGrid}>
                      {dy.liuNian.map((ln) => {
                        const lnStem = ln.ganZhi[0];
                        const lnBranch = ln.ganZhi[1];
                        const lnStemEl = getStemElement(lnStem);
                        const lnBranchEl = getBranchElement(lnBranch);
                        const isLiuNianCurrent = ln.year === CURRENT_YEAR;
                        const hasNotes = ln.annotations.length > 0;

                        return (
                          <View
                            key={ln.year}
                            style={[
                              styles.liuNianItem,
                              isLiuNianCurrent && styles.liuNianCurrent,
                              hasNotes && styles.liuNianHasNotes,
                            ]}
                          >
                            <View style={styles.liuNianYearRow}>
                              <Text style={[styles.liuNianYear, isLiuNianCurrent && styles.liuNianYearCurrent]}>
                                {ln.year}
                              </Text>
                              {hasNotes && <View style={styles.dot} />}
                            </View>
                            <View style={styles.stemBranchMini}>
                              <Text style={[styles.stemMini, { color: ELEMENT_COLORS[lnStemEl] || Colors.textPrimary }]}>
                                {lnStem}
                              </Text>
                              <Text style={[styles.branchMini, { color: ELEMENT_COLORS[lnBranchEl] || Colors.textPrimary }]}>
                                {lnBranch}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Annotation details */}
                    {dy.liuNian.some((ln) => ln.annotations.length > 0) && (
                      <View style={styles.annotationContainer}>
                        {dy.liuNian
                          .filter((ln) => ln.annotations.length > 0)
                          .map((ln) =>
                            ln.annotations.map((a, i) => {
                              const style = ANNOTATION_STYLES[a.type] || {
                                bg: Colors.surface,
                                color: Colors.textSecondary,
                                border: Colors.textSubtle,
                              };
                              return (
                                <View
                                  key={`${ln.year}-${i}`}
                                  style={[
                                    styles.annotationBadge,
                                    { backgroundColor: style.bg, borderColor: style.border },
                                  ]}
                                >
                                  <Text style={[styles.annotationLabel, { color: style.color }]}>
                                    {ln.year}年 · {a.label}
                                  </Text>
                                  <Text style={[styles.annotationDetail, { color: style.color }]}>
                                    {' '}{a.detail}
                                  </Text>
                                </View>
                              );
                            }),
                          )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.hint}>点击大运行查看流年</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FONT_SERIF,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  startInfo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: Spacing.xs,
  },
  headerCell: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm - 2,
    alignItems: 'center',
  },
  rowCurrent: {
    backgroundColor: Colors.currentYearBg,
  },
  cell: {
    fontSize: FontSize.xs,
    textAlign: 'center' as const,
    color: Colors.textPrimary,
  },
  cellCenter: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cellStep: { width: 30 },
  cellAge: { width: 70 },
  cellYear: { width: 80 },
  cellGZ: { width: 60 },
  cellTen: { width: 50 },
  cellXK: { width: 50 },
  stemBranchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  stemText: {
    fontSize: FontSize.base,
    fontFamily: FONT_SERIF,
    fontWeight: FontWeight.semibold,
  },
  branchText: {
    fontSize: FontSize.base,
    fontFamily: FONT_SERIF,
    fontWeight: FontWeight.semibold,
  },
  // LiuNian expanded section
  liuNianContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  liuNianGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  liuNianItem: {
    width: '20%',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  liuNianCurrent: {
    backgroundColor: Colors.currentYearBg,
  },
  liuNianHasNotes: {
    borderWidth: 1,
    borderColor: '#fde047',
  },
  liuNianYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  liuNianYear: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  liuNianYearCurrent: {
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.xiongXing,
  },
  stemBranchMini: {
    flexDirection: 'row',
    gap: 2,
  },
  stemMini: {
    fontSize: FontSize.xs,
    fontFamily: FONT_SERIF,
  },
  branchMini: {
    fontSize: FontSize.xs,
    fontFamily: FONT_SERIF,
  },
  // Annotations
  annotationContainer: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  annotationBadge: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  annotationLabel: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },
  annotationDetail: {
    fontSize: 10,
    lineHeight: 16,
  },
  hint: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

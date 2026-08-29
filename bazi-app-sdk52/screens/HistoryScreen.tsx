import { StyleSheet, View, ScrollView, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useCallback  } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../theme';
import { loadRecords, deleteRecord, clearRecords } from '../services/storage';
import AuroraBackground from '../components/layout/AuroraBackground';
import GlassCard from '../components/ui/GlassCard';
import { BlurTargetView } from 'expo-blur';
import type { SavedRecord } from '../services/storage';
import type { RootStackParamList } from '../navigation/types';

export default function HistoryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      loadRecords().then(setRecords);
    }, [])
  );

  const handlePress = (record: SavedRecord) => {
    navigation.navigate('Result', record.birthParams);
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    setRecords(await loadRecords());
  };

  const handleClearAll = () => {
    Alert.alert('清空历史排盘', '确定清空全部历史排盘吗?此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          await clearRecords();
          setRecords([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← 返回首页</Text>
          </Pressable>
          <Text style={styles.headerTitle}>历史排盘</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>最近 {records.length} / 20 条,同一出生时间只保留最新一次</Text>

        {records.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>排过的命盘会在这里</Text>
            <Text style={styles.emptyDesc}>回到首页输入出生信息,排盘后自动存入历史</Text>
          </View>
        )}

        <View style={styles.list}>
          {records.map((r) => (
            <GlassCard key={r.id} intensity={30} style={styles.cardShell}>
              <Pressable onPress={() => handlePress(r)}>
                <View style={styles.cardHead}>
                  <Text style={styles.brief}>{r.summary.baziBrief}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {r.summary.patternDisplay}·{r.summary.patternOutcome}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  日主 {r.summary.dayMaster} · {r.summary.patternResult}
                </Text>
                <Text style={styles.time}>
                  排盘于 {new Date(r.createdAt).toLocaleString('zh-CN')}
                </Text>
              </Pressable>
              <View style={styles.cardFooter}>
                <Pressable onPress={() => handleDelete(r.id)} hitSlop={8}>
                  <Text style={styles.deleteText}>删除</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        {records.length > 0 && (
          <Pressable onPress={handleClearAll} style={styles.clearAll}>
            <Text style={styles.clearAllText}>清空全部历史</Text>
          </Pressable>
        )}
        </ScrollView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backLink: { fontSize: FontSize.sm, color: colors.goldText },
  headerTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 72 },
  subtitle: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    color: colors.textSecondary,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
  },
  list: { gap: Spacing.md },
  flex: { flex: 1 },
  cardShell: {
    borderRadius: BorderRadius.xl,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  brief: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.dayMasterBg,
    borderWidth: 1,
    borderColor: colors.dayMasterBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: colors.goldDark,
  },
  meta: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  time: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.inkLight,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  deleteText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  clearAll: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
  },
  clearAllText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
});

import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import type { SavedRecord } from '../services/storage';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing } from '../theme';

interface Props {
  records: SavedRecord[];
  onPress: (record: SavedRecord) => void;
  onDelete: (id: string) => void;
}

const OUTCOME_COLOR: Record<string, string> = {
  '成格': '#059669',
  '不成格': '#b45309',
  '破格': '#dc2626',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  } catch {
    return '';
  }
}

export default function RecentReadings({ records, onPress, onDelete }: Props) {
  if (records.length === 0) return null;

  const handleLongPress = (record: SavedRecord) => {
    Alert.alert(
      '删除记录',
      `确定要删除「${record.summary.baziBrief}」这条排盘记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => onDelete(record.id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>最近排盘</Text>
      {records.map((record) => (
        <Pressable
          key={record.id}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => onPress(record)}
          onLongPress={() => handleLongPress(record)}
        >
          <View style={styles.cardBody}>
            <View style={styles.cardLeft}>
              <Text style={styles.baziBrief} numberOfLines={1}>
                {record.summary.baziBrief}
              </Text>
              <Text style={styles.meta}>
                日主 {record.summary.dayMaster} · {formatTime(record.createdAt)}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.patternName}>
                {record.summary.patternDisplay}
              </Text>
              <Text
                style={[
                  styles.patternResult,
                  { color: OUTCOME_COLOR[record.summary.patternOutcome] ?? Colors.textSecondary },
                ]}
              >
                {record.summary.patternResult || record.summary.patternOutcome}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
      <Text style={styles.hint}>长按可删除记录</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.goldText,
    fontFamily: FONT_SERIF,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  cardPressed: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  baziBrief: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: FONT_SERIF,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  patternName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  patternResult: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

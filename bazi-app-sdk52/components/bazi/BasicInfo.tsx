import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import {
  formatMinutesOffset,
  formatChineseSolarDatetime,
  formatDateHM,
} from '@/lib/format-time';
import Card from '../ui/Card';
import { Colors, FontSize, FontWeight, Spacing, FONT_SERIF } from '../../theme';

const GENDER_LABEL: Record<string, string> = { male: '男', female: '女' };

interface Props {
  result: BaziResult;
}

export default function BasicInfo({ result }: Props) {
  const adj = result.solarTimeAdjustment;

  const solarDateMain = adj
    ? `${formatChineseSolarDatetime(adj.solarTime)} (真太阳时)`
    : result.solarDate;

  const solarDateSub = adj
    ? `北京时间 ${formatDateHM(adj.standardTime)}，偏差 ${formatMinutesOffset(adj.totalOffsetMinutes)}`
    : '未做真太阳时换算 — 出生地未填写';

  return (
    <View style={styles.container}>
      {/* Solar date */}
      <View style={styles.fullRow}>
        <View style={styles.row}>
          <Text style={styles.label}>公历生日</Text>
          <Text style={styles.value}>{solarDateMain}</Text>
        </View>
        <Text style={styles.subText}>{solarDateSub}</Text>
      </View>

      {/* Info grid */}
      <View style={styles.grid}>
        <InfoRow label="农历生日" value={result.lunarDate} />
        <InfoRow label="生肖" value={result.zodiac} />
        <InfoRow label="命主" value={`${result.dayMaster} ${result.dayMasterElement}`} />
        <InfoRow label="性别" value={GENDER_LABEL[result.inputInfo.gender] ?? result.inputInfo.gender} />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.gridRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  fullRow: {
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    width: '50%',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    minWidth: 64,
  },
  value: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  subText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

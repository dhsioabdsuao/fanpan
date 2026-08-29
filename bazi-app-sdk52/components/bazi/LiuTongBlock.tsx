import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';

interface Props {
  full: FullAnalysis;
}

export default function LiuTongBlock({ full }: Props) {
  const lt = full.liuTong;

  return (
    <View style={styles.container}>
      <Text style={styles.meta}>
        五行源头：<Text style={styles.strong}>{lt.source}</Text>
        {lt.blockage ? (
          <Text>　淤堵点：<Text style={styles.red}>{lt.blockage}</Text></Text>
        ) : null}
        {lt.tongGuan ? (
          <Text>　通关元素：<Text style={styles.green}>{lt.tongGuan}</Text></Text>
        ) : null}
      </Text>
      <Text style={styles.desc}>{lt.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  strong: { fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  red: { fontWeight: FontWeight.semibold, color: '#b91c1c' },
  green: { fontWeight: FontWeight.semibold, color: '#047857' },
  desc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

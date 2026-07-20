import { StyleSheet, View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FONT_SERIF, Spacing } from '../theme';
import BirthForm from '../components/bazi/BirthForm';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
        {/* Title */}
        <Text style={styles.title}>四柱八字</Text>
        <Text style={styles.subtitle}>输入生辰，知晓命局</Text>

        {/* Description */}
        <View style={styles.descContainer}>
          <Text style={styles.desc}>
            本站基于《渊海子平》《三命通会》《滴天髓》《穷通宝鉴》等经典古籍，辅以现代天文算法（真太阳时校正、节气精确匹配），对您的生辰八字进行系统化排盘分析。
          </Text>
          <Text style={styles.desc}>
            愿您知命而行，顺势而为。
          </Text>
        </View>

        {/* Form */}
        <BirthForm />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl * 2,
  },
  title: {
    fontSize: FontSize.huge,
    fontWeight: '700',
    color: Colors.goldText,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.goldTextMuted as string,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: FONT_SERIF,
  },
  descContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  desc: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.goldTextSubtle as string,
    textAlign: 'center',
    lineHeight: 20,
  },
});

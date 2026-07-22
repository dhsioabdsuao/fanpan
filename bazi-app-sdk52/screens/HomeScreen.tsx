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

          {/* Decorative divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerDiamond}>◆</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* One-line tagline */}
          <Text style={styles.tagline}>
            古籍算法 · 真太阳时校正 · 节气匹配
          </Text>

          {/* Form */}
          <View style={styles.formWrapper}>
            <BirthForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.goldText,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
    textShadowColor: 'rgba(0,0,0,0.08)',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.goldTextSubtle as string,
  },
  dividerDiamond: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.goldTextSubtle as string,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  formWrapper: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

import { StyleSheet, View, ScrollView, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FONT_SERIF, Spacing, BorderRadius } from '../theme';
import BirthForm from '../components/bazi/BirthForm';
import type { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

          {/* 历史排盘入口 */}
          <Pressable
            style={styles.historyEntry}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.historyEntryText}>历史排盘 →</Text>
          </Pressable>

          <Pressable
            style={styles.privacyLink}
            onPress={() => navigation.navigate('Privacy')}
          >
            <Text style={styles.privacyLinkText}>隐私政策</Text>
          </Pressable>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.goldDark,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontWeight: '400',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: FONT_SERIF,
    letterSpacing: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl * 1.5,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.divider,
  },
  dividerDiamond: {
    marginHorizontal: Spacing.lg,
    fontSize: 8,
    color: Colors.gold,
  },
  tagline: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 2,
  },
  formWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  historyEntry: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  historyEntryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  privacyLink: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  privacyLinkText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

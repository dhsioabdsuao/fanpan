import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { BlurTargetView } from 'expo-blur';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import AuroraBackground from '../../components/layout/AuroraBackground';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ChartCard from '../../components/community/ChartCard';
import { QuestionFormSchema } from '@/community/schemas';
import type { QuestionFormData } from '@/community/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { createPost, CommunityError } from '../../services/community';
import type { RootStackParamList } from '../../navigation/types';

const resolver: Resolver<QuestionFormData> = async (values) => {
  const result = QuestionFormSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  const fieldErrors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors: fieldErrors };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Publish'>;

export default function PublishScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { draft } = route.params;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<QuestionFormData>({
    resolver,
    defaultValues: { question: '' },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const post = await createPost(draft, data.question);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.replace('PostDetail', { postId: post.id });
    } catch (e) {
      setSubmitError(e instanceof CommunityError ? e.message : '发布失败,请稍后重试');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.backLink}>← 返回</Text>
              </Pressable>
              <Text style={styles.headerTitle}>发布求测</Text>
              <View style={styles.headerSpacer} />
            </View>

            <Text style={styles.sectionLabel}>将公开的命盘(仅四柱与性别)</Text>
            <ChartCard draft={draft} showDaYun />
            <Text style={styles.privacyNote}>
              已自动脱敏:不会上传精确出生时间、姓名与出生地点;四柱本身可能被推算者反推出大致出生日期,请知悉
            </Text>

            <Text style={styles.sectionLabel}>求测问题(5–200 字)</Text>
            <GlassCard intensity={28} style={styles.cardShell}>
              <Controller
                control={form.control}
                name="question"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      placeholder="如:求看事业方向,何时能转运"
                      multiline
                      maxLength={200}
                      value={field.value}
                      onChangeText={field.onChange}
                      style={styles.questionInput}
                    />
                    <Text style={styles.counter}>{field.value.trim().length} / 200</Text>
                    {fieldState.error && (
                      <Text style={styles.errorText}>{fieldState.error.message}</Text>
                    )}
                  </>
                )}
              />

              {!user && (
                <Text style={styles.loginHint}>
                  发布需要登录,发布成功后你将进入自己的帖子
                </Text>
              )}

              <Button
                title={user ? '发布求测' : '登录并发布'}
                variant="gold"
                loading={submitting}
                onPress={user ? onSubmit : () => navigation.navigate('Login')}
                style={styles.submitButton}
              />

              {submitError && <Text style={styles.errorText}>{submitError}</Text>}
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 64, gap: Spacing.sm },
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
  sectionLabel: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
  },
  privacyNote: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  cardShell: {
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  questionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: colors.destructive,
  },
  loginHint: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
});

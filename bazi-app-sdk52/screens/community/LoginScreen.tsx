import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { BlurTargetView } from 'expo-blur';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import AuroraBackground from '../../components/layout/AuroraBackground';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import { LoginFormSchema } from '@/community/schemas';
import type { LoginFormData } from '@/community/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { CommunityError, verifyCaptcha } from '../../services/community';
import { setCaptchaUIBridge } from '../../services/cloudbase';
import type { CaptchaChallenge } from '../../services/cloudbase';
import type { RootStackParamList } from '../../navigation/types';

const resolver: Resolver<LoginFormData> = async (values) => {
  const result = LoginFormSchema.safeParse(values);
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

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, requestCode, storageReady } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 图形验证码(CloudBase 风控触发时,SDK 经 UI 桥弹窗要求人工输入)
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaResolveRef = useRef<((token: { captcha_token: string; expires_in: number } | null) => void) | null>(null);

  const form = useForm<LoginFormData>({
    resolver,
    defaultValues: { phone: '', code: '', agreed: false },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 注册验证码 UI 桥:SDK 要求图形验证码时调用,等用户输入完成后 resolve
  useEffect(() => {
    setCaptchaUIBridge(async (challenge: CaptchaChallenge) => {
      return new Promise((resolve) => {
        captchaResolveRef.current = resolve;
        setCaptcha(challenge);
        setCaptchaInput('');
        setCaptchaError(null);
      });
    });
    return () => setCaptchaUIBridge(null);
  }, []);

  const submitCaptcha = async () => {
    const resolve = captchaResolveRef.current;
    if (!captcha || !resolve) return;
    try {
      const token = await verifyCaptcha({ token: captcha.token, key: captchaInput.trim() });
      setCaptcha(null);
      captchaResolveRef.current = null;
      resolve(token);
    } catch (e) {
      setCaptchaError(e instanceof CommunityError ? e.message : '验证码校验失败,请重试');
    }
  };

  const cancelCaptcha = () => {
    captchaResolveRef.current?.(null);
    captchaResolveRef.current = null;
    setCaptcha(null);
  };

  const handleSendCode = async () => {
    const ok = await form.trigger('phone');
    if (!ok) return;
    setSending(true);
    setRequestError(null);
    try {
      await requestCode(form.getValues('phone'));
      setCooldown(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      setRequestError(e instanceof CommunityError ? e.message : '发送失败,请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await login(data.phone, data.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (e) {
      setSubmitError(e instanceof CommunityError ? e.message : '登录失败,请稍后重试');
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
              {navigation.canGoBack() ? (
                <Pressable onPress={() => navigation.goBack()}>
                  <Text style={styles.backLink}>← 返回</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Text style={styles.headerTitle}>登录</Text>
              <View style={styles.headerSpacer} />
            </View>

            <GlassCard intensity={32}>
              <Text style={styles.formTitle}>手机号验证码登录</Text>
              <Text style={styles.formDesc}>登录后即可发布求测、批注他人命盘、积累称号</Text>

              <Controller
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      placeholder="手机号"
                      keyboardType="number-pad"
                      maxLength={11}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                    {fieldState.error && (
                      <Text style={styles.errorText}>{fieldState.error.message}</Text>
                    )}
                  </>
                )}
              />

              <View style={styles.codeRow}>
                <View style={styles.codeInputWrap}>
                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          placeholder="验证码"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                        {fieldState.error && (
                          <Text style={styles.errorText}>{fieldState.error.message}</Text>
                        )}
                      </>
                    )}
                  />
                </View>
                <Pressable
                  style={[styles.codeButton, (cooldown > 0 || sending) && styles.codeButtonDisabled]}
                  onPress={handleSendCode}
                  disabled={cooldown > 0 || sending}
                >
                  <Text style={styles.codeButtonText}>
                    {cooldown > 0 ? `${cooldown}s 后重发` : sending ? '发送中…' : '获取验证码'}
                  </Text>
                </Pressable>
              </View>

              {requestError && <Text style={styles.errorText}>{requestError}</Text>}

              <Controller
                control={form.control}
                name="agreed"
                render={({ field, fieldState }) => (
                  <>
                    <View style={styles.agreeRow}>
                      <Checkbox checked={field.value} onChange={field.onChange} label="" />
                      <Text style={styles.agreeText}>
                        我已阅读并同意
                        <Text style={styles.agreeLink} onPress={() => navigation.navigate('UserAgreement')}>
                          《用户协议》
                        </Text>
                        与
                        <Text style={styles.agreeLink} onPress={() => navigation.navigate('UserAgreement')}>
                          《隐私政策》
                        </Text>
                      </Text>
                    </View>
                    {fieldState.error && (
                      <Text style={styles.errorText}>{fieldState.error.message}</Text>
                    )}
                  </>
                )}
              />

              <Button
                title="登录 / 注册"
                variant="gold"
                loading={submitting}
                onPress={onSubmit}
                style={styles.submitButton}
              />

              {submitError && <Text style={styles.errorText}>{submitError}</Text>}

              {!storageReady && (
                <Text style={styles.storageWarn}>
                  当前环境存储不可用,登录状态可能无法保存
                </Text>
              )}
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurTargetView>

      {/* 图形验证码弹窗(CloudBase 风控要求) */}
      <Modal visible={captcha != null} transparent animationType="fade" onRequestClose={cancelCaptcha}>
        <View style={styles.captchaBackdrop}>
          <View style={styles.captchaCard}>
            <Text style={styles.captchaTitle}>请输入图形验证码</Text>
            {captcha && (
              <Image
                source={{
                  uri: captcha.captchaData.startsWith('data:')
                    ? captcha.captchaData
                    : `data:image/png;base64,${captcha.captchaData}`,
                }}
                style={styles.captchaImage}
                resizeMode="contain"
              />
            )}
            <Input
              placeholder="输入图中字符"
              value={captchaInput}
              onChangeText={setCaptchaInput}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.captchaInput}
            />
            {captchaError && <Text style={styles.errorText}>{captchaError}</Text>}
            <View style={styles.captchaButtons}>
              <Pressable onPress={cancelCaptcha} hitSlop={8} style={styles.captchaCancel}>
                <Text style={styles.captchaCancelText}>取消</Text>
              </Pressable>
              <View style={styles.captchaConfirmWrap}>
                <Button
                  title="确定"
                  variant="gold"
                  onPress={submitCaptcha}
                  disabled={captchaInput.trim().length === 0}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 64, gap: Spacing.md },
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
  formTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  formDesc: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  codeInputWrap: { flex: 1 },
  codeButton: {
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  codeButtonDisabled: {
    borderColor: colors.surfaceBorder,
  },
  codeButtonText: {
    fontSize: FontSize.sm,
    color: colors.goldDark,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  agreeText: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  agreeLink: {
    color: colors.goldDark,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: colors.destructive,
    marginTop: 4,
  },
  storageWarn: {
    fontSize: FontSize.xs,
    color: colors.destructive,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  captchaBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  captchaCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairlineGold,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  captchaTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  captchaImage: {
    width: '100%',
    height: 60,
  },
  captchaInput: {
    textAlign: 'center',
  },
  captchaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  captchaCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  captchaCancelText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
  },
  captchaConfirmWrap: {
    flex: 1,
  },
});

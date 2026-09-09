import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { BlurTargetView } from 'expo-blur';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import AuroraBackground from '../../components/layout/AuroraBackground';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import TitleBadge from '../../components/community/TitleBadge';
import { useAuth } from '../../contexts/AuthContext';
import { getMyStats, fetchMyPosts, fetchMyAnnotations } from '../../services/community';
import { titleForCount } from '@/community/titles';
import type { UserStatsDTO, PostDTO, AnnotationDTO } from '@/community';
import type { RootStackParamList } from '../../navigation/types';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading, logout, requestDeletionCode, deleteAccount } = useAuth();

  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [myPosts, setMyPosts] = useState<PostDTO[]>([]);
  const [myAnnotations, setMyAnnotations] = useState<AnnotationDTO[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setStats(null);
        setMyPosts([]);
        setMyAnnotations([]);
        return;
      }
      (async () => {
        try {
          const [s, posts, anns] = await Promise.all([
            getMyStats(),
            fetchMyPosts(),
            fetchMyAnnotations(),
          ]);
          setStats(s);
          setMyPosts(posts);
          setMyAnnotations(anns);
          setLoadError(null);
        } catch (e) {
          setLoadError('加载失败,请检查网络后下拉重试');
        }
      })();
    }, [user?.id])
  );

  const handleLogout = () => {
    Alert.alert('退出登录', '确定退出当前账号吗?', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          await logout();
        },
      },
    ]);
  };

  // 注销账号:确认 → 短信验证码 → 完成删除(App Store 5.1.1(v) 要求提供注销入口)
  const handleDeleteAccount = () => {
    Alert.alert(
      '注销账号',
      '注销后账号与相关数据将被删除且不可恢复。为确认本人操作,将向你的手机发送一条验证码短信。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '继续注销',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestDeletionCode();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              if (Platform.OS === 'ios') {
                Alert.prompt(
                  '输入注销验证码',
                  '验证码已发送至你的手机,请输入:',
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '确认注销',
                      style: 'destructive',
                      onPress: async (value?: string) => {
                        if (!value?.trim()) {
                          Alert.alert('未输入验证码', '未完成注销');
                          return;
                        }
                        await confirmDeleteAccount(value.trim());
                      },
                    },
                  ],
                );
              } else {
                Alert.alert('提示', '请使用 iPhone 完成注销流程');
              }
            } catch (e) {
              Alert.alert('发送失败', e instanceof Error ? e.message : '请稍后重试');
            }
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = async (code: string) => {
    try {
      await deleteAccount(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } catch (e) {
      Alert.alert('注销失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const titleInfo = stats ? titleForCount(stats.titleCount) : null;
  const remaining = titleInfo?.nextThreshold != null && stats
    ? titleInfo.nextThreshold - stats.titleCount
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View />
            <Text style={styles.headerTitle}>我的</Text>
            <View style={styles.headerSpacer} />
          </View>

          {loading ? null : !user ? (
            /* 游客态 */
            <GlassCard intensity={32} style={styles.guestCard}>
              <Text style={styles.guestTitle}>未登录</Text>
              <Text style={styles.guestDesc}>
                登录后可发布求测、批注他人命盘,批注累计可获称号
              </Text>
              <Button
                title="手机号登录 / 注册"
                variant="gold"
                onPress={() => navigation.navigate('Login')}
              />
            </GlassCard>
          ) : (
            /* 登录态 */
            <View style={styles.body}>
              <GlassCard intensity={32}>
                <View style={styles.identityRow}>
                  <View style={styles.identityText}>
                    <Text style={styles.nickname}>{user.nickname}</Text>
                    <Text style={styles.phone}>{user.phoneMasked}</Text>
                  </View>
                  {titleInfo && <TitleBadge info={titleInfo} />}
                </View>

                {titleInfo && stats && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round(titleInfo.progress * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {remaining != null
                        ? `再批注 ${remaining} 条升级为「${titleForCount(titleInfo.nextThreshold!).name}」`
                        : '已达最高称号 · 曜金大师'}
                    </Text>
                  </View>
                )}

                <View style={styles.countRow}>
                  <Text style={styles.countText}>批注 {stats?.annotationCount ?? 0} 条</Text>
                  <Text style={styles.countText}>称号计数 {stats?.titleCount ?? 0}</Text>
                </View>

                <View style={styles.accountOps}>
                  <Pressable onPress={handleLogout} hitSlop={8} style={styles.logoutRow}>
                    <Text style={styles.logoutText}>退出登录</Text>
                  </Pressable>
                  <Pressable onPress={handleDeleteAccount} hitSlop={8} style={styles.logoutRow}>
                    <Text style={styles.deleteAccountText}>注销账号</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {loadError && <Text style={styles.errorText}>{loadError}</Text>}

              <Text style={styles.sectionTitle}>我的求测帖</Text>
              {myPosts.length === 0 ? (
                <Text style={styles.emptyText}>还没有发布过求测帖</Text>
              ) : (
                <View style={styles.list}>
                  {myPosts.map((p) => (
                    <GlassCard key={p.id} intensity={30} style={styles.cardShell}>
                      <Pressable onPress={() => navigation.navigate('PostDetail', { postId: p.id })}>
                        <View style={styles.cardHead}>
                          <Text style={styles.brief}>{p.draft.baziBrief}</Text>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{p.draft.pattern.displayName}</Text>
                          </View>
                        </View>
                        <Text style={styles.question} numberOfLines={2}>{p.question}</Text>
                        <Text style={styles.meta}>{p.annotationCount} 条批注</Text>
                      </Pressable>
                    </GlassCard>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>我的批注</Text>
              {myAnnotations.length === 0 ? (
                <Text style={styles.emptyText}>还没有批注过命盘,去广场逛逛吧</Text>
              ) : (
                <View style={styles.list}>
                  {myAnnotations.map((a) => (
                    <GlassCard key={a.id} intensity={30} style={styles.cardShell}>
                      <Pressable onPress={() => navigation.navigate('PostDetail', { postId: a.postId })}>
                        <Text style={styles.annContent} numberOfLines={2}>{a.content}</Text>
                        <Text style={styles.meta}>
                          批注于 {new Date(a.createdAt).toLocaleString('zh-CN')}
                        </Text>
                      </Pressable>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 128 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 72 },
  body: { gap: Spacing.md },
  guestCard: {
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  guestTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  guestDesc: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityText: { gap: 2 },
  nickname: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  phone: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  progressWrap: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.inkLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  countRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  countText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  accountOps: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutRow: {
    alignSelf: 'flex-start',
  },
  logoutText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  deleteAccountText: {
    fontSize: FontSize.xs,
    color: colors.destructive,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: colors.destructive,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  list: { gap: Spacing.sm, marginTop: Spacing.xs },
  cardShell: { borderRadius: BorderRadius.xl },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  brief: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.md,
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
  question: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  annContent: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  meta: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
});

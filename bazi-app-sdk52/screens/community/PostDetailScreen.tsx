// 帖子详情:全四柱命盘 + 问题 + 批注列表 + 底部批注输入条 + 举报/删帖
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchPost,
  fetchAnnotations,
  createAnnotation,
  createReport,
  deletePost,
  CommunityError,
  PAGE_SIZE,
} from '../../services/community';
import { REPORT_REASONS } from '@/community/schemas';
import type { PostDTO, AnnotationDTO } from '@/community';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { postId } = route.params;

  const [post, setPost] = useState<PostDTO | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationDTO[]>([]);
  const [annPage, setAnnPage] = useState(0);
  const [hasMoreAnnotations, setHasMoreAnnotations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draftText, setDraftText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [p, anns] = await Promise.all([fetchPost(postId), fetchAnnotations(postId, 0)]);
      setPost(p);
      setAnnotations(anns);
      setAnnPage(0);
      setHasMoreAnnotations(anns.length === PAGE_SIZE);
    } catch {
      setLoadError('加载失败,请检查网络后重试');
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMoreAnnotations = async () => {
    try {
      const next = annPage + 1;
      const more = await fetchAnnotations(postId, next);
      setAnnotations((prev) => [...prev, ...more]);
      setAnnPage(next);
      setHasMoreAnnotations(more.length === PAGE_SIZE);
    } catch {
      // 静默,可重试
    }
  };

  const handleSend = async () => {
    const text = draftText.trim();
    if (text.length === 0) return;
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const ann = await createAnnotation(postId, text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAnnotations((prev) => [ann, ...prev]);
      setPost((prev) => (prev ? { ...prev, annotationCount: prev.annotationCount + 1 } : prev));
      setDraftText('');
    } catch (e) {
      setSendError(e instanceof CommunityError ? e.message : '批注失败,请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const isAuthor = user != null && post != null && user.id === post.author.id;

  const handleMenu = () => {
    Alert.alert('帖子操作', undefined, [
      {
        text: '举报此帖',
        style: 'destructive',
        onPress: () => handleReport('Post', postId),
      },
      ...(isAuthor
        ? [
            {
              text: '删除帖子',
              style: 'destructive' as const,
              onPress: () => handleDeletePost(),
            },
          ]
        : []),
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleReport = (targetType: 'Post' | 'Annotation', targetId: string) => {
    if (!user) {
      Alert.alert('需要登录', '登录后才能举报', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    Alert.alert('举报理由', undefined, [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await createReport({ targetType, targetId, reason });
            Alert.alert('已提交', '感谢你的反馈,我们会在后台核实处理');
          } catch (e) {
            Alert.alert('举报失败', e instanceof CommunityError ? e.message : '请稍后重试');
          }
        },
      })),
      { text: '取消', style: 'cancel' as const },
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert('删除帖子', '删除后不可恢复,批注将一并移除。确定删除?', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            navigation.goBack();
          } catch (e) {
            Alert.alert('删除失败', e instanceof CommunityError ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <AuroraBackground />
        <BlurTargetView style={styles.flex}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.backLink}>← 返回</Text>
              </Pressable>
              <Text style={styles.headerTitle}>帖子详情</Text>
              <View style={styles.headerSpacer} />
            </View>
            {loadError ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{loadError}</Text>
                <Button title="重试" variant="gold" onPress={load} />
              </View>
            ) : (
              <Text style={styles.centerText}>加载中…</Text>
            )}
          </View>
        </BlurTargetView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.backLink}>← 返回</Text>
              </Pressable>
              <Text style={styles.headerTitle}>帖子详情</Text>
              <Pressable onPress={handleMenu} hitSlop={8}>
                <Text style={styles.menuText}>···</Text>
              </Pressable>
            </View>

            <ChartCard draft={post.draft} showDaYun />

            <GlassCard intensity={28} style={styles.questionCard}>
              <View style={styles.authorRow}>
                <Text style={styles.authorText}>{post.author.nickname}</Text>
                <Text style={styles.metaText}>
                  {post.draft.gender === 'male' ? '乾造' : '坤造'} ·{' '}
                  {post.draft.pattern.displayName}·{post.draft.pattern.outcome} ·{' '}
                  {post.draft.strength.level}
                </Text>
              </View>
              <Text style={styles.questionText}>{post.question}</Text>
              <Text style={styles.metaText}>
                {post.annotationCount} 条批注 ·{' '}
                {post.createdAt ? new Date(post.createdAt).toLocaleString('zh-CN') : ''}
              </Text>
            </GlassCard>

            <Text style={styles.sectionTitle}>批注({annotations.length})</Text>
            {annotations.length === 0 && (
              <Text style={styles.emptyText}>还没有批注,来写下第一条</Text>
            )}
            <View style={styles.annList}>
              {annotations.map((a) => {
                // 批注作者称号用写入时的快照,不重新映射
                return (
                  <GlassCard key={a.id} intensity={30} style={styles.annShell}>
                    <View style={styles.annHead}>
                      <Text style={styles.annAuthor}>{a.author.nickname}</Text>
                      {a.author.title && (
                        <View style={styles.annBadge}>
                          <Text style={styles.annBadgeText}>{a.author.title}</Text>
                        </View>
                      )}
                      <Text style={styles.annTime} numberOfLines={1}>
                        {new Date(a.createdAt).toLocaleString('zh-CN')}
                      </Text>
                    </View>
                    <Text style={styles.annContent}>{a.content}</Text>
                  </GlassCard>
                );
              })}
            </View>

            {hasMoreAnnotations && (
              <Pressable onPress={loadMoreAnnotations} style={styles.loadMore}>
                <Text style={styles.loadMoreText}>加载更多批注</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* 底部批注输入条 */}
          <View style={styles.inputBar}>
            {user ? (
              <>
                <Input
                  placeholder="写下你的批注(至少 10 字)…"
                  multiline
                  maxLength={500}
                  value={draftText}
                  onChangeText={setDraftText}
                  style={styles.annInput}
                />
                <Button
                  title="批注"
                  variant="gold"
                  loading={sending}
                  disabled={draftText.trim().length === 0}
                  onPress={handleSend}
                />
              </>
            ) : (
              <>
                <Text style={styles.guestTip}>登录后可批注命盘</Text>
                <Button title="登录" variant="gold" onPress={() => navigation.navigate('Login')} />
              </>
            )}
          </View>
          {sendError && <Text style={styles.sendError}>{sendError}</Text>}
        </KeyboardAvoidingView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backLink: { fontSize: FontSize.sm, color: colors.goldText },
  headerTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 72 },
  menuText: {
    fontSize: FontSize.xl,
    color: colors.goldText,
    width: 72,
    textAlign: 'right',
  },
  centerBox: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 96,
  },
  centerText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 96,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: colors.destructive,
    textAlign: 'center',
  },
  questionCard: {
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  authorText: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  questionText: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  annList: { gap: Spacing.sm, marginTop: Spacing.xs },
  annShell: {
    borderRadius: BorderRadius.xl,
  },
  annHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  annAuthor: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  annBadge: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  annBadgeText: {
    fontSize: 9,
    color: colors.gold,
    fontFamily: FONT_SERIF,
  },
  annTime: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    flexShrink: 1,
  },
  annContent: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: Spacing.xs,
  },
  loadMore: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  loadMoreText: {
    fontSize: FontSize.xs,
    color: colors.goldDark,
  },
  inputBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.hairlineGold,
    backgroundColor: colors.glassBg,
    alignItems: 'center',
  },
  annInput: {
    flex: 1,
    maxHeight: 88,
    textAlignVertical: 'top',
  },
  guestTip: {
    flex: 1,
    fontSize: FontSize.sm,
    color: colors.textMuted,
  },
  sendError: {
    fontSize: FontSize.xs,
    color: colors.destructive,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: colors.glassBg,
  },
});

// 广场帖子流:分页 + 下拉刷新 + 空态/错误态;游客可完整浏览
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { BlurTargetView } from 'expo-blur';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing } from '../../theme';
import AuroraBackground from '../../components/layout/AuroraBackground';
import Button from '../../components/ui/Button';
import PostCard from '../../components/community/PostCard';
import { fetchPosts, PAGE_SIZE } from '../../services/community';
import type { PostDTO } from '@/community';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';

export default function SquareScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList & MainTabParamList>>();

  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setError(null);
    try {
      const items = await fetchPosts(0);
      setPosts(items);
      setPage(0);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      setError('加载失败,请检查网络后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 首次挂载时加载第一页
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const items = await fetchPosts(next);
      setPosts((prev) => [...prev, ...items]);
      setPage(next);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      // 加载更多失败静默,下拉可重试
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFirstPage();
  }, [loadFirstPage]);

  const openPost = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('PostDetail', { postId });
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerSpacer} />
      <Text style={styles.headerTitle}>命理广场</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AuroraBackground />
        <BlurTargetView style={styles.flex}>
          <View style={styles.container}>
            {header}
            <Text style={styles.centerText}>广场加载中…</Text>
          </View>
        </BlurTargetView>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <AuroraBackground />
        <BlurTargetView style={styles.flex}>
          <View style={styles.container}>
            {header}
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="重试" variant="gold" onPress={() => { setLoading(true); loadFirstPage(); }} />
            </View>
          </View>
        </BlurTargetView>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <AuroraBackground />
        <BlurTargetView style={styles.flex}>
          <View style={styles.container}>
            {header}
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>广场还没有帖子</Text>
              <Text style={styles.emptyDesc}>排一张盘,发布到广场,成为第一个求测者</Text>
              <Button title="去首页排盘" variant="gold" onPress={() => navigation.navigate('HomeTab')} />
            </View>
          </View>
        </BlurTargetView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onPress={() => openPost(item.id)} />}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldDark} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <Text style={styles.footerText}>加载中…</Text> : !hasMore && posts.length > 0 ? (
              <Text style={styles.footerText}>—— 已到底 ——</Text>
            ) : null
          }
        />
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  listContainer: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 128 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 72 },
  separator: { height: Spacing.sm },
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
  emptyTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    color: colors.textSecondary,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: colors.destructive,
    textAlign: 'center',
  },
  footerText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});

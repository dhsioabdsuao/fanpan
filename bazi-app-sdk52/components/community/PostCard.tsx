// 广场帖子卡:三柱命盘卡 + 格局/强弱徽章 + 问题摘要 + 计数与时间
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMemo } from 'react';
import GlassCard from '../ui/GlassCard';
import ChartCard from './ChartCard';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import type { PostDTO } from '@/community';

interface Props {
  post: PostDTO;
  onPress: () => void;
}

export default function PostCard({ post, onPress }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Animated.View entering={FadeInDown.duration(360)}>
      <GlassCard intensity={30} style={styles.shell}>
        <Pressable onPress={onPress}>
          <ChartCard draft={post.draft} hideHour />

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {post.draft.pattern.displayName}·{post.draft.pattern.outcome}
              </Text>
            </View>
            <Text style={styles.strengthText}>{post.draft.strength.level}</Text>
            <Text style={styles.genderText}>{post.draft.gender === 'male' ? '乾造' : '坤造'}</Text>
          </View>

          <Text style={styles.question} numberOfLines={2}>
            {post.question}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.authorText}>{post.author.nickname}</Text>
            <Text style={styles.metaText}>
              {post.annotationCount} 条批注 · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  shell: {
    borderRadius: BorderRadius.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
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
  strengthText: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
  },
  genderText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  question: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  authorText: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
  },
});

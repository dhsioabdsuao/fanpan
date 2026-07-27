import { StyleSheet, View, ScrollView, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FONT_SERIF, Spacing } from '../theme';
import BirthForm from '../components/bazi/BirthForm';
import RecentReadings from '../components/RecentReadings';
import { loadRecords, deleteRecord } from '../services/storage';
import type { SavedRecord } from '../services/storage';
import type { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      loadRecords().then(setRecords);
    }, [])
  );

  const handleRecordPress = (record: SavedRecord) => {
    navigation.navigate('Result', record.birthParams);
  };

  const handleRecordDelete = async (id: string) => {
    await deleteRecord(id);
    const updated = await loadRecords();
    setRecords(updated);
  };
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

          {/* Recent Readings */}
          <RecentReadings
            records={records}
            onPress={handleRecordPress}
            onDelete={handleRecordDelete}
          />

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
  privacyLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  privacyLinkText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

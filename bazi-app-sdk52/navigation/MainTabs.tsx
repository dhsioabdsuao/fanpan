import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { MainTabParamList } from './types';
import HomeStack from './HomeStack';
import SquareStack from './SquareStack';
import ProfileStack from './ProfileStack';
import { useThemeColors, useIsDark } from '../theme/ThemeContext';
import { FONT_SERIF } from '../theme/typography';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 印章式汉字图标(零图标依赖,贴合新中式风格) */
function SealGlyph({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={[styles.sealBox, { borderColor: color }]}>
      <Text style={[styles.sealGlyph, { color }]}>{glyph}</Text>
    </View>
  );
}

const tabPressHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export default function MainTabs() {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.goldDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.glassBg,
          borderTopColor: colors.hairlineGold,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: FONT_SERIF,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        listeners={{ tabPress: tabPressHaptic }}
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <SealGlyph glyph="命" color={color} />,
        }}
      />
      <Tab.Screen
        name="SquareTab"
        component={SquareStack}
        listeners={{ tabPress: tabPressHaptic }}
        options={{
          title: '广场',
          tabBarIcon: ({ color }) => <SealGlyph glyph="场" color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        listeners={{ tabPress: tabPressHaptic }}
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <SealGlyph glyph="我" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  sealBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealGlyph: {
    fontFamily: FONT_SERIF,
    fontSize: 14,
    lineHeight: 18,
  },
});

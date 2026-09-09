import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/** 首页 Tab:排盘工具(与改造前 AppNavigator 内容一致,行为不变) */
export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}

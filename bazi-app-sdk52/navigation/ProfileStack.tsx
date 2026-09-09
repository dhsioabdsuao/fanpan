import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/community/ProfileScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/** 我的 Tab:个人中心 */
export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

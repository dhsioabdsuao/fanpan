import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/community/LoginScreen';
import UserAgreementScreen from '../screens/community/UserAgreementScreen';
import PublishScreen from '../screens/community/PublishScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="Publish" component={PublishScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="UserAgreement" component={UserAgreementScreen} />
    </Stack.Navigator>
  );
}

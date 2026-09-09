import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SquareStackParamList } from './types';
import SquareScreen from '../screens/community/SquareScreen';

const Stack = createNativeStackNavigator<SquareStackParamList>();

/** 广场 Tab:帖子流 */
export default function SquareStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Feed" component={SquareScreen} />
    </Stack.Navigator>
  );
}

import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import TaijiBackground from './components/layout/TaijiBackground';

export default function App() {
  return (
    <View style={styles.root}>
      <TaijiBackground opacity={0.7} />
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { AppThemeProvider } from './theme/ThemeContext';
import TaijiBackground from './components/layout/TaijiBackground';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <TaijiBackground opacity={0.7} />
        <SafeAreaProvider>
          <AppThemeProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AppThemeProvider>
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

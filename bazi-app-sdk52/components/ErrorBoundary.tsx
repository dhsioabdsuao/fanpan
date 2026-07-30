import { Component, type ReactNode } from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>启动异常</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? '未知错误'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b7355',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#a09888',
    textAlign: 'center',
  },
});

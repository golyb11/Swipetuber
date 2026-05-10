import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { themes, getTypography } from '../theme/theme';
import * as Updates from 'expo-updates';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<Props & { theme: 'savanna' | 'midnight' }, State> {
  constructor(props: Props & { theme: 'savanna' | 'midnight' }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      const colors = themes[this.props.theme];
      const typography = getTypography(colors);

      return (
        <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
          <Text style={[typography.mainTitle, styles.title, { color: colors.typographyDark }]}>Oops! Something went wrong.</Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.typographyDark }]}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.typographyDark }]} onPress={this.handleRestart}>
            <Text style={[typography.body, styles.buttonText, { color: colors.cardSurface }]}>Restart App</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject theme hook into class component
export const ErrorBoundary = (props: Props) => {
  const { theme } = useStore();
  return <ErrorBoundaryClass {...props} theme={theme} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 100,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

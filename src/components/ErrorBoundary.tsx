import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

interface Props {
  children: ReactNode;
  screenName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ErrorBoundary] Caught error in ${this.props.screenName || 'Screen'}:`,
      error,
      errorInfo,
    );
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.handleReset();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const title = this.props.screenName
      ? `Error in ${this.props.screenName}`
      : 'Something went wrong';

    const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="alert-triangle" size={32} color="#DC2626" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            We encountered a problem while loading this section. You can try refreshing the page or
            reloading this view.
          </Text>

          {/* Quick error banner */}
          <View style={styles.messageBanner}>
            <Feather name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 2 }} />
            <Text style={styles.messageBannerText} numberOfLines={3}>
              {errorMessage}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color={colors.navyText} />
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={this.handleReload}
              activeOpacity={0.8}
            >
              <Feather name="rotate-ccw" size={16} color={colors.bodyText} />
              <Text style={styles.secondaryBtnText}>Reload Page</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleDetailsBtn}
              onPress={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
              activeOpacity={0.8}
            >
              <Feather
                name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.mutedText}
              />
              <Text style={styles.toggleDetailsText}>
                {this.state.showDetails ? 'Hide Technical Details' : 'View Technical Details'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible details for troubleshooting */}
          {this.state.showDetails && (
            <ScrollView style={styles.detailsBox} nestedScrollEnabled>
              <Text style={styles.detailsHeader}>Stack Trace & Diagnostic Info</Text>
              <Text style={styles.detailsText} selectable>
                {this.state.error?.stack || this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    );
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  screenName?: string,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary screenName={screenName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxWidth: 580,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: '#991B1B',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.bodyText,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  messageBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.md,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  toggleDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toggleDetailsText: {
    fontSize: 12,
    color: colors.mutedText,
    fontWeight: '600',
  },
  detailsBox: {
    marginTop: spacing.md,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  detailsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    lineHeight: 16,
  },
});

export default ErrorBoundary;

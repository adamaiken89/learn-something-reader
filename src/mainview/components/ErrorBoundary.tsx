import { Component } from 'react';

import { logger } from '../logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(
      { err: error.message, stack: error.stack, componentStack: info.componentStack },
      'React error boundary caught',
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-2">Something went wrong</p>
              <p className="text-sm text-gray-500">{this.state.error?.message}</p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

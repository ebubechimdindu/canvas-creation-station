
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
          <div className="text-center space-y-6 p-8 max-w-md">
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="hover:scale-105 transition-transform duration-300"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React from 'react';
import Button from './Button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-16 px-4 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-6 text-rose-500 text-2xl font-bold">
              !
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred during rendering.'}
            </p>
            <div className="flex gap-4 w-full justify-center">
              <Button variant="outline" onClick={this.handleGoHome} className="px-6 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700">
                Go Home
              </Button>
              <Button onClick={this.handleRetry} className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800">
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, ReactNode } from 'react';

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

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
                        <div className="text-6xl mb-4 text-center">⚠️</div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                            Something went wrong
                        </h2>
                        <p className="text-slate-600 mb-6 text-center">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex-1 bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-medium hover:bg-slate-300"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                        {this.state.error && (
                            <details className="mt-4">
                                <summary className="text-xs text-slate-500 cursor-pointer">
                                    Error details
                                </summary>
                                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

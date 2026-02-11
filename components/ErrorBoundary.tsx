import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Erro não capturado:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h1>
                        <p className="text-sm text-gray-500 mb-6">
                            Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
                        </p>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 overflow-auto max-h-32 text-left">
                            <p className="font-mono text-xs text-red-700 break-words">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                            >
                                Voltar ao Início
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors text-sm"
                            >
                                Recarregar Página
                            </button>
                        </div>

                        {this.state.errorInfo && (
                            <details className="mt-4 text-xs text-gray-400 text-left">
                                <summary className="cursor-pointer hover:text-gray-600">Detalhes técnicos</summary>
                                <pre className="mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
                                    {this.state.errorInfo.componentStack}
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

export default ErrorBoundary;

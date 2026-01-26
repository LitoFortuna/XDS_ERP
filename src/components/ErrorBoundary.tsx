
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
    }

    public state: State = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-gray-800 border border-red-500/30 rounded-3xl p-8 shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">¡Vaya! Algo salió mal</h2>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Se ha producido un error inesperado al cargar esta sección. Hemos notificado al equipo técnico.
                        </p>
                        <div className="bg-gray-900 rounded-xl p-4 mb-8 text-left border border-gray-700">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Detalle del error:</p>
                            <p className="text-xs font-mono text-red-400 break-words">{this.state.error?.message || 'Error desconocido'}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                        >
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return (this as any).props.children;
    }
}

export default ErrorBoundary;

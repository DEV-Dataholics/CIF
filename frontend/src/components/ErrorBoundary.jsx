import React from 'react';
import { Warning } from '@phosphor-icons/react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in">
          <Warning size={64} className="text-danger mb-4 opacity-80" weight="fill" />
          <h2 className="text-xl font-bold font-headline mb-2 text-on-surface">Ocurrió un error inesperado en esta vista</h2>
          <p className="text-outline max-w-md mb-6">{this.state.error?.message || 'Error de renderizado.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-on-primary px-6 py-2 rounded font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

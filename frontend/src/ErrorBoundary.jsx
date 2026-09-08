import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background text-on-background">
          <div className="bg-error/10 text-error p-6 rounded-xl border border-error/20 max-w-lg shadow-xl animate-in fade-in zoom-in duration-300">
            <h1 className="font-headline text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              ⚠️ Ups, algo salió mal.
            </h1>
            <p className="font-body text-sm mb-4">
              Ocurrió un error inesperado al cargar esta sección. Hemos protegido el resto de la aplicación para que puedas seguir trabajando.
            </p>
            <div className="bg-surface p-3 rounded font-mono text-xs text-left overflow-auto mb-6 max-h-32 shadow-inner border border-outline-variant/30 text-outline">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-error text-on-error font-label font-bold uppercase tracking-widest px-6 py-3 rounded hover:brightness-110 transition-all"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

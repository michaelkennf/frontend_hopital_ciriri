import React from 'react';

export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || 'Erreur de rendu' };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Log l'erreur dans la console pour debug
    console.error('Erreur de rendu capturée:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
          {this.state.errorMsg}
        </div>
      );
    }
    return this.props.children;
  }
} 
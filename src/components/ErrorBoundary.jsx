import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1>Erreur</h1>
          <p>Une erreur est survenue.</p>
          <button className="btn btn-or" onClick={() => window.location.reload()}>
            Rafraîchir
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
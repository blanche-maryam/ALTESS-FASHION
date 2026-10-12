import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page-not-found">
      <h1 className="page-title">404</h1>
      <p>Page non trouvée.</p>
      <Link to="/" className="btn btn-or">Retour à l'accueil</Link>
    </div>
  );
}
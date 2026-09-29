import { Link } from 'react-router-dom';
import logoUrl from '../assets/logo.png';
import { Nom_Entrprise } from '../global.jsx';

/**
 * Marque ALTESS FASHION : l'emblème doré + le nom.
 * L'image est importée (et non référencée par /src/...) pour que Vite la
 * hache et la copie dans dist : un chemin /src/assets/... renvoie le fallback
 * SPA une fois le site compilé.
 */
export default function Brand({ size = 40, withText = true, asLink = true }) {
  const content = (
    <>
      <img src={logoUrl} alt="" className="brand-mark" style={{ height: size, width: size }} />
      {withText && <span className="brand-text">{Nom_Entrprise}</span>}
    </>
  );

  if (!asLink) return <span className="brand">{content}</span>;
  return (
    <Link to="/" className="brand" aria-label={`${Nom_Entrprise} — accueil`}>
      {content}
    </Link>
  );
}

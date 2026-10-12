import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import Brand from '../components/Brand.jsx';
import { Nom_Entrprise, Contact_Infos, WhatsApp_Lien } from '../global.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <Reveal className="footer-brand">
          <Brand size={44} />
          <p>Mode haut de gamme pour femmes et hommes. Élégance, qualité et style.</p>
        </Reveal>
        <Reveal index={1} step={90}>
          <div className="footer-col">
            <h4>Boutique</h4>
            <Link to="/boutique">Tous les produits</Link>
            <Link to="/femme">Collection Femme</Link>
            <Link to="/homme">Collection Homme</Link>
          </div>
        </Reveal>
        <Reveal index={2} step={90}>
          <div className="footer-col">
            <h4>Informations</h4>
            <Link to="/a-propos">À propos</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/mes-commandes">Mes commandes</Link>
          </div>
        </Reveal>
        <Reveal index={3} step={90}>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href={`mailto:${Contact_Infos.email}`}>{Contact_Infos.email}</a>
            <a href={WhatsApp_Lien} target="_blank" rel="noopener noreferrer">{Contact_Infos.telephone}</a>
            <p>{Contact_Infos.adresse}</p>
          </div>
        </Reveal>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {Nom_Entrprise}. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
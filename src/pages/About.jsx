import Reveal from '../components/Reveal.jsx';

export default function About() {
  return (
    <div className="container page-about page-enter">
      <Reveal as="h1" className="page-title">À Propos d'ALTESS FASHION</Reveal>
      <Reveal className="about-content">
        <p>ALTESS FASHION est une boutique de mode premium dédiée à l'élégance féminine et masculine. Notre mission est d'offrir des vêtements, chaussures, bijoux et accessoires de qualité supérieure, alliant tradition et modernité.</p>
        <p>Située au cœur du Cameroun, nous desservons nos clients avec passion et exigence, en sélectionnant les meilleures matières et en garantissant un service irréprochable.</p>
      </Reveal>
      <Reveal as="h2" className="section-title">Nos valeurs</Reveal>
      <div className="features-grid">
        {[
          ['Excellence','Qualité à chaque étape.'],
          ['Innovation','Collections tendance et intemporelles.'],
          ['Service','Un accompagnement personnalisé.'],
        ].map(([t,p], i) => (
          <Reveal key={t} index={i} step={100}>
            <div className="feature"><h3>{t}</h3><p>{p}</p></div>
          </Reveal>
        ))}
      </div>
      <Reveal as="h2" className="section-title">Notre histoire</Reveal>
      <Reveal className="about-content">
        <p>Fondée avec la vision de démocratiser la mode premium, ALTESS FASHION a grandi pour devenir une référence en matière de style et d'élégance. Chaque pièce sélectionnée reflète notre engagement envers l'excellence.</p>
      </Reveal>
    </div>
  );
}
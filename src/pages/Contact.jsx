import { useState } from 'react';
import Reveal from '../components/Reveal.jsx';
import { Contact_Infos, WhatsApp_Lien, contactMailto, contactTel } from '../global.jsx';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); setSent(true); };

  const socials = [
    Contact_Infos.facebook && { label: 'Facebook', href: Contact_Infos.facebook },
    Contact_Infos.instagram && { label: 'Instagram', href: Contact_Infos.instagram },
    { label: 'WhatsApp', href: WhatsApp_Lien },
  ].filter(Boolean);

  return (
    <div className="container page-contact">
      <Reveal as="h1" className="page-title">Contactez-nous</Reveal>
      <div className="contact-grid">
        <Reveal className="contact-info">
          <h3>Informations</h3>
          <p><strong>Téléphone:</strong> <a href={contactTel}>{Contact_Infos.telephone}</a></p>
          <p><strong>WhatsApp:</strong> <a href={WhatsApp_Lien} target="_blank" rel="noopener noreferrer">{Contact_Infos.telephone}</a></p>
          <p><strong>Email:</strong> <a href={contactMailto}>{Contact_Infos.email}</a></p>
          <p><strong>Adresse:</strong> {Contact_Infos.adresse}</p>
          <div className="socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
            ))}
          </div>
        </Reveal>
        <Reveal variant="right" className="contact-form-wrapper">
          {sent ? (
            <p className="success-msg anim-scale-in">Merci pour votre message ! Nous vous répondrons sous peu.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {['name','email','subject','message'].map((name, i) => (
                <Reveal key={name} index={i} step={70} className="champ">
                  <label>{name==='name'?'Nom':name==='email'?'Email':name==='subject'?'Objet':'Message'}</label>
                  {name === 'message' ? (
                    <textarea name={name} value={form[name]} onChange={handleChange} rows={5} required />
                  ) : (
                    <input type={name==='email'?'email':'text'} name={name} value={form[name]} onChange={handleChange} required />
                  )}
                </Reveal>
              ))}
              <Reveal index={4} step={70}>
                <button type="submit" className="btn btn-primaire">Envoyer</button>
              </Reveal>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}

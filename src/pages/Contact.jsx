import { useState } from 'react';
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
      <h1>Contactez-nous</h1>
      <div className="contact-grid">
        <div className="contact-info">
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
        </div>
        <div className="contact-form-wrapper">
          {sent ? (
            <p className="success-msg">Merci pour votre message ! Nous vous répondrons sous peu.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="champ"><label>Nom</label><input name="name" value={form.name} onChange={handleChange} required /></div>
              <div className="champ"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} required /></div>
              <div className="champ"><label>Objet</label><input name="subject" value={form.subject} onChange={handleChange} required /></div>
              <div className="champ"><label>Message</label><textarea name="message" value={form.message} onChange={handleChange} rows={5} required /></div>
              <button type="submit" className="btn btn-primaire">Envoyer</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

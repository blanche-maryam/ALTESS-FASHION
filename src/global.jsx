
/** Fichier pour les variable globals */


// Variables globales
export const Nom_Entrprise = "ALTESS FASHION";

// Coordonnées affichées sur le site (contact, pied de page, liens sociaux).
export const Contact_Infos = {
  telephone: '+237 656619543',
  email: 'blanchemaryam@gmail.com',
  adresse: '1234 Rue, Douala, Cameroun',
  facebook: '',
  instagram: '',
};

// WhatsApp n'accepte que les chiffres, indicatif pays inclus, sans « + »
// ni séparateurs : +237 656 61 95 43 devient 237656619543.
export const WhatsApp_Numero = '237656619543';
export const WhatsApp_Lien = `https://wa.me/${WhatsApp_Numero}`;

export const contactMailto = `mailto:${Contact_Infos.email}`;
export const contactTel = `tel:${Contact_Infos.telephone.replace(/[^\d+]/g, '')}`;

/**
 * Dictionnaire des libellés d'interface (chrome UI) - distinct des textes de
 * contenu qui proviennent, eux, des colonnes _fr/_en de Neon via l'API
 * /api/configuration/textes (règle du "zéro texte figé" appliquée au contenu
 * éditorial ; ces libellés structurels de navigation restent en dur ici).
 */
const DICTIONNAIRE_INTERFACE = {
  nav_accueil: { fr: 'Accueil', en: 'Home' },
  nav_services: { fr: 'Services', en: 'Services' },
  nav_temoignages: { fr: 'Témoignages', en: 'Testimonials' },
  nav_faq: { fr: 'FAQ', en: 'FAQ' },
  nav_actualites: { fr: 'Actualités', en: 'News' },
  nav_blog: { fr: 'Blog', en: 'Blog' },
  nav_contact: { fr: 'Contact', en: 'Contact' },
  pied_liens_rapides: { fr: 'Liens rapides', en: 'Quick links' },
  pied_contact: { fr: 'Contact', en: 'Contact' },
  chatbot_titre: { fr: 'Conseiller Virtuel HI CONSULTING', en: 'HI CONSULTING Virtual Advisor' },
  voir_tout: { fr: 'Voir tout →', en: 'See all →' },
  formulaire_envoyer: { fr: 'Envoyer ma demande', en: 'Send my request' },
  filtre_tous: { fr: 'Tous', en: 'All' },
  accueil_slogan: {
    fr: 'Nous vous garantissons un service de qualité pour la réussite de votre projet d\'immigration.',
    en: 'We guarantee quality service for the success of your immigration project.'
  },
  accueil_bouton_services: { fr: 'Découvrir nos services', en: 'Discover our services' },
  accueil_bouton_evaluation: { fr: 'Évaluation gratuite', en: 'Free evaluation' },
  accueil_apropos_titre: { fr: 'Qui sommes-nous ?', en: 'Who we are' },
  accueil_apropos_texte: {
    fr: 'HI CONSULTING IMMIGRATION accompagne depuis octobre 2020 les candidats à l\'immigration vers le Canada, la France, l\'Italie et la Belgique. Implantée à Douala, notre agence s\'est spécialisée depuis 2025 dans les procédures d\'immigration du Canada : résidence permanente, Entrée Express et ARRIMA.',
    en: 'Since October 2020, HI CONSULTING IMMIGRATION has supported candidates immigrating to Canada, France, Italy and Belgium. Based in Douala, our agency has specialized since 2025 in Canadian immigration procedures: permanent residence, Express Entry and ARRIMA.'
  },
  accueil_services_titre: { fr: 'Nos services phares', en: 'Our flagship services' },
  accueil_mission_titre: { fr: 'Notre mission', en: 'Our mission' },
  accueil_vision_titre: { fr: 'Notre vision', en: 'Our vision' },
  accueil_equipe_titre: { fr: 'Notre équipe', en: 'Our team' },
  accueil_formulaire_titre: { fr: 'Évaluez votre projet gratuitement', en: 'Evaluate your project for free' },
  accueil_actualites_titre: { fr: 'Dernières actualités migratoires', en: 'Latest immigration news' },
  services_titre_page: { fr: 'Nos Services d\'Immigration', en: 'Our Immigration Services' },
  services_sous_titre: { fr: 'Canada, France, Italie et Belgique : un accompagnement complet à chaque étape.', en: 'Canada, France, Italy and Belgium: full support at every step.' },
  faq_titre_page: { fr: 'Foire Aux Questions', en: 'Frequently Asked Questions' },
  faq_sous_titre: { fr: 'Les réponses aux questions les plus posées sur l\'immigration.', en: 'Answers to the most common immigration questions.' },
  temoignages_titre_page: { fr: 'Témoignages de Réussite', en: 'Success Stories' },
  temoignages_sous_titre: { fr: 'Ils ont fait confiance à HI CONSULTING IMMIGRATION.', en: 'They trusted HI CONSULTING IMMIGRATION.' },
  actualites_titre_page: { fr: 'Actualités Migratoires', en: 'Immigration News' },
  actualites_sous_titre: { fr: 'Les dernières lois et tendances en immigration, mises à jour en temps réel.', en: 'The latest immigration laws and trends, updated in real time.' },
  actualites_bouton_synthese: { fr: 'Synthèse IA globale', en: 'Global AI summary' },
  contact_titre_page: { fr: 'Contactez-nous', en: 'Contact us' },
  contact_sous_titre: { fr: 'Une évaluation gratuite et sans engagement de votre projet d\'immigration.', en: 'A free, no-obligation evaluation of your immigration project.' },
  contact_infos_titre: { fr: 'Nos coordonnées', en: 'Our contact details' },
  contact_carte_indisponible: { fr: 'Localisation Google Maps configurable depuis le Back-Office.', en: 'Google Maps location configurable from the Back-Office.' },
  contact_formulaire_titre: { fr: 'Formulaire d\'évaluation préliminaire', en: 'Preliminary evaluation form' },
  contact_label_adresse: { fr: 'Adresse', en: 'Address' },
  contact_label_telephones: { fr: 'Téléphones', en: 'Phone numbers' },
  contact_label_email: { fr: 'Email', en: 'Email' },

  // Placeholders de formulaires
  ph_nom_complet: { fr: 'Nom complet', en: 'Full name' },
  ph_email: { fr: 'Adresse email', en: 'Email address' },
  ph_telephone: { fr: 'Téléphone / WhatsApp', en: 'Phone / WhatsApp' },
  ph_message: { fr: 'Message (facultatif)', en: 'Message (optional)' },
  ph_chatbot: { fr: 'Posez votre question...', en: 'Ask your question...' },

  // Options du champ "Projet choisi" (la valeur envoyée au serveur reste en
  // français pour rester cohérente avec les e-mails/BDD ; seul le libellé
  // affiché change de langue).
  option_choisir_projet: { fr: 'Projet choisi', en: 'Choose your project' },
  option_ca_rp: { fr: 'Canada - Résidence Permanente', en: 'Canada - Permanent Residence' },
  option_ca_etude: { fr: 'Canada - Permis d\'étude', en: 'Canada - Study Permit' },
  option_ca_travail: { fr: 'Canada - Permis de travail', en: 'Canada - Work Permit' },
  option_ca_visiteur: { fr: 'Canada - Visa visiteur', en: 'Canada - Visitor Visa' },
  option_fr_etude: { fr: 'France - Visa étude', en: 'France - Student Visa' },
  option_fr_visiteur: { fr: 'France - Visa visiteur', en: 'France - Visitor Visa' },
  option_it_visiteur: { fr: 'Italie - Visa visiteur', en: 'Italy - Visitor Visa' },
  option_be_etude: { fr: 'Belgique - Visa étude', en: 'Belgium - Student Visa' },

  // Noms de pays (filtres de la page Services)
  pays_canada: { fr: 'Canada', en: 'Canada' },
  pays_france: { fr: 'France', en: 'France' },
  pays_italie: { fr: 'Italie', en: 'Italy' },
  pays_belgique: { fr: 'Belgique', en: 'Belgium' },

  detail_service_bouton_evaluation: { fr: 'Demander une évaluation', en: 'Request an evaluation' },
  blog_titre_page: { fr: 'Blog Immigration', en: 'Immigration Blog' },
  blog_sous_titre: { fr: 'Conseils, guides et analyses pour réussir votre projet d\'immigration.', en: 'Tips, guides and insights to succeed in your immigration project.' },
  ph_recherche_blog: { fr: 'Rechercher un article (ex: visa étudiant, Entrée Express...)', en: 'Search an article (e.g. student visa, Express Entry...)' },
  section_locaux_titre: { fr: 'Nos locaux', en: 'Our offices' },
  section_locaux_texte: { fr: 'Découvrez notre agence à Douala, où nous accueillons chaque candidat avec attention.', en: 'Discover our Douala office, where every candidate is welcomed with care.' }
};

const CLE_STOCKAGE_LANGUE = 'hi_consulting_langue';

function obtenirLangueActive() {
  return localStorage.getItem(CLE_STOCKAGE_LANGUE) || 'fr';
}

function appliquerTraductions(langue) {
  // Textes visibles (titres, paragraphes, options de <select>, libellés de boutons).
  document.querySelectorAll('[data-cle-i18n]').forEach((element) => {
    const cle = element.getAttribute('data-cle-i18n');
    const entree = DICTIONNAIRE_INTERFACE[cle];
    if (entree && entree[langue]) element.textContent = entree[langue];
  });
  // Placeholders des champs de saisie (non couverts par textContent).
  document.querySelectorAll('[data-placeholder-i18n]').forEach((element) => {
    const cle = element.getAttribute('data-placeholder-i18n');
    const entree = DICTIONNAIRE_INTERFACE[cle];
    if (entree && entree[langue]) element.setAttribute('placeholder', entree[langue]);
  });
  document.documentElement.lang = langue;
  document.dispatchEvent(new CustomEvent('langueChangee', { detail: { langue } }));
}

document.addEventListener('DOMContentLoaded', () => {
  const langueInitiale = obtenirLangueActive();
  appliquerTraductions(langueInitiale);

  const boutonSelecteur = document.getElementById('selecteurLangue');
  if (boutonSelecteur) {
    boutonSelecteur.addEventListener('click', () => {
      const langueActuelle = obtenirLangueActive();
      const nouvelleLangue = langueActuelle === 'fr' ? 'en' : 'fr';
      localStorage.setItem(CLE_STOCKAGE_LANGUE, nouvelleLangue);
      appliquerTraductions(nouvelleLangue);
    });
  }
});

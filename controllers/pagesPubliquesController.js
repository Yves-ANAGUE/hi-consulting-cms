const { executerRequete } = require('../config/basededonnees');
const { rendreGabarit } = require('../utils/moteurGabarit');
const {
  construireBaliseMetaHtml,
  genererSchemaLocalBusiness,
  genererSchemaFaqPage,
  genererSchemaTemoignages,
  genererSchemaArticle
} = require('../utils/donneesStructurees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');
const { construireBlocMediaFond } = require('../utils/mediaEmbed');

const ENTREPRISE = {
  nom: 'HI CONSULTING IMMIGRATION',
  slogan: 'Visitez. Travaillez. Éduquez. Nous vous garantissons un service de qualité pour la réussite de votre projet d\'immigration.',
  adresse: 'Logpom, Carrefour Bassong, face KMC, Douala, Cameroun',
  telephones: ['+237678924045', '+237691871842', '+237658937466'],
  email: 'hiciofficiel@gmail.com',
  reseauxSociaux: [
    'https://www.facebook.com/share/19HhsYJj7C/?mibextid=wwXIfr',
    'https://www.tiktok.com/@hiconsultingimmigration?_r=1&_t=ZN-97oP8Tn8xd8'
  ]
};

function genererSchemaNomDuSite() { 
  // Remplacement du localhost par défaut par votre vrai lien Render sécurisé
  const urlSite = process.env.URL_SITE || 'https://hi-consulting-immigration.onrender.com'; 
  
  const schema = { 
    '@context': 'https://schema.org', 
    '@type': 'WebSite', 
    'name': 'HI CONSULTING IMMIGRATION', 
    'alternateName': ['HI Consulting', 'HI Consulting Immigration Douala'], 
    'url': urlSite,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${urlSite}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }; 
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`; 
}


async function obtenirConfigGoogleActive(cheminRequete) {
  // Les routes d'administration ne doivent pas être suivies par GA4.
  if (cheminRequete.startsWith('/admin')) return { idMesureGa4: null, verificationSearchConsole: null };
  const resultat = await executerRequete('SELECT * FROM configuration_google LIMIT 1');
  const ligne = resultat.rows[0];
  return {
    idMesureGa4: ligne?.id_mesure_ga4 || null,
    verificationSearchConsole: ligne?.code_verification_search_console || null
  };
}

/**
 * Récupère les réglages globaux du site (logo réel, numéro WhatsApp flottant,
 * lien Google Maps) injectés dans l'en-tête/pied de page et la page Contact de
 * CHAQUE page publique, via les placeholders résolus par le moteur de gabarit.
 * Restent vides tant que l'administrateur ne les a pas renseignés depuis le
 * Back-Office : le SVG de secours (logo) ou un message explicatif (carte)
 * s'affiche alors à la place.
 */
async function obtenirParametresSite() {
  const resultat = await executerRequete(
    'SELECT url_logo, url_whatsapp_flottant, url_google_maps, url_video_hero, url_image_mission, url_image_vision FROM configuration_google LIMIT 1'
  );
  const ligne = resultat.rows[0];
  const urlGoogleMaps = ligne?.url_google_maps || '';
  const urlVideoHero = ligne?.url_video_hero || '';
  return {
    urlLogo: ligne?.url_logo || '/static/images/logo_HICI.jpg',
    whatsappFlottant: ligne?.url_whatsapp_flottant || '',
    urlImageMission: ligne?.url_image_mission || 'https://res.cloudinary.com/jmqph5iy/image/upload/v1785835978/photo_mission_le5ce8.jpg',
    urlImageVision: ligne?.url_image_vision || 'https://res.cloudinary.com/jmqph5iy/image/upload/v1785840405/image_vision_biyvu1.png',
    blocCarteGoogleMaps: urlGoogleMaps
      ? `<iframe src="${urlGoogleMaps}" width="100%" height="300" style="border:0;border-radius:10px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
      : `<p class="texte-secondaire">Localisation Google Maps configurable depuis le Back-Office (onglet Configuration Google).</p>`,
    // Vidéo héros configurable depuis le Back-Office (Configuration Google) ;
    // accepte un fichier direct (Cloudinary...) OU un lien YouTube/Vimeo ;
    // repli automatique sur l'image fixe tant qu'aucun média n'est renseigné.
    blocMediaHero: construireBlocMediaFond(urlVideoHero, {
      classe: urlVideoHero ? 'heros-video' : 'heros-image',
      alt: 'Voyage vers le Canada, avion et destination d\'immigration',
      
    })
  };
}

function urlCanoniqueDepuis(requete) {
  return `${process.env.URL_SITE || 'http://localhost:3000'}${requete.path}`;
}

async function rendrePageAccueil(requete, reponse) { 
  const [configGoogle, parametresSite] = await Promise.all([ 
    obtenirConfigGoogleActive(requete.path), 
    obtenirParametresSite() 
  ]); 
  const balisesMeta = construireBaliseMetaHtml({ titre: 'HI CONSULTING IMMIGRATION | Réussir au Canada', description: ENTREPRISE.slogan, urlCanonique: urlCanoniqueDepuis(requete), ...configGoogle }); 
  const schemaLocalBusiness = genererSchemaLocalBusiness(ENTREPRISE); 
  
  // Nouveau schéma d'identité généré
  const schemaNomDuSite = genererSchemaNomDuSite();

  // Envoi des variables complètes au gabarit
  const html = rendreGabarit('accueil.html', { 
    balisesMeta, 
    schemaLocalBusiness, 
    schemaNomDuSite, // <-- Nouvelle variable passée au HTML
    ...parametresSite 
  }); 
  reponse.send(html); 
}

async function rendrePageServices(requete, reponse) {
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Nos Services d\'Immigration - Canada, France, Belgique | HI CONSULTING',
    description: 'Résidence permanente, Entrée Express, ARRIMA, permis d\'étude et de travail : découvrez tous nos services.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  reponse.send(rendreGabarit('services.html', { balisesMeta, ...parametresSite }));
}

async function rendrePageDetailService(requete, reponse) {
  const { slug } = requete.params;
  const resultat = await executerRequete('SELECT * FROM services WHERE slug = $1', [slug]);
  const service = resultat.rows[0];
  if (!service) return reponse.status(404).send(rendreGabarit('404.html', {}));

  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: service.meta_titre_fr || service.titre_fr,
    description: service.meta_description_fr || service.description_fr,
    urlImage: service.url_image,
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  reponse.send(rendreGabarit('detail-service.html', { balisesMeta, idServiceJson: JSON.stringify(service), ...parametresSite }));
}

async function rendrePageFaq(requete, reponse) {
  const resultatFaq = await executerRequete('SELECT * FROM foire_aux_questions ORDER BY ordre_affichage ASC');
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Foire Aux Questions - Immigration Canada | HI CONSULTING',
    description: 'Retrouvez les réponses aux questions les plus fréquentes sur l\'immigration au Canada, en France et en Belgique.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  const schemaFaq = genererSchemaFaqPage(resultatFaq.rows, 'fr');
  reponse.send(rendreGabarit('faq.html', { balisesMeta, schemaFaq, ...parametresSite }));
}

async function rendrePageTemoignages(requete, reponse) {
  const resultatTemoignages = await executerRequete('SELECT * FROM temoignages ORDER BY cree_le DESC');
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Témoignages de Réussite - Immigration Canada | HI CONSULTING',
    description: 'Découvrez les témoignages authentiques de nos clients ayant obtenu leur visa vers le Canada et l\'Europe.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  const schemaTemoignages = genererSchemaTemoignages(resultatTemoignages.rows);
  reponse.send(rendreGabarit('temoignages.html', { balisesMeta, schemaTemoignages, ...parametresSite }));
}

async function rendrePageActualites(requete, reponse) {
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Actualités Migratoires 2026 - Canada, France, Belgique | HI CONSULTING',
    description: 'Suivez en temps réel les dernières lois et actualités migratoires du Canada et de l\'Europe.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  reponse.send(rendreGabarit('actualites.html', { balisesMeta, ...parametresSite }));
}

async function rendrePageContact(requete, reponse) {
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Contact - Évaluation Gratuite de votre Projet | HI CONSULTING',
    description: 'Contactez HI CONSULTING IMMIGRATION à Douala pour une évaluation gratuite de votre projet d\'immigration.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  reponse.send(rendreGabarit('contact.html', { balisesMeta, ...parametresSite }));
}

async function rendrePageBlogListe(requete, reponse) {
  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: 'Blog Immigration - Conseils et Actualités | HI CONSULTING',
    description: 'Nos articles pour réussir votre projet d\'immigration au Canada, en France, en Italie et en Belgique.',
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  reponse.send(rendreGabarit('blog.html', { balisesMeta, ...parametresSite }));
}

async function rendrePageBlogDetail(requete, reponse) {
  const { slug } = requete.params;
  const resultat = await executerRequete('SELECT * FROM articles WHERE slug = $1 AND publie = true', [slug]);
  const article = resultat.rows[0];
  if (!article) return reponse.status(404).send(rendreGabarit('404.html', {}));

  const [configGoogle, parametresSite] = await Promise.all([
    obtenirConfigGoogleActive(requete.path),
    obtenirParametresSite()
  ]);
  const balisesMeta = construireBaliseMetaHtml({
    titre: article.meta_titre_fr || article.titre_fr,
    description: article.meta_description_fr || article.resume_fr,
    urlImage: article.url_image_couverture,
    urlCanonique: urlCanoniqueDepuis(requete),
    ...configGoogle
  });
  const schemaArticle = genererSchemaArticle(article, urlCanoniqueDepuis(requete));
  reponse.send(rendreGabarit('blog-detail.html', {
    balisesMeta, schemaArticle, idArticleJson: JSON.stringify(article), ...parametresSite
  }));
}

module.exports = {
  ...envelopperTousLesControleurs({
    rendrePageAccueil, rendrePageServices, rendrePageDetailService,
    rendrePageFaq, rendrePageTemoignages, rendrePageActualites, rendrePageContact,
    rendrePageBlogListe, rendrePageBlogDetail
  }),
  ENTREPRISE
};

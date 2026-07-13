const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cacheMemoire = require('./cacheMemoire');

const CLE_CACHE_ACTUALITES = 'flux_actualites_migratoires';
const DUREE_CACHE_MS = 60 * 60 * 1000; // 1 heure, imposé par le cahier des charges

const SOURCES_RSS = [
  process.env.RSS_SOURCE_URL_1,
  process.env.RSS_SOURCE_URL_2
].filter(Boolean);

/**
 * Actualités de secours affichées si aucune source RSS n'est joignable
 * (évite un fil vide qui nuirait à l'expérience utilisateur et au SEO).
 * Chaque lien pointe vers une page officielle précise du sujet traité
 * (et non une simple page d'accueil), pour rester utile même en secours.
 */
const ACTUALITES_SECOURS = [
  {
    titre: 'Entrée Express : consultez les dernières rondes d\'invitations',
    resume: 'IRCC publie en continu le détail de chaque ronde d\'invitations Entrée Express : type de ronde, nombre d\'invitations et score CRS minimal.',
    lien: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html',
    source: 'Canada.ca - IRCC',
    datePublication: new Date().toISOString()
  },
  {
    titre: 'France : la procédure de visa étudiant expliquée sur France-Visas',
    resume: 'Le site officiel France-Visas détaille les conditions, pièces justificatives et étapes pour obtenir un visa étudiant vers la France.',
    lien: 'https://france-visas.gouv.fr/etudiant',
    source: 'France-Visas',
    datePublication: new Date().toISOString()
  },
  {
    titre: 'Programme régulier des travailleurs qualifiés (Arrima) : déposer sa déclaration d\'intérêt',
    resume: 'Le gouvernement du Québec détaille la marche à suivre pour créer un compte Arrima et déposer une déclaration d\'intérêt.',
    lien: 'https://www.quebec.ca/immigration/permanente/travailleurs-qualifies/programme-selection-travailleurs-qualifies/declaration-interet',
    source: 'Gouvernement du Québec',
    datePublication: new Date().toISOString()
  }
];

/**
 * Décode les entités HTML nommées/numériques les plus courantes restant
 * après le retrait des balises (Google News encode ses descriptions en
 * HTML, ex: "Titre&nbsp;&nbsp;Source"). Sans ce décodage, "&nbsp;" et
 * consorts s'affichaient littéralement dans le texte, illisibles.
 */
function decoderEntitesHtml(texte) {
  return texte
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, '\'')
    .replace(/&#(\d+);/g, (correspondance, code) => String.fromCharCode(code))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nettoie un résumé provenant du RSS : retire les instructions de prompt,
 * le contenu en anglais mélangé, et les textes suspects (très longs, avec
 * trop de points d'interrogation, etc.). Cela améliore la qualité de la
 * synthèse IA générée par OpenRouter.
 */
function nettoyerResume(texte) {
  if (!texte) return '';
  
  let nettoye = decoderEntitesHtml(texte);
  
  // Retire les grandes portions de texte en anglais pur (contenant beaucoup de mots anglais courants)
  // Cette heuristique évite les articles Google News mal parsés qui mélangent le français et l'anglais
  const motsClesAnglais = ['must', 'need', 'should', 'would', 'could', 'should', 'according', 'provide', 'concise'];
  const nombreMotsAnglais = (nettoye.match(/\b(must|need|should|would|could|according|provide)\b/gi) || []).length;
  
  // Si plus de 3 mots-clés anglais courants : c'est probablement du contenu anglais non filtré
  if (nombreMotsAnglais >= 3 && nettoye.length > 300) {
    // Prendre que la première phrase française cohérente
    const phrases = nettoye.split(/[.!?]+/).filter(p => p.trim().length > 20);
    if (phrases.length > 0) {
      const premierePhraseUtile = phrases.find(p => {
        const motsPourcentAnglais = (p.match(/\b(must|need|should|would|could|according|provide)\b/gi) || []).length / (p.split(/\s+/).length || 1);
        return motsPourcentAnglais < 0.2; // Moins de 20% de mots anglais
      });
      if (premierePhraseUtile) {
        nettoye = premierePhraseUtile.trim();
      }
    }
  }
  
  // Limite la longueur à 220 caractères pour éviter les résumés énormes
  nettoye = tronquerSurMot(nettoye, 220);
  
  return nettoye;
}

/**
 * Tronque un texte à une longueur maximale sans jamais couper un mot en
 * plein milieu (évite l'effet "texte coupé/étrange" en fin de résumé).
 */
function tronquerSurMot(texte, longueurMax) {
  if (texte.length <= longueurMax) return texte;
  const tronque = texte.slice(0, longueurMax);
  const dernierEspace = tronque.lastIndexOf(' ');
  return `${dernierEspace > 0 ? tronque.slice(0, dernierEspace) : tronque}…`;
}

async function recupererFluxUnique(urlFlux) {
  const reponse = await fetch(urlFlux, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HIConsultingBot/1.0)' } });
  if (!reponse.ok) throw new Error(`Statut HTTP ${reponse.status}`);
  const contenuXml = await reponse.text();
  const analyseur = new xml2js.Parser({ explicitArray: false, trim: true });
  const resultat = await analyseur.parseStringPromise(contenuXml);
  const elements = resultat?.rss?.channel?.item || [];
  const listeElements = Array.isArray(elements) ? elements : [elements];
  return listeElements.slice(0, 10).map((element) => {
    // Le flux Google News fournit une balise <source> avec le vrai nom du
    // média (ex. "Radio-Canada") ; on l'utilise en priorité sur le nom de
    // domaine du flux lui-même (qui serait toujours "news.google.com").
    const nomSource = (typeof element.source === 'object' ? element.source?._ : element.source) || new URL(urlFlux).hostname;
    const descriptionBrute = decoderEntitesHtml((element.description || '').replace(/<[^>]*>/g, ''));
    // Google News répète parfois le titre + le nom de la source dans la
    // description brute ; on retire ce doublon quand on le détecte.
    const titreNettoye = decoderEntitesHtml((element.title || 'Actualité migratoire').replace(/<[^>]*>/g, ''));
    const resumeSansDoublon = descriptionBrute.replace(titreNettoye, '').trim() || descriptionBrute;
    return {
      titre: titreNettoye,
      resume: nettoyerResume(resumeSansDoublon),
      lien: element.link,
      source: nomSource,
      datePublication: element.pubDate || new Date().toISOString()
    };
  });
}

/**
 * Récupère les actualités migratoires en agrégeant toutes les sources RSS.
 * Résultat mis en cache RAM 1h pour un affichage instantané aux visiteurs
 * suivants et pour ne pas ré-interroger les sources externes à chaque clic.
 */
async function recupererActualites() {
  const enCache = cacheMemoire.obtenir(CLE_CACHE_ACTUALITES);
  if (enCache) return enCache;

  let toutesLesActualites = [];
  try {
    if (SOURCES_RSS.length === 0) throw new Error('Aucune source RSS configurée');
    const resultats = await Promise.allSettled(SOURCES_RSS.map(recupererFluxUnique));
    resultats.forEach((resultat) => {
      if (resultat.status === 'fulfilled') toutesLesActualites.push(...resultat.value);
    });
    if (toutesLesActualites.length === 0) throw new Error('Toutes les sources RSS ont échoué');
  } catch (erreur) {
    console.warn('[AnalyseurRss] Bascule sur les actualités de secours :', erreur.message);
    toutesLesActualites = ACTUALITES_SECOURS;
  }

  toutesLesActualites.sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication));
  cacheMemoire.definir(CLE_CACHE_ACTUALITES, toutesLesActualites, DUREE_CACHE_MS);
  return toutesLesActualites;
}

module.exports = { recupererActualites, CLE_CACHE_ACTUALITES };

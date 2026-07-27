const { recupererActualites } = require('../utils/analyseurRss');
const { appelerOpenRouter } = require('../utils/openrouter');
const cacheMemoire = require('../utils/cacheMemoire');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

const CLE_CACHE_RESUME = 'resume_ia_actualites';
const DUREE_CACHE_RESUME_MS = 60 * 60 * 1000; // aligné sur le cache RSS (1h)

async function obtenirActualites(requete, reponse) {
  const actualites = await recupererActualites();
  reponse.json(actualites);
}

/**
 * Génère (ou renvoie depuis le cache) un résumé global des actualités
 * affichées, via OpenRouter. Un seul appel IA par heure et par langue,
 * ce qui protège le quota gratuit de 50 requêtes/jour partagé avec le chatbot.
 */
async function genererResumeGlobal(requete, reponse) {
  const langue = requete.query.langue === 'en' ? 'en' : 'fr';
  const cleCache = `${CLE_CACHE_RESUME}_${langue}`;
  const resumeEnCache = cacheMemoire.obtenir(cleCache);
  if (resumeEnCache) {
    return reponse.json({ resume: resumeEnCache, depuisCache: true });
  }

  const actualites = await recupererActualites();
  
  // Si aucune actualité n'est disponible, on gère le cas immédiatement
  if (!actualites || actualites.length === 0) {
    const messageVide = langue === 'fr' 
      ? "Aucune actualité récente à analyser pour le moment." 
      : "No recent news available for analysis at the moment.";
    return reponse.json({ resume: messageVide, depuisCache: false, quotaAtteint: false });
  }

  const contenuPourIa = actualites
    .map((article, index) => `${index + 1}. ${article.titre} — ${article.resume}`)
    .join('\n');

  // Amélioration des consignes de sortie pour éviter les refus ou les répétitions des règles
  const consigneLangue = langue === 'fr'
    ? 'Tu devez répondre EXCLUSIVEMENT en français. Ne commence jamais ton message par des formules d\'introduction, de politesse ou de confirmation (ne dis pas "Voici le résumé" ou "Safe"). Rédige directement le résumé sous forme de texte brut synthétique.'
    : 'You must answer EXCLUSIVELY in English. Never start your response with introductory phrases, politeness, or status confirmations (do not say "Here is the summary" or "Safe"). Write the synthetic raw text summary immediately.';

  let texte = "";
  let quotaAtteint = false;

  try {
    const resultatOpenRouter = await appelerOpenRouter([
      {
        role: 'system',
        content: `Tu es un analyste expert et factuel en immigration internationale. Ton unique rôle est de synthétiser des flux d'actualités.
        
DIRECTIVES DE STYLE STRICTES :
- Ne génère AUCUN émoji, aucun symbole graphique, et aucune numérotation stylisée (pas de 1️⃣2️⃣3️⃣).
- Utilise uniquement des tirets simples (-) ou des phrases fluides reliées par des connecteurs logiques.
- Interdiction absolue de commenter tes propres consignes ou de répéter la demande de l'utilisateur.
- Reste neutre, objectif et professionnel.

${consigneLangue}`
      },
      {
        role: 'user',
        content: `Voici les données textuelles à traiter :
[DONNÉES]
${contenuPourIa}
[FIN DES DONNÉES]

Rédige un résumé global condensé de 150 mots maximum décrivant les grandes tendances migratoires qui se dégagent de ces éléments. Produis directement le contenu final sans aucun préambule.`
      }
    ], langue);

    texte = resultatOpenRouter?.texte ? resultatOpenRouter.texte.trim() : "";
    quotaAtteint = !!resultatOpenRouter?.quotaAtteint;
  } catch (erreuria) {
    console.error("Erreur lors de l'appel OpenRouter, bascule sur le mécanisme de secours :", erreuria);
    texte = "";
  }

  // MÉCANISME DE SECOURS (FALLBACK) : Si l'IA échoue ou renvoie une chaîne invalide
  if (!texte || texte.toLowerCase().includes("user safety") || texte.length < 10) {
    const maxTitres = actualites.slice(0, 3);
    if (langue === 'fr') {
      texte = "Retrouvez les dernières évolutions de l'immigration internationale à travers nos articles récents, traitant notamment de : " + 
              maxTitres.map(a => `"${a.titre}"`).join(', ') + ".";
    } else {
      texte = "Find the latest developments in international immigration through our recent articles, notably covering: " + 
              maxTitres.map(a => `"${a.titre}"`).join(', ') + ".";
    }
    // On force l'état du quota pour indiquer qu'on utilise un affichage de secours
    quotaAtteint = true;
  }

  // On ne met en cache que si le quota n'était pas atteint et que la vraie réponse IA a fonctionné
  if (!quotaAtteint) {
    cacheMemoire.definir(cleCache, texte, DUREE_CACHE_RESUME_MS);
  }

  reponse.json({ resume: texte, depuisCache: false, quotaAtteint });
}

module.exports = envelopperTousLesControleurs({ obtenirActualites, genererResumeGlobal });

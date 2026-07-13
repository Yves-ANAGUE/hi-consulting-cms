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
  const contenuPourIa = actualites
    .map((article, index) => `${index + 1}. ${article.titre} — ${article.resume}`)
    .join('\n');

  const consigneLangue = langue === 'fr'
    ? 'Réponds en français, de façon concise et structurée. N\'utilise AUCUN émoji, aucune numérotation en émoji (pas de 1️⃣2️⃣3️⃣) : utilise uniquement des tirets ou des phrases courtes reliées par des connecteurs logiques.'
    : 'Answer in English, concisely and in a structured way. Do NOT use any emoji or emoji numbering (no 1️⃣2️⃣3️⃣): use plain dashes or short connected sentences instead.';
  const { texte, quotaAtteint } = await appelerOpenRouter([
    {
      role: 'system',
      content: `Tu es un analyste spécialisé en immigration internationale. ${consigneLangue}`
    },
    {
      role: 'user',
      content: `Voici une liste d'actualités migratoires récentes :\n${contenuPourIa}\n\nRédige un résumé global condensé (150 mots maximum, texte brut sans émoji) des tendances migratoires qui s'en dégagent.`
    }
  ], langue);

  if (!quotaAtteint) {
    cacheMemoire.definir(cleCache, texte, DUREE_CACHE_RESUME_MS);
  }

  reponse.json({ resume: texte, depuisCache: false, quotaAtteint });
}

module.exports = envelopperTousLesControleurs({ obtenirActualites, genererResumeGlobal });

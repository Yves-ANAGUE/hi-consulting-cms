const fetch = require('node-fetch');

const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';

const MESSAGES_QUOTA_ATTEINT = {
  fr:
    "Je reçois actuellement un très grand nombre de demandes. Pour obtenir une réponse immédiate, " +
    "je vous invite à consulter notre Foire Aux Questions ou à utiliser notre Formulaire d'Évaluation " +
    "afin qu'un de nos agents vous recontacte par e-mail.",
  en:
    "I'm currently receiving a very high number of requests. For an immediate answer, please check " +
    "our FAQ page or use our Evaluation Form so one of our agents can get back to you by e-mail."
};

/**
 * Nettoie une réponse de modèle gratuit : retire les émojis numérotés
 * (1️⃣2️⃣3️⃣, souvent mal rendus), les espaces multiples résiduels, et détecte
 * les cas où le modèle a échoué (réponse très longue contenant des instructions
 * de prompt ou du contenu anglais mélangé).
 */
function nettoyerReponseIa(texte) {
  let nettoye = texte
    .replace(/[\u0030-\u0039]\uFE0F?\u20E3/g, '') // émojis "chiffre encerclé" (1️⃣, 2️⃣...)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Détecte si le modèle a échoué et retourné un contenu mal structuré
  // (plus de 2000 caractères = probablement une erreur ou du contenu non traité)
  if (nettoye.length > 2000) {
    // Chercher la première phrase complète en français
    const correspondancePhrase = nettoye.match(/^[^.!?]*[.!?]/);
    if (correspondancePhrase) {
      const premierPhrase = correspondancePhrase[0].trim();
      if (premierPhrase.length > 50 && premierPhrase.length < 500) {
        nettoye = premierPhrase;
      } else {
        // Fallback : prendre les 300 premiers caractères
        nettoye = nettoye.slice(0, 300).trim() + '…';
      }
    }
  }

  return nettoye;
}

/**
 * Appelle un modèle OpenRouter précis avec un timeout garanti par
 * AbortController (le paramètre "timeout" de node-fetch v2 est peu fiable
 * sur certains environnements réseau contraints comme Render gratuit).
 */
async function appellerUnModele(modele, messages, tempsLimiteMs) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), tempsLimiteMs);

  try {
    const reponse = await fetch(URL_OPENROUTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.URL_SITE || 'http://localhost:3000',
        'X-Title': 'HI CONSULTING IMMIGRATION'
      },
      body: JSON.stringify({ model: modele, messages, max_tokens: 800, temperature: 0.4 }),
      signal: controleur.signal
    });

    if (reponse.status === 429) throw new Error('QUOTA_ATTEINT');
    if (!reponse.ok) {
      const corpsErreur = await reponse.text().catch(() => '');
      throw new Error(`STATUT_${reponse.status}: ${corpsErreur.slice(0, 150)}`);
    }

    const donnees = await reponse.json();
    const texte = donnees?.choices?.[0]?.message?.content?.trim();
    if (!texte) throw new Error('REPONSE_VIDE');
    return nettoyerReponseIa(texte);
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Interroge en PARALLÈLE le modèle principal et le modèle de secours
 * (Promise.any) : dès que l'un des deux répond correctement, sa réponse est
 * utilisée immédiatement, sans attendre l'autre. Sur le routeur gratuit
 * openrouter/free, le modèle réellement sélectionné varie à chaque appel et
 * certains sont nettement plus lents ; attendre en séquence (l'un puis
 * l'autre) doublait inutilement le temps d'attente perçu par le visiteur.
 * @param {Array<{role:string, content:string}>} messages
 * @param {'fr'|'en'} langue
 * @returns {Promise<{texte: string, quotaAtteint: boolean}>}
 */
async function appelerOpenRouter(messages, langue = 'fr') {
  const modeles = [
    process.env.OPENROUTER_MODELE || 'openrouter/free',
    process.env.OPENROUTER_MODELE_SECOURS || 'nvidia/nemotron-nano-9b-v2:free'
  ].filter(Boolean);

  const TEMPS_LIMITE_MS = 18000;

  try {
    const texte = await Promise.any(
      modeles.map((modele) =>
        appellerUnModele(modele, messages, TEMPS_LIMITE_MS).catch((erreur) => {
          console.warn(`[OpenRouter] Échec avec ${modele} : ${erreur.message}`);
          throw erreur;
        })
      )
    );
    return { texte, quotaAtteint: false };
  } catch (erreurAgregee) {
    console.error('[OpenRouter] Tous les modèles gratuits ont échoué :', erreurAgregee?.errors?.map((e) => e.message).join(' | '));
    return { texte: MESSAGES_QUOTA_ATTEINT[langue] || MESSAGES_QUOTA_ATTEINT.fr, quotaAtteint: true };
  }
}

module.exports = { appelerOpenRouter, MESSAGES_QUOTA_ATTEINT };

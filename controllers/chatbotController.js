const { executerRequete } = require('../config/basededonnees');
const { appelerOpenRouter } = require('../utils/openrouter');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

const NOMBRE_MAX_MESSAGES_HISTORIQUE = 6; // 3 échanges (question+réponse) de contexte

/**
 * Recherche de pertinence FAQ par recouvrement de mots-clés significatifs.
 * Le score est désormais une PROPORTION (mots trouvés / mots de la question)
 * et non un simple compteur brut : ce dernier déclenchait de faux positifs
 * (ex: une question sur "vos services, mission, vision" correspondait par
 * hasard à une FAQ sur l'Entrée Express simplement parce que 2 mots communs
 * suffisaient, sans rapport réel avec la question posée).
 * Complexité O(n*m) (n = nombre de FAQ, m = mots de la question) : négligeable
 * pour un volume de FAQ de l'ordre de la dizaine à la centaine d'entrées.
 */
function calculerScorePertinence(question, faq, langue) {
  const texteFaq = `${langue === 'fr' ? faq.question_fr : faq.question_en} ${langue === 'fr' ? faq.reponse_fr : faq.reponse_en}`.toLowerCase();
  const motsQuestion = question.toLowerCase().split(/\s+/).filter((mot) => mot.length > 3);
  if (motsQuestion.length === 0) return 0;
  const motsTrouves = motsQuestion.filter((mot) => texteFaq.includes(mot)).length;
  return motsTrouves / motsQuestion.length;
}

/**
 * Construit le contexte factuel de l'entreprise à injecter dans le prompt
 * système, pour que l'IA générative réponde sur la base des VRAIES données
 * (services, mission, vision, coordonnées) plutôt que d'inventer des faits
 * plausibles mais faux sur l'entreprise elle-même.
 */
async function construireContexteEntreprise(langue) {
  const [resultatServices, resultatTextes] = await Promise.all([
    executerRequete('SELECT titre_fr, titre_en, pays FROM services ORDER BY ordre_affichage ASC'),
    executerRequete('SELECT cle, valeur_fr, valeur_en FROM textes_globaux')
  ]);

  const textes = {};
  resultatTextes.rows.forEach((ligne) => {
    textes[ligne.cle] = langue === 'fr' ? ligne.valeur_fr : ligne.valeur_en;
  });

  const listeServices = resultatServices.rows
    .map((service) => `- ${langue === 'fr' ? service.titre_fr : service.titre_en} (${service.pays || 'Canada'})`)
    .join('\n');

  return langue === 'fr'
    ? `Informations certifiées sur l'entreprise (à utiliser en priorité, ne jamais contredire) :
Nom : ${textes.nom_entreprise || 'HI CONSULTING IMMIGRATION'}
Slogan : ${textes.slogan_principal || ''}
À propos : ${textes.a_propos || ''}
Mission : ${textes.mission || ''}
Vision : ${textes.vision || ''}
Adresse physique : Logpom, Carrefour Bassong, face KMC, Douala, Cameroun (également face immeuble Mont Baloua, 2ème étage)
Téléphones/WhatsApp : +237 678 924 045 / +237 691 871 842 / +237 658 937 466
Email : hiciofficiel@gmail.com
Services proposés :
${listeServices}`
    : `Certified company information (use as priority source, never contradict) :
Name: ${textes.nom_entreprise || 'HI CONSULTING IMMIGRATION'}
Slogan: ${textes.slogan_principal || ''}
About: ${textes.a_propos || ''}
Mission: ${textes.mission || ''}
Vision: ${textes.vision || ''}
Physical address: Logpom, Carrefour Bassong, face KMC, Douala, Cameroon (also facing Mont Baloua building, 2nd floor)
Phones/WhatsApp: +237 678 924 045 / +237 691 871 842 / +237 658 937 466
Email: hiciofficiel@gmail.com
Services offered:
${listeServices}`;
}

async function repondreChatbot(requete, reponse) {
  const { question, langue = 'fr', historique = [] } = requete.body;
  if (!question || question.trim().length < 3) {
    return reponse.status(400).json({ erreur: 'Question invalide.' });
  }

  const resultatFaq = await executerRequete('SELECT * FROM foire_aux_questions');
  const faqAvecScore = resultatFaq.rows
    .map((faq) => ({ faq, score: calculerScorePertinence(question, faq, langue) }))
    .filter((entree) => entree.score > 0)
    .sort((a, b) => b.score - a.score);

  // Seuil relevé à 60% des mots significatifs de la question retrouvés dans
  // la FAQ (au lieu d'un simple compteur brut ≥ 2), pour éviter les faux
  // positifs sur des questions générales sans lien réel avec une FAQ précise.
  if (faqAvecScore.length > 0 && faqAvecScore[0].score >= 0.6) {
    const meilleureFaq = faqAvecScore[0].faq;
    return reponse.json({
      reponse: langue === 'fr' ? meilleureFaq.reponse_fr : meilleureFaq.reponse_en,
      source: 'faq_certifiee'
    });
  }

  const contexteEntreprise = await construireContexteEntreprise(langue);

  const promptSysteme =
    (langue === 'fr'
      ? 'Tu es le conseiller virtuel de HI CONSULTING IMMIGRATION. Utilise EXCLUSIVEMENT les informations ' +
        'certifiées ci-dessous pour toute question sur l\'entreprise elle-même (adresse, services, mission, ' +
        'vision, contact) : ne les invente jamais, ne les suppose jamais, et ne les contredis jamais. ' +
        'Si une question porte sur l\'entreprise et que l\'information ne figure pas ci-dessous, dis ' +
        'honnêtement que tu ne disposes pas de cette information précise et invite à consulter la page ' +
        '[Contact](/contact). Tu peux en revanche utiliser tes connaissances générales sur l\'immigration ' +
        '(lois, procédures, délais habituels) pour les questions générales qui ne concernent pas l\'entreprise ' +
        'elle-même, en précisant qu\'il s\'agit d\'informations générales à vérifier auprès d\'une source ' +
        'officielle. Utilise des liens internes réels quand pertinent : [Témoignages](/temoignages), ' +
        '[FAQ](/faq), [Services](/services). Réponds de façon concise (5 phrases maximum), sans émojis, ' +
        'sans numérotation en émojis. Réponds UNIQUEMENT en français.\n\n' + contexteEntreprise
      : 'You are the virtual advisor for HI CONSULTING IMMIGRATION. Use EXCLUSIVELY the certified information ' +
        'below for any question about the company itself (address, services, mission, vision, contact): never ' +
        'invent it, never assume it, never contradict it. If a question is about the company and the information ' +
        'is not listed below, honestly say you do not have that precise information and invite the user to visit ' +
        'the [Contact](/contact) page. You may use your general immigration knowledge (laws, procedures, typical ' +
        'delays) for general questions unrelated to the company itself, clarifying it is general information to ' +
        'verify with an official source. Use real internal links when relevant: [Testimonials](/temoignages), ' +
        '[FAQ](/faq), [Services](/services). Answer concisely (5 sentences maximum), no emojis, no emoji ' +
        'numbering. Answer ONLY in English.\n\n' + contexteEntreprise);

  const messagesConversation = [
    { role: 'system', content: promptSysteme },
    ...historique.slice(-NOMBRE_MAX_MESSAGES_HISTORIQUE).map((message) => ({
      role: message.role === 'utilisateur' ? 'user' : 'assistant',
      content: String(message.contenu || '').slice(0, 500)
    })),
    { role: 'user', content: question }
  ];

  const { texte, quotaAtteint } = await appelerOpenRouter(messagesConversation, langue);

  reponse.json({ reponse: texte, source: quotaAtteint ? 'quota_atteint' : 'ia_generative' });
}

module.exports = envelopperTousLesControleurs({ repondreChatbot });

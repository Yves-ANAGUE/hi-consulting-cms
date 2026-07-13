const { envoyerFormulaireEvaluation } = require('../config/messagerie');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

const EXPRESSION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function soumettreFormulaireEvaluation(requete, reponse) {
  const { nomComplet, email, telephone, projetChoisi, message } = requete.body;

  const erreursValidation = [];
  if (!nomComplet || nomComplet.trim().length < 2) erreursValidation.push('Le nom complet est invalide.');
  if (!email || !EXPRESSION_EMAIL.test(email)) erreursValidation.push('L\'adresse email est invalide.');
  if (!telephone || telephone.trim().length < 6) erreursValidation.push('Le numéro de téléphone est invalide.');
  if (!projetChoisi) erreursValidation.push('Le projet choisi est requis.');

  if (erreursValidation.length > 0) {
    return reponse.status(400).json({ erreur: 'Formulaire invalide.', details: erreursValidation });
  }

  // Réponse immédiate au visiteur : l'envoi de l'e-mail se poursuit en
  // arrière-plan ("fire-and-forget"). Avant ce correctif, la requête HTTP
  // restait bloquée jusqu'à la fin de la tentative SMTP (pouvant dépasser
  // 30 secondes en cas de port bloqué par l'hébergeur), ce que le visiteur
  // percevait comme un formulaire figé. Le succès/échec réel de l'envoi
  // reste journalisé côté serveur (cf. config/messagerie.js) pour un suivi
  // manuel si nécessaire, sans jamais faire attendre le visiteur.
  envoyerFormulaireEvaluation({ nomComplet, email, telephone, projetChoisi, message }).catch((erreur) => {
    console.error('[Contact] Erreur inattendue lors de l\'envoi en arrière-plan :', erreur.message);
  });

  reponse.status(202).json({
    message: 'Votre demande a été transmise. Un agent vous recontactera très prochainement.'
  });
}

module.exports = envelopperTousLesControleurs({ soumettreFormulaireEvaluation });

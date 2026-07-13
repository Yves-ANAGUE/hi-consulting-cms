/**
 * Encapsule un contrôleur asynchrone Express pour transmettre toute erreur
 * (rejet de promesse) au middleware d'erreur global via next(erreur).
 *
 * Sans cet enveloppement, une exception dans un contrôleur `async` (ex :
 * perte de connexion à Neon) devient un rejet de promesse non intercepté :
 * sur Node 18+, cela termine tout le processus au lieu de renvoyer une
 * simple réponse HTTP 500, ce qui mettrait tout le site hors service pour
 * une seule requête en erreur.
 * @param {Function} controleurAsync
 */
function envelopperAsync(controleur) {
  return (requete, reponse, suivant) => {
    Promise.resolve(controleur(requete, reponse, suivant)).catch(suivant);
  };
}

/**
 * Enveloppe toutes les fonctions d'un module contrôleur en une seule fois,
 * pour éviter de répéter envelopperAsync() sur chaque déclaration de route.
 * @param {Object<string, Function>} objetControleur
 */
function envelopperTousLesControleurs(objetControleur) {
  const resultat = {};
  for (const [nom, fonction] of Object.entries(objetControleur)) {
    resultat[nom] = typeof fonction === 'function' ? envelopperAsync(fonction) : fonction;
  }
  return resultat;
}

module.exports = envelopperAsync;
module.exports.envelopperTousLesControleurs = envelopperTousLesControleurs;

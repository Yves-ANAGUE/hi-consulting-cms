const { televerserVersCloudinary } = require('../config/cloudinary');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

/**
 * Traite plusieurs fichiers en mémoire et les téléverse séquentiellement
 * vers Cloudinary. Traitement séquentiel (et non Promise.all) volontaire :
 * cela borne le nombre de flux d'upload simultanés et donc le pic de RAM
 * consommé (chaque buffer est libéré par le ramasse-miettes dès que son
 * upload est terminé), ce qui est préférable sur un environnement à 512 Mo.
 * @complexity O(n) appels réseau séquentiels pour n fichiers - le coût
 * dominant est le transfert réseau, pas le calcul local.
 */
async function televerserMedias(requete, reponse) {
  const fichiers = requete.files;
  if (!fichiers || fichiers.length === 0) {
    return reponse.status(400).json({ erreur: 'Aucun fichier reçu.' });
  }

  const resultats = [];
  const erreurs = [];

  for (const fichier of fichiers) {
    try {
      const typeRessource = fichier.mimetype.startsWith('video') ? 'video' : 'image';
      const { urlSecurisee, idPublic } = await televerserVersCloudinary(fichier.buffer, typeRessource);
      resultats.push({ nomOriginal: fichier.originalname, url: urlSecurisee, idPublic, type: typeRessource });
    } catch (erreur) {
      erreurs.push({ nomOriginal: fichier.originalname, message: erreur.message });
    }
  }

  const codeStatut = erreurs.length > 0 && resultats.length === 0 ? 502 : 201;
  reponse.status(codeStatut).json({ televersements: resultats, erreurs });
}

module.exports = envelopperTousLesControleurs({ televerserMedias });

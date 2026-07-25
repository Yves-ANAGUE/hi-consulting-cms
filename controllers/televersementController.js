const { televerserVersCloudinary } = require('../config/cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

/**
 * Traite plusieurs fichiers en mémoire et les téléverse séquentiellement
 * vers Cloudinary. CONSERVÉ pour compatibilité mais plus utilisé par défaut
 * par le Back-Office (voir genererSignatureTeleversement ci-dessous, qui
 * permet un envoi direct navigateur → Cloudinary sans passer par la RAM du
 * serveur, donc sans plafond de taille imposé par Render).
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

/**
 * Génère une signature d'upload Cloudinary côté serveur (seul endroit où la
 * clé secrète API_SECRET peut être manipulée sans risque). Le navigateur
 * utilise ensuite cette signature pour uploader DIRECTEMENT vers Cloudinary,
 * sans que le fichier ne transite jamais par la RAM de notre serveur Render
 * — donc aucune limite de taille imposée par notre code ou notre hébergeur
 * (seule la limite de votre compte Cloudinary s'applique, très large en
 * gratuit : 100 Mo par fichier vidéo/image).
 */
function genererSignatureTeleversement(requete, reponse) {
  const timestamp = Math.round(Date.now() / 1000);
  const dossier = 'hi-consulting-immigration';

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: dossier },
    process.env.CLOUDINARY_API_SECRET
  );

  reponse.json({
    signature,
    timestamp,
    dossier,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  });
}

module.exports = envelopperTousLesControleurs({ televerserMedias, genererSignatureTeleversement });
const multer = require('multer');

/**
 * Stockage en mémoire (Buffer) plutôt que sur disque : le fichier ne touche
 * jamais le disque du serveur et est directement retransmis en flux vers
 * Cloudinary (cf config/cloudinary.js). Une limite stricte par fichier
 * empêche un unique gros envoi de saturer les ~512 Mo de RAM du plan
 * gratuit Render ; le multi-upload reste possible car chaque fichier est
 * traité et libéré (flux fermé) avant l'arrivée du suivant côté contrôleur.
 */
const stockageMemoire = multer.memoryStorage();

const televersementMultiple = multer({
  storage: stockageMemoire,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80 Mo par fichier (vidéos de témoignages incluses)
    files: 15
  },
  fileFilter: (requete, fichier, callback) => {
    const typesAutorises = /^(image|video)\//;
    if (!typesAutorises.test(fichier.mimetype)) {
      return callback(new Error('Type de fichier non autorisé : seuls les images et vidéos sont acceptées.'));
    }
    callback(null, true);
  }
});

module.exports = { televersementMultiple };

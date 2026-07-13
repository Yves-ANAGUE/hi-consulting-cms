const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Pousse un buffer (image ou vidéo) vers Cloudinary via un flux (streaming).
 * Aucune écriture sur disque : le buffer en mémoire (RAM) est directement
 * transvasé dans le flux d'upload, ce qui limite l'empreinte mémoire du
 * serveur Node même pour des fichiers volumineux (vidéos de témoignages).
 * @param {Buffer} tamponFichier
 * @param {'image'|'video'} typeRessource
 * @returns {Promise<{urlSecurisee: string, idPublic: string}>}
 */
function televerserVersCloudinary(tamponFichier, typeRessource = 'image') {
  return new Promise((resoudre, rejeter) => {
    const flux = cloudinary.uploader.upload_stream(
      {
        folder: 'hi-consulting-immigration',
        resource_type: typeRessource,
        // Compression automatique adaptée pour préserver la bande passante
        quality: 'auto',
        fetch_format: 'auto'
      },
      (erreur, resultat) => {
        if (erreur) return rejeter(erreur);
        resoudre({ urlSecurisee: resultat.secure_url, idPublic: resultat.public_id });
      }
    );
    flux.end(tamponFichier);
  });
}

module.exports = { cloudinary, televerserVersCloudinary };

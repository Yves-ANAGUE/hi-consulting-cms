const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

async function listerPhotosLocaux(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM photos_locaux ORDER BY ordre_affichage ASC');
  reponse.json(resultat.rows);
}

async function creerPhotoLocal(requete, reponse) {
  const { urlMedia, typeMedia, legendeFr, legendeEn, ordreAffichage } = requete.body;
  if (!urlMedia) return reponse.status(400).json({ erreur: 'L\'URL du média est requise.' });
  const resultat = await executerRequete(
    `INSERT INTO photos_locaux (url_media, type_media, legende_fr, legende_en, ordre_affichage)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [urlMedia, typeMedia || 'image', legendeFr, legendeEn, ordreAffichage || 0]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierPhotoLocal(requete, reponse) {
  const { id } = requete.params;
  const { urlMedia, typeMedia, legendeFr, legendeEn, ordreAffichage } = requete.body;
  const resultat = await executerRequete(
    `UPDATE photos_locaux SET
       url_media = COALESCE($1, url_media), type_media = COALESCE($2, type_media),
       legende_fr = COALESCE($3, legende_fr), legende_en = COALESCE($4, legende_en),
       ordre_affichage = COALESCE($5, ordre_affichage)
     WHERE id = $6 RETURNING *`,
    [urlMedia, typeMedia, legendeFr, legendeEn, ordreAffichage, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Photo introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerPhotoLocal(requete, reponse) {
  await executerRequete('DELETE FROM photos_locaux WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Photo supprimée avec succès.' });
}

module.exports = envelopperTousLesControleurs({
  listerPhotosLocaux, creerPhotoLocal, modifierPhotoLocal, supprimerPhotoLocal
});

const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

async function listerPhotosEquipeGroupe(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM photos_equipe_groupe ORDER BY ordre_affichage ASC');
  reponse.json(resultat.rows);
}

async function creerPhotoEquipeGroupe(requete, reponse) {
  const { urlMedia, legendeFr, legendeEn, ordreAffichage } = requete.body;
  if (!urlMedia) return reponse.status(400).json({ erreur: 'L\'URL du média est requise.' });
  const resultat = await executerRequete(
    `INSERT INTO photos_equipe_groupe (url_media, legende_fr, legende_en, ordre_affichage)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [urlMedia, legendeFr, legendeEn, ordreAffichage || 0]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierPhotoEquipeGroupe(requete, reponse) {
  const { id } = requete.params;
  const { urlMedia, legendeFr, legendeEn, ordreAffichage } = requete.body;
  const resultat = await executerRequete(
    `UPDATE photos_equipe_groupe SET
       url_media = COALESCE($1, url_media), legende_fr = COALESCE($2, legende_fr),
       legende_en = COALESCE($3, legende_en), ordre_affichage = COALESCE($4, ordre_affichage)
     WHERE id = $5 RETURNING *`,
    [urlMedia, legendeFr, legendeEn, ordreAffichage, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Photo introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerPhotoEquipeGroupe(requete, reponse) {
  await executerRequete('DELETE FROM photos_equipe_groupe WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Photo supprimée avec succès.' });
}

module.exports = envelopperTousLesControleurs({
  listerPhotosEquipeGroupe, creerPhotoEquipeGroupe, modifierPhotoEquipeGroupe, supprimerPhotoEquipeGroupe
});

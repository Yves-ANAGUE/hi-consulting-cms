const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

async function listerTemoignages(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM temoignages ORDER BY cree_le DESC');
  reponse.json(resultat.rows);
}

async function creerTemoignage(requete, reponse) {
  const { nomClient, note, texteFr, texteEn, urlPhoto, urlVideo, paysDestination } = requete.body;
  if (!nomClient || !note || !texteFr || !texteEn) {
    return reponse.status(400).json({ erreur: 'Nom, note et textes (FR/EN) sont requis.' });
  }
  if (note < 1 || note > 5) {
    return reponse.status(400).json({ erreur: 'La note doit être comprise entre 1 et 5.' });
  }
  const resultat = await executerRequete(
    `INSERT INTO temoignages (nom_client, note, texte_fr, texte_en, url_photo, url_video, pays_destination)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [nomClient, note, texteFr, texteEn, urlPhoto, urlVideo, paysDestination]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierTemoignage(requete, reponse) {
  const { id } = requete.params;
  const { nomClient, note, texteFr, texteEn, urlPhoto, urlVideo, paysDestination } = requete.body;
  const resultat = await executerRequete(
    `UPDATE temoignages SET
       nom_client = COALESCE($1, nom_client), note = COALESCE($2, note),
       texte_fr = COALESCE($3, texte_fr), texte_en = COALESCE($4, texte_en),
       url_photo = COALESCE($5, url_photo), url_video = COALESCE($6, url_video),
       pays_destination = COALESCE($7, pays_destination)
     WHERE id = $8 RETURNING *`,
    [nomClient, note, texteFr, texteEn, urlPhoto, urlVideo, paysDestination, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Témoignage introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerTemoignage(requete, reponse) {
  await executerRequete('DELETE FROM temoignages WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Témoignage supprimé avec succès.' });
}

module.exports = envelopperTousLesControleurs({ listerTemoignages, creerTemoignage, modifierTemoignage, supprimerTemoignage });

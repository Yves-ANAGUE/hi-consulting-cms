const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

async function listerReseauxSociaux(requete, reponse) {
  const resultat = await executerRequete(
    'SELECT * FROM reseaux_sociaux WHERE actif = true ORDER BY ordre_affichage ASC'
  );
  reponse.json(resultat.rows);
}

async function listerReseauxSociauxAdmin(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM reseaux_sociaux ORDER BY ordre_affichage ASC');
  reponse.json(resultat.rows);
}

async function creerReseauSocial(requete, reponse) {
  const { plateforme, url, ordreAffichage } = requete.body;
  if (!plateforme || !url) {
    return reponse.status(400).json({ erreur: 'La plateforme et l\'URL sont requises.' });
  }
  const resultat = await executerRequete(
    `INSERT INTO reseaux_sociaux (plateforme, url, ordre_affichage) VALUES ($1, $2, $3) RETURNING *`,
    [plateforme, url, ordreAffichage || 0]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierReseauSocial(requete, reponse) {
  const { id } = requete.params;
  const { plateforme, url, ordreAffichage, actif } = requete.body;
  const resultat = await executerRequete(
    `UPDATE reseaux_sociaux SET
       plateforme = COALESCE($1, plateforme), url = COALESCE($2, url),
       ordre_affichage = COALESCE($3, ordre_affichage), actif = COALESCE($4, actif)
     WHERE id = $5 RETURNING *`,
    [plateforme, url, ordreAffichage, actif, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Réseau social introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerReseauSocial(requete, reponse) {
  await executerRequete('DELETE FROM reseaux_sociaux WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Réseau social supprimé avec succès.' });
}

module.exports = envelopperTousLesControleurs({
  listerReseauxSociaux, listerReseauxSociauxAdmin,
  creerReseauSocial, modifierReseauSocial, supprimerReseauSocial
});

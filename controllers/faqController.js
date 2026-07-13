const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

async function listerFaq(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM foire_aux_questions ORDER BY ordre_affichage ASC');
  reponse.json(resultat.rows);
}

async function creerFaq(requete, reponse) {
  const { questionFr, questionEn, reponseFr, reponseEn, ordreAffichage } = requete.body;
  if (!questionFr || !questionEn || !reponseFr || !reponseEn) {
    return reponse.status(400).json({ erreur: 'Les versions française et anglaise sont requises.' });
  }
  const resultat = await executerRequete(
    `INSERT INTO foire_aux_questions (question_fr, question_en, reponse_fr, reponse_en, ordre_affichage)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [questionFr, questionEn, reponseFr, reponseEn, ordreAffichage || 0]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierFaq(requete, reponse) {
  const { id } = requete.params;
  const { questionFr, questionEn, reponseFr, reponseEn, ordreAffichage } = requete.body;
  const resultat = await executerRequete(
    `UPDATE foire_aux_questions SET
       question_fr = COALESCE($1, question_fr), question_en = COALESCE($2, question_en),
       reponse_fr = COALESCE($3, reponse_fr), reponse_en = COALESCE($4, reponse_en),
       ordre_affichage = COALESCE($5, ordre_affichage)
     WHERE id = $6 RETURNING *`,
    [questionFr, questionEn, reponseFr, reponseEn, ordreAffichage, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Question introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerFaq(requete, reponse) {
  await executerRequete('DELETE FROM foire_aux_questions WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Question supprimée avec succès.' });
}

module.exports = envelopperTousLesControleurs({ listerFaq, creerFaq, modifierFaq, supprimerFaq });

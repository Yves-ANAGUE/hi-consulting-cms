const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

// --- Textes globaux (règle du "zéro texte figé") ---

async function listerTextesGlobaux(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM textes_globaux');
  const dictionnaire = {};
  resultat.rows.forEach((ligne) => {
    dictionnaire[ligne.cle] = { fr: ligne.valeur_fr, en: ligne.valeur_en };
  });
  reponse.json(dictionnaire);
}

async function modifierTexteGlobal(requete, reponse) {
  const { cle } = requete.params;
  const { valeurFr, valeurEn } = requete.body;
  if (!valeurFr || !valeurEn) {
    return reponse.status(400).json({ erreur: 'Les versions française et anglaise sont requises.' });
  }
  await executerRequete(
    `INSERT INTO textes_globaux (cle, valeur_fr, valeur_en) VALUES ($1, $2, $3)
     ON CONFLICT (cle) DO UPDATE SET valeur_fr = $2, valeur_en = $3`,
    [cle, valeurFr, valeurEn]
  );
  reponse.json({ message: 'Texte mis à jour avec succès.' });
}

// --- Configuration Google (GA4 + Search Console) + réglages du site (logo, WhatsApp, médias), injectés en SSR ---

const CORRESPONDANCE_CHAMPS_CONFIG = {
  idMesureGa4: 'id_mesure_ga4',
  codeVerificationSearchConsole: 'code_verification_search_console',
  urlLogo: 'url_logo',
  urlWhatsappFlottant: 'url_whatsapp_flottant',
  urlGoogleMaps: 'url_google_maps',
  urlVideoHero: 'url_video_hero',
  urlImageMission: 'url_image_mission',
  urlImageVision: 'url_image_vision'
};

async function obtenirConfigGoogle(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM configuration_google LIMIT 1');
  reponse.json(resultat.rows[0] || Object.fromEntries(Object.values(CORRESPONDANCE_CHAMPS_CONFIG).map((colonne) => [colonne, null])));
}

async function modifierConfigGoogle(requete, reponse) {
  const existant = await executerRequete('SELECT * FROM configuration_google LIMIT 1');
  const ligneActuelle = existant.rows[0] || {};

  // COALESCE côté application (et non SQL) pour permettre de vider un champ
  // volontairement (chaîne vide) sans que la valeur précédente ne persiste.
  const colonnes = [];
  const valeurs = [];
  Object.entries(CORRESPONDANCE_CHAMPS_CONFIG).forEach(([cleCamel, colonneSql]) => {
    colonnes.push(colonneSql);
    valeurs.push(requete.body[cleCamel] !== undefined ? requete.body[cleCamel] : ligneActuelle[colonneSql]);
  });

  if (existant.rows.length === 0) {
    const espacesReserves = colonnes.map((_, index) => `$${index + 1}`).join(', ');
    await executerRequete(
      `INSERT INTO configuration_google (${colonnes.join(', ')}) VALUES (${espacesReserves})`,
      valeurs
    );
  } else {
    const affectations = colonnes.map((colonne, index) => `${colonne} = $${index + 1}`).join(', ');
    valeurs.push(ligneActuelle.id);
    await executerRequete(
      `UPDATE configuration_google SET ${affectations} WHERE id = $${valeurs.length}`,
      valeurs
    );
  }
  reponse.json({ message: 'Configuration mise à jour avec succès.' });
}

// --- Organigramme de l'équipe ---

async function listerEquipe(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM membres_equipe ORDER BY ordre_affichage ASC');
  reponse.json(resultat.rows);
}

async function creerMembreEquipe(requete, reponse) {
  const { nom, posteFr, posteEn, urlPhoto, ordreAffichage } = requete.body;
  if (!nom || !posteFr || !posteEn) {
    return reponse.status(400).json({ erreur: 'Nom et poste (FR/EN) sont requis.' });
  }
  const resultat = await executerRequete(
    `INSERT INTO membres_equipe (nom, poste_fr, poste_en, url_photo, ordre_affichage)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [nom, posteFr, posteEn, urlPhoto, ordreAffichage || 0]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierMembreEquipe(requete, reponse) {
  const { id } = requete.params;
  const { nom, posteFr, posteEn, urlPhoto, ordreAffichage } = requete.body;
  const resultat = await executerRequete(
    `UPDATE membres_equipe SET
       nom = COALESCE($1, nom), poste_fr = COALESCE($2, poste_fr), poste_en = COALESCE($3, poste_en),
       url_photo = COALESCE($4, url_photo), ordre_affichage = COALESCE($5, ordre_affichage)
     WHERE id = $6 RETURNING *`,
    [nom, posteFr, posteEn, urlPhoto, ordreAffichage, id]
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Membre introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerMembreEquipe(requete, reponse) {
  await executerRequete('DELETE FROM membres_equipe WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Membre supprimé avec succès.' });
}

module.exports = envelopperTousLesControleurs({
  listerTextesGlobaux, modifierTexteGlobal,
  obtenirConfigGoogle, modifierConfigGoogle,
  listerEquipe, creerMembreEquipe, modifierMembreEquipe, supprimerMembreEquipe
});

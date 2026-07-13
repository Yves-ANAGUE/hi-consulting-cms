const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

function genererSlug(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function listerServices(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM services ORDER BY ordre_affichage ASC, cree_le DESC');
  reponse.json(resultat.rows);
}

async function obtenirServiceParSlug(requete, reponse) {
  const { slug } = requete.params;
  const resultat = await executerRequete('SELECT * FROM services WHERE slug = $1', [slug]);
  if (resultat.rows.length === 0) {
    return reponse.status(404).json({ erreur: 'Service introuvable.' });
  }
  reponse.json(resultat.rows[0]);
}

async function creerService(requete, reponse) {
  const {
    titreFr, titreEn, descriptionFr, descriptionEn, pays,
    metaTitreFr, metaTitreEn, metaDescriptionFr, metaDescriptionEn,
    urlImage, texteAlternatifImage, ordreAffichage
  } = requete.body;

  if (!titreFr || !titreEn) {
    return reponse.status(400).json({ erreur: 'Le titre en français et en anglais est requis.' });
  }

  const slugBase = genererSlug(titreFr);
  let slugFinal = slugBase;
  let compteur = 1;
  while ((await executerRequete('SELECT 1 FROM services WHERE slug = $1', [slugFinal])).rows.length > 0) {
    slugFinal = `${slugBase}-${compteur++}`;
  }

  const resultat = await executerRequete(
    `INSERT INTO services
      (slug, titre_fr, titre_en, description_fr, description_en, pays,
       meta_titre_fr, meta_titre_en, meta_description_fr, meta_description_en,
       url_image, texte_alternatif_image, ordre_affichage)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [slugFinal, titreFr, titreEn, descriptionFr, descriptionEn, pays,
     metaTitreFr, metaTitreEn, metaDescriptionFr, metaDescriptionEn,
     urlImage, texteAlternatifImage, ordreAffichage || 0]
  );

  reponse.status(201).json(resultat.rows[0]);
}

async function modifierService(requete, reponse) {
  const { id } = requete.params;
  const champsAutorises = [
    'titre_fr', 'titre_en', 'description_fr', 'description_en', 'pays',
    'meta_titre_fr', 'meta_titre_en', 'meta_description_fr', 'meta_description_en',
    'url_image', 'texte_alternatif_image', 'ordre_affichage'
  ];
  const correspondanceCamel = {
    titreFr: 'titre_fr', titreEn: 'titre_en', descriptionFr: 'description_fr', descriptionEn: 'description_en',
    pays: 'pays', metaTitreFr: 'meta_titre_fr', metaTitreEn: 'meta_titre_en',
    metaDescriptionFr: 'meta_description_fr', metaDescriptionEn: 'meta_description_en',
    urlImage: 'url_image', texteAlternatifImage: 'texte_alternatif_image', ordreAffichage: 'ordre_affichage'
  };

  const affectations = [];
  const valeurs = [];
  let indexParametre = 1;
  for (const [cleCamel, colonneSql] of Object.entries(correspondanceCamel)) {
    if (requete.body[cleCamel] !== undefined && champsAutorises.includes(colonneSql)) {
      affectations.push(`${colonneSql} = $${indexParametre++}`);
      valeurs.push(requete.body[cleCamel]);
    }
  }
  if (affectations.length === 0) return reponse.status(400).json({ erreur: 'Aucune donnée à mettre à jour.' });

  valeurs.push(id);
  const resultat = await executerRequete(
    `UPDATE services SET ${affectations.join(', ')} WHERE id = $${indexParametre} RETURNING *`,
    valeurs
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Service introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerService(requete, reponse) {
  const { id } = requete.params;
  await executerRequete('DELETE FROM services WHERE id = $1', [id]);
  reponse.json({ message: 'Service supprimé avec succès.' });
}

module.exports = {
  ...envelopperTousLesControleurs({ listerServices, obtenirServiceParSlug, creerService, modifierService, supprimerService }),
  genererSlug
};

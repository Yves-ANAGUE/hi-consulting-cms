const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

function genererSlug(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Liste les articles publiés, avec recherche optionnelle par mot-clé.
 * La recherche porte sur le titre, le résumé et les mots-clés (colonnes
 * bilingues), via ILIKE (insensible à la casse et aux accents grâce à
 * l'index par défaut de Postgres sur ce volume de données modeste - un
 * index trigram serait la suite logique au-delà de quelques centaines
 * d'articles).
 */
async function listerArticles(requete, reponse) {
  const { recherche, langue } = requete.query;
  const langueActive = langue === 'en' ? 'en' : 'fr';

  if (recherche && recherche.trim().length > 0) {
    const motif = `%${recherche.trim()}%`;
    const colonneTitre = langueActive === 'fr' ? 'titre_fr' : 'titre_en';
    const colonneResume = langueActive === 'fr' ? 'resume_fr' : 'resume_en';
    const resultat = await executerRequete(
      `SELECT id, slug, titre_fr, titre_en, resume_fr, resume_en, url_image_couverture, auteur, cree_le,
       LENGTH(contenu_fr) AS longueur_fr, LENGTH(contenu_en) AS longueur_en
       FROM articles
       WHERE publie = true AND (${colonneTitre} ILIKE $1 OR ${colonneResume} ILIKE $1 OR mots_cles ILIKE $1)
       ORDER BY cree_le DESC`,
      [motif]
    );
    return reponse.json(resultat.rows);
  }

  const resultat = await executerRequete(
    `SELECT id, slug, titre_fr, titre_en, resume_fr, resume_en, url_image_couverture, auteur, cree_le,
       LENGTH(contenu_fr) AS longueur_fr, LENGTH(contenu_en) AS longueur_en
     FROM articles WHERE publie = true ORDER BY cree_le DESC`
  );
  reponse.json(resultat.rows);
}

async function listerArticlesAdmin(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM articles ORDER BY cree_le DESC');
  reponse.json(resultat.rows);
}

async function obtenirArticleParSlug(requete, reponse) {
  const resultat = await executerRequete('SELECT * FROM articles WHERE slug = $1 AND publie = true', [requete.params.slug]);
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Article introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function creerArticle(requete, reponse) {
  const {
    titreFr, titreEn, resumeFr, resumeEn, contenuFr, contenuEn,
    urlImageCouverture, texteAlternatifImage, metaTitreFr, metaTitreEn,
    metaDescriptionFr, metaDescriptionEn, motsCles, auteur, publie
  } = requete.body;

  if (!titreFr || !titreEn || !contenuFr || !contenuEn) {
    return reponse.status(400).json({ erreur: 'Titre et contenu (FR/EN) sont requis.' });
  }

  const slugBase = genererSlug(titreFr);
  let slugFinal = slugBase;
  let compteur = 1;
  while ((await executerRequete('SELECT 1 FROM articles WHERE slug = $1', [slugFinal])).rows.length > 0) {
    slugFinal = `${slugBase}-${compteur++}`;
  }

  const resultat = await executerRequete(
    `INSERT INTO articles
      (slug, titre_fr, titre_en, resume_fr, resume_en, contenu_fr, contenu_en,
       url_image_couverture, texte_alternatif_image, meta_titre_fr, meta_titre_en,
       meta_description_fr, meta_description_en, mots_cles, auteur, publie)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [slugFinal, titreFr, titreEn, resumeFr, resumeEn, contenuFr, contenuEn,
     urlImageCouverture, texteAlternatifImage, metaTitreFr, metaTitreEn,
     metaDescriptionFr, metaDescriptionEn, motsCles, auteur || 'HI CONSULTING IMMIGRATION',
     publie !== undefined ? publie : true]
  );
  reponse.status(201).json(resultat.rows[0]);
}

async function modifierArticle(requete, reponse) {
  const { id } = requete.params;
  const correspondanceCamel = {
    titreFr: 'titre_fr', titreEn: 'titre_en', resumeFr: 'resume_fr', resumeEn: 'resume_en',
    contenuFr: 'contenu_fr', contenuEn: 'contenu_en', urlImageCouverture: 'url_image_couverture',
    texteAlternatifImage: 'texte_alternatif_image', metaTitreFr: 'meta_titre_fr', metaTitreEn: 'meta_titre_en',
    metaDescriptionFr: 'meta_description_fr', metaDescriptionEn: 'meta_description_en',
    motsCles: 'mots_cles', auteur: 'auteur', publie: 'publie'
  };

  const affectations = [];
  const valeurs = [];
  let indexParametre = 1;
  for (const [cleCamel, colonneSql] of Object.entries(correspondanceCamel)) {
    if (requete.body[cleCamel] !== undefined) {
      affectations.push(`${colonneSql} = $${indexParametre++}`);
      valeurs.push(requete.body[cleCamel]);
    }
  }
  if (affectations.length === 0) return reponse.status(400).json({ erreur: 'Aucune donnée à mettre à jour.' });

  affectations.push('mis_a_jour_le = NOW()');
  valeurs.push(id);
  const resultat = await executerRequete(
    `UPDATE articles SET ${affectations.join(', ')} WHERE id = $${indexParametre} RETURNING *`,
    valeurs
  );
  if (resultat.rows.length === 0) return reponse.status(404).json({ erreur: 'Article introuvable.' });
  reponse.json(resultat.rows[0]);
}

async function supprimerArticle(requete, reponse) {
  await executerRequete('DELETE FROM articles WHERE id = $1', [requete.params.id]);
  reponse.json({ message: 'Article supprimé avec succès.' });
}

module.exports = {
  ...envelopperTousLesControleurs({
    listerArticles, listerArticlesAdmin, obtenirArticleParSlug, creerArticle, modifierArticle, supprimerArticle
  }),
  genererSlug
};

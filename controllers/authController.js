const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

const TOURS_HACHAGE = 12;

async function connexion(requete, reponse) {
  const { email, motDePasse } = requete.body;
  if (!email || !motDePasse) {
    return reponse.status(400).json({ erreur: 'Email et mot de passe requis.' });
  }

  const resultat = await executerRequete('SELECT * FROM comptes_administration WHERE email = $1 AND actif = true', [email]);
  const compte = resultat.rows[0];
  if (!compte) {
    return reponse.status(401).json({ erreur: 'Identifiants incorrects.' });
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, compte.mot_de_passe_hache);
  if (!motDePasseValide) {
    return reponse.status(401).json({ erreur: 'Identifiants incorrects.' });
  }

  const jeton = jwt.sign(
    { id: compte.id, email: compte.email, role: compte.role, nomComplet: compte.nom_complet },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '8h' }
  );

  reponse.cookie('jeton_session', jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000
  });

  reponse.json({
    message: 'Connexion réussie.',
    utilisateur: { id: compte.id, email: compte.email, role: compte.role, nomComplet: compte.nom_complet }
  });
}

function deconnexion(requete, reponse) {
  reponse.clearCookie('jeton_session');
  reponse.json({ message: 'Déconnexion réussie.' });
}

/**
 * Création d'un compte collaborateur/admin.
 * - super_admin peut créer admin ou collaborateur.
 * - admin ne peut créer un collaborateur QUE si le champ droit_gestion_equipe
 *   lui a été activé par le super_admin.
 */
async function creerCompte(requete, reponse) {
  const demandeur = requete.utilisateurConnecte;
  const { email, motDePasse, nomComplet, role } = requete.body;

  if (!email || !motDePasse || !nomComplet || !role) {
    return reponse.status(400).json({ erreur: 'Tous les champs sont requis.' });
  }
  if (role === 'super_admin') {
    return reponse.status(403).json({ erreur: 'La création d\'un second Super Admin n\'est pas autorisée.' });
  }
  if (demandeur.role === 'admin') {
    const resultatDroit = await executerRequete(
      'SELECT droit_gestion_equipe FROM comptes_administration WHERE id = $1',
      [demandeur.id]
    );
    if (!resultatDroit.rows[0]?.droit_gestion_equipe) {
      return reponse.status(403).json({ erreur: 'Vous n\'avez pas le droit de gérer l\'équipe. Contactez le Super Admin.' });
    }
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, TOURS_HACHAGE);
  try {
    const resultat = await executerRequete(
      `INSERT INTO comptes_administration (email, mot_de_passe_hache, nom_complet, role, cree_par)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nom_complet, role`,
      [email, motDePasseHache, nomComplet, role, demandeur.id]
    );
    reponse.status(201).json({ message: 'Compte créé avec succès.', compte: resultat.rows[0] });
  } catch (erreur) {
    if (erreur.code === '23505') {
      return reponse.status(409).json({ erreur: 'Cet email est déjà utilisé.' });
    }
    throw erreur;
  }
}

async function listerComptes(requete, reponse) {
  const resultat = await executerRequete(
    'SELECT id, email, nom_complet, role, droit_gestion_equipe, actif, cree_le FROM comptes_administration ORDER BY cree_le DESC'
  );
  reponse.json(resultat.rows);
}

async function modifierCompte(requete, reponse) {
  const { id } = requete.params;
  const { email, nomComplet, motDePasse, droitGestionEquipe } = requete.body;

  const champsAMettreAJour = [];
  const valeurs = [];
  let indexParametre = 1;

  if (email) { champsAMettreAJour.push(`email = $${indexParametre++}`); valeurs.push(email); }
  if (nomComplet) { champsAMettreAJour.push(`nom_complet = $${indexParametre++}`); valeurs.push(nomComplet); }
  if (motDePasse) {
    const hache = await bcrypt.hash(motDePasse, TOURS_HACHAGE);
    champsAMettreAJour.push(`mot_de_passe_hache = $${indexParametre++}`);
    valeurs.push(hache);
  }
  if (typeof droitGestionEquipe === 'boolean' && ['admin', 'super_admin'].includes(requete.utilisateurConnecte.role)) {
    champsAMettreAJour.push(`droit_gestion_equipe = $${indexParametre++}`);
    valeurs.push(droitGestionEquipe);
  }

  if (champsAMettreAJour.length === 0) {
    return reponse.status(400).json({ erreur: 'Aucune donnée à mettre à jour.' });
  }

  valeurs.push(id);
  await executerRequete(
    `UPDATE comptes_administration SET ${champsAMettreAJour.join(', ')} WHERE id = $${indexParametre}`,
    valeurs
  );
  reponse.json({ message: 'Compte mis à jour avec succès.' });
}

async function supprimerCompte(requete, reponse) {
  const { id } = requete.params;
  const compteVise = await executerRequete('SELECT role FROM comptes_administration WHERE id = $1', [id]);
  if (compteVise.rows[0]?.role === 'super_admin') {
    return reponse.status(403).json({ erreur: 'Le compte Super Admin ne peut pas être supprimé.' });
  }
  await executerRequete('DELETE FROM comptes_administration WHERE id = $1', [id]);
  reponse.json({ message: 'Compte supprimé avec succès.' });
}

module.exports = envelopperTousLesControleurs({ connexion, deconnexion, creerCompte, listerComptes, modifierCompte, supprimerCompte });

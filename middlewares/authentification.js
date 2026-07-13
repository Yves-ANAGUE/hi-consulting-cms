const jwt = require('jsonwebtoken');

/**
 * Vérifie la présence et la validité du token JWT (cookie httpOnly en priorité,
 * en-tête Authorization en secours pour les appels API directs/outils).
 */
function verifierAuthentification(requete, reponse, suivant) {
  const jeton = requete.cookies?.jeton_session || extraireJetonEnTete(requete);
  if (!jeton) {
    return reponse.status(401).json({ erreur: 'Authentification requise.' });
  }
  try {
    const donneesJeton = jwt.verify(jeton, process.env.JWT_SECRET);
    requete.utilisateurConnecte = donneesJeton;
    suivant();
  } catch (erreur) {
    return reponse.status(401).json({ erreur: 'Session invalide ou expirée.' });
  }
}

function extraireJetonEnTete(requete) {
  const enTete = requete.headers.authorization;
  if (!enTete || !enTete.startsWith('Bearer ')) return null;
  return enTete.slice(7);
}

/**
 * Fabrique un middleware qui n'autorise que les rôles listés.
 * Hiérarchie : super_admin > admin > collaborateur.
 * @param  {...string} rolesAutorises
 */
function autoriserRoles(...rolesAutorises) {
  return (requete, reponse, suivant) => {
    if (!requete.utilisateurConnecte || !rolesAutorises.includes(requete.utilisateurConnecte.role)) {
      return reponse.status(403).json({ erreur: 'Accès refusé : privilèges insuffisants.' });
    }
    suivant();
  };
}

/**
 * Un compte ne peut modifier/supprimer un autre profil que si :
 * - il modifie son propre profil, OU
 * - il est admin/super_admin (droit de gestion des employés).
 */
function autoriserAutoGestionOuAdmin(requete, reponse, suivant) {
  const idCible = requete.params.id;
  const utilisateur = requete.utilisateurConnecte;
  const estProprietaire = String(utilisateur.id) === String(idCible);
  const estGestionnaire = ['admin', 'super_admin'].includes(utilisateur.role);
  if (!estProprietaire && !estGestionnaire) {
    return reponse.status(403).json({ erreur: 'Vous ne pouvez modifier que votre propre profil.' });
  }
  suivant();
}

module.exports = { verifierAuthentification, autoriserRoles, autoriserAutoGestionOuAdmin };

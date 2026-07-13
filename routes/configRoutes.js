const express = require('express');
const routeur = express.Router();
const configController = require('../controllers/configController');
const reseauxSociauxController = require('../controllers/reseauxSociauxController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/textes', configController.listerTextesGlobaux);
routeur.patch('/textes/:cle', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), configController.modifierTexteGlobal);

routeur.get('/google', configController.obtenirConfigGoogle);
routeur.patch('/google', verifierAuthentification, autoriserRoles('admin', 'super_admin'), configController.modifierConfigGoogle);

routeur.get('/equipe', configController.listerEquipe);
routeur.post('/equipe', verifierAuthentification, autoriserRoles('admin', 'super_admin'), configController.creerMembreEquipe);
routeur.patch('/equipe/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), configController.modifierMembreEquipe);
routeur.delete('/equipe/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), configController.supprimerMembreEquipe);

// Réseaux sociaux : lecture publique (footer), écriture réservée au Back-Office
routeur.get('/reseaux-sociaux', reseauxSociauxController.listerReseauxSociaux);
routeur.get('/reseaux-sociaux/admin', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), reseauxSociauxController.listerReseauxSociauxAdmin);
routeur.post('/reseaux-sociaux', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), reseauxSociauxController.creerReseauSocial);
routeur.patch('/reseaux-sociaux/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), reseauxSociauxController.modifierReseauSocial);
routeur.delete('/reseaux-sociaux/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), reseauxSociauxController.supprimerReseauSocial);

module.exports = routeur;

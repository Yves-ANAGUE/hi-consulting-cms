const express = require('express');
const routeur = express.Router();
const authController = require('../controllers/authController');
const { verifierAuthentification, autoriserRoles, autoriserAutoGestionOuAdmin } = require('../middlewares/authentification');

routeur.post('/connexion', authController.connexion);
routeur.post('/deconnexion', authController.deconnexion);

routeur.get('/comptes', verifierAuthentification, autoriserRoles('admin', 'super_admin'), authController.listerComptes);
routeur.post('/comptes', verifierAuthentification, autoriserRoles('admin', 'super_admin'), authController.creerCompte);
routeur.patch('/comptes/:id', verifierAuthentification, autoriserAutoGestionOuAdmin, authController.modifierCompte);
routeur.delete('/comptes/:id', verifierAuthentification, autoriserAutoGestionOuAdmin, authController.supprimerCompte);

module.exports = routeur;

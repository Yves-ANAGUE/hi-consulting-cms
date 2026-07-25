const express = require('express');
const routeur = express.Router();
const { televersementMultiple } = require('../middlewares/televersementMemoire');
const televersementController = require('../controllers/televersementController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

// Ancienne route (fichier -> RAM serveur -> Cloudinary), conservée pour
// compatibilité mais plus utilisée par défaut par le Back-Office.
routeur.post(
  '/',
  verifierAuthentification,
  autoriserRoles('admin', 'super_admin', 'collaborateur'),
  televersementMultiple.array('fichiers', 15),
  televersementController.televerserMedias
);

// Nouvelle route : fournit juste une signature (quelques octets), jamais le
// fichier lui-même. Utilisée par le nouvel upload direct navigateur -> Cloudinary.
routeur.get(
  '/signature',
  verifierAuthentification,
  autoriserRoles('admin', 'super_admin', 'collaborateur'),
  televersementController.genererSignatureTeleversement
);

module.exports = routeur;
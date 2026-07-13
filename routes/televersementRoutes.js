const express = require('express');
const routeur = express.Router();
const { televersementMultiple } = require('../middlewares/televersementMemoire');
const televersementController = require('../controllers/televersementController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.post(
  '/',
  verifierAuthentification,
  autoriserRoles('admin', 'super_admin', 'collaborateur'),
  televersementMultiple.array('fichiers', 20),
  televersementController.televerserMedias
);

module.exports = routeur;

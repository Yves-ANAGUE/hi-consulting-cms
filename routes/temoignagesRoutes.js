const express = require('express');
const routeur = express.Router();
const temoignagesController = require('../controllers/temoignagesController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', temoignagesController.listerTemoignages);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), temoignagesController.creerTemoignage);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), temoignagesController.modifierTemoignage);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), temoignagesController.supprimerTemoignage);

module.exports = routeur;

const express = require('express');
const routeur = express.Router();
const servicesController = require('../controllers/servicesController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', servicesController.listerServices);
routeur.get('/:slug', servicesController.obtenirServiceParSlug);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), servicesController.creerService);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), servicesController.modifierService);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), servicesController.supprimerService);

module.exports = routeur;

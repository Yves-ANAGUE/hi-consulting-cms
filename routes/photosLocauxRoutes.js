const express = require('express');
const routeur = express.Router();
const photosLocauxController = require('../controllers/photosLocauxController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', photosLocauxController.listerPhotosLocaux);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), photosLocauxController.creerPhotoLocal);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), photosLocauxController.modifierPhotoLocal);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), photosLocauxController.supprimerPhotoLocal);

module.exports = routeur;

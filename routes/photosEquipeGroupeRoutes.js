const express = require('express');
const routeur = express.Router();
const photosEquipeGroupeController = require('../controllers/photosEquipeGroupeController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', photosEquipeGroupeController.listerPhotosEquipeGroupe);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), photosEquipeGroupeController.creerPhotoEquipeGroupe);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), photosEquipeGroupeController.modifierPhotoEquipeGroupe);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), photosEquipeGroupeController.supprimerPhotoEquipeGroupe);

module.exports = routeur;

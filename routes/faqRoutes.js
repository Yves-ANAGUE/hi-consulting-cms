const express = require('express');
const routeur = express.Router();
const faqController = require('../controllers/faqController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', faqController.listerFaq);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), faqController.creerFaq);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), faqController.modifierFaq);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), faqController.supprimerFaq);

module.exports = routeur;

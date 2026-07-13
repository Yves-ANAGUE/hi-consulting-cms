const express = require('express');
const routeur = express.Router();
const actualitesController = require('../controllers/actualitesController');

routeur.get('/', actualitesController.obtenirActualites);
routeur.get('/resume-ia', actualitesController.genererResumeGlobal);

module.exports = routeur;

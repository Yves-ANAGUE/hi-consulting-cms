const express = require('express');
const routeur = express.Router();
const contactController = require('../controllers/contactController');

routeur.post('/evaluation', contactController.soumettreFormulaireEvaluation);

module.exports = routeur;

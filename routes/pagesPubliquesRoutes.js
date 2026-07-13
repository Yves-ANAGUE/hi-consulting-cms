const express = require('express');
const routeur = express.Router();
const pagesPubliquesController = require('../controllers/pagesPubliquesController');

routeur.get('/', pagesPubliquesController.rendrePageAccueil);
routeur.get('/services', pagesPubliquesController.rendrePageServices);
routeur.get('/services/:slug', pagesPubliquesController.rendrePageDetailService);
routeur.get('/faq', pagesPubliquesController.rendrePageFaq);
routeur.get('/temoignages', pagesPubliquesController.rendrePageTemoignages);
routeur.get('/actualites', pagesPubliquesController.rendrePageActualites);
routeur.get('/blog', pagesPubliquesController.rendrePageBlogListe);
routeur.get('/blog/:slug', pagesPubliquesController.rendrePageBlogDetail);
routeur.get('/contact', pagesPubliquesController.rendrePageContact);

module.exports = routeur;

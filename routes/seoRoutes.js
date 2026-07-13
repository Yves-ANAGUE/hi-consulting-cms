const express = require('express');
const routeur = express.Router();
const seoTechniqueController = require('../controllers/seoTechniqueController');

routeur.get('/robots.txt', seoTechniqueController.genererRobotsTxt);
routeur.get('/sitemap.xml', seoTechniqueController.genererSitemapXml);

module.exports = routeur;

const express = require('express');
const routeur = express.Router();
const articlesController = require('../controllers/articlesController');
const { verifierAuthentification, autoriserRoles } = require('../middlewares/authentification');

routeur.get('/', articlesController.listerArticles);
routeur.get('/admin', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), articlesController.listerArticlesAdmin);
routeur.get('/:slug', articlesController.obtenirArticleParSlug);
routeur.post('/', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), articlesController.creerArticle);
routeur.patch('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin', 'collaborateur'), articlesController.modifierArticle);
routeur.delete('/:id', verifierAuthentification, autoriserRoles('admin', 'super_admin'), articlesController.supprimerArticle);

module.exports = routeur;

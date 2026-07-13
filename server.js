require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const routesPagesPubliques = require('./routes/pagesPubliquesRoutes');
const routesSeo = require('./routes/seoRoutes');
const routesSysteme = require('./routes/systemeRoutes');
const routesAuth = require('./routes/authRoutes');
const routesServices = require('./routes/servicesRoutes');
const routesFaq = require('./routes/faqRoutes');
const routesTemoignages = require('./routes/temoignagesRoutes');
const routesActualites = require('./routes/actualitesRoutes');
const routesContact = require('./routes/contactRoutes');
const routesChatbot = require('./routes/chatbotRoutes');
const routesConfig = require('./routes/configRoutes');
const routesTeleversement = require('./routes/televersementRoutes');
const routesPhotosLocaux = require('./routes/photosLocauxRoutes');
const routesPhotosEquipeGroupe = require('./routes/photosEquipeGroupeRoutes');
const routesArticles = require('./routes/articlesRoutes');

const application = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares globaux ---
application.use(helmet({
  contentSecurityPolicy: false // désactivé pour autoriser les CDN externes (GSAP, FontAwesome, images libres)
}));
application.use(compression());
application.use(cors({ credentials: true, origin: process.env.URL_SITE || true }));
application.use(express.json({ limit: '2mb' }));
application.use(express.urlencoded({ extended: true }));
application.use(cookieParser());

// --- Fichiers statiques (frontend vitrine + panneau admin) ---
application.use('/static', express.static(path.join(__dirname, 'public')));
application.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// --- Routes techniques SEO et anti-sommeil (avant tout, ultra légères) ---
application.use('/', routesSeo);
application.use('/api/systeme', routesSysteme);

// --- Routes API ---
application.use('/api/authentification', routesAuth);
application.use('/api/services', routesServices);
application.use('/api/faq', routesFaq);
application.use('/api/temoignages', routesTemoignages);
application.use('/api/actualites', routesActualites);
application.use('/api/contact', routesContact);
application.use('/api/chatbot', routesChatbot);
application.use('/api/configuration', routesConfig);
application.use('/api/televersement', routesTeleversement);
application.use('/api/photos-locaux', routesPhotosLocaux);
application.use('/api/photos-equipe-groupe', routesPhotosEquipeGroupe);
application.use('/api/articles', routesArticles);

// --- Pages publiques rendues en SSR (doit rester après les routes API/statiques) ---
application.use('/', routesPagesPubliques);

// --- Gestion des erreurs 404 ---
application.use((requete, reponse) => {
  if (requete.path.startsWith('/api')) {
    return reponse.status(404).json({ erreur: 'Route API introuvable.' });
  }
  reponse.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// --- Gestionnaire d'erreurs global ---
application.use((erreur, requete, reponse, suivant) => {
  console.error('[ErreurServeur]', erreur);
  if (erreur.message?.includes('Type de fichier non autorisé')) {
    return reponse.status(415).json({ erreur: erreur.message });
  }
  if (erreur.code === 'LIMIT_FILE_SIZE') {
    return reponse.status(413).json({ erreur: 'Fichier trop volumineux (80 Mo maximum par fichier).' });
  }
  reponse.status(500).json({ erreur: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' });
});

application.listen(PORT, () => {
  console.log(`[Serveur] HI CONSULTING IMMIGRATION - CMS démarré sur le port ${PORT}`);
  console.log(`[Serveur] Environnement : ${process.env.NODE_ENV || 'development'}`);
});

module.exports = application;

const express = require('express');
const routeur = express.Router();

// Route ultra-légère qui ne touche jamais Neon : appelée par un service
// externe (ex: UptimeRobot) pour empêcher la mise en veille du serveur
// gratuit, sans consommer le quota d'heures de calcul de la base.
routeur.get('/ping', (requete, reponse) => {
  reponse.type('text/plain').send('OK');
});

module.exports = routeur;

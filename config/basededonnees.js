const { Pool } = require('pg');

// Pool de connexions réutilisables - évite l'ouverture d'une connexion par requête
// et respecte le quota de connexions simultanées imposé par Neon (plan gratuit).
const poolConnexion = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

poolConnexion.on('error', (erreur) => {
  console.error('[BaseDeDonnees] Erreur inattendue sur une connexion inactive du pool :', erreur.message);
});

/**
 * Exécute une requête SQL paramétrée.
 * @param {string} texteRequete
 * @param {Array} parametres
 */
async function executerRequete(texteRequete, parametres = []) {
  const debut = Date.now();
  const resultat = await poolConnexion.query(texteRequete, parametres);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL] ${texteRequete.slice(0, 80)}... (${Date.now() - debut}ms, ${resultat.rowCount} ligne(s))`);
  }
  return resultat;
}

module.exports = { poolConnexion, executerRequete };

const fs = require('fs');
const path = require('path');

// Cache des gabarits bruts lus sur disque : évite une lecture disque à
// chaque requête HTTP (le disque est le goulot d'étranglement le plus lent
// de la pile). Invalidation manuelle possible via viderCacheGabarits().
const cacheGabarits = new Map();

function lireGabarit(nomFichier) {
  if (cacheGabarits.has(nomFichier)) return cacheGabarits.get(nomFichier);
  const cheminComplet = path.join(__dirname, '..', 'views', nomFichier);
  const contenu = fs.readFileSync(cheminComplet, 'utf-8');
  if (process.env.NODE_ENV === 'production') cacheGabarits.set(nomFichier, contenu);
  return contenu;
}

/**
 * Résout récursivement les directives d'inclusion {{> fichier.html}} avant
 * l'injection des données (permet de mutualiser l'en-tête et le pied de
 * page sans dupliquer le HTML dans chaque vue).
 */
function resoudreInclusions(gabarit) {
  return gabarit.replace(/\{\{>\s*([\w.-]+)\s*\}\}/g, (correspondanceComplete, nomPartiel) => {
    return resoudreInclusions(lireGabarit(nomPartiel));
  });
}

/**
 * Remplace toutes les occurrences de {{cle}} par la valeur correspondante.
 * Les clés absentes du dictionnaire sont remplacées par une chaîne vide
 * pour ne jamais laisser fuiter de syntaxe de gabarit vers le client (SEO).
 * @param {string} nomFichier
 * @param {Object<string,string>} donnees
 */
function rendreGabarit(nomFichier, donnees = {}) {
  const gabaritBrut = resoudreInclusions(lireGabarit(nomFichier));
  return gabaritBrut.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (correspondanceComplete, cle) => {
    const valeur = donnees[cle];
    return valeur === undefined || valeur === null ? '' : String(valeur);
  });
}

function viderCacheGabarits() {
  cacheGabarits.clear();
}

module.exports = { rendreGabarit, viderCacheGabarits };

/**
 * Cache en mémoire vive (RAM) basé sur une Map.
 *
 * Choix de structure : Map plutôt qu'un objet littéral ou un Array.
 * - Lecture/écriture/suppression en O(1) garanti (contrairement à un Array
 *   où retrouver une entrée par clé impose un parcours O(n)).
 * - Une Map conserve les types de clés natifs et évite les collisions avec
 *   les propriétés héritées du prototype Object (ex: "constructor", "toString").
 * - Itération ordonnée par insertion, utile pour purger les entrées les plus
 *   anciennes en cas de pression mémoire (non nécessaire ici : volume faible
 *   et fixe -> flux RSS unique + résumés IA).
 *
 * Complexité : get/set/delete = O(1). purgerExpires() = O(n) sur le nombre
 * d'entrées en cache, exécuté paresseusement (lazy) à chaque accès plutôt
 * que via un setInterval, pour ne consommer aucun cycle CPU en l'absence
 * de trafic (important sur un plan gratuit Render à ressources limitées).
 */
class CacheMemoire {
  constructor() {
    this.magasin = new Map();
  }

  /**
   * @param {string} cle
   * @param {*} valeur
   * @param {number} dureeViemillisecondes
   */
  definir(cle, valeur, dureeViemillisecondes) {
    this.magasin.set(cle, {
      valeur,
      expireA: Date.now() + dureeViemillisecondes
    });
  }

  /**
   * @param {string} cle
   * @returns {*|null}
   */
  obtenir(cle) {
    const entree = this.magasin.get(cle);
    if (!entree) return null;
    if (Date.now() > entree.expireA) {
      this.magasin.delete(cle);
      return null;
    }
    return entree.valeur;
  }

  possede(cle) {
    return this.obtenir(cle) !== null;
  }

  supprimer(cle) {
    this.magasin.delete(cle);
  }

  viderTout() {
    this.magasin.clear();
  }
}

// Instance unique partagée par tout le processus (singleton).
module.exports = new CacheMemoire();

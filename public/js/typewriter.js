/**
 * Effet machine à écrire minuté : écrit puis efface chaque mot de la liste
 * en boucle. Implémentation en récursion via setTimeout (et non setInterval)
 * pour pouvoir moduler précisément la vitesse d'écriture vs d'effacement.
 */
function demarrerMachineAEcrire(idElementCible, mots, vitesseEcritureMs = 90, vitesseEffacementMs = 45, pauseMs = 1400) {
  const element = document.getElementById(idElementCible);
  if (!element) return;

  let indexMot = 0;
  let indexCaractere = 0;
  let enEffacement = false;

  function etapeSuivante() {
    const motActuel = mots[indexMot];

    if (!enEffacement) {
      indexCaractere++;
      element.textContent = motActuel.slice(0, indexCaractere);
      if (indexCaractere === motActuel.length) {
        enEffacement = true;
        setTimeout(etapeSuivante, pauseMs);
        return;
      }
      setTimeout(etapeSuivante, vitesseEcritureMs);
    } else {
      indexCaractere--;
      element.textContent = motActuel.slice(0, indexCaractere);
      if (indexCaractere === 0) {
        enEffacement = false;
        indexMot = (indexMot + 1) % mots.length;
        setTimeout(etapeSuivante, 300);
        return;
      }
      setTimeout(etapeSuivante, vitesseEffacementMs);
    }
  }

  etapeSuivante();
}

document.addEventListener('DOMContentLoaded', () => {
  const motsFr = ['Visitez.', 'Travaillez.', 'Étudiez.', 'Réussissez.'];
  const motsEn = ['Visit.', 'Work.', 'Study.', 'Succeed.'];
  const langueActive = localStorage.getItem('hi_consulting_langue') || 'fr';
  demarrerMachineAEcrire('texteMachineAEcrire', langueActive === 'fr' ? motsFr : motsEn);
});

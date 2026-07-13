document.addEventListener('DOMContentLoaded', async () => {
  const grille = document.getElementById('grilleServicesComplete');
  let tousLesServices = [];

  try {
    tousLesServices = await recupererJson('/api/services');
    afficherServices(tousLesServices);
  } catch {
    grille.innerHTML = '<p>Impossible de charger les services pour le moment.</p>';
  }

  function afficherServices(liste) {
    grille.innerHTML = liste.map(construireCarteService).join('') || '<p>Aucun service dans cette catégorie.</p>';
  }

  document.querySelectorAll('.filtre-pays').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      document.querySelectorAll('.filtre-pays').forEach((b) => b.classList.remove('actif'));
      bouton.classList.add('actif');
      const pays = bouton.dataset.pays;
      afficherServices(pays === 'tous' ? tousLesServices : tousLesServices.filter((s) => s.pays === pays));
    });
  });
});

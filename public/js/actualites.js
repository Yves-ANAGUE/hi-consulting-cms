document.addEventListener('DOMContentLoaded', async () => {
  const grille = document.getElementById('grilleActualitesComplete');
  const boutonSynthese = document.getElementById('boutonSyntheseIa');
  const conteneurSynthese = document.getElementById('conteneurSyntheseIa');

  try {
    const actualites = await recupererJson('/api/actualites');
    grille.innerHTML = actualites.map(construireCarteActualite).join('') || '<p>Aucune actualité disponible pour le moment.</p>';
  } catch {
    grille.innerHTML = '<p>Impossible de charger les actualités.</p>';
  }

  boutonSynthese?.addEventListener('click', async () => {
    boutonSynthese.disabled = true;
    conteneurSynthese.hidden = false;
    conteneurSynthese.textContent = langueActive() === 'fr' ? 'Analyse des actualités en cours...' : 'Analyzing the news...';
    try {
      const resultat = await recupererJson(`/api/actualites/resume-ia?langue=${langueActive()}`);
      conteneurSynthese.textContent = resultat.resume;
    } catch {
      conteneurSynthese.textContent = langueActive() === 'fr'
        ? 'La synthèse IA est momentanément indisponible.'
        : 'The AI summary is temporarily unavailable.';
    } finally {
      boutonSynthese.disabled = false;
    }
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  const grille = document.getElementById('grilleArticlesBlog');
  const formulaire = document.getElementById('formulaireRechercheBlog');
  const entreeRecherche = document.getElementById('entreeRechercheBlog');

  async function chargerArticles(recherche = '') {
    grille.innerHTML = '<div class="squelette-carte"></div><div class="squelette-carte"></div><div class="squelette-carte"></div>';
    try {
      const parametres = new URLSearchParams({ langue: langueActive() });
      if (recherche) parametres.set('recherche', recherche);
      const articles = await recupererJson(`/api/articles?${parametres.toString()}`);
      grille.innerHTML = articles.map(construireCarteArticle).join('') ||
        `<p class="texte-secondaire">${langueActive() === 'fr' ? 'Aucun article ne correspond à votre recherche.' : 'No article matches your search.'}</p>`;
    } catch {
      grille.innerHTML = '<p class="texte-secondaire">Impossible de charger les articles.</p>';
    }
  }

  formulaire?.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    chargerArticles(entreeRecherche.value.trim());
  });

  await chargerArticles();
});

function construireCarteArticle(article) {
  const titre = texteSelonLangue(article, 'titre_fr', 'titre_en');
  const resume = texteSelonLangue(article, 'resume_fr', 'resume_en');
  const date = new Date(article.cree_le).toLocaleDateString(langueActive() === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  // Estimation à partir de la longueur en caractères (LENGTH SQL), sans
  // charger le contenu complet de chaque article dans la liste.
  const longueurCaracteres = langueActive() === 'fr' ? article.longueur_fr : article.longueur_en;
  const tempsLecture = Math.max(1, Math.round((longueurCaracteres || 0) / 5 / 200));
  return `
    <a href="/blog/${article.slug}" class="carte">
      <img class="carte-image" src="${article.url_image_couverture || 'https://picsum.photos/seed/hi-consulting-article/900/600'}" alt="${echapperHtml(titre)}" loading="lazy">
      <div class="carte-contenu">
        <span class="carte-etiquette-pays">${date} · ${tempsLecture} min</span>
        <h3>${echapperHtml(titre)}</h3>
        <p>${echapperHtml((resume || '').slice(0, 110))}...</p>
        <span class="carte-lien-service">${langueActive() === 'fr' ? 'Lire l\'article →' : 'Read article →'}</span>
      </div>
    </a>`;
}

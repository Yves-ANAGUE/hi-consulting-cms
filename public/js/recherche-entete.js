document.addEventListener('DOMContentLoaded', () => {
  const bouton = document.getElementById('boutonRechercheEntete');
  const panneau = document.getElementById('panneauRechercheEntete');
  const entree = document.getElementById('entreeRechercheEntete');
  const resultats = document.getElementById('resultatsRechercheEntete');
  if (!bouton || !panneau) return;

  let minuteurRecherche = null;

  bouton.addEventListener('click', () => {
    const estOuvert = !panneau.hidden;
    panneau.hidden = estOuvert;
    if (!estOuvert) entree.focus();
  });

  document.addEventListener('click', (evenement) => {
    if (!panneau.contains(evenement.target) && evenement.target !== bouton && !bouton.contains(evenement.target)) {
      panneau.hidden = true;
    }
  });

  entree?.addEventListener('input', () => {
    clearTimeout(minuteurRecherche);
    const terme = entree.value.trim();
    if (terme.length < 2) {
      resultats.innerHTML = '';
      return;
    }
    // Anti-rebond (debounce) : évite un appel réseau à chaque frappe.
    minuteurRecherche = setTimeout(() => rechercherArticles(terme), 300);
  });

  async function rechercherArticles(terme) {
    const langue = localStorage.getItem('hi_consulting_langue') || 'fr';
    resultats.innerHTML = '<p class="texte-secondaire-recherche">Recherche...</p>';
    try {
      const reponse = await fetch(`/api/articles?recherche=${encodeURIComponent(terme)}&langue=${langue}`);
      const articles = await reponse.json();
      if (articles.length === 0) {
        resultats.innerHTML = `<p class="texte-secondaire-recherche">${langue === 'fr' ? 'Aucun article trouvé.' : 'No article found.'}</p>`;
        return;
      }
      resultats.innerHTML = articles.slice(0, 6).map((article) => {
        const titre = langue === 'fr' ? article.titre_fr : article.titre_en;
        return `<a href="/blog/${article.slug}" class="resultat-recherche-item">
          <img src="${article.url_image_couverture || 'https://picsum.photos/seed/hi-consulting-article/80/80'}" alt="">
          <span>${titre}</span>
        </a>`;
      }).join('');
    } catch {
      resultats.innerHTML = '<p class="texte-secondaire-recherche">Recherche indisponible.</p>';
    }
  }
});

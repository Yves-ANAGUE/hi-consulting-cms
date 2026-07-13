document.addEventListener('DOMContentLoaded', () => {
  const donneesBrutes = document.getElementById('donneesArticleInitiales')?.textContent;
  const conteneur = document.getElementById('articleBlog');
  if (!donneesBrutes || !conteneur) return;

  const article = JSON.parse(donneesBrutes);
  const titre = texteSelonLangue(article, 'titre_fr', 'titre_en');
  const contenu = texteSelonLangue(article, 'contenu_fr', 'contenu_en');
  const date = new Date(article.cree_le).toLocaleDateString(langueActive() === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const tempsLecture = calculerTempsLecture(contenu);
  const texteTempsLecture = langueActive() === 'fr' ? `${tempsLecture} min de lecture` : `${tempsLecture} min read`;

  // Le contenu est stocké en texte brut (paragraphes séparés par un saut de
  // ligne) : on le transforme en paragraphes HTML plutôt que d'autoriser du
  // HTML arbitraire depuis le Back-Office (surface XSS inutile pour un
  // simple éditeur de texte, sans perte de lisibilité pour l'utilisateur).
  const paragraphesHtml = contenu
    .split(/\n+/)
    .filter((paragraphe) => paragraphe.trim().length > 0)
    .map((paragraphe) => `<p>${echapperHtml(paragraphe.trim())}</p>`)
    .join('');

  conteneur.innerHTML = `
    <div class="entete-article-blog">
      <span class="carte-etiquette-pays">${date} · ${echapperHtml(article.auteur)} · ${texteTempsLecture}</span>
      <h1>${echapperHtml(titre)}</h1>
    </div>
    <img class="image-couverture-article" src="${article.url_image_couverture || 'https://picsum.photos/seed/hi-consulting-article/1200/700'}" alt="${echapperHtml(article.texte_alternatif_image || titre)}">
    <div class="corps-article-blog">${paragraphesHtml}</div>
    <a href="/contact" class="bouton bouton-primaire" style="margin-top:24px;">${langueActive() === 'fr' ? 'Demander une évaluation' : 'Request an evaluation'}</a>
  `;
  document.addEventListener('langueChangee', () => location.reload());
});

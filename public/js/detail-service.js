document.addEventListener('DOMContentLoaded', () => {
  const donneesBrutes = document.getElementById('donneesServiceInitiales')?.textContent;
  const article = document.getElementById('articleService');
  if (!donneesBrutes || !article) return;

  const service = JSON.parse(donneesBrutes);
  const titre = texteSelonLangue(service, 'titre_fr', 'titre_en');
  const description = texteSelonLangue(service, 'description_fr', 'description_en');

  article.innerHTML = `
    <span class="carte-etiquette-pays">${echapperHtml(traduirePays(service.pays))}</span>
    <h1>${echapperHtml(titre)}</h1>
    <img class="carte-image" style="height:320px;border-radius:14px;margin:20px 0;"
         src="${service.url_image || 'https://picsum.photos/seed/hi-consulting-service-defaut/1200/700'}"
         alt="${echapperHtml(service.texte_alternatif_image || titre)}">
    <p style="font-size:1.1rem;line-height:1.8;">${echapperHtml(description)}</p>
    <a href="/contact" class="bouton bouton-primaire" style="margin-top:24px;">${langueActive() === 'fr' ? 'Demander une évaluation' : 'Request an evaluation'}</a>
  `;
  document.addEventListener('langueChangee', () => location.reload());
});

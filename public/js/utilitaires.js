/** Fonctions partagées entre les scripts de pages publiques. */

function langueActive() {
  return localStorage.getItem('hi_consulting_langue') || 'fr';
}

function texteSelonLangue(objetBilingue, cleFr, cleEn) {
  return langueActive() === 'fr' ? objetBilingue[cleFr] : objetBilingue[cleEn];
}

const NOMS_PAYS = {
  Canada: { fr: 'Canada', en: 'Canada' },
  France: { fr: 'France', en: 'France' },
  Italie: { fr: 'Italie', en: 'Italy' },
  Belgique: { fr: 'Belgique', en: 'Belgium' },
  USA: { fr: 'USA', en: 'USA' }
};
function traduirePays(nomPays) {
  return NOMS_PAYS[nomPays]?.[langueActive()] || nomPays || 'Canada';
}

function echapperHtml(texte = '') {
  return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function recupererJson(url, options) {
  const reponse = await fetch(url, options);
  if (!reponse.ok) throw new Error(`Statut HTTP ${reponse.status}`);
  return reponse.json();
}

function construireCarteService(service) {
  const titre = texteSelonLangue(service, 'titre_fr', 'titre_en');
  const description = texteSelonLangue(service, 'description_fr', 'description_en');
  return `
    <a href="/services/${service.slug}" class="carte">
      <img class="carte-image" src="${service.url_image || 'https://picsum.photos/seed/hi-consulting-service-defaut/800/600'}" alt="${echapperHtml(service.texte_alternatif_image || titre)}" loading="lazy">
      <div class="carte-contenu">
        <span class="carte-etiquette-pays">${echapperHtml(traduirePays(service.pays))}</span>
        <h3>${echapperHtml(titre)}</h3>
        <p>${echapperHtml((description || '').slice(0, 100))}...</p>
        <span class="carte-lien-service">${langueActive() === 'fr' ? 'En savoir plus →' : 'Learn more →'}</span>
      </div>
    </a>`;
}

function construireCarteActualite(article) {
  return `
    <a href="${article.lien}" target="_blank" rel="noopener noreferrer" class="carte">
      <div class="carte-contenu">
        <span class="carte-etiquette-pays">${echapperHtml(article.source)}</span>
        <h3>${echapperHtml(article.titre)}</h3>
        <p>${echapperHtml(article.resume)}</p>
      </div>
    </a>`;
}

function construireCarteTemoignage(temoignage) {
  const texte = texteSelonLangue(temoignage, 'texte_fr', 'texte_en');
  const etoiles = '★'.repeat(temoignage.note) + '☆'.repeat(5 - temoignage.note);
  return `
    <div class="carte carte-temoignage">
      <div class="entete-carte-temoignage">
        ${temoignage.url_photo
          ? `<img class="avatar-temoignage" src="${temoignage.url_photo}" alt="Photo de ${echapperHtml(temoignage.nom_client)}" loading="lazy">`
          : `<div class="avatar-temoignage avatar-temoignage-defaut">${echapperHtml(temoignage.nom_client?.[0] || '?')}</div>`}
        <div class="identite-temoignage">
          <strong>${echapperHtml(temoignage.nom_client)}</strong>
          <span class="etoiles-temoignage" aria-label="Note ${temoignage.note} sur 5">${etoiles}</span>
          ${temoignage.pays_destination ? `<span class="pays-temoignage">${echapperHtml(temoignage.pays_destination)}</span>` : ''}
        </div>
      </div>
      <p class="texte-temoignage">${echapperHtml(texte)}</p>
      ${temoignage.url_video ? `<button class="bouton bouton-secondaire bouton-voir-video" data-url-video="${temoignage.url_video}" type="button">${langueActive() === 'fr' ? 'Voir la vidéo' : 'Watch video'}</button>` : ''}
    </div>`;
}

/**
 * Construit un bloc média plein cadre à partir de n'importe quelle URL
 * (image directe, vidéo directe, ou lien YouTube/Vimeo). Équivalent côté
 * navigateur de utils/mediaEmbed.js (Node) : dupliqué volontairement car ces
 * deux contextes d'exécution ne partagent pas de module bundlé.
 */
function construireBlocMediaUniversel(url, { classe = '', alt = '' } = {}) {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const correspondance = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    if (!correspondance) return '';
    const idVideo = correspondance[1];
    return `<div class="${classe} conteneur-embed-fond">
      <iframe src="https://www.youtube.com/embed/${idVideo}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade" frameborder="0" loading="lazy"></iframe>
    </div>`;
  }
  if (url.includes('vimeo.com')) {
    const correspondance = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (!correspondance) return '';
    return `<div class="${classe} conteneur-embed-fond">
      <iframe src="https://player.vimeo.com/video/${correspondance[1]}?autoplay=1&muted=1&controls=0&background=1" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade" frameborder="0" loading="lazy"></iframe>
    </div>`;
  }
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return `<video class="${classe}" src="${url}" muted loop autoplay playsinline></video>`;
  }
  return `<img class="${classe}" src="${url}" alt="${echapperHtml(alt)}" loading="lazy">`;
}

/**
 * Estime le temps de lecture d'un article à partir de son nombre de mots
 * (moyenne de 200 mots/minute, standard couramment utilisé par les blogs).
 * @param {string} texte
 * @returns {number} minutes (arrondi au moins à 1)
 */
function calculerTempsLecture(texte = '') {
  const nombreMots = texte.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(nombreMots / 200));
}

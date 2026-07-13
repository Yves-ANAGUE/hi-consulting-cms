/**
 * Détecte le type d'une URL de média et construit le HTML d'intégration
 * approprié. Corrige un point important : le champ "vidéo héros" acceptait
 * uniquement des liens de fichiers vidéo directs (.mp4...), typiquement
 * obtenus après un téléversement vers Cloudinary. Les liens provenant
 * d'ailleurs (YouTube, Vimeo) ont un format d'intégration différent (iframe,
 * pas de balise <video>) : sans cette détection, coller un lien YouTube dans
 * ce champ n'affichait rien.
 */

function extraireIdYoutube(url) {
  const correspondance = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
  return correspondance ? correspondance[1] : null;
}

function extraireIdVimeo(url) {
  const correspondance = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return correspondance ? correspondance[1] : null;
}

function estFichierVideoDirect(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function estFichierImageDirect(url) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

/**
 * Construit un bloc HTML plein cadre (couvrant tout son conteneur parent,
 * pensé pour un arrière-plan de section) à partir de n'importe quelle URL de
 * média : vidéo directe, image directe, ou lien YouTube/Vimeo.
 * @param {string} url
 * @param {{classe: string, alt: string, urlSecours: string}} options
 * @returns {string} HTML prêt à insérer
 */
function construireBlocMediaFond(url, { classe = '', alt = '', urlSecours = '' } = {}) {
  if (!url) {
    return urlSecours
      ? `<img class="${classe}" src="${urlSecours}" alt="${alt}" loading="eager">`
      : '';
  }

  const idYoutube = extraireIdYoutube(url);
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (!idYoutube) return construireBlocMediaFond('', { classe, alt, urlSecours });
    // Astuce classique pour un embed YouTube en arrière-plan silencieux et
    // sans contrôles : agrandi (scale) puis recentré pour masquer les bandes
    // noires et l'interface, à la manière d'un object-fit:cover natif.
    return `<div class="${classe} conteneur-embed-fond">
      <iframe
        src="https://www.youtube.com/embed/${idYoutube}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade" frameborder="0" loading="lazy"></iframe>
    </div>`;
  }

  const idVimeo = extraireIdVimeo(url);
  if (url.includes('vimeo.com')) {
    if (!idVimeo) return construireBlocMediaFond('', { classe, alt, urlSecours });
    return `<div class="${classe} conteneur-embed-fond">
      <iframe
        src="https://player.vimeo.com/video/${idVimeo}?autoplay=1&muted=1&controls=0&background=1"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade" frameborder="0" loading="lazy"></iframe>
    </div>`;
  }

  if (estFichierVideoDirect(url)) {
    return `<video class="${classe}" autoplay muted loop playsinline ${urlSecours ? `poster="${urlSecours}"` : ''}>
      <source src="${url}">
    </video>`;
  }

  if (estFichierImageDirect(url) || url.startsWith('http')) {
    // Tout le reste (y compris une URL sans extension mais valide, ex: une
    // image Cloudinary sans suffixe) est traité comme une image.
    return `<img class="${classe}" src="${url}" alt="${alt}" loading="eager">`;
  }

  return construireBlocMediaFond('', { classe, alt, urlSecours });
}

module.exports = { construireBlocMediaFond, extraireIdYoutube, extraireIdVimeo, estFichierVideoDirect, estFichierImageDirect };

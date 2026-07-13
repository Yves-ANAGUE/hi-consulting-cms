document.addEventListener('DOMContentLoaded', async () => {
  const piste = document.getElementById('pisteCarrouselTemoignages');
  const indicateurs = document.getElementById('indicateursCarrouselTemoignages');
  const boutonPrecedent = document.getElementById('boutonPrecedentTemoignage');
  const boutonSuivant = document.getElementById('boutonSuivantTemoignage');
  const modale = document.getElementById('modaleVideo');
  const conteneurIframe = document.getElementById('conteneurIframeVideo');

  let indexActuel = 0;
  let minuteurDefilementAuto = null;

  try {
    const listeTemoignages = await recupererJson('/api/temoignages');
    if (listeTemoignages.length === 0) {
      piste.innerHTML = '<p class="texte-secondaire">Aucun témoignage disponible.</p>';
      return;
    }

    piste.innerHTML = listeTemoignages.map((temoignage, index) =>
      `<div class="diapositive-temoignage${index === 0 ? ' active' : ''}">${construireCarteTemoignage(temoignage)}</div>`
    ).join('');

    indicateurs.innerHTML = listeTemoignages.map((_, index) =>
      `<button class="point-indicateur${index === 0 ? ' actif' : ''}" data-index="${index}" aria-label="Témoignage ${index + 1}"></button>`
    ).join('');

    piste.querySelectorAll('.bouton-voir-video').forEach((bouton) => {
      bouton.addEventListener('click', () => ouvrirVideoTemoignage(bouton.dataset.urlVideo));
    });

    function allerADiapositive(nouvelIndex) {
      const diapositives = piste.querySelectorAll('.diapositive-temoignage');
      indexActuel = (nouvelIndex + diapositives.length) % diapositives.length;
      diapositives.forEach((diapositive, index) => diapositive.classList.toggle('active', index === indexActuel));
      indicateurs.querySelectorAll('.point-indicateur').forEach((point, index) => point.classList.toggle('actif', index === indexActuel));
    }

    function relancerDefilementAuto() {
      clearInterval(minuteurDefilementAuto);
      minuteurDefilementAuto = setInterval(() => allerADiapositive(indexActuel + 1), 6000);
    }

    boutonPrecedent?.addEventListener('click', () => { allerADiapositive(indexActuel - 1); relancerDefilementAuto(); });
    boutonSuivant?.addEventListener('click', () => { allerADiapositive(indexActuel + 1); relancerDefilementAuto(); });
    indicateurs.querySelectorAll('.point-indicateur').forEach((point) => {
      point.addEventListener('click', () => { allerADiapositive(Number(point.dataset.index)); relancerDefilementAuto(); });
    });

    relancerDefilementAuto();
  } catch {
    piste.innerHTML = '<p class="texte-secondaire">Impossible de charger les témoignages.</p>';
  }

  document.getElementById('fermerModaleVideo')?.addEventListener('click', fermerModaleVideo);
  modale?.addEventListener('click', (evenement) => {
    if (evenement.target.id === 'modaleVideo') fermerModaleVideo();
  });

  function fermerModaleVideo() {
    modale.hidden = true;
    conteneurIframe.innerHTML = '';
  }

  /**
   * Seuls YouTube et TikTok proposent un format d'intégration publique
   * (iframe) fonctionnant sans clé API ni validation d'application.
   * Facebook et Instagram bloquent l'affichage de leurs pages classiques
   * dans une iframe (en-tête X-Frame-Options), d'où l'erreur "n'autorise
   * pas la connexion" : on ouvre alors la vidéo dans un nouvel onglet
   * plutôt que d'essayer d'intégrer une page qui le refusera toujours.
   */
  function ouvrirVideoTemoignage(urlBrute) {
    if (!urlBrute) return;

    if (urlBrute.includes('youtube.com') || urlBrute.includes('youtu.be')) {
      const idVideo = extraireIdYoutube(urlBrute);
      if (!idVideo) return window.open(urlBrute, '_blank', 'noopener,noreferrer');
      afficherIframe(`https://www.youtube.com/embed/${idVideo}?rel=0&modestbranding=1`);
      return;
    }

    if (urlBrute.includes('tiktok.com')) {
      const idVideo = extraireIdTiktok(urlBrute);
      if (!idVideo) return window.open(urlBrute, '_blank', 'noopener,noreferrer');
      afficherIframe(`https://www.tiktok.com/embed/v2/${idVideo}`);
      return;
    }

    // Facebook, Instagram, ou tout autre lien : intégration native non fiable
    // sans configuration d'application -> ouverture directe dans un nouvel onglet.
    window.open(urlBrute, '_blank', 'noopener,noreferrer');
  }

  function afficherIframe(urlIntegrable) {
    conteneurIframe.innerHTML = `<iframe src="${urlIntegrable}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    modale.hidden = false;
  }

  function extraireIdYoutube(url) {
    const correspondance = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
    return correspondance ? correspondance[1] : null;
  }

  function extraireIdTiktok(url) {
    const correspondance = url.match(/\/video\/(\d+)/);
    return correspondance ? correspondance[1] : null;
  }
});

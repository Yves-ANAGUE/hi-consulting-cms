document.addEventListener('DOMContentLoaded', async () => {
  const grilleServices = document.getElementById('grilleServicesApercu');
  const grilleActualites = document.getElementById('grilleActualitesApercu');

  try {
    const services = await recupererJson('/api/services');
    grilleServices.innerHTML = services.slice(0, 3).map(construireCarteService).join('') ||
      '<p>Aucun service disponible pour le moment.</p>';
  } catch {
    grilleServices.innerHTML = '<p>Impossible de charger les services.</p>';
  }

  try {
    const actualites = await recupererJson('/api/actualites');
    grilleActualites.innerHTML = actualites.slice(0, 3).map(construireCarteActualite).join('') ||
      '<p>Aucune actualité disponible.</p>';
  } catch {
    grilleActualites.innerHTML = '<p>Impossible de charger les actualités.</p>';
  }

  chargerTextesGlobauxAccueil();
  chargerEquipeAccueil();
  chargerPhotosLocaux();
  document.addEventListener('langueChangee', () => appliquerTextesGlobauxEnCache());

  const formulaire = document.getElementById('formulaireEvaluationAccueil');
  formulaire?.addEventListener('submit', (e) => soumettreFormulaireEvaluation(e, 'messageStatutFormulaire'));
});

// Mis en cache après le premier chargement pour ré-appliquer instantanément
// la bonne langue au clic sur FR/EN, sans refaire d'appel réseau.
let texteGlobauxEnCache = null;

async function chargerTextesGlobauxAccueil() {
  try {
    texteGlobauxEnCache = await recupererJson('/api/configuration/textes');
    appliquerTextesGlobauxEnCache();
  } catch {
    // En cas d'échec, les textes de secours codés dans le HTML restent affichés.
  }
}

function appliquerTextesGlobauxEnCache() {
  if (!texteGlobauxEnCache) return;
  const langue = langueActive();

  const elementSlogan = document.getElementById('texteSloganPrincipal');
  if (elementSlogan && texteGlobauxEnCache.slogan_principal) {
    elementSlogan.textContent = texteGlobauxEnCache.slogan_principal[langue];
  }

  const elementApropos = document.getElementById('texteAproposEntreprise');
  if (elementApropos && texteGlobauxEnCache.a_propos) {
    elementApropos.textContent = texteGlobauxEnCache.a_propos[langue];
  }

  const elementMission = document.getElementById('texteMissionEntreprise');
  if (elementMission && texteGlobauxEnCache.mission) {
    elementMission.textContent = texteGlobauxEnCache.mission[langue];
  }

  const elementVision = document.getElementById('texteVisionEntreprise');
  if (elementVision && texteGlobauxEnCache.vision) {
    elementVision.textContent = texteGlobauxEnCache.vision[langue];
  }
}

async function chargerEquipeAccueil() {
  const diaporama = document.getElementById('diaporamaEquipe');
  const indicateurs = document.getElementById('indicateursDiaporamaEquipe');
  if (!diaporama) return;
  try {
    const photos = await recupererJson('/api/photos-equipe-groupe');
    if (photos.length === 0) {
      diaporama.innerHTML = '<p class="texte-secondaire" style="text-align:center;">Photos d\'équipe à ajouter depuis le Back-Office.</p>';
      return;
    }

    diaporama.innerHTML = photos.map((photo, index) => {
      const legende = texteSelonLangue(photo, 'legende_fr', 'legende_en');
      return `
        <div class="diapositive-equipe${index === 0 ? ' active' : ''}">
          <img src="${photo.url_media}" alt="${echapperHtml(legende || 'Équipe HI CONSULTING IMMIGRATION')}" loading="${index === 0 ? 'eager' : 'lazy'}">
          ${legende ? `<span class="legende-diaporama-equipe">${echapperHtml(legende)}</span>` : ''}
        </div>`;
    }).join('');

    if (photos.length > 1) {
      indicateurs.innerHTML = photos.map((_, index) =>
        `<button class="point-indicateur${index === 0 ? ' actif' : ''}" data-index="${index}" aria-label="Photo ${index + 1}"></button>`
      ).join('');

      let indexActuel = 0;
      function allerADiapositive(nouvelIndex) {
        const diapositives = diaporama.querySelectorAll('.diapositive-equipe');
        indexActuel = (nouvelIndex + diapositives.length) % diapositives.length;
        diapositives.forEach((diapositive, index) => diapositive.classList.toggle('active', index === indexActuel));
        indicateurs.querySelectorAll('.point-indicateur').forEach((point, index) => point.classList.toggle('actif', index === indexActuel));
      }
      indicateurs.querySelectorAll('.point-indicateur').forEach((point) => {
        point.addEventListener('click', () => allerADiapositive(Number(point.dataset.index)));
      });
      setInterval(() => allerADiapositive(indexActuel + 1), 5000);
    }
  } catch {
    diaporama.innerHTML = '<p class="texte-secondaire" style="text-align:center;">Impossible de charger les photos de l\'équipe pour le moment.</p>';
  }
}

async function chargerPhotosLocaux() {
  const grille = document.getElementById('grillePhotosLocaux');
  if (!grille) return;
  try {
    const photos = await recupererJson('/api/photos-locaux');
    grille.innerHTML = photos.map(construireVignettePhotoLocal).join('') ||
      '<p class="texte-secondaire">Photos à ajouter depuis le Back-Office (onglet Médias).</p>';
  } catch {
    grille.innerHTML = '<p class="texte-secondaire">Impossible de charger les photos pour le moment.</p>';
  }
}

function construireVignettePhotoLocal(photo) {
  const legende = texteSelonLangue(photo, 'legende_fr', 'legende_en');
  const blocMedia = construireBlocMediaUniversel(photo.url_media, { classe: 'media-photogrid', alt: legende || 'Locaux HI CONSULTING IMMIGRATION' });
  return `
    <div class="vignette-photogrid">
      ${blocMedia}
      <span class="legende-photogrid">${echapperHtml(legende || '')}</span>
    </div>`;
}

async function soumettreFormulaireEvaluation(evenement, idMessageStatut) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const messageStatut = document.getElementById(idMessageStatut);
  const donnees = Object.fromEntries(new FormData(formulaire).entries());

  messageStatut.textContent = 'Envoi en cours...';
  messageStatut.className = 'message-statut';

  try {
    const reponse = await fetch('/api/contact/evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    });
    const resultat = await reponse.json();
    if (!reponse.ok) throw new Error(resultat.erreur || 'Erreur inconnue');
    messageStatut.textContent = resultat.message;
    messageStatut.classList.add('succes');
    formulaire.reset();
  } catch (erreur) {
    messageStatut.textContent = erreur.message;
    messageStatut.classList.add('erreur');
  }
}

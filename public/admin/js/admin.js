/* ============================================================
   HI CONSULTING IMMIGRATION — Back-Office (logique cliente)
   ============================================================ */

const API = '/api';

/* ---------- Utilitaires réseau ---------- */
async function appelApi(chemin, options = {}) {
  const reponse = await fetch(`${API}${chemin}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (reponse.status === 401) {
    window.location.href = '/admin/login.html';
    throw new Error('Session expirée.');
  }
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(donnees.erreur || `Erreur HTTP ${reponse.status}`);
  return donnees;
}

function echapperHtml(texte = '') {
  return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   PAGE DE CONNEXION
   ============================================================ */
const formulaireConnexion = document.getElementById('formulaireConnexion');
if (formulaireConnexion) {
  formulaireConnexion.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const messageErreur = document.getElementById('messageErreurConnexion');
    const donnees = Object.fromEntries(new FormData(formulaireConnexion).entries());
    messageErreur.textContent = '';
    try {
      await appelApi('/authentification/connexion', { method: 'POST', body: JSON.stringify(donnees) });
      window.location.href = '/admin/index.html';
    } catch (erreur) {
      messageErreur.textContent = erreur.message;
    }
  });
}

/* ============================================================
   TABLEAU DE BORD PRINCIPAL (index.html uniquement)
   ============================================================ */
const barreLaterale = document.querySelector('.barre-laterale-admin');
if (barreLaterale) {
  initialiserTableauDeBord();
}

async function initialiserTableauDeBord() {
  // Navigation par onglets
  document.querySelectorAll('.lien-onglet').forEach((bouton) => {
    bouton.addEventListener('click', () => activerOnglet(bouton.dataset.onglet));
  });

  document.getElementById('boutonDeconnexion')?.addEventListener('click', async () => {
    await appelApi('/authentification/deconnexion', { method: 'POST' }).catch(() => {});
    window.location.href = '/admin/login.html';
  });

  document.getElementById('fermerModaleFormulaire')?.addEventListener('click', fermerModale);
  document.getElementById('modaleFormulaire')?.addEventListener('click', (e) => {
    if (e.target.id === 'modaleFormulaire') fermerModale();
  });

  document.querySelectorAll('[data-action]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const action = bouton.dataset.action;
      const gestionnaires = {
        'ouvrir-formulaire-service': () => ouvrirFormulaireService(),
        'ouvrir-formulaire-faq': () => ouvrirFormulaireFaq(),
        'ouvrir-formulaire-temoignage': () => ouvrirFormulaireTemoignage(),
        'ouvrir-formulaire-membre': () => ouvrirFormulaireMembre(),
        'ouvrir-formulaire-compte': () => ouvrirFormulaireCompte(),
        'ouvrir-formulaire-reseau': () => ouvrirFormulaireReseau(),
        'ouvrir-formulaire-article': () => ouvrirFormulaireArticle(),
        'ouvrir-formulaire-local': () => ouvrirFormulaireLocal(),
        'ouvrir-formulaire-photo-equipe': () => ouvrirFormulairePhotoEquipe()
      };
      gestionnaires[action]?.();
    });
  });

  document.getElementById('formulaireGoogle')?.addEventListener('submit', soumettreConfigGoogle);
  configurerZoneTeleversement();

  await Promise.all([
    chargerServices(),
    chargerFaq(),
    chargerTemoignages(),
    chargerActualites(),
    chargerEquipe(),
    chargerTextesGlobaux(),
    chargerConfigGoogle(),
    chargerReseauxAdmin(),
    chargerComptes(),
    chargerStatistiques(),
    chargerArticlesAdmin(),
    chargerLocauxAdmin(),
    chargerPhotosEquipeAdmin()
  ]).catch((erreur) => console.error('[Admin] Erreur de chargement initial :', erreur));
}

function activerOnglet(idOnglet) {
  document.querySelectorAll('.lien-onglet').forEach((b) => b.classList.toggle('actif', b.dataset.onglet === idOnglet));
  document.querySelectorAll('.panneau-onglet').forEach((p) => p.classList.remove('actif'));
  const nomsAffiches = {
    tableauDeBord: 'Tableau de bord', services: 'Services', faq: 'FAQ', temoignages: 'Témoignages',
    actualites: 'Actualités', blog: 'Blog', locaux: 'Nos Locaux', equipe: 'Équipe', textes: 'Textes du site',
    google: 'Configuration Google', reseaux: 'Réseaux sociaux', medias: 'Médias', comptes: 'Comptes'
  };
  document.getElementById(`onglet${idOnglet.charAt(0).toUpperCase()}${idOnglet.slice(1)}`)?.classList.add('actif');
  document.getElementById('titreOngletActif').textContent = nomsAffiches[idOnglet] || '';
}

/* ---------- Modale générique de formulaire ---------- */
function ouvrirModale(contenuHtml) {
  document.getElementById('corpsModaleFormulaire').innerHTML = contenuHtml;
  document.getElementById('modaleFormulaire').hidden = false;
}
function fermerModale() {
  document.getElementById('modaleFormulaire').hidden = true;
  document.getElementById('corpsModaleFormulaire').innerHTML = '';
}

/* ============================================================
   STATISTIQUES DU TABLEAU DE BORD
   ============================================================ */
async function chargerStatistiques() {
  try {
    const [services, faq, temoignages, comptes] = await Promise.all([
      appelApi('/services'), appelApi('/faq'), appelApi('/temoignages'), appelApi('/authentification/comptes').catch(() => [])
    ]);
    document.getElementById('statNombreServices').textContent = services.length;
    document.getElementById('statNombreFaq').textContent = faq.length;
    document.getElementById('statNombreTemoignages').textContent = temoignages.length;
    document.getElementById('statNombreComptes').textContent = Array.isArray(comptes) ? comptes.length : '-';
  } catch (erreur) {
    console.error('[Admin] Statistiques indisponibles :', erreur.message);
  }
}

/* ============================================================
   SERVICES
   ============================================================ */
async function chargerServices() {
  const services = await appelApi('/services');
  const conteneur = document.getElementById('listeServicesAdmin');
  conteneur.innerHTML = services.map((service) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(service.titre_fr)}</strong>
        <span>${echapperHtml(service.pays || '')} · /services/${echapperHtml(service.slug)}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-service="${service.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-service="${service.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun service pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-service]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const service = services.find((s) => String(s.id) === bouton.dataset.modifierService);
      ouvrirFormulaireService(service);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-service]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer ce service définitivement ?')) return;
      await appelApi(`/services/${bouton.dataset.supprimerService}`, { method: 'DELETE' });
      chargerServices();
    });
  });
}

function ouvrirFormulaireService(service = {}) {
  ouvrirModale(`
    <h2>${service.id ? 'Modifier' : 'Ajouter'} un service</h2>
    <form id="formulaireService" class="formulaire-admin">
      <div class="bloc-bilingue">
        <span class="etiquette-langue">Français</span>
        <input type="text" name="titreFr" placeholder="Titre (FR)" value="${echapperHtml(service.titre_fr || '')}" required>
        <textarea name="descriptionFr" placeholder="Description (FR)" rows="3">${echapperHtml(service.description_fr || '')}</textarea>
        <span class="etiquette-langue">English</span>
        <input type="text" name="titreEn" placeholder="Title (EN)" value="${echapperHtml(service.titre_en || '')}" required>
        <textarea name="descriptionEn" placeholder="Description (EN)" rows="3">${echapperHtml(service.description_en || '')}</textarea>
      </div>
      <label>Pays
        <select name="pays">
          ${['Canada', 'France', 'Italie', 'Belgique', 'USA'].map((p) => `<option value="${p}" ${service.pays === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </label>
      <label>Meta Title (FR) <input type="text" name="metaTitreFr" value="${echapperHtml(service.meta_titre_fr || '')}"></label>
      <label>Meta Description (FR) <input type="text" name="metaDescriptionFr" value="${echapperHtml(service.meta_description_fr || '')}"></label>
      <label>URL image (Cloudinary) <input type="text" name="urlImage" value="${echapperHtml(service.url_image || '')}"></label>
      <label>Texte alternatif image (Alt) <input type="text" name="texteAlternatifImage" value="${echapperHtml(service.texte_alternatif_image || '')}"></label>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${service.ordre_affichage ?? 0}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireService"></p>
    </form>
  `);
  document.getElementById('formulaireService').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    const messageStatut = document.getElementById('messageStatutFormulaireService');
    try {
      if (service.id) {
        await appelApi(`/services/${service.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/services', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerServices();
      chargerStatistiques();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   FAQ
   ============================================================ */
async function chargerFaq() {
  const listeFaq = await appelApi('/faq');
  const conteneur = document.getElementById('listeFaqAdmin');
  conteneur.innerHTML = listeFaq.map((faq) => `
    <div class="item-liste-admin">
      <div class="infos-item"><strong>${echapperHtml(faq.question_fr)}</strong></div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-faq="${faq.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-faq="${faq.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucune question pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-faq]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const faq = listeFaq.find((f) => String(f.id) === bouton.dataset.modifierFaq);
      ouvrirFormulaireFaq(faq);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-faq]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer cette question ?')) return;
      await appelApi(`/faq/${bouton.dataset.supprimerFaq}`, { method: 'DELETE' });
      chargerFaq();
    });
  });
}

function ouvrirFormulaireFaq(faq = {}) {
  ouvrirModale(`
    <h2>${faq.id ? 'Modifier' : 'Ajouter'} une question FAQ</h2>
    <form id="formulaireFaq" class="formulaire-admin">
      <div class="bloc-bilingue">
        <span class="etiquette-langue">Français</span>
        <input type="text" name="questionFr" placeholder="Question (FR)" value="${echapperHtml(faq.question_fr || '')}" required>
        <textarea name="reponseFr" placeholder="Réponse (FR)" rows="3" required>${echapperHtml(faq.reponse_fr || '')}</textarea>
        <span class="etiquette-langue">English</span>
        <input type="text" name="questionEn" placeholder="Question (EN)" value="${echapperHtml(faq.question_en || '')}" required>
        <textarea name="reponseEn" placeholder="Answer (EN)" rows="3" required>${echapperHtml(faq.reponse_en || '')}</textarea>
      </div>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${faq.ordre_affichage ?? 0}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireFaq"></p>
    </form>
  `);
  document.getElementById('formulaireFaq').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    const messageStatut = document.getElementById('messageStatutFormulaireFaq');
    try {
      if (faq.id) {
        await appelApi(`/faq/${faq.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/faq', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerFaq();
      chargerStatistiques();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   TÉMOIGNAGES
   ============================================================ */
async function chargerTemoignages() {
  const listeTemoignages = await appelApi('/temoignages');
  const conteneur = document.getElementById('listeTemoignagesAdmin');
  conteneur.innerHTML = listeTemoignages.map((temoignage) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(temoignage.nom_client)}</strong>
        <span>${'★'.repeat(temoignage.note)}${'☆'.repeat(5 - temoignage.note)} · ${echapperHtml(temoignage.pays_destination || '')}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-temoignage="${temoignage.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-temoignage="${temoignage.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun témoignage pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-temoignage]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const temoignage = listeTemoignages.find((t) => String(t.id) === bouton.dataset.modifierTemoignage);
      ouvrirFormulaireTemoignage(temoignage);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-temoignage]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer ce témoignage ?')) return;
      await appelApi(`/temoignages/${bouton.dataset.supprimerTemoignage}`, { method: 'DELETE' });
      chargerTemoignages();
    });
  });
}

function ouvrirFormulaireTemoignage(temoignage = {}) {
  ouvrirModale(`
    <h2>${temoignage.id ? 'Modifier' : 'Ajouter'} un témoignage</h2>
    <form id="formulaireTemoignage" class="formulaire-admin">
      <label>Nom du client <input type="text" name="nomClient" value="${echapperHtml(temoignage.nom_client || '')}" required></label>
      <label>Note (1 à 5)
        <input type="number" name="note" min="1" max="5" value="${temoignage.note ?? 5}" required>
      </label>
      <div class="bloc-bilingue">
        <span class="etiquette-langue">Français</span>
        <textarea name="texteFr" placeholder="Texte (FR)" rows="3" required>${echapperHtml(temoignage.texte_fr || '')}</textarea>
        <span class="etiquette-langue">English</span>
        <textarea name="texteEn" placeholder="Text (EN)" rows="3" required>${echapperHtml(temoignage.texte_en || '')}</textarea>
      </div>
      <label>Pays de destination <input type="text" name="paysDestination" value="${echapperHtml(temoignage.pays_destination || '')}"></label>
      <label>URL photo (Cloudinary) <input type="text" name="urlPhoto" value="${echapperHtml(temoignage.url_photo || '')}"></label>
      <label>Lien vidéo (YouTube/TikTok) <input type="text" name="urlVideo" value="${echapperHtml(temoignage.url_video || '')}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireTemoignage"></p>
    </form>
  `);
  document.getElementById('formulaireTemoignage').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    donnees.note = Number(donnees.note);
    const messageStatut = document.getElementById('messageStatutFormulaireTemoignage');
    try {
      if (temoignage.id) {
        await appelApi(`/temoignages/${temoignage.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/temoignages', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerTemoignages();
      chargerStatistiques();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   ACTUALITÉS (lecture seule, issues du flux RSS + cache RAM)
   ============================================================ */
async function chargerActualites() {
  const actualites = await appelApi('/actualites');
  const conteneur = document.getElementById('listeActualitesAdmin');
  conteneur.innerHTML = actualites.map((article) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(article.titre)}</strong>
        <span>${echapperHtml(article.source)} · ${new Date(article.datePublication).toLocaleDateString('fr-FR')}</span>
      </div>
      <div class="actions-item-admin">
        <a class="bouton-icone" href="${article.lien}" target="_blank" rel="noopener noreferrer">Voir la source</a>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucune actualité disponible pour le moment.</p>';
}

/* ============================================================
   ÉQUIPE (organigramme)
   ============================================================ */
async function chargerEquipe() {
  const equipe = await appelApi('/configuration/equipe');
  const conteneur = document.getElementById('listeEquipeAdmin');
  conteneur.innerHTML = equipe.map((membre) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(membre.nom)}</strong>
        <span>${echapperHtml(membre.poste_fr)}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-membre="${membre.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-membre="${membre.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun membre enregistré.</p>';

  conteneur.querySelectorAll('[data-modifier-membre]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const membre = equipe.find((m) => String(m.id) === bouton.dataset.modifierMembre);
      ouvrirFormulaireMembre(membre);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-membre]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer ce membre ?')) return;
      await appelApi(`/configuration/equipe/${bouton.dataset.supprimerMembre}`, { method: 'DELETE' });
      chargerEquipe();
    });
  });
}

function ouvrirFormulaireMembre(membre = {}) {
  ouvrirModale(`
    <h2>${membre.id ? 'Modifier' : 'Ajouter'} un membre de l'équipe</h2>
    <form id="formulaireMembre" class="formulaire-admin">
      <label>Nom complet <input type="text" name="nom" value="${echapperHtml(membre.nom || '')}" required></label>
      <label>Poste (FR) <input type="text" name="posteFr" value="${echapperHtml(membre.poste_fr || '')}" required></label>
      <label>Poste (EN) <input type="text" name="posteEn" value="${echapperHtml(membre.poste_en || '')}" required></label>
      <label>URL photo (Cloudinary) <input type="text" name="urlPhoto" value="${echapperHtml(membre.url_photo || '')}"></label>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${membre.ordre_affichage ?? 0}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireMembre"></p>
    </form>
  `);
  document.getElementById('formulaireMembre').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    const messageStatut = document.getElementById('messageStatutFormulaireMembre');
    try {
      if (membre.id) {
        await appelApi(`/configuration/equipe/${membre.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/configuration/equipe', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerEquipe();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   TEXTES GLOBAUX (zéro texte figé)
   ============================================================ */
async function chargerTextesGlobaux() {
  const dictionnaire = await appelApi('/configuration/textes');
  const conteneur = document.getElementById('listeTextesAdmin');
  const entrees = Object.entries(dictionnaire);
  conteneur.innerHTML = entrees.map(([cle, valeurs]) => `
    <div class="item-liste-admin" style="flex-direction:column;align-items:stretch;">
      <strong>${echapperHtml(cle)}</strong>
      <form class="formulaire-admin formulaire-texte-global" data-cle="${echapperHtml(cle)}" style="margin-top:10px;">
        <input type="text" name="valeurFr" value="${echapperHtml(valeurs.fr || '')}" placeholder="Version française">
        <input type="text" name="valeurEn" value="${echapperHtml(valeurs.en || '')}" placeholder="English version">
        <button type="submit" class="bouton bouton-primaire" style="align-self:flex-start;">Mettre à jour</button>
      </form>
    </div>`).join('') || '<p class="texte-secondaire">Aucun texte global enregistré. Utilisez le script de seed pour les initialiser.</p>';

  conteneur.querySelectorAll('.formulaire-texte-global').forEach((formulaire) => {
    formulaire.addEventListener('submit', async (evenement) => {
      evenement.preventDefault();
      const cle = formulaire.dataset.cle;
      const donnees = Object.fromEntries(new FormData(formulaire).entries());
      await appelApi(`/configuration/textes/${cle}`, { method: 'PATCH', body: JSON.stringify(donnees) });
    });
  });
}

/* ============================================================
   CONFIGURATION GOOGLE (GA4 + Search Console) + LOGO + WHATSAPP
   ============================================================ */
async function chargerConfigGoogle() {
  const config = await appelApi('/configuration/google');
  const formulaire = document.getElementById('formulaireGoogle');
  formulaire.idMesureGa4.value = config.id_mesure_ga4 || '';
  formulaire.codeVerificationSearchConsole.value = config.code_verification_search_console || '';
  formulaire.urlLogo.value = config.url_logo || '';
  formulaire.urlWhatsappFlottant.value = config.url_whatsapp_flottant || '';
  formulaire.urlGoogleMaps.value = config.url_google_maps || '';
  formulaire.urlVideoHero.value = config.url_video_hero || '';
  formulaire.urlImageMission.value = config.url_image_mission || '';
  formulaire.urlImageVision.value = config.url_image_vision || '';
}

async function soumettreConfigGoogle(evenement) {
  evenement.preventDefault();
  const donnees = Object.fromEntries(new FormData(evenement.target).entries());
  const messageStatut = document.getElementById('messageStatutGoogle');
  try {
    await appelApi('/configuration/google', { method: 'PATCH', body: JSON.stringify(donnees) });
    messageStatut.textContent = 'Configuration enregistrée avec succès.';
    messageStatut.className = 'message-statut succes';
  } catch (erreur) {
    messageStatut.textContent = erreur.message;
    messageStatut.className = 'message-statut erreur';
  }
}

/* ============================================================
   RÉSEAUX SOCIAUX (pied de page, entièrement modifiables)
   ============================================================ */
async function chargerReseauxAdmin() {
  const reseaux = await appelApi('/configuration/reseaux-sociaux/admin');
  const conteneur = document.getElementById('listeReseauxAdmin');
  conteneur.innerHTML = reseaux.map((reseau) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(reseau.plateforme)}</strong>
        <span>${echapperHtml(reseau.url)}${reseau.actif ? '' : ' · désactivé'}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-reseau="${reseau.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-reseau="${reseau.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun réseau social pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-reseau]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const reseau = reseaux.find((r) => String(r.id) === bouton.dataset.modifierReseau);
      ouvrirFormulaireReseau(reseau);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-reseau]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer ce réseau social ?')) return;
      await appelApi(`/configuration/reseaux-sociaux/${bouton.dataset.supprimerReseau}`, { method: 'DELETE' });
      chargerReseauxAdmin();
    });
  });
}

function ouvrirFormulaireReseau(reseau = {}) {
  ouvrirModale(`
    <h2>${reseau.id ? 'Modifier' : 'Ajouter'} un réseau social</h2>
    <form id="formulaireReseau" class="formulaire-admin">
      <label>Plateforme
        <select name="plateforme">
          ${['facebook', 'tiktok', 'instagram', 'linkedin', 'youtube', 'autre']
            .map((p) => `<option value="${p}" ${reseau.plateforme === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </label>
      <label>URL complète <input type="text" name="url" value="${echapperHtml(reseau.url || '')}" placeholder="https://..." required></label>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${reseau.ordre_affichage ?? 0}"></label>
      <label style="flex-direction:row;align-items:center;gap:8px;">
        <input type="checkbox" name="actif" ${reseau.actif === false ? '' : 'checked'} style="width:auto;">
        Afficher ce réseau sur le site
      </label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireReseau"></p>
    </form>
  `);
  document.getElementById('formulaireReseau').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const formData = new FormData(evenement.target);
    const donnees = Object.fromEntries(formData.entries());
    donnees.actif = formData.get('actif') === 'on';
    const messageStatut = document.getElementById('messageStatutFormulaireReseau');
    try {
      if (reseau.id) {
        await appelApi(`/configuration/reseaux-sociaux/${reseau.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/configuration/reseaux-sociaux', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerReseauxAdmin();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   TÉLÉVERSEMENT MULTI-FICHIERS (streaming vers Cloudinary)
   ============================================================ */
function configurerZoneTeleversement() {
  const zone = document.getElementById('zoneGlisserDeposer');
  const entreeFichiers = document.getElementById('entreeFichiers');
  if (!zone || !entreeFichiers) return;

  ['dragover', 'dragleave', 'drop'].forEach((typeEvenement) => {
    zone.addEventListener(typeEvenement, (e) => e.preventDefault());
  });
  zone.addEventListener('drop', (e) => televerserFichiers(e.dataTransfer.files));
  entreeFichiers.addEventListener('change', (e) => televerserFichiers(e.target.files));
}

async function televerserFichiers(listeFichiers) {
  const conteneurResultats = document.getElementById('resultatsTeleversement');
  if (!listeFichiers.length) return;

  const tailleTotaleMo = (Array.from(listeFichiers).reduce((total, f) => total + f.size, 0) / (1024 * 1024)).toFixed(1);
  conteneurResultats.innerHTML = `
    <div class="barre-progression-conteneur">
      <div class="barre-progression-info">
        <span id="texteProgressionUpload">Envoi de ${listeFichiers.length} fichier(s) (${tailleTotaleMo} Mo)...</span>
        <span id="pourcentageProgressionUpload">0%</span>
      </div>
      <div class="barre-progression-fond">
        <div id="barreProgressionUpload" class="barre-progression-remplissage" style="width:0%"></div>
      </div>
    </div>`;

  const formData = new FormData();
  Array.from(listeFichiers).forEach((fichier) => formData.append('fichiers', fichier));

  try {
    const resultat = await televerserAvecProgression(formData);
    conteneurResultats.innerHTML = (resultat.televersements || []).map((fichier) => `
      <div class="item-liste-admin">
        <div class="infos-item"><strong>${echapperHtml(fichier.nomOriginal)}</strong><span>${fichier.type}</span></div>
        <input type="text" readonly value="${fichier.url}" onclick="this.select()" style="flex:2;padding:8px;border-radius:6px;border:1px solid #d7dbe0;">
      </div>`).join('') || '<p class="texte-secondaire">Aucun fichier téléversé.</p>';
  } catch (erreur) {
    conteneurResultats.innerHTML = `<p class="message-statut erreur">${erreur.message}</p>`;
  }
}

/**
 * fetch() ne permet pas de suivre la progression d'un envoi (upload), seulement
 * celle d'une réception. XMLHttpRequest expose `upload.onprogress`, seul moyen
 * natif d'afficher une barre de progression fidèle pendant le transfert des
 * fichiers, potentiellement volumineux (vidéos de témoignages), vers le serveur.
 */
function televerserAvecProgression(formData) {
  return new Promise((resoudre, rejeter) => {
    const requete = new XMLHttpRequest();
    requete.open('POST', `${API}/televersement`);
    requete.withCredentials = true;

    requete.upload.addEventListener('progress', (evenement) => {
      if (!evenement.lengthComputable) return;
      const pourcentage = Math.round((evenement.loaded / evenement.total) * 100);
      const barre = document.getElementById('barreProgressionUpload');
      const texte = document.getElementById('pourcentageProgressionUpload');
      if (barre) barre.style.width = `${pourcentage}%`;
      if (texte) texte.textContent = `${pourcentage}%`;
    });

    requete.addEventListener('load', () => {
      try {
        const donnees = JSON.parse(requete.responseText);
        if (requete.status >= 200 && requete.status < 300) {
          resoudre(donnees);
        } else {
          rejeter(new Error(donnees.erreur || `Erreur HTTP ${requete.status}`));
        }
      } catch {
        rejeter(new Error('Réponse du serveur invalide.'));
      }
    });

    requete.addEventListener('error', () => rejeter(new Error('Erreur réseau pendant le téléversement.')));
    requete.send(formData);
  });
}

/* ============================================================
   COMPTES ADMINISTRATEURS (hiérarchie)
   ============================================================ */
async function chargerComptes() {
  const comptes = await appelApi('/authentification/comptes');
  const conteneur = document.getElementById('listeComptesAdmin');
  conteneur.innerHTML = comptes.map((compte) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(compte.nom_complet)}</strong>
        <span>${echapperHtml(compte.email)} · ${echapperHtml(compte.role)}${compte.droit_gestion_equipe ? ' · Gestion équipe activée' : ''}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-compte="${compte.id}">Modifier</button>
        ${compte.role !== 'super_admin' ? `<button class="bouton-icone supprimer" data-supprimer-compte="${compte.id}">Supprimer</button>` : ''}
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun compte trouvé.</p>';

  conteneur.querySelectorAll('[data-modifier-compte]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const compte = comptes.find((c) => String(c.id) === bouton.dataset.modifierCompte);
      ouvrirFormulaireCompte(compte);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-compte]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer ce compte définitivement ?')) return;
      await appelApi(`/authentification/comptes/${bouton.dataset.supprimerCompte}`, { method: 'DELETE' });
      chargerComptes();
      chargerStatistiques();
    });
  });
}

function ouvrirFormulaireCompte(compte = {}) {
  ouvrirModale(`
    <h2>${compte.id ? 'Modifier' : 'Ajouter'} un compte</h2>
    <form id="formulaireCompte" class="formulaire-admin">
      <label>Nom complet <input type="text" name="nomComplet" value="${echapperHtml(compte.nom_complet || '')}" required></label>
      <label>Email <input type="email" name="email" value="${echapperHtml(compte.email || '')}" required></label>
      <label>Mot de passe ${compte.id ? '(laisser vide pour ne pas changer)' : ''}
        <input type="password" name="motDePasse" ${compte.id ? '' : 'required'}>
      </label>
      ${!compte.id ? `
      <label>Rôle
        <select name="role">
          <option value="collaborateur">Collaborateur</option>
          <option value="admin">Admin</option>
        </select>
      </label>` : ''}
      <label style="flex-direction:row;align-items:center;gap:8px;">
        <input type="checkbox" name="droitGestionEquipe" ${compte.droit_gestion_equipe ? 'checked' : ''} style="width:auto;">
        Autoriser la gestion de l'équipe (création de collaborateurs)
      </label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireCompte"></p>
    </form>
  `);
  document.getElementById('formulaireCompte').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const formData = new FormData(evenement.target);
    const donnees = Object.fromEntries(formData.entries());
    donnees.droitGestionEquipe = formData.get('droitGestionEquipe') === 'on';
    if (!donnees.motDePasse) delete donnees.motDePasse;
    const messageStatut = document.getElementById('messageStatutFormulaireCompte');
    try {
      if (compte.id) {
        await appelApi(`/authentification/comptes/${compte.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/authentification/comptes', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerComptes();
      chargerStatistiques();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   BLOG (articles natifs, SEO)
   ============================================================ */
async function chargerArticlesAdmin() {
  const articles = await appelApi('/articles/admin');
  const conteneur = document.getElementById('listeArticlesAdmin');
  conteneur.innerHTML = articles.map((article) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(article.titre_fr)}</strong>
        <span>/blog/${echapperHtml(article.slug)} ${article.publie ? '' : '· brouillon'}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-article="${article.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-article="${article.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucun article pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-article]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const article = articles.find((a) => String(a.id) === bouton.dataset.modifierArticle);
      ouvrirFormulaireArticle(article);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-article]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer cet article définitivement ?')) return;
      await appelApi(`/articles/${bouton.dataset.supprimerArticle}`, { method: 'DELETE' });
      chargerArticlesAdmin();
    });
  });
}

function ouvrirFormulaireArticle(article = {}) {
  ouvrirModale(`
    <h2>${article.id ? 'Modifier' : 'Rédiger'} un article</h2>
    <form id="formulaireArticle" class="formulaire-admin">
      <div class="bloc-bilingue">
        <span class="etiquette-langue">Français</span>
        <input type="text" name="titreFr" placeholder="Titre (FR)" value="${echapperHtml(article.titre_fr || '')}" required>
        <textarea name="resumeFr" placeholder="Résumé court (FR, affiché dans la liste)" rows="2">${echapperHtml(article.resume_fr || '')}</textarea>
        <textarea name="contenuFr" placeholder="Contenu complet (FR, un paragraphe par ligne)" rows="8" required>${echapperHtml(article.contenu_fr || '')}</textarea>
        <span class="etiquette-langue">English</span>
        <input type="text" name="titreEn" placeholder="Title (EN)" value="${echapperHtml(article.titre_en || '')}" required>
        <textarea name="resumeEn" placeholder="Short summary (EN)" rows="2">${echapperHtml(article.resume_en || '')}</textarea>
        <textarea name="contenuEn" placeholder="Full content (EN, one paragraph per line)" rows="8" required>${echapperHtml(article.contenu_en || '')}</textarea>
      </div>
      <label>URL image de couverture (Cloudinary) <input type="text" name="urlImageCouverture" value="${echapperHtml(article.url_image_couverture || '')}"></label>
      <label>Meta Description (FR, pour Google) <input type="text" name="metaDescriptionFr" value="${echapperHtml(article.meta_description_fr || '')}"></label>
      <label>Mots-clés (séparés par des virgules, pour la recherche interne) <input type="text" name="motsCles" value="${echapperHtml(article.mots_cles || '')}"></label>
      <label style="flex-direction:row;align-items:center;gap:8px;">
        <input type="checkbox" name="publie" ${article.publie === false ? '' : 'checked'} style="width:auto;">
        Publier immédiatement (sinon enregistré comme brouillon)
      </label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireArticle"></p>
    </form>
  `);
  document.getElementById('formulaireArticle').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const formData = new FormData(evenement.target);
    const donnees = Object.fromEntries(formData.entries());
    donnees.publie = formData.get('publie') === 'on';
    const messageStatut = document.getElementById('messageStatutFormulaireArticle');
    try {
      if (article.id) {
        await appelApi(`/articles/${article.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/articles', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerArticlesAdmin();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   NOS LOCAUX (photos/vidéos de l'agence)
   ============================================================ */
async function chargerLocauxAdmin() {
  const photos = await appelApi('/photos-locaux');
  const conteneur = document.getElementById('listeLocauxAdmin');
  conteneur.innerHTML = photos.map((photo) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(photo.legende_fr || 'Sans légende')}</strong>
        <span>${photo.type_media}</span>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-local="${photo.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-local="${photo.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucune photo pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-local]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const photo = photos.find((p) => String(p.id) === bouton.dataset.modifierLocal);
      ouvrirFormulaireLocal(photo);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-local]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer cette photo ?')) return;
      await appelApi(`/photos-locaux/${bouton.dataset.supprimerLocal}`, { method: 'DELETE' });
      chargerLocauxAdmin();
    });
  });
}

function ouvrirFormulaireLocal(photo = {}) {
  ouvrirModale(`
    <h2>${photo.id ? 'Modifier' : 'Ajouter'} une photo/vidéo des locaux</h2>
    <form id="formulaireLocal" class="formulaire-admin">
      <label>URL du média (accepte les fichiers directs OU les liens YouTube/Vimeo)
        <input type="text" name="urlMedia" value="${echapperHtml(photo.url_media || '')}" placeholder="https://... ou https://youtube.com/watch?v=... ou https://vimeo.com/..." required>
      </label>
      <label>Type
        <select name="typeMedia">
          <option value="image" ${photo.type_media !== 'video' ? 'selected' : ''}>Image</option>
          <option value="video" ${photo.type_media === 'video' ? 'selected' : ''}>Vidéo (directe ou YouTube/Vimeo)</option>
        </select>
      </label>
      <label>Légende (FR) <input type="text" name="legendeFr" value="${echapperHtml(photo.legende_fr || '')}"></label>
      <label>Légende (EN) <input type="text" name="legendeEn" value="${echapperHtml(photo.legende_en || '')}"></label>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${photo.ordre_affichage ?? 0}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulaireLocal"></p>
    </form>
  `);
  document.getElementById('formulaireLocal').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    const messageStatut = document.getElementById('messageStatutFormulaireLocal');
    try {
      if (photo.id) {
        await appelApi(`/photos-locaux/${photo.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/photos-locaux', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerLocauxAdmin();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

/* ============================================================
   PHOTOS D'ÉQUIPE COLLECTIVES (diaporama public)
   ============================================================ */
async function chargerPhotosEquipeAdmin() {
  const photos = await appelApi('/photos-equipe-groupe');
  const conteneur = document.getElementById('listePhotosEquipeAdmin');
  conteneur.innerHTML = photos.map((photo) => `
    <div class="item-liste-admin">
      <div class="infos-item">
        <strong>${echapperHtml(photo.legende_fr || 'Sans légende')}</strong>
      </div>
      <div class="actions-item-admin">
        <button class="bouton-icone" data-modifier-photo-equipe="${photo.id}">Modifier</button>
        <button class="bouton-icone supprimer" data-supprimer-photo-equipe="${photo.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<p class="texte-secondaire">Aucune photo collective pour le moment.</p>';

  conteneur.querySelectorAll('[data-modifier-photo-equipe]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const photo = photos.find((p) => String(p.id) === bouton.dataset.modifierPhotoEquipe);
      ouvrirFormulairePhotoEquipe(photo);
    });
  });
  conteneur.querySelectorAll('[data-supprimer-photo-equipe]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      if (!confirm('Supprimer cette photo ?')) return;
      await appelApi(`/photos-equipe-groupe/${bouton.dataset.supprimerPhotoEquipe}`, { method: 'DELETE' });
      chargerPhotosEquipeAdmin();
    });
  });
}

function ouvrirFormulairePhotoEquipe(photo = {}) {
  ouvrirModale(`
    <h2>${photo.id ? 'Modifier' : 'Ajouter'} une photo collective</h2>
    <form id="formulairePhotoEquipe" class="formulaire-admin">
      <label>URL de la photo (grand format, toute l'équipe réunie ; téléversez-la dans l'onglet Médias)
        <input type="text" name="urlMedia" value="${echapperHtml(photo.url_media || '')}" required>
      </label>
      <label>Légende (FR) <input type="text" name="legendeFr" value="${echapperHtml(photo.legende_fr || '')}"></label>
      <label>Légende (EN) <input type="text" name="legendeEn" value="${echapperHtml(photo.legende_en || '')}"></label>
      <label>Ordre d'affichage <input type="number" name="ordreAffichage" value="${photo.ordre_affichage ?? 0}"></label>
      <button type="submit" class="bouton bouton-primaire">Enregistrer</button>
      <p class="message-statut" id="messageStatutFormulairePhotoEquipe"></p>
    </form>
  `);
  document.getElementById('formulairePhotoEquipe').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = Object.fromEntries(new FormData(evenement.target).entries());
    const messageStatut = document.getElementById('messageStatutFormulairePhotoEquipe');
    try {
      if (photo.id) {
        await appelApi(`/photos-equipe-groupe/${photo.id}`, { method: 'PATCH', body: JSON.stringify(donnees) });
      } else {
        await appelApi('/photos-equipe-groupe', { method: 'POST', body: JSON.stringify(donnees) });
      }
      fermerModale();
      chargerPhotosEquipeAdmin();
    } catch (erreur) {
      messageStatut.textContent = erreur.message;
      messageStatut.className = 'message-statut erreur';
    }
  });
}

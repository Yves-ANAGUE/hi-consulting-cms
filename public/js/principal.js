document.addEventListener('DOMContentLoaded', () => {
  injecterFondAnimeGlobal();

  const anneeSpan = document.getElementById('anneeActuelle');
  if (anneeSpan) anneeSpan.textContent = new Date().getFullYear();

  // Bouton WhatsApp flottant : masqué tant qu'aucun numéro n'est configuré
  // depuis le Back-Office (onglet Configuration Google).
  const boutonWhatsapp = document.getElementById('boutonWhatsappFlottant');
  if (boutonWhatsapp) {
    const numeroConfigure = boutonWhatsapp.dataset.whatsappConfigure;
    if (numeroConfigure && numeroConfigure.trim().length > 3) {
      boutonWhatsapp.hidden = false;
    }
  }

  // Réseaux sociaux du footer : rendus dynamiquement pour rester modifiables
  // (ajout/suppression/changement de lien) depuis le Back-Office sans toucher au code.
  chargerReseauxSociauxFooter();

  // Menu mobile
  const boutonMenu = document.getElementById('boutonMenuMobile');
  const navigation = document.querySelector('.navigation-principale');
  if (boutonMenu && navigation) {
    boutonMenu.addEventListener('click', () => {
      navigation.classList.toggle('ouvert');
    });
    // Ferme le menu automatiquement après avoir cliqué un lien (évite de
    // rester ouvert et de masquer la page suivante au chargement).
    navigation.querySelectorAll('a').forEach((lien) => {
      lien.addEventListener('click', () => navigation.classList.remove('ouvert'));
    });
  }

  // Animation d'entrée légère (fondu + translation) au scroll, sans dépendance externe.
  const elementsAnimes = document.querySelectorAll('main section, .carte');
  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting) {
          entree.target.style.opacity = '1';
          entree.target.style.transform = 'translateY(0)';
          observateur.unobserve(entree.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  elementsAnimes.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(24px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observateur.observe(element);
  });
});

/**
 * Insère le fond animé décoratif (formes flottantes + motif de points) au
 * tout début de <body>, une seule fois. Fait en JS plutôt que dupliqué dans
 * chacune des 10 vues du site : un seul endroit à maintenir, et le rendu
 * SSR des pages reste inchangé (élément purement cosmétique, aria-hidden).
 */
function injecterFondAnimeGlobal() {
  if (document.querySelector('.fond-anime-global')) return;
  const fond = document.createElement('div');
  fond.className = 'fond-anime-global';
  fond.setAttribute('aria-hidden', 'true');
  fond.innerHTML = `
    <div class="motif-points"></div>
    <div class="forme-fond forme-fond-1"></div>
    <div class="forme-fond forme-fond-2"></div>
    <div class="forme-fond forme-fond-3"></div>
    <div class="forme-fond forme-fond-4"></div>
  `;
  document.body.prepend(fond);
}

const ICONES_RESEAUX = {
  facebook: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.6 5.8a4.7 4.7 0 0 1-3.3-1.4v9.9a4.5 4.5 0 1 1-3.9-4.5v2.3a2.2 2.2 0 1 0 1.6 2.2V2h2.3a4.7 4.7 0 0 0 3.3 3.9z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2 .3 2.4.5.6.2 1 .5 1.5 1 .4.4.7.8 1 1.5.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2-.5 2.4-.2.6-.5 1-1 1.5-.4.4-.8.7-1.5 1-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2-.3-2.4-.5-.6-.2-1-.5-1.5-1-.4-.4-.7-.8-1-1.5-.2-.5-.4-1.2-.5-2.4-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-2 .5-2.4.2-.6.5-1 1-1.5.4-.4.8-.7 1.5-1 .5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 0-1.6.2-1.9.4-.5.2-.8.4-1.2.7-.3.3-.6.7-.7 1.2-.1.3-.3.9-.4 1.9-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1 .2 1.6.4 1.9.2.5.4.8.7 1.2.3.3.7.6 1.2.7.3.1.9.3 1.9.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1 0 1.6-.2 1.9-.4.5-.2.8-.4 1.2-.7.3-.3.6-.7.7-1.2.1-.3.3-.9.4-1.9.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1-.2-1.6-.4-1.9-.2-.5-.4-.8-.7-1.2-.3-.3-.7-.6-1.2-.7-.3-.1-.9-.3-1.9-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm5.7-2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.9 8.4H3.6V20H6.9V8.4zM5.3 3.5A1.9 1.9 0 1 0 5.3 7.3 1.9 1.9 0 0 0 5.3 3.5zM20.4 20h-3.3v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V20H9.5V8.4h3.2v1.6h.1c.4-.8 1.5-1.7 3.1-1.7 3.4 0 4 2.2 4 5.1V20z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C18 4.8 12 4.8 12 4.8s-6 0-7.5.4a3 3 0 0 0-2.1 2.1C2 8.8 2 12 2 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1c1.5.4 7.5.4 7.5.4s6 0 7.5-.4a3 3 0 0 0 2.1-2.1C22 15.2 22 12 22 12zM10 15.3V8.7l6 3.3-6 3.3z"/></svg>',
  defaut: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>'
};

async function chargerReseauxSociauxFooter() {
  const conteneur = document.getElementById('reseauxSociauxFooter');
  if (!conteneur) return;
  try {
    const reponse = await fetch('/api/configuration/reseaux-sociaux');
    const liste = await reponse.json();
    conteneur.innerHTML = liste
      .map((reseau) => {
        const icone = ICONES_RESEAUX[reseau.plateforme?.toLowerCase()] || ICONES_RESEAUX.defaut;
        return `<a href="${reseau.url}" target="_blank" rel="noopener noreferrer" aria-label="${reseau.plateforme}">${icone}</a>`;
      })
      .join('');
  } catch {
    conteneur.innerHTML = '';
  }
}

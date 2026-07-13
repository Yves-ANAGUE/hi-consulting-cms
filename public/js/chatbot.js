document.addEventListener('DOMContentLoaded', () => {
  const bulle = document.getElementById('bulleChatbot');
  const fenetre = document.getElementById('fenetreChatbot');
  const boutonFermer = document.getElementById('fermerChatbot');
  const formulaire = document.getElementById('formulaireChatbot');
  const entree = document.getElementById('entreeChatbot');
  const zoneMessages = document.getElementById('messagesChatbot');
  if (!bulle || !fenetre) return;

  let messageAccueilAffiche = false;
  // Historique conservé côté client uniquement (mémoire de session), pour
  // que le serveur reste "sans état" entre deux requêtes tout en donnant à
  // l'IA le contexte des derniers échanges (évite les réponses hors-sujet
  // aux questions de suivi comme "je veux dire vos services...").
  const historiqueConversation = [];

  // requestAnimationFrame garantit une ouverture perçue en moins de 200ms (INP).
  function basculerFenetre(afficher) {
    fenetre.hidden = false;
    requestAnimationFrame(() => {
      fenetre.classList.toggle('visible', afficher);
      if (!afficher) setTimeout(() => { fenetre.hidden = true; }, 180);
    });
    if (afficher && !messageAccueilAffiche) {
      const langue = localStorage.getItem('hi_consulting_langue') || 'fr';
      ajouterMessage(
        'assistant',
        langue === 'fr'
          ? 'Bonjour ! Je suis votre conseiller virtuel. Posez-moi une question sur l\'immigration au Canada, en France ou en Belgique.'
          : 'Hello! I\'m your virtual advisor. Ask me anything about immigration to Canada, France or Belgium.'
      );
      messageAccueilAffiche = true;
    }
  }

  bulle.addEventListener('click', () => basculerFenetre(!fenetre.classList.contains('visible')));
  boutonFermer?.addEventListener('click', () => basculerFenetre(false));

  function convertirLiensMarkdown(texte) {
    const echappe = texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return echappe.replace(/\[([^\]]+)\]\((\/[^\)]+)\)/g, '<a href="$2">$1</a>');
  }

  function ajouterMessage(role, texte) {
    const bulleMessage = document.createElement('div');
    bulleMessage.className = `message-chatbot ${role}`;
    bulleMessage.innerHTML = convertirLiensMarkdown(texte);
    zoneMessages.appendChild(bulleMessage);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
  }

  function afficherIndicateurFrappe() {
    const indicateur = document.createElement('div');
    indicateur.className = 'message-chatbot assistant indicateur-frappe';
    indicateur.id = 'indicateurFrappeChatbot';
    indicateur.innerHTML = '<span></span><span></span><span></span>';
    zoneMessages.appendChild(indicateur);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
  }

  function retirerIndicateurFrappe() {
    document.getElementById('indicateurFrappeChatbot')?.remove();
  }

  formulaire?.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const question = entree.value.trim();
    if (!question) return;
    ajouterMessage('utilisateur', question);
    historiqueConversation.push({ role: 'utilisateur', contenu: question });
    entree.value = '';
    afficherIndicateurFrappe();

    const langue = localStorage.getItem('hi_consulting_langue') || 'fr';
    try {
      const reponseServeur = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, langue, historique: historiqueConversation })
      });
      const donnees = await reponseServeur.json();
      retirerIndicateurFrappe();
      const texteReponse = donnees.reponse || (langue === 'fr' ? 'Une erreur est survenue, veuillez réessayer.' : 'An error occurred, please try again.');
      ajouterMessage('assistant', texteReponse);
      historiqueConversation.push({ role: 'assistant', contenu: texteReponse });
    } catch (erreur) {
      retirerIndicateurFrappe();
      ajouterMessage(
        'assistant',
        langue === 'fr'
          ? 'Connexion impossible pour le moment. Veuillez consulter notre page Contact.'
          : 'Connection unavailable right now. Please visit our Contact page.'
      );
    }
  });
});

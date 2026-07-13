document.addEventListener('DOMContentLoaded', () => {
  const formulaire = document.getElementById('formulaireEvaluationContact');
  formulaire?.addEventListener('submit', (evenement) => soumettreFormulaireContact(evenement));
});

async function soumettreFormulaireContact(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const messageStatut = document.getElementById('messageStatutFormulaireContact');
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

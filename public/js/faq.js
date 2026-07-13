document.addEventListener('DOMContentLoaded', async () => {
  const accordeon = document.getElementById('accordeonFaq');
  try {
    const listeFaq = await recupererJson('/api/faq');
    accordeon.innerHTML = listeFaq.map((faq, index) => `
      <div class="item-faq" data-index="${index}">
        <button class="question-faq" type="button" aria-expanded="false">
          <span>${echapperHtml(texteSelonLangue(faq, 'question_fr', 'question_en'))}</span>
          <span aria-hidden="true">+</span>
        </button>
        <div class="reponse-faq"><p>${echapperHtml(texteSelonLangue(faq, 'reponse_fr', 'reponse_en'))}</p></div>
      </div>
    `).join('') || '<p>Aucune question disponible.</p>';

    accordeon.querySelectorAll('.question-faq').forEach((bouton) => {
      bouton.addEventListener('click', () => {
        const item = bouton.closest('.item-faq');
        const reponse = item.querySelector('.reponse-faq');
        const estOuvert = item.classList.toggle('ouvert');
        bouton.setAttribute('aria-expanded', String(estOuvert));
        reponse.style.maxHeight = estOuvert ? `${reponse.scrollHeight}px` : '0';
      });
    });
  } catch {
    accordeon.innerHTML = '<p>Impossible de charger la FAQ pour le moment.</p>';
  }
});

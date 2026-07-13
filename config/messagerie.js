const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

const transporteurSmtp = nodemailer.createTransport({
  host: process.env.SMTP_HOTE,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_UTILISATEUR,
    pass: process.env.SMTP_MOT_DE_PASSE
  },
  connectionTimeout: 8000, // échoue vite plutôt que de bloquer la requête HTTP en attente
  socketTimeout: 8000
});

function construireContenuHtml({ nomComplet, email, telephone, projetChoisi, message }) {
  return `
    <h2>Nouvelle demande d'évaluation préliminaire</h2>
    <p><strong>Nom complet :</strong> ${nomComplet}</p>
    <p><strong>Email :</strong> ${email}</p>
    <p><strong>Téléphone :</strong> ${telephone}</p>
    <p><strong>Projet choisi :</strong> ${projetChoisi}</p>
    ${message ? `<p><strong>Message :</strong> ${message}</p>` : ''}
    <p><em>Reçu le ${new Date().toLocaleString('fr-FR')}</em></p>
  `;
}

/**
 * Envoi via l'API HTTP de Brevo (ex-Sendinblue), plutôt que via un socket
 * SMTP classique. De nombreux hébergeurs gratuits (dont Render) bloquent ou
 * ralentissent fortement les ports SMTP sortants (25/465/587), provoquant
 * des "Connection timeout" pouvant dépasser 30 secondes. L'API Brevo passe
 * en HTTPS (port 443), jamais bloqué, et répond typiquement en moins d'une
 * seconde.
 */
async function envoyerViaBrevoApi(donnees) {
  const reponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'Site Web HI CONSULTING', email: process.env.SMTP_UTILISATEUR || process.env.EMAIL_DESTINATAIRE },
      to: [{ email: process.env.EMAIL_DESTINATAIRE }],
      replyTo: { email: donnees.email },
      subject: `Nouvelle demande d'évaluation - ${donnees.nomComplet}`,
      htmlContent: construireContenuHtml(donnees)
    }),
    timeout: 8000
  });
  if (!reponse.ok) {
    const corps = await reponse.text().catch(() => '');
    throw new Error(`Brevo API : statut ${reponse.status} - ${corps.slice(0, 200)}`);
  }
}

async function envoyerViaSmtp(donnees) {
  await transporteurSmtp.sendMail({
    from: `"Site Web HI CONSULTING" <${process.env.SMTP_UTILISATEUR}>`,
    to: process.env.EMAIL_DESTINATAIRE,
    replyTo: donnees.email,
    subject: `Nouvelle demande d'évaluation - ${donnees.nomComplet}`,
    html: construireContenuHtml(donnees)
  });
}

/**
 * Envoie le formulaire d'évaluation préliminaire directement par e-mail
 * (aucun stockage en base pour préserver le quota Neon). Utilise l'API
 * Brevo si une clé est configurée (recommandé sur Render), sinon SMTP.
 * Cette fonction est appelée en "fire-and-forget" par le contrôleur : sa
 * durée n'impacte jamais le temps de réponse perçu par le visiteur.
 */
async function envoyerFormulaireEvaluation(donnees) {
  try {
    if (process.env.BREVO_API_KEY) {
      await envoyerViaBrevoApi(donnees);
    } else {
      await envoyerViaSmtp(donnees);
    }
    console.log(`[Messagerie] Formulaire envoyé avec succès pour ${donnees.email}.`);
    return true;
  } catch (erreur) {
    console.error('[Messagerie] Échec de l\'envoi, log de secours :', erreur.message);
    console.log('[Messagerie] Contenu non envoyé :', donnees);
    return false;
  }
}

module.exports = { envoyerFormulaireEvaluation };

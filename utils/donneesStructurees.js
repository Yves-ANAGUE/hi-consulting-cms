const URL_SITE = () => process.env.URL_SITE || 'http://localhost:3000';

/**
 * Construit le bloc de balises <meta> (title, description, OpenGraph) à
 * injecter dans le <head>. Retourne du HTML prêt à insérer.
 */
function construireBaliseMetaHtml({ titre, description, urlImage, urlCanonique, verificationSearchConsole, idMesureGa4 }) {
  const balises = [];
  balises.push(`<title>${echapperHtml(titre)}</title>`);
  balises.push(`<meta name="description" content="${echapperHtml(description)}">`);
  balises.push(`<link rel="canonical" href="${urlCanonique}">`);
  balises.push(`<meta property="og:title" content="${echapperHtml(titre)}">`);
  balises.push(`<meta property="og:description" content="${echapperHtml(description)}">`);
  balises.push(`<meta property="og:type" content="website">`);
  balises.push(`<meta property="og:url" content="${urlCanonique}">`);
  if (urlImage) balises.push(`<meta property="og:image" content="${urlImage}">`);
  balises.push(`<meta name="twitter:card" content="summary_large_image">`);

  if (verificationSearchConsole) {
    balises.push(`<meta name="google-site-verification" content="${echapperHtml(verificationSearchConsole)}">`);
  }
  if (idMesureGa4) {
    balises.push(`
      <script async src="https://www.googletagmanager.com/gtag/js?id=${idMesureGa4}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${idMesureGa4}');
      </script>`);
  }
  return balises.join('\n    ');
}

function echapperHtml(texte = '') {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function genererSchemaLocalBusiness(entreprise) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: entreprise.nom,
    description: entreprise.slogan,
    address: {
      '@type': 'PostalAddress',
      streetAddress: entreprise.adresse,
      addressLocality: 'Douala',
      addressCountry: 'CM'
    },
    telephone: entreprise.telephones,
    email: entreprise.email,
    url: URL_SITE(),
    sameAs: entreprise.reseauxSociaux
  });
}

function genererSchemaFaqPage(listeFaq, langue = 'fr') {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: listeFaq.map((faq) => ({
      '@type': 'Question',
      name: langue === 'fr' ? faq.question_fr : faq.question_en,
      acceptedAnswer: {
        '@type': 'Answer',
        text: langue === 'fr' ? faq.reponse_fr : faq.reponse_en
      }
    }))
  });
}

function genererSchemaTemoignages(listeTemoignages) {
  return JSON.stringify(
    listeTemoignages.map((temoignage) => ({
      '@context': 'https://schema.org',
      '@type': 'Review',
      author: { '@type': 'Person', name: temoignage.nom_client },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: temoignage.note,
        bestRating: '5'
      },
      reviewBody: temoignage.texte_fr
    }))
  );
}

function genererSchemaArticle(article, urlCanonique) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titre_fr,
    description: article.resume_fr,
    image: article.url_image_couverture ? [article.url_image_couverture] : undefined,
    author: { '@type': 'Organization', name: article.auteur || 'HI CONSULTING IMMIGRATION' },
    publisher: { '@type': 'Organization', name: 'HI CONSULTING IMMIGRATION' },
    datePublished: article.cree_le,
    dateModified: article.mis_a_jour_le || article.cree_le,
    mainEntityOfPage: urlCanonique
  });
}

module.exports = {
  construireBaliseMetaHtml,
  genererSchemaLocalBusiness,
  genererSchemaFaqPage,
  genererSchemaTemoignages,
  genererSchemaArticle,
  echapperHtml
};

const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

function genererRobotsTxt(requete, reponse) {
  const urlSite = process.env.URL_SITE || 'http://localhost:3000';
  const contenu = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/administration',
    `Sitemap: ${urlSite}/sitemap.xml`
  ].join('\n');
  reponse.type('text/plain').send(contenu);
}

async function genererSitemapXml(requete, reponse) {
  const urlSite = process.env.URL_SITE || 'http://localhost:3000';
  const pagesStatiques = ['/', '/services', '/temoignages', '/faq', '/actualites', '/blog', '/contact'];

  const resultatServices = await executerRequete('SELECT slug, mis_a_jour_le FROM services');
  const urlsServices = resultatServices.rows.map((service) => ({
    url: `/services/${service.slug}`,
    derniereModification: service.mis_a_jour_le
  }));

  const resultatArticles = await executerRequete('SELECT slug, mis_a_jour_le FROM articles WHERE publie = true');
  const urlsArticles = resultatArticles.rows.map((article) => ({
    url: `/blog/${article.slug}`,
    derniereModification: article.mis_a_jour_le
  }));

  const toutesLesEntrees = [
    ...pagesStatiques.map((chemin) => ({ url: chemin, derniereModification: new Date() })),
    ...urlsServices,
    ...urlsArticles
  ];

  const corpsXml = toutesLesEntrees
    .map(
      (entree) => `  <url>
    <loc>${urlSite}${entree.url}</loc>
    <lastmod>${new Date(entree.derniereModification).toISOString().split('T')[0]}</lastmod>
  </url>`
    )
    .join('\n');

  const xmlComplet = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpsXml}
</urlset>`;

  reponse.type('application/xml').send(xmlComplet);
}

module.exports = envelopperTousLesControleurs({ genererRobotsTxt, genererSitemapXml });

const { executerRequete } = require('../config/basededonnees');
const { envelopperTousLesControleurs } = require('../utils/envelopperAsync');

function genererRobotsTxt(requete, reponse) { 
  const urlSite = process.env.URL_SITE || 'http://localhost:3000'; 
  const contenu = [ 
    'User-agent: *', 
    'Allow: /', 
    'Disallow: /admin', 
    'Disallow: /api/administration', 
    'Disallow: /*.json$',       // Évite d'indexer vos routes API ou configs JSON publiques
    'Disallow: /node_modules/',  // Bloque les ressources système inutiles
    '',
    `Sitemap: ${urlSite}/sitemap.xml` 
  ].join('\n'); 
  reponse.type('text/plain').send(contenu); 
} 


async function genererSitemapXml(requete, reponse) {
  const urlSite = process.env.URL_SITE || 'http://localhost:3000';
  
  // 1. Configuration précise des pages statiques avec priorité
  const pagesStatiques = [
    { url: '/', mod: new Date(), freq: 'daily', prio: '1.0' },
    { url: '/services', mod: new Date(), freq: 'weekly', prio: '0.9' },
    { url: '/blog', mod: new Date(), freq: 'daily', prio: '0.8' },
    { url: '/contact', mod: new Date(), freq: 'monthly', prio: '0.8' },
    { url: '/temoignages', mod: new Date(), freq: 'weekly', prio: '0.7' },
    { url: '/faq', mod: new Date(), freq: 'monthly', prio: '0.6' },
    { url: '/actualites', mod: new Date(), freq: 'daily', prio: '0.7' }
  ];

  // 2. Récupération des services dynamiques
  const resultatServices = await executerRequete('SELECT slug, mis_a_jour_le FROM services');
  const urlsServices = resultatServices.rows.map((service) => ({
    url: `/services/${service.slug}`,
    derniereModification: service.mis_a_jour_le,
    freq: 'weekly',
    prio: '0.8' // Forte priorité pour vos pages de conversion (Entrée Express, etc.)
  }));

  // 3. Récupération des articles de blog
  const resultatArticles = await executerRequete('SELECT slug, mis_a_jour_le FROM articles WHERE publie = true');
  const urlsArticles = resultatArticles.rows.map((article) => ({
    url: `/blog/${article.slug}`,
    derniereModification: article.mis_a_jour_le,
    freq: 'monthly',
    prio: '0.6'
  }));

  // 4. Fusion de toutes les entrées
  const toutesLesEntrees = [
    ...pagesStatiques.map(p => ({ url: p.url, date: p.mod, freq: p.freq, prio: p.prio })),
    ...urlsServices.map(s => ({ url: s.url, date: s.derniereModification, freq: s.freq, prio: s.prio })),
    ...urlsArticles.map(a => ({ url: a.url, date: a.derniereModification, freq: a.freq, prio: a.prio }))
  ];

  // 5. Génération du corps XML enrichi
  const corpsXml = toutesLesEntrees
    .map(
      (entree) => `  <url>
    <loc>${urlSite}${entree.url}</loc>
    <lastmod>${new Date(entree.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>${entree.freq}</changefreq>
    <priority>${entree.prio}</priority>
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

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { executerRequete, poolConnexion } = require('../config/basededonnees');

async function creerTables() {
  await executerRequete(`
    CREATE TABLE IF NOT EXISTS comptes_administration (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      mot_de_passe_hache VARCHAR(255) NOT NULL,
      nom_complet VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'collaborateur')),
      droit_gestion_equipe BOOLEAN DEFAULT false,
      actif BOOLEAN DEFAULT true,
      cree_par INTEGER REFERENCES comptes_administration(id) ON DELETE SET NULL,
      cree_le TIMESTAMP DEFAULT NOW()
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      titre_fr VARCHAR(255) NOT NULL,
      titre_en VARCHAR(255) NOT NULL,
      description_fr TEXT,
      description_en TEXT,
      pays VARCHAR(100),
      meta_titre_fr VARCHAR(255),
      meta_titre_en VARCHAR(255),
      meta_description_fr VARCHAR(500),
      meta_description_en VARCHAR(500),
      url_image TEXT,
      texte_alternatif_image VARCHAR(255),
      ordre_affichage INTEGER DEFAULT 0,
      cree_le TIMESTAMP DEFAULT NOW(),
      mis_a_jour_le TIMESTAMP DEFAULT NOW()
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS foire_aux_questions (
      id SERIAL PRIMARY KEY,
      question_fr TEXT NOT NULL,
      question_en TEXT NOT NULL,
      reponse_fr TEXT NOT NULL,
      reponse_en TEXT NOT NULL,
      ordre_affichage INTEGER DEFAULT 0,
      cree_le TIMESTAMP DEFAULT NOW()
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS temoignages (
      id SERIAL PRIMARY KEY,
      nom_client VARCHAR(255) NOT NULL,
      note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
      texte_fr TEXT NOT NULL,
      texte_en TEXT NOT NULL,
      url_photo TEXT,
      url_video TEXT,
      pays_destination VARCHAR(100),
      cree_le TIMESTAMP DEFAULT NOW()
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS membres_equipe (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      poste_fr VARCHAR(255) NOT NULL,
      poste_en VARCHAR(255) NOT NULL,
      url_photo TEXT,
      ordre_affichage INTEGER DEFAULT 0
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS textes_globaux (
      cle VARCHAR(100) PRIMARY KEY,
      valeur_fr TEXT NOT NULL,
      valeur_en TEXT NOT NULL
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS configuration_google (
      id SERIAL PRIMARY KEY,
      id_mesure_ga4 VARCHAR(20),
      code_verification_search_console VARCHAR(255),
      url_logo TEXT,
      url_whatsapp_flottant VARCHAR(50),
      url_google_maps TEXT,
      url_video_hero TEXT,
      url_image_mission TEXT,
      url_image_vision TEXT
    );
  `);
  // Ajout rétroactif si la table existait déjà avant cette mise à jour du CMS.
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_logo TEXT;`);
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_whatsapp_flottant VARCHAR(50);`);
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_google_maps TEXT;`);
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_video_hero TEXT;`);
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_image_mission TEXT;`);
  await executerRequete(`ALTER TABLE configuration_google ADD COLUMN IF NOT EXISTS url_image_vision TEXT;`);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS reseaux_sociaux (
      id SERIAL PRIMARY KEY,
      plateforme VARCHAR(50) NOT NULL,
      url TEXT NOT NULL,
      ordre_affichage INTEGER DEFAULT 0,
      actif BOOLEAN DEFAULT true
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS photos_locaux (
      id SERIAL PRIMARY KEY,
      url_media TEXT NOT NULL,
      type_media VARCHAR(10) DEFAULT 'image' CHECK (type_media IN ('image', 'video')),
      legende_fr VARCHAR(255),
      legende_en VARCHAR(255),
      ordre_affichage INTEGER DEFAULT 0
    );
  `);

  // Grandes photos COLLECTIVES de l'équipe (diaporama plein cadre), distinctes
  // de la table membres_equipe (fiches individuelles conservées pour un usage
  // interne futur mais qui ne sont plus affichées publiquement, à la demande
  // explicite de l'entreprise de ne plus exposer les profils un par un).
  await executerRequete(`
    CREATE TABLE IF NOT EXISTS photos_equipe_groupe (
      id SERIAL PRIMARY KEY,
      url_media TEXT NOT NULL,
      legende_fr VARCHAR(255),
      legende_en VARCHAR(255),
      ordre_affichage INTEGER DEFAULT 0
    );
  `);

  await executerRequete(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      titre_fr VARCHAR(255) NOT NULL,
      titre_en VARCHAR(255) NOT NULL,
      resume_fr TEXT,
      resume_en TEXT,
      contenu_fr TEXT NOT NULL,
      contenu_en TEXT NOT NULL,
      url_image_couverture TEXT,
      texte_alternatif_image VARCHAR(255),
      meta_titre_fr VARCHAR(255),
      meta_titre_en VARCHAR(255),
      meta_description_fr VARCHAR(500),
      meta_description_en VARCHAR(500),
      mots_cles VARCHAR(500),
      auteur VARCHAR(255) DEFAULT 'HI CONSULTING IMMIGRATION',
      publie BOOLEAN DEFAULT true,
      cree_le TIMESTAMP DEFAULT NOW(),
      mis_a_jour_le TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('[Seed] Tables créées ou déjà existantes.');
}

async function creerSuperAdminInitial() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM comptes_administration');
  if (Number(resultat.rows[0].count) > 0) {
    console.log('[Seed] Des comptes existent déjà, création du Super Admin ignorée.');
    return;
  }
  const motDePasseHache = await bcrypt.hash(process.env.SUPER_ADMIN_MOT_DE_PASSE || 'ChangezMoiImmediatement123!', 12);
  await executerRequete(
    `INSERT INTO comptes_administration (email, mot_de_passe_hache, nom_complet, role, droit_gestion_equipe)
     VALUES ($1, $2, $3, 'super_admin', true)`,
    [process.env.SUPER_ADMIN_EMAIL || 'hiciofficiel@gmail.com', motDePasseHache, 'Super Administrateur']
  );
  console.log(`[Seed] Super Admin créé : ${process.env.SUPER_ADMIN_EMAIL}`);
}

async function seederServices() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM services');
  if (Number(resultat.rows[0].count) > 0) return;

  const services = [
    {
      slug: 'residence-permanente-canada',
      titreFr: 'Résidence Permanente Canada', titreEn: 'Canada Permanent Residence',
      descriptionFr: 'Accompagnement complet pour votre demande de résidence permanente via Entrée Express ou ARRIMA (Québec).',
      descriptionEn: 'Complete support for your permanent residence application via Express Entry or ARRIMA (Quebec).',
      pays: 'Canada',
      urlImage: 'https://picsum.photos/seed/canada-residence-permanente/900/600',
      texteAlternatifImage: 'Ville canadienne symbolisant la résidence permanente'
    },
    {
      slug: 'permis-etude-canada',
      titreFr: 'Permis d\'Étude Canada', titreEn: 'Canada Study Permit',
      descriptionFr: 'Constitution de dossier, choix d\'établissement et suivi jusqu\'à l\'obtention de votre permis d\'étude.',
      descriptionEn: 'File preparation, school selection and follow-up until you obtain your study permit.',
      pays: 'Canada',
      urlImage: 'https://picsum.photos/seed/canada-permis-etude/900/600',
      texteAlternatifImage: 'Étudiant international se préparant pour le Canada'
    },
    {
      slug: 'permis-travail-canada',
      titreFr: 'Permis de Travail Canada', titreEn: 'Canada Work Permit',
      descriptionFr: 'Recherche d\'employeur, validation d\'étude d\'impact et dépôt de votre demande de permis de travail.',
      descriptionEn: 'Employer search, labour market impact assessment and filing of your work permit application.',
      pays: 'Canada',
      urlImage: 'https://picsum.photos/seed/canada-permis-travail/900/600',
      texteAlternatifImage: 'Professionnel travaillant au Canada'
    },
    {
      slug: 'visa-visiteur-canada',
      titreFr: 'Visa Visiteur Canada', titreEn: 'Canada Visitor Visa',
      descriptionFr: 'Préparation de votre dossier de visa visiteur pour le Canada, incluant lettre d\'invitation et preuves de solvabilité.',
      descriptionEn: 'Preparation of your Canada visitor visa file, including invitation letter and proof of funds.',
      pays: 'Canada',
      urlImage: 'https://picsum.photos/seed/canada-visa-visiteur/900/600',
      texteAlternatifImage: 'Visiteur découvrant le Canada'
    },
    {
      slug: 'parrainage-familial-canada',
      titreFr: 'Parrainage Familial', titreEn: 'Family Sponsorship',
      descriptionFr: 'Accompagnement pour le parrainage d\'un époux, conjoint de fait ou enfant à charge vers le Canada.',
      descriptionEn: 'Support for sponsoring a spouse, common-law partner or dependent child to Canada.',
      pays: 'Canada',
      urlImage: 'https://picsum.photos/seed/canada-parrainage-familial/900/600',
      texteAlternatifImage: 'Famille réunie grâce au parrainage familial'
    },
    {
      slug: 'visa-etude-france',
      titreFr: 'Visa d\'Étude France', titreEn: 'France Student Visa',
      descriptionFr: 'Accompagnement Campus France, choix d\'établissement et dépôt de votre demande de visa long séjour étudiant.',
      descriptionEn: 'Campus France support, school selection and filing of your long-stay student visa application.',
      pays: 'France',
      urlImage: 'https://picsum.photos/seed/france-visa-etude/900/600',
      texteAlternatifImage: 'Étudiant se préparant pour la France'
    },
    {
      slug: 'visa-visiteur-france',
      titreFr: 'Visa Visiteur France', titreEn: 'France Visitor Visa',
      descriptionFr: 'Préparation complète de votre dossier de visa court séjour pour la France (Schengen).',
      descriptionEn: 'Complete preparation of your short-stay (Schengen) visa file for France.',
      pays: 'France',
      urlImage: 'https://picsum.photos/seed/france-visa-visiteur/900/600',
      texteAlternatifImage: 'Tour Eiffel symbolisant un visa visiteur France'
    },
    {
      slug: 'visa-visiteur-italie',
      titreFr: 'Visa Visiteur Italie', titreEn: 'Italy Visitor Visa',
      descriptionFr: 'Accompagnement pour votre demande de visa court séjour Schengen à destination de l\'Italie.',
      descriptionEn: 'Support for your short-stay Schengen visa application to Italy.',
      pays: 'Italie',
      urlImage: 'https://picsum.photos/seed/italie-visa-visiteur/900/600',
      texteAlternatifImage: 'Colisée de Rome symbolisant un visa visiteur Italie'
    },
    {
      slug: 'visa-etude-belgique',
      titreFr: 'Visa d\'Étude Belgique', titreEn: 'Belgium Student Visa',
      descriptionFr: 'Constitution de dossier et accompagnement pour votre demande de visa d\'étude vers la Belgique.',
      descriptionEn: 'File preparation and support for your study visa application to Belgium.',
      pays: 'Belgique',
      urlImage: 'https://picsum.photos/seed/belgique-visa-etude/900/600',
      texteAlternatifImage: 'Étudiant se préparant pour la Belgique'
    }
  ];

  for (const [index, service] of services.entries()) {
    await executerRequete(
      `INSERT INTO services (slug, titre_fr, titre_en, description_fr, description_en, pays, url_image, texte_alternatif_image, ordre_affichage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [service.slug, service.titreFr, service.titreEn, service.descriptionFr, service.descriptionEn,
       service.pays, service.urlImage, service.texteAlternatifImage, index]
    );
  }
  console.log(`[Seed] ${services.length} services insérés.`);
}

async function seederFaq() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM foire_aux_questions');
  if (Number(resultat.rows[0].count) > 0) return;

  const questions = [
    {
      questionFr: 'Qu\'est-ce que le programme Entrée Express ?',
      questionEn: 'What is the Express Entry program?',
      reponseFr: 'Entrée Express est le système de gestion des demandes de résidence permanente du Canada pour les travailleurs qualifiés, basé sur un système de points (Classement Global). Nous vous aidons à maximiser votre score et à préparer un dossier complet.',
      reponseEn: 'Express Entry is Canada\'s application management system for skilled workers seeking permanent residence, based on a points system (Comprehensive Ranking System). We help you maximize your score and prepare a complete file.'
    },
    {
      questionFr: 'Combien de temps prend une demande de permis d\'étude au Canada ?',
      questionEn: 'How long does a Canadian study permit application take?',
      reponseFr: 'Les délais varient selon le pays de résidence et la période de l\'année, généralement entre 4 et 12 semaines. Nous vous accompagnons pour constituer un dossier complet afin de réduire les risques de retard ou de refus.',
      reponseEn: 'Processing times vary by country of residence and time of year, generally between 4 and 12 weeks. We help you build a complete file to reduce the risk of delay or refusal.'
    },
    {
      questionFr: 'Qu\'est-ce que le programme ARRIMA au Québec ?',
      questionEn: 'What is the ARRIMA program in Quebec?',
      reponseFr: 'ARRIMA est le portail de déclaration d\'intérêt du Québec pour l\'immigration économique. Il permet au Québec de sélectionner les candidats correspondant à ses besoins de main-d\'œuvre. Notre équipe vous guide dans la création et l\'optimisation de votre profil.',
      reponseEn: 'ARRIMA is Quebec\'s expression of interest portal for economic immigration. It allows Quebec to select candidates matching its labour market needs. Our team guides you in creating and optimizing your profile.'
    },
    {
      questionFr: 'Puis-je obtenir un visa visiteur pour la France sans invitation ?',
      questionEn: 'Can I get a France visitor visa without an invitation letter?',
      reponseFr: 'Une lettre d\'invitation n\'est pas toujours obligatoire mais renforce considérablement votre dossier. Nous vous conseillons sur les pièces justificatives adaptées à votre situation (tourisme, famille, affaires).',
      reponseEn: 'An invitation letter is not always mandatory but significantly strengthens your file. We advise you on the supporting documents suited to your situation (tourism, family, business).'
    }
  ];

  for (const [index, question] of questions.entries()) {
    await executerRequete(
      `INSERT INTO foire_aux_questions (question_fr, question_en, reponse_fr, reponse_en, ordre_affichage)
       VALUES ($1,$2,$3,$4,$5)`,
      [question.questionFr, question.questionEn, question.reponseFr, question.reponseEn, index]
    );
  }
  console.log(`[Seed] ${questions.length} questions FAQ insérées.`);
}

async function seederTemoignages() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM temoignages');
  if (Number(resultat.rows[0].count) > 0) return;

  const temoignages = [
    {
      nomClient: 'Brice K.', note: 5, paysDestination: 'Canada',
      texteFr: 'Grâce à HI CONSULTING IMMIGRATION, j\'ai obtenu ma résidence permanente via Entrée Express en moins d\'un an. Un accompagnement sérieux et transparent du début à la fin.',
      texteEn: 'Thanks to HI CONSULTING IMMIGRATION, I obtained my permanent residence via Express Entry in less than a year. Serious and transparent support from start to finish.',
      urlPhoto: 'https://picsum.photos/seed/temoignage-brice/400/400',
      urlVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      nomClient: 'Estelle N.', note: 5, paysDestination: 'France',
      texteFr: 'Mon dossier de visa étudiant pour la France a été accepté du premier coup. L\'équipe a été disponible à chaque étape, je recommande vivement.',
      texteEn: 'My French student visa application was accepted on the first try. The team was available at every step, I highly recommend them.',
      urlPhoto: 'https://picsum.photos/seed/temoignage-estelle/400/400',
      urlVideo: ''
    },
    {
      nomClient: 'Junior T.', note: 4, paysDestination: 'Canada',
      texteFr: 'Processus de permis de travail bien encadré. Quelques délais administratifs indépendants de l\'agence, mais un suivi rigoureux jusqu\'à l\'obtention du visa.',
      texteEn: 'Well-managed work permit process. A few administrative delays beyond the agency\'s control, but rigorous follow-up until the visa was obtained.',
      urlPhoto: 'https://picsum.photos/seed/temoignage-junior/400/400',
      urlVideo: ''
    }
  ];

  for (const temoignage of temoignages) {
    await executerRequete(
      `INSERT INTO temoignages (nom_client, note, texte_fr, texte_en, url_photo, url_video, pays_destination)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [temoignage.nomClient, temoignage.note, temoignage.texteFr, temoignage.texteEn,
       temoignage.urlPhoto, temoignage.urlVideo, temoignage.paysDestination]
    );
  }
  console.log(`[Seed] ${temoignages.length} témoignages insérés.`);
}

async function seederEquipe() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM membres_equipe');
  if (Number(resultat.rows[0].count) > 0) return;

  const equipe = [
    { nom: 'M. Wordo Tanya Henry', posteFr: 'PDG Fondateur', posteEn: 'Founding CEO' },
    { nom: 'Mme Ngo Mbak Madeleine', posteFr: 'PDG Fondatrice', posteEn: 'Founding CEO' },
    { nom: 'Mme Sporah Mbeng', posteFr: 'Directrice Générale', posteEn: 'General Manager' },
    { nom: 'Mme Agnès', posteFr: 'Assistante de Direction et Réceptionniste', posteEn: 'Executive Assistant & Receptionist' },
    { nom: 'Mme Fondjo Nicole', posteFr: 'Département Community Manager', posteEn: 'Community Manager Department' },
    { nom: 'Mme Tchiekwa Prisca', posteFr: 'Département Permis d\'Étude, de Travail et Visiteur', posteEn: 'Study, Work & Visitor Permits Department' },
    { nom: 'Mme Ursula Njantan', posteFr: 'Département Résidence Permanente, Entrée Express et ARRIMA', posteEn: 'Permanent Residence, Express Entry & ARRIMA Department' }
  ];

  for (const [index, membre] of equipe.entries()) {
    await executerRequete(
      `INSERT INTO membres_equipe (nom, poste_fr, poste_en, url_photo, ordre_affichage)
       VALUES ($1,$2,$3,$4,$5)`,
      [membre.nom, membre.posteFr, membre.posteEn,
       `https://picsum.photos/seed/equipe-${index}/300/300`, index]
    );
  }
  console.log(`[Seed] ${equipe.length} membres de l'équipe insérés.`);
}

async function seederTextesGlobaux() {
  const textes = [
    { cle: 'nom_entreprise', valeurFr: 'HI CONSULTING IMMIGRATION', valeurEn: 'HI CONSULTING IMMIGRATION' },
    {
      cle: 'slogan_principal',
      valeurFr: 'Visitez. Travaillez. Éduquez. Nous vous garantissons un service de qualité pour la réussite de votre projet d\'immigration.',
      valeurEn: 'Visit. Work. Study. We guarantee quality service for the success of your immigration project.'
    },
    {
      cle: 'a_propos',
      valeurFr: 'HI CONSULTING IMMIGRATION accompagne depuis octobre 2020 les candidats à l\'immigration vers le Canada, la France, l\'Italie et la Belgique. Implantée à Douala, notre agence s\'est spécialisée depuis 2025 dans les procédures d\'immigration du Canada : résidence permanente, Entrée Express et ARRIMA.',
      valeurEn: 'Since October 2020, HI CONSULTING IMMIGRATION has supported candidates immigrating to Canada, France, Italy and Belgium. Based in Douala, our agency has specialized since 2025 in Canadian immigration procedures: permanent residence, Express Entry and ARRIMA.'
    },
    {
      cle: 'mission',
      valeurFr: 'Accompagner avec transparence et expertise à chaque étape de votre projet d\'immigration, jusqu\'à l\'obtention de votre statut.',
      valeurEn: 'Supporting you with transparency and expertise at every stage of your immigration project, until you obtain your status.'
    },
    {
      cle: 'vision',
      valeurFr: 'Devenir la référence en matière d\'accompagnement vers une immigration transparente et personnalisée vers le Canada.',
      valeurEn: 'Becoming the reference for transparent and personalized support toward immigration to Canada.'
    }
  ];

  for (const texte of textes) {
    await executerRequete(
      `INSERT INTO textes_globaux (cle, valeur_fr, valeur_en) VALUES ($1, $2, $3)
       ON CONFLICT (cle) DO NOTHING`,
      [texte.cle, texte.valeurFr, texte.valeurEn]
    );
  }
  console.log(`[Seed] ${textes.length} textes globaux vérifiés/insérés.`);
}

async function seederReseauxSociaux() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM reseaux_sociaux');
  if (Number(resultat.rows[0].count) > 0) return;

  const reseaux = [
    { plateforme: 'facebook', url: 'https://www.facebook.com/share/19HhsYJj7C/?mibextid=wwXIfr' },
    { plateforme: 'tiktok', url: 'https://www.tiktok.com/@hiconsultingimmigration?_r=1&_t=ZN-97oP8Tn8xd8' }
  ];

  for (const [index, reseau] of reseaux.entries()) {
    await executerRequete(
      'INSERT INTO reseaux_sociaux (plateforme, url, ordre_affichage) VALUES ($1, $2, $3)',
      [reseau.plateforme, reseau.url, index]
    );
  }
  console.log(`[Seed] ${reseaux.length} réseaux sociaux insérés (modifiables depuis le Back-Office).`);
}

async function seederConfigurationSite() {
  const resultat = await executerRequete('SELECT id FROM configuration_google LIMIT 1');
  if (resultat.rows.length > 0) return;
  // url_video_hero volontairement laissé vide : aucune vidéo tierce n'est
  // hotlinkée par défaut (risque de lien mort ou de licence non respectée).
  // Le hero utilise l'image de secours jusqu'à ce que l'administrateur
  // téléverse sa propre vidéo via l'onglet Médias puis colle son URL dans
  // Configuration Google.
  await executerRequete(
    'INSERT INTO configuration_google (url_whatsapp_flottant, url_google_maps, url_image_mission, url_image_vision) VALUES ($1, $2, $3, $4)',
    [
      '237678924045',
      'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d761.5990300722099!2d9.767887998886145!3d4.080652348274601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sLogpom%2C%20Carrefour%20Bassong%2C%20Douala!5e0!3m2!1sfr!2scm!4v1783452413876!5m2!1sfr!2scm',
      'https://picsum.photos/seed/hi-consulting-mission/600/400',
      'https://picsum.photos/seed/hi-consulting-vision/600/400'
    ]
  );
  console.log('[Seed] Numéro WhatsApp flottant, lien Google Maps et images Mission/Vision initialisés par défaut.');
}

async function seederPhotosLocaux() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM photos_locaux');
  if (Number(resultat.rows[0].count) > 0) return;

  const photos = [
    { legendeFr: 'Accueil des clients à l\'agence de Douala', legendeEn: 'Client reception at our Douala office', seed: 'hi-consulting-locaux-1' },
    { legendeFr: 'Espace de conseil personnalisé', legendeEn: 'Personalized advisory space', seed: 'hi-consulting-locaux-2' },
    { legendeFr: 'Salle de préparation aux entretiens', legendeEn: 'Interview preparation room', seed: 'hi-consulting-locaux-3' },
    { legendeFr: 'Notre équipe au travail', legendeEn: 'Our team at work', seed: 'hi-consulting-locaux-4' }
  ];

  for (const [index, photo] of photos.entries()) {
    await executerRequete(
      `INSERT INTO photos_locaux (url_media, type_media, legende_fr, legende_en, ordre_affichage)
       VALUES ($1, 'image', $2, $3, $4)`,
      [`https://picsum.photos/seed/${photo.seed}/700/500`, photo.legendeFr, photo.legendeEn, index]
    );
  }
  console.log(`[Seed] ${photos.length} photos des locaux insérées (à remplacer par vos vraies photos via Médias).`);
}

async function seederPhotosEquipeGroupe() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM photos_equipe_groupe');
  if (Number(resultat.rows[0].count) > 0) return;

  const photos = [
    { legendeFr: 'Toute l\'équipe HI CONSULTING IMMIGRATION', legendeEn: 'The whole HI CONSULTING IMMIGRATION team', seed: 'hi-consulting-equipe-groupe-1' },
    { legendeFr: 'Réunion d\'équipe hebdomadaire', legendeEn: 'Weekly team meeting', seed: 'hi-consulting-equipe-groupe-2' },
    { legendeFr: 'Nos conseillers en immigration', legendeEn: 'Our immigration advisors', seed: 'hi-consulting-equipe-groupe-3' }
  ];

  for (const [index, photo] of photos.entries()) {
    await executerRequete(
      `INSERT INTO photos_equipe_groupe (url_media, legende_fr, legende_en, ordre_affichage)
       VALUES ($1, $2, $3, $4)`,
      [`https://picsum.photos/seed/${photo.seed}/1200/700`, photo.legendeFr, photo.legendeEn, index]
    );
  }
  console.log(`[Seed] ${photos.length} photos d'équipe collectives insérées (à remplacer par vos vraies photos via Médias).`);
}

async function seederArticles() {
  const resultat = await executerRequete('SELECT COUNT(*) FROM articles');
  if (Number(resultat.rows[0].count) > 0) return;

  const articles = [
    {
      slug: 'guide-entree-express-2026',
      titreFr: 'Entrée Express 2026 : le guide complet pour maximiser votre score CRS',
      titreEn: '2026 Express Entry: the complete guide to maximizing your CRS score',
      resumeFr: 'Tout ce qu\'il faut savoir sur le système de Classement Global (CRS) et les leviers concrets pour augmenter vos points avant de soumettre votre profil.',
      resumeEn: 'Everything you need to know about the Comprehensive Ranking System (CRS) and concrete ways to boost your score before submitting your profile.',
      contenuFr: 'Le programme Entrée Express reste la voie la plus rapide vers la résidence permanente au Canada pour les travailleurs qualifiés. Le système de Classement Global (CRS) attribue des points selon l\'âge, le niveau d\'études, l\'expérience professionnelle, la maîtrise du français et de l\'anglais, et l\'adaptabilité. Pour maximiser votre score, priorisez d\'abord vos résultats linguistiques : un score élevé au TEF ou à l\'IELTS peut rapporter plusieurs centaines de points, bien plus qu\'un diplôme supplémentaire. Ensuite, une offre d\'emploi validée par une étude d\'impact sur le marché du travail (EIMT) ajoute des points considérables. Enfin, le parrainage provincial (PNP) reste la stratégie la plus efficace pour les profils avec un score CRS autour de la moyenne : il ajoute automatiquement 600 points, garantissant une invitation. Notre équipe accompagne chaque candidat dans l\'évaluation précise de son profil et l\'identification des leviers les plus rentables selon sa situation.',
      contenuEn: 'Express Entry remains the fastest path to Canadian permanent residence for skilled workers. The Comprehensive Ranking System (CRS) awards points based on age, education, work experience, French and English proficiency, and adaptability. To maximize your score, prioritize your language test results first: a strong TEF or IELTS score can be worth several hundred points, far more than an additional degree. Next, a job offer backed by a Labour Market Impact Assessment (LMIA) adds considerable points. Finally, provincial nomination (PNP) remains the most effective strategy for candidates with an average CRS score: it automatically adds 600 points, guaranteeing an invitation. Our team helps every candidate accurately assess their profile and identify the most cost-effective levers for their situation.',
      urlImageCouverture: 'https://picsum.photos/seed/article-entree-express/1000/600',
      metaDescriptionFr: 'Guide complet 2026 pour maximiser votre score CRS Entrée Express : tests linguistiques, EIMT, parrainage provincial.',
      metaDescriptionEn: '2026 complete guide to maximize your Express Entry CRS score: language tests, LMIA, provincial nomination.',
      motsCles: 'entrée express, CRS, résidence permanente canada, score entrée express, immigration canada 2026'
    },
    {
      slug: 'visa-etude-france-etapes',
      titreFr: 'Visa étudiant France : les 7 étapes indispensables avant votre départ',
      titreEn: 'France student visa: 7 essential steps before you leave',
      resumeFr: 'De l\'inscription sur Campus France au rendez-vous consulaire : le parcours complet pour partir étudier en France sans mauvaise surprise.',
      resumeEn: 'From registering on Campus France to your consular appointment: the complete process to study in France without surprises.',
      contenuFr: 'Étudier en France demande une préparation méthodique. Première étape : créer votre dossier Campus France, obligatoire pour la majorité des pays. Deuxième étape : obtenir vos admissions auprès des établissements visés — privilégiez au moins trois candidatures pour sécuriser votre parcours. Troisième étape : constituer votre justificatif de ressources (garantie financière ou attestation de prise en charge). Quatrième étape : souscrire une assurance maladie couvrant votre séjour. Cinquième étape : déposer votre demande de visa long séjour mention étudiant sur France-Visas. Sixième étape : préparer l\'entretien consulaire, souvent déterminant. Septième étape : dès l\'arrivée en France, valider votre visa auprès de l\'OFII dans les délais impartis. Chaque étape comporte des pièges administratifs fréquents ; notre équipe vérifie votre dossier avant chaque dépôt pour éviter tout refus évitable.',
      contenuEn: 'Studying in France requires methodical preparation. Step one: create your Campus France file, mandatory for most countries. Step two: secure admissions from your target institutions — apply to at least three to strengthen your path. Step three: prepare your proof of financial resources. Step four: take out health insurance covering your stay. Step five: submit your long-stay student visa application on France-Visas. Step six: prepare for the consular interview, often decisive. Step seven: upon arrival in France, validate your visa with OFII within the required timeframe. Each step has common administrative pitfalls; our team reviews your file before every submission to avoid avoidable refusals.',
      urlImageCouverture: 'https://picsum.photos/seed/article-visa-france/1000/600',
      metaDescriptionFr: 'Les 7 étapes essentielles pour obtenir votre visa étudiant France : Campus France, ressources, entretien consulaire, OFII.',
      metaDescriptionEn: 'The 7 essential steps to get your France student visa: Campus France, financial proof, consular interview, OFII.',
      motsCles: 'visa étudiant france, campus france, ofii, étudier en france, visa long séjour'
    }
  ];

  for (const article of articles) {
    await executerRequete(
      `INSERT INTO articles
        (slug, titre_fr, titre_en, resume_fr, resume_en, contenu_fr, contenu_en,
         url_image_couverture, texte_alternatif_image, meta_titre_fr, meta_titre_en,
         meta_description_fr, meta_description_en, mots_cles)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [article.slug, article.titreFr, article.titreEn, article.resumeFr, article.resumeEn,
       article.contenuFr, article.contenuEn, article.urlImageCouverture, article.titreFr,
       article.titreFr, article.titreEn, article.metaDescriptionFr, article.metaDescriptionEn, article.motsCles]
    );
  }
  console.log(`[Seed] ${articles.length} articles de blog insérés.`);
}

async function executerSeedComplet() {
  try {
    await creerTables();
    await creerSuperAdminInitial();
    await seederServices();
    await seederFaq();
    await seederTemoignages();
    await seederEquipe();
    await seederTextesGlobaux();
    await seederReseauxSociaux();
    await seederConfigurationSite();
    await seederPhotosLocaux();
    await seederPhotosEquipeGroupe();
    await seederArticles();
    console.log('\n[Seed] Initialisation terminée avec succès.');
    console.log(`[Seed] Connexion Super Admin -> Email: ${process.env.SUPER_ADMIN_EMAIL || 'hiciofficiel@gmail.com'}`);
  } catch (erreur) {
    console.error('[Seed] Échec de l\'initialisation :', erreur);
    process.exitCode = 1;
  } finally {
    await poolConnexion.end();
  }
}

executerSeedComplet();

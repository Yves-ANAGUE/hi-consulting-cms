# HI CONSULTING IMMIGRATION — CMS sur mesure

CMS complet (Node.js/Express + PostgreSQL Neon + Cloudinary + OpenRouter) pour l'agence
HI CONSULTING IMMIGRATION. Backend Express servant à la fois l'API REST, le frontend
vitrine statique (SSR pour le SEO) et le panneau d'administration.

## 1. Installation locale

```bash
# 1. Décompresser le projet puis se placer dans le dossier
cd hi-consulting-cms

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement et le compléter
cp .env.example .env
# -> Renseigner DATABASE_URL (Neon), CLOUDINARY_*, SMTP_*, OPENROUTER_API_KEY, JWT_SECRET

# 4. Initialiser la base de données (tables + données réelles de l'entreprise)
npm run seed

# 5. Démarrer le serveur
npm start
# Le site est disponible sur http://localhost:3000
# Le Back-Office est disponible sur http://localhost:3000/admin/login.html
```

Identifiants Super Admin par défaut (à changer immédiatement après la première connexion) :
définis dans `.env` via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_MOT_DE_PASSE`.

## 2. Arborescence

```
hi-consulting-cms/
├── server.js                     # Point d'entrée Express
├── config/                       # Connexions externes (Neon, Cloudinary, SMTP)
├── controllers/                  # Logique métier par ressource
├── routes/                       # Déclaration des routes Express
├── middlewares/                  # Auth JWT, rôles, upload mémoire
├── utils/                        # Cache RAM, RSS, OpenRouter, SEO, gabarits
├── scripts/initialiserBaseDeDonnees.js  # Création tables + seed
├── views/                        # Gabarits HTML SSR (accueil, services, faq...)
└── public/
    ├── css/js/images             # Frontend vitrine
    └── admin/                    # Panneau d'administration (SPA légère)
```

## 3. Edge cases et contraintes traités

| Contrainte | Traitement |
|---|---|
| RAM limitée (512 Mo, plan gratuit) | Upload en `multer.memoryStorage()` + flux direct vers Cloudinary (jamais écrit sur disque) ; téléversement **séquentiel** (pas de `Promise.all`) pour borner le nombre de buffers simultanés en mémoire. |
| Mise en veille du service gratuit | Route `/api/systeme/ping` sans aucune requête SQL, appelée par UptimeRobot. |
| Quota Neon (heures de calcul) | Formulaire de contact et actualités RSS **jamais stockés en base** ; envoi direct par e-mail (Nodemailer) et cache RAM (`CacheMemoire`, TTL 1h). |
| Quota OpenRouter (50 req/jour gratuit) | Interception du code HTTP 429, bascule sur un second modèle gratuit, puis message pré-enregistré si les deux échouent. Le résumé IA des actualités est lui-même mis en cache 1h pour limiter les appels. |
| Cumulative Layout Shift (CLS) | Squelettes (`.squelette-carte`) de **hauteur fixe identique** aux cartes réelles, affichés avant le premier rendu des données. |
| INP (< 200 ms) chatbot/modales | Ouverture pilotée par `requestAnimationFrame` + transitions CSS courtes (`0.18s`), pas de calcul bloquant à l'ouverture. |
| Slugs dupliqués | `genererSlug()` + boucle de suffixation (`-1`, `-2`...) avant insertion en base. |
| Hiérarchie des comptes | Contrainte SQL `CHECK (role IN (...))`, vérification du `droit_gestion_equipe` avant toute création de collaborateur par un simple Admin, interdiction de suppression/duplication du Super Admin. |
| Échec d'envoi e-mail (formulaire) | Le visiteur reçoit toujours une confirmation ; un log serveur de secours conserve les données en cas d'échec SMTP (non-bloquant pour l'UX). |
| Flux RSS indisponible | Bascule automatique sur une liste d'actualités de secours codées en dur, pour ne jamais afficher un fil vide (impact SEO/UX). |
| Fichier non autorisé à l'upload | `fileFilter` Multer rejette tout MIME hors `image/*` et `video/*` avant même la lecture du buffer. |
| Routes admin trackées par erreur dans GA4 | La configuration Google (`gtag.js`) n'est injectée en SSR que si `requete.path` ne commence pas par `/admin`. |
| **Modale toujours visible malgré `hidden`** | Bug corrigé : une règle `.modale-x { display: flex }` a la même spécificité CSS que `[hidden]` et gagnait le conflit. Règle globale `[hidden] { display: none !important; }` ajoutée dans `style.css` et `admin.css`. |
| **Modèle OpenRouter introuvable (404)** | Les anciens slugs figés (`meta-llama/llama-3-8b-instruct:free`, etc.) sont régulièrement retirés par OpenRouter. Le projet utilise désormais `openrouter/free` (routeur officiel toujours valide) avec un second modèle de secours concret. |
| **Image externe cassée (404 Unsplash)** | Toutes les images de démonstration utilisent désormais Picsum (`picsum.photos/seed/...`), un service d'images qui ne retourne jamais de 404, avec une seed dédiée par service/témoignage/membre pour une image distincte et stable. |
| **Flux RSS toujours en échec / lien pointant vers la page d'accueil** | Remplacement des URLs RSS par des flux Google News (réels, avec lien direct vers l'article) ; les données de secours pointent vers des pages officielles précises (pas de simples pages d'accueil). |
| **Traductions incomplètes (placeholders, options, boutons dynamiques)** | `i18n.js` gère désormais aussi `data-placeholder-i18n` (placeholders) et un dictionnaire de pays ; les textes générés dynamiquement en JS (bouton vidéo, bouton d'évaluation) utilisent une traduction directe au moment du rendu plutôt qu'un passage global trop tardif. |
| **Chatbot halluciné / réponses hors-sujet** | Le prompt système injecte désormais le contexte réel de l'entreprise (services, mission, vision, adresse) depuis la base ; le seuil de correspondance FAQ est passé d'un compteur brut à un ratio (≥ 60% des mots significatifs), ce qui évite les faux positifs (ex: une question sur "mission/vision" ne déclenche plus par erreur la FAQ Entrée Express). L'historique des derniers échanges est transmis à l'IA pour les questions de suivi. |
| **Timeout OpenRouter (> 15s) sur Render** | Remplacement du timeout `node-fetch` (peu fiable) par un `AbortController` explicite (18s) ; les deux modèles gratuits sont désormais interrogés **en parallèle** (`Promise.any`) plutôt qu'en séquence, pour ne jamais attendre le modèle le plus lent avant de tenter le second. |
| **Formulaire de contact perçu comme lent / bloqué** | La réponse HTTP n'attend plus l'issue de l'envoi e-mail (`fire-and-forget`) : le visiteur est confirmé immédiatement, l'envoi se poursuit en arrière-plan et son résultat reste journalisé côté serveur. |
| **SMTP Gmail en "Connection timeout" sur Render** | De nombreux hébergeurs (dont Render) filtrent les ports SMTP sortants (25/465/587). Ajout du support de l'API HTTP de Brevo (`BREVO_API_KEY`), qui passe en HTTPS (jamais bloqué) ; utilisée automatiquement si la clé est renseignée, sinon repli sur SMTP classique. |
| **Entités HTML littérales dans les actualités (`&nbsp;`)** | Google News encode ses descriptions en HTML ; ajout d'un décodage explicite des entités les plus courantes après le retrait des balises, plus une troncature qui ne coupe jamais un mot en plein milieu. |
| **Menu mobile qui s'ouvre horizontalement (débordement)** | Le menu togglait un `display:block` sur le conteneur sans changer le `flex-direction: row` de la liste interne. Bascule désormais sur une classe CSS dédiée (`.ouvert`) avec `flex-direction: column` et positionnement en menu déroulant plein-largeur. |

## 4. Approche algorithmique et structures de données

## 3bis. Nouvelles fonctionnalités (refonte frontend + blog natif)

- **Blog natif avec recherche** (`/blog`, `/blog/:slug`) : articles rédigés directement dans le
  Back-Office (onglet Blog), indexés par Google (SSR + schéma `Article`), et recherchables par
  mot-clé via `ILIKE` sur titre/résumé/mots-clés (`GET /api/articles?recherche=...`). Distinct du
  fil d'actualités RSS (qui reste un agrégateur externe en lecture seule).
- **Section "Nos Locaux"** (page d'accueil) : photos/vidéos de l'agence en grille "photogrid" avec
  effet de zoom au survol, gérées depuis l'onglet Nos Locaux du Back-Office.
- **Équipe en bannière défilante** : remplace les fiches individuelles par un défilement continu
  en pur CSS (`@keyframes`), plus dynamique, cohérent avec la demande de ne plus afficher chaque
  membre nommément mais l'équipe dans son ensemble.
- **Carrousel de témoignages** : transitions animées (fondu + translation) avec flèches et
  indicateurs, défilement automatique toutes les 6 secondes, pause au survol.
- **Vidéo d'arrière-plan du héros** : configurable depuis le Back-Office (Configuration Google →
  URL vidéo héros). Volontairement laissée vide par défaut : aucune vidéo tierce n'est hotlinkée
  sans certitude de licence ni de stabilité du lien ; l'image de secours (Picsum) s'affiche tant
  qu'aucune vidéo n'est renseignée.
- **Formes décoratives réutilisables** (`.forme-blob`, `.forme-triangle`, `.forme-trapeze`,
  `.forme-cercle`) : cassent l'aspect "tout en angle droit" sans jamais interférer avec le
  contenu (`position:absolute`, `pointer-events:none`, `z-index` bas).
- **Police Google Fonts** (Poppins pour les titres, Inter pour le texte), chargée via `@import`
  dans `style.css` — aucune modification requise dans les vues.

## 4. Approche algorithmique et structures de données

- **Cache actualités/résumé IA — `Map` (via `CacheMemoire`)** : lecture/écriture/expiration en
  **O(1)**, contre O(n) pour une recherche par clé dans un `Array`. Le volume reste borné
  (quelques dizaines d'entrées maximum), donc pas de structure plus complexe (LRU, etc.)
  nécessaire ; l'expiration est vérifiée paresseusement à la lecture plutôt que via un
  `setInterval`, pour ne consommer aucun cycle CPU hors trafic.
- **Recherche de pertinence FAQ (chatbot) — recouvrement de mots-clés** : complexité
  **O(n·m)** (n = nombre de FAQ, m = mots de la question). Acceptable car n reste de l'ordre
  de la dizaine ; un index full-text PostgreSQL (`tsvector`) serait la suite logique si le
  volume de FAQ devenait important (> 200 entrées).
- **Génération de slugs uniques** : boucle avec vérification d'existence en base, O(k) où k
  est le nombre de collisions (quasi toujours 0 ou 1 en pratique).
- **Upload multi-fichiers** : traitement **séquentiel** en O(n) appels réseau plutôt que
  parallèle, choix délibéré pour plafonner le pic mémoire au lieu de minimiser la latence
  totale — pertinent sur un hébergement à ressources contraintes.
- **Sitemap dynamique** : concaténation O(n) sur les pages statiques + services, régénérée à
  la demande (pas de cache) car peu appelée (robots d'indexation) et peu coûteuse.

## 5. Sécurité

- Mots de passe hachés avec `bcryptjs` (12 rounds, implémentation pure JS — aucune
  compilation native requise, donc compatible avec tous les hébergeurs sans configuration).
- Sessions par JWT en cookie `httpOnly`, `sameSite=strict`, `secure` en production.
- Toutes les routes de modification (`POST`/`PATCH`/`DELETE`) protégées par
  `verifierAuthentification` + `autoriserRoles`.
- `helmet` pour les en-têtes HTTP de sécurité ; `express.json({ limit: '2mb' })` contre les
  payloads excessifs.

## 6. Ce qui reste à faire avant la mise en production

Ce livrable couvre l'intégralité de l'architecture demandée (backend, SSR/SEO, chatbot,
CRUD bilingue, upload streaming, hiérarchie des comptes) avec des données réelles de
l'entreprise pré-chargées. Avant le déploiement sur Render, suivez le guide détaillé
`GUIDE_DEPLOIEMENT.md` fourni avec ce projet. En résumé :

1. Renseigner de vraies clés API (Cloudinary, OpenRouter, SMTP applicatif Gmail, Neon).
2. Téléverser le vrai logo de l'entreprise via l'onglet **Médias**, puis coller l'URL
   obtenue dans l'onglet **Configuration Google** (champ "URL du logo"). Tant qu'aucun
   logo n'est configuré, le SVG de secours s'affiche automatiquement (failsafe).
3. Renseigner le numéro WhatsApp du bouton flottant dans l'onglet **Configuration Google**
   (le bouton reste masqué tant qu'aucun numéro n'est renseigné).
4. Ajouter/retirer les réseaux sociaux réels depuis l'onglet **Réseaux sociaux** (Facebook
   et TikTok sont préconfigurés, mais Instagram, LinkedIn, YouTube etc. peuvent être
   ajoutés librement, sans toucher au code).
5. Remplacer le lien Google Maps placeholder (`data-lien-google-maps` dans `contact.html`)
   par l'URL réelle de l'agence (voir `GUIDE_DEPLOIEMENT.md`, section 5).
6. Relire/enrichir les textes FR/EN via le Back-Office (onglet **Textes du site**) pour
   couvrir la totalité des sections souhaitées.
7. Ajouter les vraies photos de l'équipe et des témoignages via l'onglet **Médias**.
8. Renseigner les balises GA4/Search Console via l'onglet **Configuration Google**.

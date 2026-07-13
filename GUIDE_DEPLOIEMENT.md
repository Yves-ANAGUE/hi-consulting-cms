# Guide de mise en production — HI CONSULTING IMMIGRATION

Ce guide détaille, étape par étape, chacun des points listés dans le README sous
« Ce qui reste à faire avant la mise en production ». Suivez l'ordre proposé : chaque
service (Neon, Cloudinary, etc.) doit être créé avant de renseigner sa clé dans `.env`.

---

## 1. Créer la base de données Neon (PostgreSQL gratuit)

1. Allez sur **https://neon.tech** et créez un compte (gratuit, via GitHub/Google/email).
2. Cliquez sur **"Create a project"**.
   - Nom du projet : `hi-consulting-immigration`
   - Région : choisissez la plus proche de vos visiteurs (ex. `eu-central` si vos clients
     sont en Afrique/Europe — Neon n'a pas de région Afrique, `eu-central-1` (Francfort)
     est généralement le meilleur compromis de latence).
   - Version PostgreSQL : laissez la version par défaut (16 ou plus récent).
3. Une fois le projet créé, allez dans l'onglet **"Connection Details"** (ou "Dashboard").
4. Copiez la chaîne qui commence par `postgresql://...` — c'est votre `DATABASE_URL`.
   Elle ressemble à :
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Collez-la dans votre fichier `.env` :
   ```
   DATABASE_URL=postgresql://neondb_owner:AbCdEf123456@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
6. **Important (quota gratuit)** : le plan gratuit Neon suspend la base après une période
   d'inactivité et limite les heures de calcul mensuelles. C'est précisément pourquoi le
   projet utilise la route `/api/systeme/ping` (voir étape 8, UptimeRobot) — elle ne touche
   jamais la base, donc elle ne consomme pas ce quota, mais elle garde le service Render
   éveillé. La base Neon, elle, se "réveille" automatiquement à la première requête réelle
   (délai de 1 à 3 secondes, normal sur le plan gratuit).

---

## 2. Créer un compte Cloudinary (stockage images/vidéos)

1. Allez sur **https://cloudinary.com** et créez un compte gratuit.
2. Une fois connecté, votre **Dashboard** affiche directement trois informations dans un
   encart "Product Environment Credentials" :
   - `Cloud Name`
   - `API Key`
   - `API Secret` (cliquez sur l'icône "œil" pour l'afficher)
3. Copiez ces trois valeurs dans `.env` :
   ```
   CLOUDINARY_CLOUD_NAME=votre_cloud_name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
4. Rien d'autre à configurer : le code crée automatiquement un dossier
   `hi-consulting-immigration` dans votre Cloudinary au premier téléversement.
5. Plan gratuit Cloudinary : 25 crédits/mois (environ 25 Go de stockage+bande passante
   combinés), largement suffisant pour démarrer. Vous pourrez surveiller l'usage dans
   l'onglet **"Usage"** de votre dashboard Cloudinary si le site grossit.

---

## 3. Configurer l'envoi d'e-mails

### Option recommandée : API Brevo (résout les blocages SMTP sur Render)

Render (et la plupart des hébergeurs gratuits) bloquent ou ralentissent fortement les ports SMTP
sortants (25/465/587), ce qui provoque les erreurs `Connection timeout` visibles dans vos logs.
La solution la plus fiable est de passer par l'API HTTP de Brevo (jamais bloquée, HTTPS/443) :

1. Créez un compte gratuit sur **https://app.brevo.com** (300 e-mails/jour offerts).
2. Allez dans **Paramètres du compte** (icône engrenage) → **Clés API** → **Générer une nouvelle
   clé API**.
3. Copiez la clé et ajoutez-la dans vos variables d'environnement Render (et votre `.env` local) :
   ```
   BREVO_API_KEY=votre-cle-brevo
   ```
4. C'est tout : dès que cette variable est présente, le code bascule automatiquement sur l'API
   Brevo pour l'envoi du formulaire de contact — aucune autre configuration SMTP n'est nécessaire.
   Si vous laissez `BREVO_API_KEY` vide, le SMTP Gmail classique (ci-dessous) prend le relais.

### Option alternative : Gmail + mot de passe d'application (SMTP classique)

Le formulaire d'évaluation envoie un e-mail via le compte `hiciofficiel@gmail.com`. Gmail
n'accepte plus les mots de passe normaux pour les connexions applicatives (SMTP) : il faut
générer un **mot de passe d'application** dédié.

1. Connectez-vous sur **https://myaccount.google.com/security** avec le compte
   `hiciofficiel@gmail.com`.
2. Activez la **vérification en deux étapes** si elle n'est pas déjà active (obligatoire
   pour pouvoir créer un mot de passe d'application) : section "Comment vous connecter à
   Google" → "Vérification en deux étapes" → suivez les instructions (SMS ou application).
3. Une fois la 2FA activée, retournez dans **Sécurité** et recherchez
   **"Mots de passe des applications"** (ou allez directement sur
   **https://myaccount.google.com/apppasswords**).
4. Donnez un nom à l'application, par exemple `HI Consulting CMS`, puis cliquez sur
   **Créer**. Google affiche un mot de passe de 16 caractères (ex. `abcd efgh ijkl mnop`).
5. Copiez ce mot de passe (sans les espaces) dans `.env` :
   ```
   SMTP_HOTE=smtp.gmail.com
   SMTP_PORT=465
   SMTP_UTILISATEUR=hiciofficiel@gmail.com
   SMTP_MOT_DE_PASSE=abcdefghijklmnop
   EMAIL_DESTINATAIRE=hiciofficiel@gmail.com
   ```
6. **Test rapide** : après le déploiement, remplissez le formulaire de contact du site
   avec votre propre adresse e-mail et vérifiez la réception. En cas d'échec, les logs
   Render (`npm start` → onglet "Logs") afficheront le message d'erreur SMTP exact.

> Alternative recommandée à terme : un service transactionnel comme **Brevo** (ex-Sendinblue,
> gratuit jusqu'à 300 e-mails/jour) est plus fiable qu'un compte Gmail personnel pour un
> usage professionnel régulier. Si vous changez de fournisseur, seules les 4 variables
> `SMTP_*` changent — aucune modification de code n'est nécessaire.

---

## 4. Obtenir une clé API OpenRouter (chatbot + synthèse IA)

1. Allez sur **https://openrouter.ai** et créez un compte.
2. Cliquez sur votre avatar (en haut à droite) → **"Keys"** → **"Create Key"**.
3. Donnez-lui un nom (ex. `hi-consulting-production`) et copiez la clé générée
   (elle commence par `sk-or-v1-...` et n'est affichée qu'une seule fois).
4. Collez-la dans `.env` :
   ```
   OPENROUTER_API_KEY=sk-or-v1-votre-cle-copiee-ici
   OPENROUTER_MODELE=meta-llama/llama-3-8b-instruct:free
   OPENROUTER_MODELE_SECOURS=google/gemini-flash-1.5:free
   ```
5. **Vérifiez que les modèles gratuits sont toujours disponibles** avant le lancement :
   les modèles `:free` d'OpenRouter changent parfois de nom ou sont retirés. Allez sur
   **https://openrouter.ai/models** et filtrez par "Free" pour confirmer que
   `meta-llama/llama-3-8b-instruct:free` (ou un équivalent) existe encore. Si un modèle a
   été renommé, mettez simplement à jour la variable `OPENROUTER_MODELE` dans `.env` — le
   code n'a pas besoin d'être modifié.
6. Rappel du comportement déjà codé : au-delà de 50 requêtes gratuites par jour (limite
   imposée par OpenRouter), le chatbot bascule automatiquement sur le message pré-enregistré
   plutôt que de planter — vous n'avez rien à faire de plus.

---

## 5. Renseigner le vrai lien Google Maps

1. Allez sur **https://www.google.com/maps** et recherchez l'adresse de l'agence
   (`Logpom, Carrefour Bassong, Douala`) ou localisez-la manuellement sur la carte.
2. Cliquez sur le point exact de l'immeuble → un encart apparaît en bas/à gauche →
   cliquez sur **"Partager"** → onglet **"Intégrer une carte"** (pas "Envoyer un lien").
3. Copiez l'URL qui se trouve à l'intérieur de l'attribut `src="..."` du code `<iframe>`
   proposé (une longue URL commençant par `https://www.google.com/maps/embed?...`).
4. Ouvrez `views/contact.html` dans le projet et remplacez ce bloc :
   ```html
   <div id="conteneurCarte" class="conteneur-carte" data-lien-google-maps="">
     <p class="texte-secondaire" data-cle-i18n="contact_carte_indisponible">...</p>
   </div>
   ```
   par :
   ```html
   <div id="conteneurCarte" class="conteneur-carte">
     <iframe
       src="COLLEZ_ICI_L_URL_EMBED_COPIEE"
       width="100%" height="300" style="border:0;border-radius:10px;"
       loading="lazy" referrerpolicy="no-referrer-when-downgrade">
     </iframe>
   </div>
   ```
5. Redémarrez le serveur (`npm start`) pour voir le changement.

---

## 6. Créer la propriété Google Analytics 4 (GA4)

1. Allez sur **https://analytics.google.com** et connectez-vous avec un compte Google
   professionnel (idéalement `hiciofficiel@gmail.com`).
2. Cliquez sur **"Administration"** (icône engrenage en bas à gauche) → **"Créer une
   propriété"**.
3. Renseignez :
   - Nom de la propriété : `HI Consulting Immigration - Site Web`
   - Fuseau horaire : `Cameroun (GMT+1)`
   - Devise : `Franc CFA (XAF)` ou `Euro`, selon votre préférence de reporting.
4. Continuez jusqu'à l'étape **"Flux de données"** → choisissez **"Web"** → renseignez
   l'URL de votre site (ex. `https://hi-consulting-immigration.onrender.com` ou votre
   futur nom de domaine) → nommez le flux → cliquez sur **"Créer un flux"**.
5. Google affiche immédiatement votre **ID de mesure**, au format `G-XXXXXXXXXX`. C'est
   cette valeur (et uniquement celle-ci, pas la clé API) qu'il faut copier.
6. **Ne modifiez aucun fichier de code** : connectez-vous au **Back-Office**
   (`/admin/login.html`) → onglet **"Configuration Google"** → collez le `G-XXXXXXXXXX`
   dans le champ **"ID de mesure Google Analytics 4"** → **Enregistrer**.
   Le serveur injecte alors automatiquement le script `gtag.js` sur toutes les pages
   publiques (jamais sur `/admin`, pour ne pas fausser vos statistiques de visite réelles).

---

## 7. Vérifier le site sur Google Search Console

1. Allez sur **https://search.google.com/search-console**.
2. Cliquez sur **"Ajouter une propriété"** → choisissez **"Préfixe d'URL"** (plus simple
   que "Domaine" si vous n'avez pas encore accès aux DNS) → entrez l'URL complète de votre
   site (ex. `https://hi-consulting-immigration.onrender.com/`).
3. Parmi les méthodes de vérification proposées, choisissez **"Balise HTML"**. Google
   affiche une balise du type :
   ```html
   <meta name="google-site-verification" content="AbCdEfGhIjKlMnOpQrStUvWxYz" />
   ```
4. Copiez uniquement la valeur de l'attribut `content` (la chaîne après `content="`).
5. Dans le **Back-Office** → onglet **"Configuration Google"** → champ **"Code de
   vérification Google Search Console"** → collez cette valeur → **Enregistrer**.
6. Retournez sur Google Search Console et cliquez sur **"Vérifier"**. La vérification
   devrait réussir immédiatement puisque le serveur injecte déjà la balise en SSR.
7. Une fois vérifié, allez dans **"Sitemaps"** (menu de gauche) et soumettez :
   ```
   sitemap.xml
   ```
   (le site le génère automatiquement à `https://votredomaine.com/sitemap.xml`, déjà à
   jour avec tous les services publiés).

---

## 8. Déploiement sur Render (hébergement)

1. Poussez le projet sur un dépôt GitHub (créez un nouveau dépôt vide, puis) :
   ```bash
   cd hi-consulting-cms
   git init
   git add .
   git commit -m "Version initiale du CMS HI CONSULTING IMMIGRATION"
   git branch -M main
   git remote add origin https://github.com/votre-compte/hi-consulting-cms.git
   git push -u origin main
   ```
2. Allez sur **https://render.com**, créez un compte, puis cliquez sur
   **"New +"** → **"Web Service"**.
3. Connectez votre compte GitHub et sélectionnez le dépôt `hi-consulting-cms`.
4. Configuration du service :
   - **Name** : `hi-consulting-immigration`
   - **Region** : la plus proche de vos visiteurs (Frankfurt recommandé pour l'Afrique/Europe)
   - **Branch** : `main`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : `Free`
5. Dans la section **"Environment Variables"**, ajoutez **toutes** les variables de votre
   `.env` local, une par une (clé = valeur), exactement comme dans `.env.example` — y
   compris `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `SMTP_*`, `OPENROUTER_API_KEY`.
   Pensez à mettre `NODE_ENV=production` et `URL_SITE=https://hi-consulting-immigration.onrender.com`
   (remplacez par votre URL Render réelle une fois le service créé).
6. Cliquez sur **"Create Web Service"**. Render installe les dépendances et démarre le
   serveur automatiquement (~2-3 minutes).
7. Une fois le déploiement terminé, le Shell Render (utile pour lancer une commande
   ponctuelle) **n'est pas disponible sur le plan gratuit** — Render affiche un message
   d'upgrade vers le plan Starter si vous cliquez sur l'onglet "Shell". Deux façons
   d'exécuter le seed sans Shell ni plan payant :

   **Option A — depuis votre PC (recommandée)** : Neon est une base cloud, accessible
   depuis n'importe où. Dans votre `.env` **local**, remplacez `DATABASE_URL` par la même
   valeur que celle renseignée dans les variables d'environnement Render, puis lancez
   simplement `npm run seed` sur votre machine. Le script peuple directement la base de
   production, sans toucher à Render.

   **Option B — via le Start Command** : dans Settings → Build & Deploy, remplacez
   temporairement (ou définitivement) le Start Command `npm start` par :
   ```
   node scripts/initialiserBaseDeDonnees.js && npm start
   ```
   Le script vérifie systématiquement si les données existent avant d'insérer quoi que
   ce soit ; il peut donc rester en place à chaque redémarrage sans jamais dupliquer les
   données.
8. **Empêcher la mise en veille (plan gratuit Render)** : les services gratuits Render
   s'endorment après 15 minutes sans trafic. Allez sur **https://uptimerobot.com**, créez
   un compte gratuit, puis **"Add New Monitor"** :
   - Monitor Type : `HTTP(s)`
   - URL : `https://hi-consulting-immigration.onrender.com/api/systeme/ping`
   - Monitoring Interval : `5 minutes`
   Cette route ne consomme aucun quota Neon (voir étape 1), elle sert uniquement à
   maintenir Render éveillé.

---

## 9. Personnaliser les textes, médias et l'équipe via le Back-Office

Une fois le site en ligne et le seed exécuté, tout le contenu éditorial se modifie
**sans toucher au code**, directement depuis `/admin/login.html` (identifiants définis par
`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_MOT_DE_PASSE` dans vos variables d'environnement) :

- **Onglet "Services"** : modifier/ajouter/supprimer un service, avec titre, description,
  meta title/description et image, en français ET en anglais.
- **Onglet "Textes du site"** : ajuster le slogan, la mission, la vision, etc.
- **Onglet "Médias"** : glissez-déposez vos vraies photos/vidéos (équipe, témoignages,
  bannières) — le système les envoie automatiquement vers Cloudinary et vous donne l'URL
  finale à copier dans le champ concerné (ex. "URL photo" du formulaire Témoignage).
- **Onglet "Équipe"** : mettre à jour les photos et postes de l'organigramme.
- **Onglet "Comptes"** : créer les accès pour vos collaborateurs (Mme Fondjo, Mme Tchiekwa,
  Mme Njantan, etc.), avec ou sans droit de gestion d'équipe selon leur rôle réel.

> Conseil : changez le mot de passe du Super Admin dès la première connexion via l'onglet
> "Comptes" → cliquez sur votre propre compte → "Modifier" → nouveau mot de passe.

---

## Récapitulatif des variables `.env` à renseigner avant le lancement

| Variable | Où l'obtenir |
|---|---|
| `DATABASE_URL` | Étape 1 — Neon |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Étape 2 — Cloudinary |
| `SMTP_UTILISATEUR` / `SMTP_MOT_DE_PASSE` | Étape 3 — Gmail (mot de passe d'application) |
| `OPENROUTER_API_KEY` | Étape 4 — OpenRouter |
| `JWT_SECRET` | À générer vous-même : une chaîne aléatoire longue, ex. via `openssl rand -hex 32` |
| GA4 / Search Console | Étapes 6-7 — **ne vont pas dans `.env`**, se renseignent depuis le Back-Office |

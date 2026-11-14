# Chez LouLou — Boutique en ligne & Cadeaux (Côte d’Ivoire)

Application e-commerce complète pour la boutique **Chez LouLou** (Abidjan, Côte d’Ivoire) : collections **Femme, Homme, Enfants, Jeunes & Cadeaux**, adaptation saisonnière et festive automatique (14 thèmes), programme de fidélité **Points LouLou**, parrainage, coffrets cadeaux sur mesure, paiements Mobile Money / carte, notifications WhatsApp & SMS, reçus/bons de livraison PDF, messagerie client-vendeur en temps réel et tableau de bord administrateur.

---

## 1. Prérequis (Requirements)

Avant de lancer l’application sur votre ordinateur, installez :

- **Node.js `22.18+`** (recommandé : **Node.js 22 LTS**, ex. `v22.23+`)
  - *Important* : Le script de production (`npm start` → `node server.ts`) utilise l’exécution native de TypeScript intégrée à Node.js 22+.
  - Téléchargement officiel : [https://nodejs.org](https://nodejs.org)
- **npm** (inclus automatiquement avec Node.js)
- **Git** (optionnel, uniquement si vous souhaitez pousser le projet sur GitHub depuis votre ordinateur) : [https://git-scm.com](https://git-scm.com)

Vérifiez vos versions dans un terminal :

```bash
node -v   # doit afficher v22.x.x
npm -v
```

---

## 2. Installation et lancement en local (sur votre ordinateur)

1. **Ouvrez un terminal** dans le dossier du projet (`chez-loulou` ou le dossier décompressé).

2. **Installez les dépendances** :
   ```bash
   npm install
   ```

3. **Créez votre fichier `.env`** (optionnel en local, mais recommandé) :
   ```bash
   cp .env.example .env
   ```
   *(Sous Windows PowerShell : `Copy-Item .env.example .env`)*

4. **Lancez l’application en mode développement** :
   ```bash
   npm run dev
   ```

5. **Ouvrez votre navigateur** à l’adresse :
   [http://localhost:3000](http://localhost:3000)

---

## 3. Lancer en mode production (optionnel)

Pour compiler le site et le démarrer en mode production sur votre machine ou un serveur :

```bash
npm run build
NODE_ENV=production npm start
```

Sous Windows PowerShell :
```powershell
npm run build
$env:NODE_ENV="production"; npm start
```

---

## 4. Commandes utiles

| Commande | Description |
| :--- | :--- |
| `npm install` | Installe toutes les bibliothèques requises (`package.json`) |
| `npm run dev` | Démarre le serveur Express + Vite sur `http://localhost:3000` |
| `npm run build` | Compile l’application React dans le dossier `dist/` |
| `npm start` | Démarre le serveur Node (`node server.ts`) |
| `npm run lint` | Vérifie les types TypeScript (`tsc --noEmit`) |

---

## 5. Variables d’environnement (`.env`)

Toutes les clés ci-dessous sont **optionnelles pour tester en local** : sans ces clés, l’application fonctionne en mode direct Mobile Money (saisie de référence) et liens manuels `wa.me` / `sms:`.

```env
PORT=3000
APP_URL="http://localhost:3000"

# Passerelles de paiement en ligne (optionnel, côté serveur uniquement)
PAYSTACK_SECRET_KEY=""
CINETPAY_API_KEY=""
CINETPAY_SITE_ID=""
WAVE_API_KEY=""

# Notifications automatiques WhatsApp / SMS (optionnel, côté serveur uniquement)
WHATSAPP_CLOUD_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
SMS_WEBHOOK_URL=""
```

> **Sécurité** : Ne partagez jamais votre fichier `.env` et ne le mettez jamais sur GitHub (il est déjà bloqué par `.gitignore`).

---

## 6. Firebase & Accès Administrateur

- La connexion Firebase (Firestore + Google Auth) est déjà configurée dans `firebase-applet-config.json` et protégée par `firestore.rules`.
- **Connexion Google en local** : `localhost` est normalement autorisé par défaut dans Firebase. Si vous déployez sur un autre domaine, ajoutez ce domaine dans **Firebase Console → Authentication → Settings → Authorized domains**.
- **Accès Administrateur** : connectez-vous sur le site avec le compte Google administrateur configuré (`pacmanghoster@gmail.com`) pour accéder à l’espace de gestion (articles, prix, photos, commandes, statistiques en temps réel, thèmes festifs, codes promo et messagerie).

---

## 7. Structure principale du projet

```text
├── server.ts                    # Serveur Express (API paiements, notifications & SPA)
├── index.html                   # Point d'entrée HTML & métadonnées
├── package.json                 # Dépendances et scripts npm
├── firestore.rules              # Règles de sécurité Firestore
├── firebase-applet-config.json  # Configuration client Firebase
├── public/assets/aistudio/      # Logo officiel Chez LouLou
└── src/
    ├── App.tsx                  # Shell principal de l'application
    ├── firebase.ts              # Initialisation Firebase & Auth
    ├── context/StoreContext.tsx # État global, panier, fidélité, commandes
    ├── components/              # Composants boutique, messagerie & admin
    ├── data/seedCatalog.ts      # Catalogue initial & paramètres par défaut
    ├── types/store.ts           # Types TypeScript
    └── utils/                   # Calendrier festif, formateurs, générateur PDF
```

---

## 8. Pousser le dossier sur GitHub depuis votre ordinateur

Une fois le projet téléchargé et ouvert sur votre ordinateur (après avoir créé un dépôt vide sur GitHub) :

```bash
git init
git add .
git commit -m "Boutique Chez LouLou"
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/chez-loulou-boutique.git
git push -u origin main
```

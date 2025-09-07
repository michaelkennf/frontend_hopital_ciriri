# Frontend - Gestion d'Hôpital

Ce dossier contient le frontend de la plateforme de gestion d'hôpital (React + Vite).

## 🚀 Fonctionnalités principales
- Authentification multi-rôles (admin, médecin, caissier, etc.)
- Gestion des patients, consultations, examens, hospitalisations, médicaments
- Tableaux de bord par rôle
- Impression de documents (fiche de présence, autorisation, etc.)
- Interface moderne et responsive

## 🛠️ Installation locale

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/TON-UTILISATEUR/hopital-frontend.git
   cd hopital-frontend
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer l'API**
   - Crée un fichier `.env` à la racine du dossier frontend :
     ```env
     VITE_API_URL=https://ton-backend.onrender.com/api
     ```
   - (Remplace l'URL par celle de ton backend Render)

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur [http://localhost:5173](http://localhost:5173)

## 🏗️ Build pour la production
```bash
npm run build
```
Le build sera généré dans le dossier `dist/`.

## 🌍 Déploiement sur Vercel
1. Pousse le code sur GitHub
2. Va sur [vercel.com](https://vercel.com), connecte ton compte GitHub
3. Clique sur "Add New Project" et sélectionne ce repo
4. Vercel détecte automatiquement Vite/React
5. Build command : `npm run build`  
   Output directory : `dist`
6. Clique sur "Deploy"

## 📦 Structure du projet
- `src/` : code source React
- `public/` : assets statiques
- `index.html` : point d'entrée
- `vite.config.js` : config Vite

## 📄 Licence
Projet open source, usage libre pour l'éducation et la santé. 
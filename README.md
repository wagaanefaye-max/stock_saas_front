# Stock SaaS Frontend - Plateforme Web SaaS de Gestion de Stock Multi-Entreprises

Application web moderne de gestion de stock développée avec Angular 18 et PrimeNG.

> **Note** : Ce répertoire contient uniquement le frontend de l'application.

## 🚀 Technologies

- **Angular 18** - Framework frontend
- **PrimeNG 18** - Bibliothèque de composants UI
- **TypeScript** - Langage de programmation
- **SCSS** - Préprocesseur CSS

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# L'application sera accessible sur http://localhost:4200
```

## 🎨 Design

L'application utilise une palette de couleurs personnalisée :

- **Primary**: #2563EB (Bleu)
- **Secondary**: #16A34A (Vert)
- **Warning**: #F59E0B (Orange)
- **Danger**: #DC2626 (Rouge)

## 📱 Fonctionnalités

- ✅ Authentification
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des produits
- ✅ Gestion des entrepôts
- ✅ Suivi des mouvements de stock
- ✅ Rapports et analyses
- ✅ Paramètres de l'entreprise

## 🏗️ Structure du projet

```
src/
├── app/
│   ├── layout/          # Layout principal avec sidebar
│   ├── pages/           # Pages de l'application
│   │   ├── login/       # Page de connexion
│   │   ├── dashboard/   # Tableau de bord
│   │   ├── products/    # Gestion des produits
│   │   ├── warehouses/ # Gestion des entrepôts
│   │   ├── movements/   # Mouvements de stock
│   │   ├── reports/     # Rapports
│   │   └── settings/    # Paramètres
│   ├── app.component.ts
│   └── app.routes.ts
├── styles.scss          # Styles globaux
└── index.html
```

## 🔧 Développement

Le projet utilise Angular standalone components et les dernières fonctionnalités d'Angular 18.

Pour construire l'application en production :

```bash
npm run build
```


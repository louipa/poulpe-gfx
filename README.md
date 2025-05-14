# Poulpe GFX Demo

Ce projet est une démo vidéo utilisant Three.js pour animer un poulpe dans le cadre d'un cours à l'IMT Atlantique.

## 🐙 Fonctionnalités

- poulpe animé
- environnement (eau animée, obstacles et bâteau)
- lorsque la caméra est submergée, un shader est appliqué
- en appuyant sur la barre espace, des poissons apparaissent
- les poissons sont projetés lorsqu'ils entrent en collision avec le poulpe

## 🚀 Technologies utilisées

- [Three.js](https://threejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)

## 📋 Prérequis

- Node.js (version recommandée : 18 ou supérieure)
- npm

## 🛠️ Installation

1. Clonez le repository :

```bash
git clone https://github.com/louipa/poulpe-gfx
cd poulpe-gfx
```

2. Installez les dépendances :

```bash
npm install
# ou
yarn install
```

## 🚀 Démarrage

Pour lancer le serveur de développement :

```bash
npm run dev
```

Le projet sera accessible à l'adresse `http://localhost:5173`

## 📁 Structure du projet

```
├── src/              # Code source
├── public/           # Assets statiques
├── index.html        # Point d'entrée HTML
├── script.ts         # Script principal
├── tsconfig.json     # Configuration TypeScript
└── package.json      # Dépendances et scripts
```

## 📷 Screenshots

![Pieuvre](/screenshots/octopus.png)
![Pieuvre avec les poissons](/screenshots/fish.png)
![Pieuvre sous l'eau](/screenshots/underwater.png)

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE.md).

## 👥 Auteur

Louis PAINTER

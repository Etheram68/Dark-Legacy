# Dark Legacy - Prototype MMO Spatial

Prototype de jeu MMO spatial inspiré de Dark Orbit, développé avec PixiJS et Node.js.

## Fonctionnalités implémentées ✨

### Gameplay
- ✅ Vaisseau spatial contrôlable avec physique réaliste
- ✅ Système de tir avec projectiles physiques
- ✅ Particules et effets visuels (moteurs, tirs, explosions)
- ✅ Système de vie avec barre de santé
- ✅ Détection de collisions
- ✅ Fond étoilé animé

### Architecture
- ✅ Moteur de jeu avec PixiJS
- ✅ Architecture client-serveur prête pour le multijoueur
- ✅ Gestionnaire réseau avec Socket.io
- ✅ Prédiction côté client et réconciliation serveur
- ✅ Structure de code modulaire et extensible

## Installation 🚀

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

## Utilisation 🎮

### Mode solo (sans serveur)
Ouvrez simplement le fichier `index.html` dans votre navigateur.

### Mode multijoueur

1. **Démarrer le serveur** :
```bash
npm start
```
Le serveur démarre sur le port 3000.

2. **Ouvrir le jeu** :
Ouvrez votre navigateur à l'adresse `http://localhost:3000`

3. **Activer le multijoueur** :
Dans `index.html`, décommentez ces lignes (ligne ~148) :
```javascript
const networkManager = new NetworkManager(game);
networkManager.connect('http://localhost:3000');
game.setNetworkManager(networkManager);
```

## Contrôles 🎯

**Style Dark Orbit - Contrôle à la souris** :
- **Clic gauche** : Se déplacer vers la position cliquée
- **Maintenir le clic gauche** : Suivre la souris en continu
- **Clic droit** : Activer/Désactiver le tir automatique
- **Espace** : Tirer manuellement

## Structure du projet 📁

```
Dark-Legacy/
├── client/              # Code client
│   ├── Game.js         # Moteur de jeu principal
│   ├── Ship.js         # Classe vaisseau
│   ├── Projectile.js   # Classe projectile
│   ├── Particle.js     # Système de particules
│   └── NetworkManager.js # Gestion réseau
├── server/             # Code serveur
│   └── index.js        # Serveur Node.js + Socket.io
├── index.html          # Point d'entrée
└── package.json        # Dépendances
```

## Prochaines étapes 🔮

### Court terme
- [ ] Ajouter plusieurs types de vaisseaux
- [ ] Implémenter des ennemis IA
- [ ] Système de ressources/points
- [ ] Zone de carte plus grande avec minimap

### Moyen terme
- [ ] Système de progression
- [ ] Différents types d'armes
- [ ] Power-ups et bonus
- [ ] Plusieurs zones/secteurs

### Long terme
- [ ] Système de clans/guildes
- [ ] Économie et marché
- [ ] Crafting d'équipements
- [ ] PvP par zones

## Technologies utilisées 🛠️

- **Frontend** : PixiJS v8 (WebGL/Canvas)
- **Backend** : Node.js + Express
- **Réseau** : Socket.io
- **Architecture** : Client-serveur autoritaire avec prédiction

## Performance 📊

- Taux de rafraîchissement : 60 FPS (client)
- Taux de mise à jour réseau : 20 ticks/seconde (serveur)
- Optimisations : Object pooling, culling, interpolation

## Licence

MIT

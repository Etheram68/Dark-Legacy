/**
 * Serveur Node.js avec Socket.io pour le multijoueur
 * Architecture autoritaire : le serveur valide tout
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..')));

// État du monde
const gameState = {
    players: {},
    projectiles: [],
    lastProjectileId: 0
};

// Configuration du jeu
const CONFIG = {
    worldWidth: 1920,
    worldHeight: 1080,
    tickRate: 1000 / 20, // 20 ticks par seconde
    projectileSpeed: 600,
    playerSpeed: 300
};

// Gestion des connexions
io.on('connection', (socket) => {
    console.log('Nouveau joueur connecté:', socket.id);

    // Créer un nouveau joueur
    gameState.players[socket.id] = {
        id: socket.id,
        x: Math.random() * CONFIG.worldWidth,
        y: Math.random() * CONFIG.worldHeight,
        vx: 0,
        vy: 0,
        rotation: 0,
        health: 100,
        lastProcessedInput: 0
    };

    // Envoyer l'ID au joueur
    socket.emit('player_id', socket.id);

    // Envoyer l'état actuel du monde au nouveau joueur
    socket.emit('world_state', gameState);

    // Notifier les autres joueurs
    socket.broadcast.emit('player_joined', gameState.players[socket.id]);

    // Recevoir les inputs du joueur
    socket.on('player_input', (input) => {
        handlePlayerInput(socket.id, input);
    });

    // Tir
    socket.on('player_fire', (fireData) => {
        handlePlayerFire(socket.id, fireData);
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Joueur déconnecté:', socket.id);
        delete gameState.players[socket.id];
        io.emit('player_left', socket.id);
    });
});

// Traiter les inputs des joueurs
function handlePlayerInput(playerId, input) {
    const player = gameState.players[playerId];
    if (!player) return;

    // Valider et appliquer l'input
    const deltaTime = 0.05; // Temps fixe pour la simulation

    // Rotation
    if (input.left) {
        player.rotation -= 4 * deltaTime;
    }
    if (input.right) {
        player.rotation += 4 * deltaTime;
    }

    // Accélération
    if (input.up) {
        const ax = Math.sin(player.rotation) * 500 * deltaTime;
        const ay = -Math.cos(player.rotation) * 500 * deltaTime;
        player.vx += ax;
        player.vy += ay;
    }
    if (input.down) {
        const ax = -Math.sin(player.rotation) * 250 * deltaTime;
        const ay = Math.cos(player.rotation) * 250 * deltaTime;
        player.vx += ax;
        player.vy += ay;
    }

    // Friction
    player.vx *= 0.98;
    player.vy *= 0.98;

    // Limiter la vitesse
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > CONFIG.playerSpeed) {
        player.vx = (player.vx / speed) * CONFIG.playerSpeed;
        player.vy = (player.vy / speed) * CONFIG.playerSpeed;
    }

    // Mise à jour de la position
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    // Wrap around
    if (player.x < 0) player.x = CONFIG.worldWidth;
    if (player.x > CONFIG.worldWidth) player.x = 0;
    if (player.y < 0) player.y = CONFIG.worldHeight;
    if (player.y > CONFIG.worldHeight) player.y = 0;

    // Enregistrer le dernier input traité
    player.lastProcessedInput = input.sequence;

    // Tir
    if (input.fire) {
        handlePlayerFire(playerId, {
            x: player.x,
            y: player.y,
            angle: player.rotation
        });
    }
}

// Gérer les tirs
function handlePlayerFire(playerId, fireData) {
    const player = gameState.players[playerId];
    if (!player) return;

    const projectileId = ++gameState.lastProjectileId;

    const offsetX = Math.sin(player.rotation) * 25;
    const offsetY = -Math.cos(player.rotation) * 25;

    const projectile = {
        id: projectileId,
        x: player.x + offsetX,
        y: player.y + offsetY,
        angle: player.rotation,
        vx: Math.sin(player.rotation) * CONFIG.projectileSpeed,
        vy: -Math.cos(player.rotation) * CONFIG.projectileSpeed,
        ownerId: playerId,
        createdAt: Date.now()
    };

    gameState.projectiles.push(projectile);

    // Notifier tous les clients
    io.emit('projectile_fired', projectile);
}

// Boucle de simulation du serveur
setInterval(() => {
    updateGameState();
    broadcastGameState();
}, CONFIG.tickRate);

function updateGameState() {
    const deltaTime = CONFIG.tickRate / 1000;

    // Mise à jour des projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Supprimer les projectiles hors limites ou trop vieux
        const age = (Date.now() - proj.createdAt) / 1000;
        return (
            proj.x >= 0 &&
            proj.x <= CONFIG.worldWidth &&
            proj.y >= 0 &&
            proj.y <= CONFIG.worldHeight &&
            age < 3
        );
    });

    // Détection des collisions (simplifié)
    gameState.projectiles.forEach(proj => {
        Object.keys(gameState.players).forEach(playerId => {
            if (playerId === proj.ownerId) return;

            const player = gameState.players[playerId];
            const dx = proj.x - player.x;
            const dy = proj.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 20) {
                player.health -= 10;
                // Supprimer le projectile après collision
                proj.x = -1000; // Force la suppression au prochain cycle
            }
        });
    });
}

function broadcastGameState() {
    // Envoyer l'état du monde à tous les clients
    io.emit('world_state', {
        players: gameState.players,
        projectiles: gameState.projectiles
    });
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
});

/**
 * Gestionnaire réseau pour le multijoueur
 * Architecture client-serveur autoritaire avec prédiction côté client
 */
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerId = null;
        this.connected = false;

        // Interpolation et prédiction
        this.serverUpdates = [];
        this.updateRate = 1000 / 20; // 20 updates par seconde
        this.lastUpdateTime = 0;

        // Buffer pour la réconciliation
        this.pendingInputs = [];
        this.inputSequence = 0;
    }

    connect(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connecté au serveur');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Déconnecté du serveur');
            this.connected = false;
        });

        // Recevoir l'ID du joueur
        this.socket.on('player_id', (id) => {
            this.playerId = id;
            console.log('Player ID:', id);
        });

        // Recevoir les états du monde
        this.socket.on('world_state', (worldState) => {
            this.handleWorldState(worldState);
        });

        // Recevoir les nouveaux joueurs
        this.socket.on('player_joined', (playerData) => {
            this.spawnPlayer(playerData);
        });

        // Recevoir les joueurs qui partent
        this.socket.on('player_left', (playerId) => {
            this.removePlayer(playerId);
        });

        // Recevoir les projectiles
        this.socket.on('projectile_fired', (projectileData) => {
            this.spawnProjectile(projectileData);
        });
    }

    sendInput(input) {
        if (!this.connected) return;

        // Ajouter un numéro de séquence pour la réconciliation
        input.sequence = this.inputSequence++;
        input.timestamp = Date.now();

        // Envoyer au serveur
        this.socket.emit('player_input', input);

        // Stocker pour réconciliation future
        this.pendingInputs.push(input);

        // Garder seulement les 100 derniers inputs
        if (this.pendingInputs.length > 100) {
            this.pendingInputs.shift();
        }
    }

    handleWorldState(worldState) {
        // Mise à jour des positions des autres joueurs
        if (worldState.players) {
            Object.keys(worldState.players).forEach(playerId => {
                if (playerId === this.playerId) {
                    // Réconciliation pour le joueur local
                    this.reconcileLocalPlayer(worldState.players[playerId]);
                } else {
                    // Interpolation pour les autres joueurs
                    this.updateRemotePlayer(playerId, worldState.players[playerId]);
                }
            });
        }

        // Mise à jour des projectiles
        if (worldState.projectiles) {
            worldState.projectiles.forEach(proj => {
                this.updateProjectile(proj);
            });
        }
    }

    reconcileLocalPlayer(serverState) {
        // Réconciliation : vérifier si la position du serveur correspond
        // Si non, corriger et rejouer les inputs en attente

        const player = this.game.localPlayer;
        if (!player) return;

        // Si la différence est trop grande, corriger
        const dx = player.x - serverState.x;
        const dy = player.y - serverState.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            // Correction de position
            player.x = serverState.x;
            player.y = serverState.y;
            player.vx = serverState.vx;
            player.vy = serverState.vy;

            // Rejouer les inputs en attente après la dernière mise à jour du serveur
            const lastProcessedInput = serverState.lastProcessedInput;
            const inputsToReplay = this.pendingInputs.filter(
                input => input.sequence > lastProcessedInput
            );

            // Simuler ces inputs localement
            inputsToReplay.forEach(input => {
                // Appliquer l'input (simplification)
                // En production, il faudrait une fonction de simulation déterministe
            });
        }

        // Nettoyer les inputs traités
        this.pendingInputs = this.pendingInputs.filter(
            input => input.sequence > serverState.lastProcessedInput
        );
    }

    updateRemotePlayer(playerId, playerState) {
        // Trouver ou créer le joueur distant
        let player = this.game.entities.find(e => e.networkId === playerId);

        if (!player) {
            player = new Ship(playerState.x, playerState.y, this.game, false);
            player.networkId = playerId;
            this.game.addEntity(player);
        }

        // Interpolation lisse vers la nouvelle position
        // Pour l'instant, mise à jour directe (à améliorer avec interpolation)
        player.x = playerState.x;
        player.y = playerState.y;
        player.rotation = playerState.rotation;
        player.vx = playerState.vx;
        player.vy = playerState.vy;
    }

    updateProjectile(projectileData) {
        // Vérifier si le projectile existe déjà
        let projectile = this.game.projectiles.find(p => p.networkId === projectileData.id);

        if (!projectile) {
            // Créer un nouveau projectile
            projectile = new Projectile(
                projectileData.x,
                projectileData.y,
                projectileData.angle,
                null
            );
            projectile.networkId = projectileData.id;
            this.game.addProjectile(projectile);
        } else {
            // Mettre à jour la position
            projectile.x = projectileData.x;
            projectile.y = projectileData.y;
        }
    }

    spawnPlayer(playerData) {
        const player = new Ship(playerData.x, playerData.y, this.game, false);
        player.networkId = playerData.id;
        this.game.addEntity(player);
    }

    removePlayer(playerId) {
        const player = this.game.entities.find(e => e.networkId === playerId);
        if (player) {
            player.destroy();
        }
    }

    spawnProjectile(projectileData) {
        const projectile = new Projectile(
            projectileData.x,
            projectileData.y,
            projectileData.angle,
            null
        );
        projectile.networkId = projectileData.id;
        this.game.addProjectile(projectile);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

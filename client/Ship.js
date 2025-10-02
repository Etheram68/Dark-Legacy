/**
 * Classe représentant un vaisseau spatial
 * Gère les contrôles, le mouvement, et les tirs
 */
class Ship {
    constructor(x, y, game, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.isPlayer = isPlayer;

        // Propriétés physiques
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.radius = 20;

        // Propriétés de gameplay
        this.maxSpeed = 250;
        this.acceleration = 400;
        this.rotationSpeed = 5;
        this.health = 100;
        this.maxHealth = 100;

        // Tir
        this.fireRate = 0.15; // secondes entre chaque tir
        this.lastFireTime = 0;
        this.autoFire = false; // Tir automatique lors du mouvement

        // Contrôles à la souris (style Dark Orbit)
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMoving = false;
        this.targetX = x;
        this.targetY = y;
        this.moveThreshold = 10; // Distance minimale pour arrêter le mouvement

        // Graphiques
        this.graphics = new PIXI.Container();
        this.createShipGraphics();

        // Si c'est le joueur, configurer les contrôles
        if (this.isPlayer) {
            this.setupControls();
        }

        // Moteurs (pour les effets de particules)
        this.engineParticleTimer = 0;
    }

    createShipGraphics() {
        // Vaisseau style Dark Orbit - design plus détaillé
        const ship = new PIXI.Graphics();

        // Corps principal (ovale allongé)
        ship.ellipse(0, 0, 12, 18);
        ship.fill({ color: 0x1A4D6D });

        // Partie avant (pointe)
        ship.moveTo(0, -18);
        ship.lineTo(-8, -10);
        ship.lineTo(8, -10);
        ship.closePath();
        ship.fill({ color: 0x2A6D8D });

        // Ailes
        // Aile gauche
        ship.moveTo(-12, -5);
        ship.lineTo(-25, 0);
        ship.lineTo(-22, 8);
        ship.lineTo(-12, 5);
        ship.closePath();
        ship.fill({ color: 0x0D3D5D });

        // Aile droite
        ship.moveTo(12, -5);
        ship.lineTo(25, 0);
        ship.lineTo(22, 8);
        ship.lineTo(12, 5);
        ship.closePath();
        ship.fill({ color: 0x0D3D5D });

        // Cockpit (fenêtre)
        ship.circle(0, -5, 5);
        ship.fill({ color: 0x00DDFF, alpha: 0.7 });

        // Détails lumineux
        ship.circle(-8, -2, 2);
        ship.fill({ color: 0x00FF00 });
        ship.circle(8, -2, 2);
        ship.fill({ color: 0xFF0000 });

        // Réacteurs arrière
        ship.rect(-8, 12, 5, 6);
        ship.fill({ color: 0x0A2A3D });
        ship.rect(3, 12, 5, 6);
        ship.fill({ color: 0x0A2A3D });

        // Contours du vaisseau
        ship.ellipse(0, 0, 12, 18);
        ship.stroke({ color: 0x00AAFF, width: 1, alpha: 0.8 });

        this.graphics.addChild(ship);

        // Barre de vie
        this.healthBar = new PIXI.Graphics();
        this.updateHealthBar();
        this.graphics.addChild(this.healthBar);

        this.graphics.x = this.x;
        this.graphics.y = this.y;
    }

    setupControls() {
        // Contrôle à la souris (style Dark Orbit)
        const canvas = this.game.app.canvas;

        // Clic gauche : se déplacer vers la position
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Clic gauche
                this.isMoving = true;
                this.updateMousePosition(e);
            }
        });

        // Mouvement de la souris pendant le clic
        canvas.addEventListener('mousemove', (e) => {
            if (this.isMoving) {
                this.updateMousePosition(e);
            }
        });

        // Relâcher le clic
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMoving = false;
            }
        });

        // Clic droit : activer/désactiver le tir automatique
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.autoFire = !this.autoFire;
            console.log('Tir automatique:', this.autoFire ? 'Activé' : 'Désactivé');
        });

        // Touche espace pour tir manuel
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.fire();
                e.preventDefault();
            }
        });
    }

    updateMousePosition(e) {
        const rect = this.game.app.canvas.getBoundingClientRect();
        this.targetX = e.clientX - rect.left;
        this.targetY = e.clientY - rect.top;
    }

    update(deltaTime) {
        if (this.isPlayer) {
            this.handleInput(deltaTime);
        }

        // Mise à jour de la position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Limites de l'écran (wrap around)
        if (this.x < 0) this.x = this.game.app.screen.width;
        if (this.x > this.game.app.screen.width) this.x = 0;
        if (this.y < 0) this.y = this.game.app.screen.height;
        if (this.y > this.game.app.screen.height) this.y = 0;

        // Mise à jour des graphiques
        this.graphics.x = this.x;
        this.graphics.y = this.y;
        this.graphics.rotation = this.rotation;

        // Particules du moteur
        if (this.isMoving && this.isPlayer) {
            this.engineParticleTimer += deltaTime;
            if (this.engineParticleTimer > 0.05) {
                this.createEngineParticles();
                this.engineParticleTimer = 0;
            }
        }

        // Tir automatique
        if (this.autoFire && this.isPlayer) {
            this.fire();
        }
    }

    handleInput(deltaTime) {
        if (!this.isMoving) return;

        // Calculer la direction vers la cible
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Si on est assez proche de la cible, arrêter
        if (distanceToTarget < this.moveThreshold) {
            this.vx *= 0.9;
            this.vy *= 0.9;
            return;
        }

        // Angle vers la cible
        const targetAngle = Math.atan2(dx, -dy);

        // Rotation progressive vers la cible
        let angleDiff = targetAngle - this.rotation;

        // Normaliser l'angle entre -PI et PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Appliquer la rotation
        if (Math.abs(angleDiff) > 0.05) {
            this.rotation += Math.sign(angleDiff) * this.rotationSpeed * deltaTime;
        } else {
            this.rotation = targetAngle;
        }

        // Accélérer dans la direction de la rotation
        const ax = Math.sin(this.rotation) * this.acceleration * deltaTime;
        const ay = -Math.cos(this.rotation) * this.acceleration * deltaTime;
        this.vx += ax;
        this.vy += ay;

        // Limiter la vitesse
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }

    fire() {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastFireTime < this.fireRate) return;

        this.lastFireTime = currentTime;

        // Créer un projectile
        const offsetX = Math.sin(this.rotation) * 25;
        const offsetY = -Math.cos(this.rotation) * 25;

        const projectile = new Projectile(
            this.x + offsetX,
            this.y + offsetY,
            this.rotation,
            this
        );

        this.game.addProjectile(projectile);

        // Effet de recul
        this.vx -= Math.sin(this.rotation) * 10;
        this.vy += Math.cos(this.rotation) * 10;

        // Effet visuel de tir
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        const offsetX = Math.sin(this.rotation) * 25;
        const offsetY = -Math.cos(this.rotation) * 25;

        for (let i = 0; i < 5; i++) {
            const particle = new Particle(this.x + offsetX, this.y + offsetY, {
                color: 0xFFFF00,
                speed: 50 + Math.random() * 50,
                lifetime: 0.1 + Math.random() * 0.1,
                size: 2 + Math.random() * 2,
                angle: this.rotation + (Math.random() - 0.5) * 0.5
            });
            this.game.particles.push(particle);
            this.game.worldContainer.addChild(particle.graphics);
        }
    }

    createEngineParticles() {
        // Deux réacteurs (gauche et droit)
        const reactors = [
            { offsetX: -Math.sin(this.rotation) * 18 - Math.cos(this.rotation) * 6,
              offsetY: Math.cos(this.rotation) * 18 - Math.sin(this.rotation) * 6 },
            { offsetX: -Math.sin(this.rotation) * 18 + Math.cos(this.rotation) * 6,
              offsetY: Math.cos(this.rotation) * 18 + Math.sin(this.rotation) * 6 }
        ];

        reactors.forEach(reactor => {
            const particle = new Particle(this.x + reactor.offsetX, this.y + reactor.offsetY, {
                color: Math.random() > 0.5 ? 0xFF6600 : 0xFFAA00,
                speed: 50,
                lifetime: 0.3,
                size: 3,
                angle: this.rotation + Math.PI + (Math.random() - 0.5) * 0.3
            });
            this.game.particles.push(particle);
            this.game.worldContainer.addChild(particle.graphics);
        });
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
        }
    }

    updateHealthBar() {
        this.healthBar.clear();

        const barWidth = 40;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        // Fond
        this.healthBar.rect(-barWidth / 2, -30, barWidth, barHeight);
        this.healthBar.fill({ color: 0x333333 });

        // Vie
        this.healthBar.rect(-barWidth / 2, -30, barWidth * healthPercent, barHeight);
        this.healthBar.fill({ color: healthPercent > 0.5 ? 0x00FF00 : healthPercent > 0.25 ? 0xFFAA00 : 0xFF0000 });
    }

    destroy() {
        // Effet d'explosion
        for (let i = 0; i < 30; i++) {
            const particle = new Particle(this.x, this.y, {
                color: Math.random() > 0.5 ? 0xFF6600 : 0xFFFF00,
                speed: 100 + Math.random() * 200,
                lifetime: 0.5 + Math.random() * 0.5,
                size: 3 + Math.random() * 5
            });
            this.game.particles.push(particle);
            this.game.worldContainer.addChild(particle.graphics);
        }

        this.graphics.destroy();
        const index = this.game.entities.indexOf(this);
        if (index > -1) {
            this.game.entities.splice(index, 1);
        }
    }
}

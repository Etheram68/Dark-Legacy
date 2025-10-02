/**
 * Classe principale du moteur de jeu
 * Gère l'initialisation de PixiJS et la boucle de jeu
 */
class Game {
    constructor() {
        this.app = null;
        this.entities = [];
        this.projectiles = [];
        this.particles = [];
        this.lastTime = performance.now();

        // Prêt pour le multijoueur
        this.networkManager = null;
        this.localPlayer = null;
    }

    async init() {
        // Créer l'application PixiJS
        this.app = new PIXI.Application();
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        document.body.appendChild(this.app.canvas);

        // Créer le conteneur principal
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        // Créer le fond étoilé
        this.createStarfield();

        // Démarrer la boucle de jeu
        this.app.ticker.add(() => this.gameLoop());

        // Gérer le redimensionnement
        window.addEventListener('resize', () => this.resize());
    }

    createStarfield() {
        const starfield = new PIXI.Graphics();

        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.app.screen.width;
            const y = Math.random() * this.app.screen.height;
            const size = Math.random() * 2;
            const alpha = 0.3 + Math.random() * 0.7;

            starfield.circle(x, y, size);
            starfield.fill({ color: 0xFFFFFF, alpha: alpha });
        }

        this.worldContainer.addChild(starfield);
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Mise à jour de toutes les entités
        this.entities.forEach(entity => entity.update(deltaTime));

        // Mise à jour des projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);

            // Supprimer les projectiles hors écran
            if (projectile.isOffScreen(this.app.screen)) {
                projectile.destroy();
                return false;
            }
            return true;
        });

        // Mise à jour des particules
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);

            if (particle.isDead()) {
                particle.destroy();
                return false;
            }
            return true;
        });

        // Détection des collisions
        this.checkCollisions();
    }

    checkCollisions() {
        // Collision projectiles vs entités
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            for (let j = this.entities.length - 1; j >= 0; j--) {
                const entity = this.entities[j];

                // Ne pas vérifier les collisions avec le propriétaire du projectile
                if (projectile.owner === entity) continue;

                if (this.checkCollision(projectile, entity)) {
                    // Créer effet d'impact
                    this.createImpactEffect(projectile.x, projectile.y);

                    // Gérer les dégâts
                    entity.takeDamage(projectile.damage);

                    // Supprimer le projectile
                    projectile.destroy();
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }

    createImpactEffect(x, y) {
        // Créer des particules d'impact
        for (let i = 0; i < 10; i++) {
            const particle = new Particle(x, y, {
                color: 0xFF6600,
                speed: 50 + Math.random() * 100,
                lifetime: 0.3 + Math.random() * 0.3,
                size: 2 + Math.random() * 3
            });
            this.particles.push(particle);
            this.worldContainer.addChild(particle.graphics);
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
        this.worldContainer.addChild(entity.graphics);
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.worldContainer.addChild(projectile.graphics);
    }

    resize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }

    // Méthode pour intégration future du réseau
    setNetworkManager(networkManager) {
        this.networkManager = networkManager;
    }
}

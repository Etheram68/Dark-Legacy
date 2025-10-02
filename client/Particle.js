/**
 * Classe représentant une particule
 * Utilisée pour les effets visuels (explosions, moteurs, impacts)
 */
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;

        // Options avec valeurs par défaut
        this.color = options.color || 0xFFFFFF;
        this.speed = options.speed || 100;
        this.lifetime = options.lifetime || 1;
        this.size = options.size || 2;
        this.angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;

        // Calcul de la vélocité
        this.vx = Math.sin(this.angle) * this.speed;
        this.vy = -Math.cos(this.angle) * this.speed;

        // État
        this.age = 0;
        this.alpha = 1;

        // Graphiques
        this.graphics = new PIXI.Graphics();
        this.createParticleGraphics();
    }

    createParticleGraphics() {
        this.graphics.circle(0, 0, this.size);
        this.graphics.fill({ color: this.color, alpha: this.alpha });

        this.graphics.x = this.x;
        this.graphics.y = this.y;
    }

    update(deltaTime) {
        this.age += deltaTime;

        // Mise à jour de la position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Fade out
        this.alpha = 1 - (this.age / this.lifetime);

        // Mise à jour des graphiques
        this.graphics.clear();
        this.graphics.circle(0, 0, this.size * this.alpha);
        this.graphics.fill({ color: this.color, alpha: this.alpha });

        this.graphics.x = this.x;
        this.graphics.y = this.y;
    }

    isDead() {
        return this.age >= this.lifetime;
    }

    destroy() {
        this.graphics.destroy();
    }
}

/**
 * Classe représentant un projectile
 * Gère la physique et le rendu des projectiles
 */
class Projectile {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;

        // Propriétés physiques
        this.speed = 600;
        this.vx = Math.sin(angle) * this.speed;
        this.vy = -Math.cos(angle) * this.speed;
        this.radius = 3;

        // Propriétés de gameplay
        this.damage = 10;
        this.lifetime = 3; // secondes
        this.age = 0;

        // Graphiques
        this.graphics = new PIXI.Container();
        this.createProjectileGraphics();
    }

    createProjectileGraphics() {
        const projectile = new PIXI.Graphics();

        // Corps du projectile
        projectile.circle(0, 0, this.radius);
        projectile.fill({ color: 0xFFFF00 });

        // Aura lumineuse
        projectile.circle(0, 0, this.radius * 2);
        projectile.fill({ color: 0xFFFF00, alpha: 0.3 });

        // Traînée
        const trail = new PIXI.Graphics();
        trail.moveTo(0, 0);
        trail.lineTo(0, 10);
        trail.stroke({ color: 0xFFAA00, width: 2, alpha: 0.5 });

        this.graphics.addChild(trail);
        this.graphics.addChild(projectile);

        this.graphics.x = this.x;
        this.graphics.y = this.y;
        this.graphics.rotation = this.angle;
    }

    update(deltaTime) {
        this.age += deltaTime;

        // Mise à jour de la position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Mise à jour des graphiques
        this.graphics.x = this.x;
        this.graphics.y = this.y;

        // Effet de pulsation
        const scale = 1 + Math.sin(this.age * 20) * 0.2;
        this.graphics.scale.set(scale);
    }

    isOffScreen(screen) {
        const margin = 50;
        return (
            this.x < -margin ||
            this.x > screen.width + margin ||
            this.y < -margin ||
            this.y > screen.height + margin ||
            this.age > this.lifetime
        );
    }

    destroy() {
        this.graphics.destroy();
    }
}

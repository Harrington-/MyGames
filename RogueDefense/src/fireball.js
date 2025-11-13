// Fireball class - handles projectile behavior
class Fireball {
    constructor(app, x, y, directionX, directionY) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.startX = x; // Store starting position
        this.startY = y;
        this.speed = 3;
        this.directionX = directionX;
        this.directionY = directionY;
        this.radius = 4; // Half the original size
        this.active = true;
        this.maxDistance = 800; // Max travel distance from start
        
        this.sprite = this.createFireballSprite();
        this.updateSpritePosition();
    }

    createFireballSprite() {
        const graphics = new PIXI.Graphics();
        
        // Outer glow (orange)
        graphics.circle(0, 0, this.radius + 2);
        graphics.fill({ color: 0xff6600, alpha: 0.5 });
        
        // Main fireball (bright orange/yellow)
        graphics.circle(0, 0, this.radius);
        graphics.fill(0xff8800);
        
        // Inner core (yellow)
        graphics.circle(0, 0, this.radius - 3);
        graphics.fill(0xffff00);

        const texture = this.app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        
        return sprite;
    }

    update(levelLoader, enemies) {
        if (!this.active) return false;

        // Move fireball
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;

        // Check collision with enemies
        if (enemies) {
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (!enemy.active) continue;
                
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.radius + enemy.size / 2) {
                    enemy.takeDamage(1);
                    this.active = false;
                    return false;
                }
            }
        }

        // Check collision with walls (only if chunk/tile is loaded)
        const tile = levelLoader.getTileAt(this.x, this.y);
        // Projectiles only collide with walls and trees, not water
        if (tile !== null && blocksProjectiles(tile.type)) {
            this.active = false;
            return false;
        }

        // Check if fireball has traveled too far from its starting position
        const dx = this.x - this.startX;
        const dy = this.y - this.startY;
        const distanceTraveled = Math.sqrt(dx * dx + dy * dy);
        if (distanceTraveled > this.maxDistance) {
            this.active = false;
            return false;
        }

        this.updateSpritePosition();
        return true;
    }

    updateSpritePosition() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    getSprite() {
        return this.sprite;
    }

    destroy() {
        this.active = false;
        if (this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
    }
}

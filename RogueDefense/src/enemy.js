// Enemy class - basic enemy that follows player
class Enemy {
    constructor(app, x, y, player, pathfinder) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.player = player;
        this.pathfinder = pathfinder;
        this.speed = 1.5;
        this.health = 5; // Takes 2 fireballs to kill
        this.maxHealth = 5;
        this.size = 20;
        this.active = true;
        
        // Pathfinding
        this.path = [];
        this.pathUpdateTimer = 0;
        this.pathUpdateInterval = 30; // Recalculate path every 30 frames
        
        this.sprite = this.createEnemySprite();
        this.healthBarContainer = this.createHealthBar();
        this.updateSpritePosition();
    }

    createEnemySprite() {
        const graphics = new PIXI.Graphics();
        
        // Body (red blob/slime)
        graphics.circle(0, 0, this.size / 2);
        graphics.fill(0xCC0000);
        
        // Darker center
        graphics.circle(0, 0, this.size / 3);
        graphics.fill(0x880000);
        
        // Eyes
        graphics.circle(-4, -2, 2);
        graphics.fill(0x000000);
        graphics.circle(4, -2, 2);
        graphics.fill(0x000000);

        const texture = this.app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        
        graphics.destroy();
        
        return sprite;
    }

    createHealthBar() {
        const container = new PIXI.Container();
        
        // Background (red)
        const bg = new PIXI.Graphics();
        bg.rect(-10, -14, 20, 3);
        bg.fill(0x880000);
        container.addChild(bg);
        
        // Health (green)
        const health = new PIXI.Graphics();
        health.rect(-10, -14, 20, 3);
        health.fill(0x00FF00);
        container.addChild(health);
        
        container.healthBar = health;
        container.visible = true;
        
        return container;
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBarContainer.healthBar.clear();
        this.healthBarContainer.healthBar.rect(-10, -14, 20 * healthPercent, 3);
        this.healthBarContainer.healthBar.fill(healthPercent > 0.5 ? 0x00FF00 : 0xFF8800);
    }

    update(delta, levelLoader) {
        if (!this.active) return false;

        // Update pathfinding timer
        this.pathUpdateTimer++;
        if (this.pathUpdateTimer >= this.pathUpdateInterval || !this.path || this.path.length === 0) {
            // Recalculate path to player
            this.path = this.pathfinder.findPath(this.x, this.y, this.player.x, this.player.y);
            this.pathUpdateTimer = 0;
            
            // Remove first waypoint (current position) if path exists
            if (this.path && this.path.length > 0) {
                this.path.shift();
            } else {
                this.path = []; // Ensure path is always an array
            }
        }

        // Follow path
        if (this.path && this.path.length > 0) {
            const target = this.path[0];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                // Reached waypoint, move to next
                this.path.shift();
            } else {
                // Move towards waypoint
                const dirX = dx / distance;
                const dirY = dy / distance;

                const newX = this.x + dirX * this.speed * delta;
                const newY = this.y + dirY * this.speed * delta;

                // Simple collision check
                if (!levelLoader.isSolidAt(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        }

        this.updateSpritePosition();
        return true;
    }

    takeDamage(damage) {
        this.health -= damage;
        this.updateHealthBar();
        
        // Flash white when hit
        this.sprite.tint = 0xFFFFFF;
        setTimeout(() => {
            if (this.sprite) {
                this.sprite.tint = 0xFFFFFF;
            }
        }, 100);

        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy died
        }
        return false;
    }

    updateSpritePosition() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.healthBarContainer.x = this.x;
        this.healthBarContainer.y = this.y;
    }

    getSprite() {
        return this.sprite;
    }

    getHealthBar() {
        return this.healthBarContainer;
    }

    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    destroy() {
        this.active = false;
        if (this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
        if (this.healthBarContainer.parent) {
            this.healthBarContainer.parent.removeChild(this.healthBarContainer);
        }
        this.sprite.destroy();
        this.healthBarContainer.destroy({ children: true });
    }
}

// Player class - handles player character, movement, and collision
class Player {
    constructor(app, levelLoader) {
        this.app = app;
        this.levelLoader = levelLoader;
        this.speed = 2.5;
        this.x = 0; // Start at world origin
        this.y = 0;
        this.camera = null; // Will be set externally
        
        // Movement state
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Attack state
        this.lastDirectionX = 0;
        this.lastDirectionY = -1; // Default to up
        this.mouseX = null;
        this.mouseY = null;
        this.fireballs = [];

        this.sprite = this.createPlayerSprite();
        this.updateSpritePosition();
        
        // Delay setup to ensure DOM is ready
        setTimeout(() => this.setupControls(), 0);
    }

    createPlayerSprite() {
        const graphics = new PIXI.Graphics();
        
        // Draw a simple Link-style character (green with hat)
        // Body (green tunic)
        graphics.rect(-8, -4, 16, 20);
        graphics.fill(0x2ecc40);
        
        // Head (peach)
        graphics.circle(0, -10, 6);
        graphics.fill(0xffdc9e);
        
        // Hat (darker green)
        graphics.moveTo(-8, -10);
        graphics.lineTo(0, -18);
        graphics.lineTo(8, -10);
        graphics.fill(0x1d8028);
        
        // Shield (brown/gray - on back)
        graphics.rect(8, 0, 4, 12);
        graphics.fill(0x7f8c8d);

        const texture = this.app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        
        return sprite;
    }

    setupControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
            }
        });

        // Mouse tracking (convert to world coordinates)
        window.addEventListener('mousemove', (e) => {
            const canvas = this.app.canvas;
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Convert to world coordinates if camera exists
            if (this.camera) {
                const worldPos = this.camera.screenToWorld(screenX, screenY);
                this.mouseX = worldPos.x;
                this.mouseY = worldPos.y;
            } else {
                this.mouseX = screenX;
                this.mouseY = screenY;
            }
        });

        // Mouse click to shoot
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.shootFireball();
                e.preventDefault();
            }
        });
    }

    setCamera(camera) {
        this.camera = camera;
    }

    update(delta) {
        let newX = this.x;
        let newY = this.y;
        let moved = false;

        // Calculate movement
        if (this.keys.up) {
            newY -= this.speed * delta;
            moved = true;
        }
        if (this.keys.down) {
            newY += this.speed * delta;
            moved = true;
        }
        if (this.keys.left) {
            newX -= this.speed * delta;
            moved = true;
        }
        if (this.keys.right) {
            newX += this.speed * delta;
            moved = true;
        }

        // Update last direction if player moved
        if (moved) {
            const dx = newX - this.x;
            const dy = newY - this.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                this.lastDirectionX = dx / length;
                this.lastDirectionY = dy / length;
            }
        }

        // Collision detection - check corners of player hitbox
        const size = 12; // Player hitbox size
        const canMove = !this.checkCollision(newX, newY, size);

        if (canMove) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try sliding along walls
            if (!this.checkCollision(newX, this.y, size)) {
                this.x = newX;
            } else if (!this.checkCollision(this.x, newY, size)) {
                this.y = newY;
            }
        }

        this.updateSpritePosition();
    }

    checkCollision(x, y, size) {
        // Check four corners of the player's hitbox
        const corners = [
            { x: x - size/2, y: y - size/2 }, // top-left
            { x: x + size/2, y: y - size/2 }, // top-right
            { x: x - size/2, y: y + size/2 }, // bottom-left
            { x: x + size/2, y: y + size/2 }  // bottom-right
        ];

        for (let corner of corners) {
            if (this.levelLoader.isSolidAt(corner.x, corner.y)) {
                return true;
            }
        }
        return false;
    }

    updateSpritePosition() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    shootFireball() {
        let dirX, dirY;

        // Use mouse position if available
        if (this.mouseX !== null && this.mouseY !== null) {
            const dx = this.mouseX - this.x;
            const dy = this.mouseY - this.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                dirX = dx / length;
                dirY = dy / length;
            } else {
                dirX = this.lastDirectionX;
                dirY = this.lastDirectionY;
            }
        } else {
            // Use last movement direction
            dirX = this.lastDirectionX;
            dirY = this.lastDirectionY;
        }

        const fireball = new Fireball(this.app, this.x, this.y, dirX, dirY);
        this.fireballs.push(fireball);
    }

    updateFireballs(enemies) {
        // Update all fireballs and remove inactive ones
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const stillActive = this.fireballs[i].update(this.levelLoader, enemies);
            if (!stillActive) {
                this.fireballs[i].destroy();
                this.fireballs.splice(i, 1);
            }
        }
    }

    getFireballs() {
        return this.fireballs;
    }

    getSprite() {
        return this.sprite;
    }
}

// Camera system to follow the player
class Camera {
    constructor(app, target) {
        this.app = app;
        this.target = target; // The player or object to follow
        this.worldContainer = new PIXI.Container();
        
        // Camera bounds (viewport size)
        this.viewportWidth = app.screen.width;
        this.viewportHeight = app.screen.height;
        
        // Smooth camera movement
        this.smoothing = 0.1;
    }

    update() {
        if (!this.target) return;

        // Calculate desired camera position (center on target)
        const desiredX = this.viewportWidth / 2 - this.target.x;
        const desiredY = this.viewportHeight / 2 - this.target.y;

        // Smooth camera movement (lerp)
        this.worldContainer.x += (desiredX - this.worldContainer.x) * this.smoothing;
        this.worldContainer.y += (desiredY - this.worldContainer.y) * this.smoothing;
    }

    getWorldContainer() {
        return this.worldContainer;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX - this.worldContainer.x,
            y: screenY - this.worldContainer.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX + this.worldContainer.x,
            y: worldY + this.worldContainer.y
        };
    }
}

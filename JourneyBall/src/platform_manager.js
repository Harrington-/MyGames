// PlatformManager: manages platforms, walls and collision
function PlatformManager(world, edgeColor, ballRadius, gameWidth, gameHeight) {
    this.world = world;
    this.edgeColor = edgeColor;
    this.ballRadius = ballRadius;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.platforms = [];
}

PlatformManager.prototype.addWallsAndCeiling = function() {
    // Don't add edges if they already exist
    if (this.platforms.some(p => p.type === 'edge')) return;
    const WALL_HEIGHT = 100000;
    // Left wall
    const leftWall = new PIXI.Graphics();
    leftWall.lineStyle(this.ballRadius, this.edgeColor);
    leftWall.moveTo(this.ballRadius/2, -WALL_HEIGHT);
    leftWall.lineTo(this.ballRadius/2, this.gameHeight + 20);
    this.world.addChild(leftWall);
    this.platforms.push({
        x1: this.ballRadius/2,
        y1: -WALL_HEIGHT,
        x2: this.ballRadius/2,
        y2: this.gameHeight,
        thickness: this.ballRadius,
        type: 'edge',
        graphics: leftWall
    });

    // Right wall
    const rightWall = new PIXI.Graphics();
    rightWall.lineStyle(this.ballRadius, this.edgeColor);
    rightWall.moveTo(this.gameWidth - this.ballRadius/2, -WALL_HEIGHT);
    rightWall.lineTo(this.gameWidth - this.ballRadius/2, this.gameHeight + 20);
    this.world.addChild(rightWall);
    this.platforms.push({
        x1: this.gameWidth - this.ballRadius/2,
        y1: -WALL_HEIGHT,
        x2: this.gameWidth - this.ballRadius/2,
        y2: this.gameHeight,
        thickness: this.ballRadius,
        type: 'edge',
        graphics: rightWall
    });

    // Ceiling
    const ceiling = new PIXI.Graphics();
    ceiling.lineStyle(this.ballRadius, this.edgeColor);
    ceiling.moveTo(this.ballRadius/2, -WALL_HEIGHT);
    ceiling.lineTo(this.gameWidth - this.ballRadius/2, -WALL_HEIGHT);
    this.world.addChild(ceiling);
    this.platforms.push({
        x1: this.ballRadius/2,
        y1: -WALL_HEIGHT,
        x2: this.gameWidth - this.ballRadius/2,
        y2: -WALL_HEIGHT,
        thickness: this.ballRadius,
        type: 'edge',
        graphics: ceiling
    });
};

PlatformManager.prototype.loadLevelFromCSV = function(csvData) {
    // Remove non-edge platforms from the world but keep permanent edges (walls/ceiling)
    for (let i = this.platforms.length - 1; i >= 0; i--) {
        const p = this.platforms[i];
        if (p.type !== 'edge') {
            if (p.graphics && p.graphics.parent) this.world.removeChild(p.graphics);
            this.platforms.splice(i, 1);
        }
    }

    const lines = csvData.trim().split('\n');
    for (let line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 6) continue;
        const x1 = parseFloat(parts[0]);
        const y1 = parseFloat(parts[1]);
        const x2 = parseFloat(parts[2]);
        const y2 = parseFloat(parts[3]);
        const thickness = parseFloat(parts[4]);
        const type = parts[5];

        const platformGraphics = new PIXI.Graphics();
        platformGraphics.lineStyle(thickness, this.edgeColor);
        platformGraphics.moveTo(x1, y1);
        platformGraphics.lineTo(x2, y2);
        this.world.addChild(platformGraphics);

        this.platforms.push({ x1, y1, x2, y2, thickness, type, graphics: platformGraphics });
    }
};

// Collision helper: resolves circle vs line segment, returns normal/overlap when collided
PlatformManager.prototype.resolveCircleLineCollision = function(circle, x1, y1, x2, y2, thickness) {
    const lineX = x2 - x1;
    const lineY = y2 - y1;
    const lineLength = Math.sqrt(lineX * lineX + lineY * lineY);
    if (lineLength === 0) return false;
    const lineDirX = lineX / lineLength;
    const lineDirY = lineY / lineLength;
    const toCircleX = circle.x - x1;
    const toCircleY = circle.y - y1;
    const projection = toCircleX * lineDirX + toCircleY * lineDirY;
    const clampedProjection = Math.max(0, Math.min(lineLength, projection));
    const closestX = x1 + lineDirX * clampedProjection;
    const closestY = y1 + lineDirY * clampedProjection;
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const overlap = (thickness/2 + circle.radius) - dist;
    if (overlap > 0) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        // Move circle out along normal
        circle.x += nx * overlap;
        circle.y += ny * overlap;
        return { nx, ny, overlap };
    }
    return false;
};

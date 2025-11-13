// LevelLoader class - handles loading and rendering tile-based levels
class LevelLoader {
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.tiles = [];
        this.levelData = null;
    }

    loadLevel(levelData) {
        // Clear existing tiles
        this.container.removeChildren();
        this.tiles = [];
        this.levelData = levelData;

        // Create tiles
        for (let row = 0; row < levelData.length; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < levelData[row].length; col++) {
                const tileType = levelData[row][col];
                const tile = this.createTile(tileType, col, row);
                this.tiles[row][col] = {
                    sprite: tile,
                    type: tileType,
                    solid: isSolid(tileType)
                };
                this.container.addChild(tile);
            }
        }

        return this.container;
    }

    createTile(tileType, col, row) {
        const graphics = new PIXI.Graphics();
        const color = TILE_COLORS[tileType];
        
        graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
        graphics.fill(color);
        
        // Add slight border for visual clarity
        graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
        graphics.stroke({ color: 0x000000, width: 0.5, alpha: 0.2 });

        const texture = this.app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;

        return sprite;
    }

    getTileAt(x, y) {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        
        if (row >= 0 && row < this.tiles.length && 
            col >= 0 && col < this.tiles[0].length) {
            return this.tiles[row][col];
        }
        return null;
    }

    isSolidAt(x, y) {
        const tile = this.getTileAt(x, y);
        return tile ? tile.solid : true;
    }
}

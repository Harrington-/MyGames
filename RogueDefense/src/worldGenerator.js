// Infinite world generator using chunks and Perlin noise
class WorldGenerator {
    constructor(app, seed = 12345) {
        this.app = app;
        this.seed = seed;
        this.noise = new PerlinNoise(seed);
        
        // Chunk settings
        this.chunkSize = 16; // 16x16 tiles per chunk
        this.chunks = new Map(); // Store generated chunks
        this.chunkContainer = new PIXI.Container();
        
        // Generation parameters
        this.scale = 0.05; // Lower scale = larger features/areas
        this.waterThreshold = -0.35; // Less water
        this.treeThreshold = 0.25;
        this.pathThreshold = 0.08; // Smaller path areas
        
        // Texture cache to avoid regenerating textures
        this.tileTextures = new Map();
        this.createTileTextures();
    }

    createTileTextures() {
        // Pre-generate textures for each tile type
        for (let tileType in TILE_COLORS) {
            const graphics = new PIXI.Graphics();
            const color = TILE_COLORS[tileType];
            
            graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.fill(color);
            
            // Add slight border
            graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.stroke({ color: 0x000000, width: 0.5, alpha: 0.2 });

            const texture = this.app.renderer.generateTexture(graphics);
            this.tileTextures.set(parseInt(tileType), texture);
            
            graphics.destroy();
        }
    }

    getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    worldToChunk(worldX, worldY) {
        return {
            chunkX: Math.floor(worldX / (this.chunkSize * TILE_SIZE)),
            chunkY: Math.floor(worldY / (this.chunkSize * TILE_SIZE))
        };
    }

    generateChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: [],
            container: new PIXI.Container()
        };

        // Generate tiles for this chunk
        for (let localY = 0; localY < this.chunkSize; localY++) {
            chunk.tiles[localY] = [];
            for (let localX = 0; localX < this.chunkSize; localX++) {
                const worldX = chunkX * this.chunkSize + localX;
                const worldY = chunkY * this.chunkSize + localY;
                
                // Generate tile based on noise
                const tileType = this.getTileType(worldX, worldY);
                const tile = this.createTile(tileType, localX, localY, chunkX, chunkY);
                
                chunk.tiles[localY][localX] = {
                    sprite: tile,
                    type: tileType,
                    solid: isSolid(tileType)
                };
                
                chunk.container.addChild(tile);
            }
        }

        this.chunks.set(key, chunk);
        this.chunkContainer.addChild(chunk.container);
        
        return chunk;
    }

    getTileType(worldX, worldY) {
        // Get multiple octaves of noise for variety and smoothness
        const noise1 = this.noise.noise(worldX * this.scale, worldY * this.scale);
        const noise2 = this.noise.noise(worldX * this.scale * 2.5, worldY * this.scale * 2.5) * 0.3;
        const noise3 = this.noise.noise(worldX * this.scale * 0.5, worldY * this.scale * 0.5) * 0.15;
        
        const value = noise1 + noise2 + noise3;

        // Determine tile type based on noise value with smoother transitions
        if (value < this.waterThreshold) {
            return TILES.WATER;
        } else if (value > this.treeThreshold) {
            // More varied tree placement
            const treeNoise = this.noise.noise(worldX * 0.2, worldY * 0.2);
            return treeNoise > 0 ? TILES.TREE : TILES.GRASS;
        } else if (Math.abs(value - 0.05) < this.pathThreshold) {
            // Paths follow contour lines for more natural look
            return TILES.PATH;
        } else {
            return TILES.GRASS;
        }
    }

    createTile(tileType, localX, localY, chunkX, chunkY) {
        // Use cached texture instead of generating new one
        const texture = this.tileTextures.get(tileType);
        const sprite = new PIXI.Sprite(texture);
        
        // Position in world coordinates
        sprite.x = (chunkX * this.chunkSize + localX) * TILE_SIZE;
        sprite.y = (chunkY * this.chunkSize + localY) * TILE_SIZE;

        return sprite;
    }

    loadChunksAroundPosition(centerX, centerY, radius = 2) {
        const centerChunk = this.worldToChunk(centerX, centerY);
        
        const loadedChunks = [];
        
        // Load chunks in a radius around the center
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const chunkX = centerChunk.chunkX + dx;
                const chunkY = centerChunk.chunkY + dy;
                const chunk = this.generateChunk(chunkX, chunkY);
                loadedChunks.push(chunk);
            }
        }

        // Unload distant chunks
        this.unloadDistantChunks(centerChunk.chunkX, centerChunk.chunkY, radius + 1);
        
        return loadedChunks;
    }

    unloadDistantChunks(centerChunkX, centerChunkY, maxDistance) {
        const toRemove = [];
        
        for (let [key, chunk] of this.chunks) {
            const dx = Math.abs(chunk.x - centerChunkX);
            const dy = Math.abs(chunk.y - centerChunkY);
            
            if (dx > maxDistance || dy > maxDistance) {
                this.chunkContainer.removeChild(chunk.container);
                // Destroy container and sprites (but not the shared textures)
                chunk.container.destroy({ children: true, texture: false, baseTexture: false });
                toRemove.push(key);
            }
        }
        
        toRemove.forEach(key => this.chunks.delete(key));
    }

    getTileAt(x, y) {
        const chunk = this.worldToChunk(x, y);
        const key = this.getChunkKey(chunk.chunkX, chunk.chunkY);
        
        if (!this.chunks.has(key)) {
            return null; // Chunk not loaded
        }
        
        const chunkData = this.chunks.get(key);
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const localX = ((tileX % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((tileY % this.chunkSize) + this.chunkSize) % this.chunkSize;
        
        if (localY >= 0 && localY < chunkData.tiles.length &&
            localX >= 0 && localX < chunkData.tiles[0].length) {
            return chunkData.tiles[localY][localX];
        }
        
        return null;
    }

    isSolidAt(x, y) {
        const tile = this.getTileAt(x, y);
        const result = tile ? tile.solid : false; // Changed from true to false
        return result;
    }

    getContainer() {
        return this.chunkContainer;
    }
}

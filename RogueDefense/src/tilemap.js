// Tile types
const TILES = {
    GRASS: 0,
    WALL: 1,
    WATER: 2,
    PATH: 3,
    TREE: 4
};

// Default level - 20x15 tiles (each tile is 32x32 pixels)
const defaultLevel = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 4, 4, 0, 0, 3, 3, 3, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 1],
    [1, 0, 4, 4, 0, 0, 3, 0, 3, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 0, 3, 3, 3, 3, 0, 0, 2, 2, 2, 2, 0, 1],
    [1, 0, 1, 1, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 2, 2, 2, 2, 0, 1],
    [1, 0, 1, 1, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
    [1, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const TILE_SIZE = 32;

// Tile colors for rendering
const TILE_COLORS = {
    [TILES.GRASS]: 0x6B9F4A,     // Richer grass green
    [TILES.WALL]: 0x8b7355,
    [TILES.WATER]: 0x3A7CA5,     // Deeper blue
    [TILES.PATH]: 0xB89968,      // Sandy/dirt path
    [TILES.TREE]: 0x2D5A1E       // Darker forest green
};

// Collision map - which tiles block player movement
const isSolid = (tileType) => {
    return tileType === TILES.WALL || tileType === TILES.WATER || tileType === TILES.TREE;
};

// Collision map for projectiles - which tiles block projectiles
const blocksProjectiles = (tileType) => {
    return tileType === TILES.WALL || tileType === TILES.TREE;
};

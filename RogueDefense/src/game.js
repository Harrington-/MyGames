// Main game initialization
(async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 1280,
        height: 720,
        backgroundColor: 0x2c3e50,
        antialias: true
    });

    // Add canvas to game container
    document.getElementById('game-container').appendChild(app.canvas);

    // World seed (change this number to generate a different world)
    const WORLD_SEED = Math.floor(Math.random() * 100000);

    // Create world generator (infinite procedural world)
    const worldGenerator = new WorldGenerator(app, WORLD_SEED);
    
    // Create camera
    const camera = new Camera(app, { x: 0, y: 0 });
    const worldContainer = camera.getWorldContainer();
    app.stage.addChild(worldContainer);

    // Add world to camera container
    worldContainer.addChild(worldGenerator.getContainer());

    // Create player
    const player = new Player(app, worldGenerator);
    player.setCamera(camera);
    camera.target = player; // Set camera to follow player
    worldContainer.addChild(player.getSprite());

    // Container for fireballs (separate from world chunks so they don't get unloaded)
    const fireballContainer = new PIXI.Container();
    worldContainer.addChild(fireballContainer);

    // Container for enemies
    const enemyContainer = new PIXI.Container();
    worldContainer.addChild(enemyContainer);

    // Container for health bars (above enemies)
    const healthBarContainer = new PIXI.Container();
    worldContainer.addChild(healthBarContainer);

    // Create pathfinder (tile size is 32)
    const pathfinder = new Pathfinder(worldGenerator, 32);

    // Enemy management
    const enemies = [];
    let enemySpawnTimer = 0;
    let killCount = 0;
    let gameTime = 0; // Track time in frames
    const BASE_ENEMY_SPAWN_INTERVAL = 800; // Base spawn rate (3 seconds at 60fps)
    const BASE_MAX_ENEMIES = 10;
    
    // Dynamic difficulty scaling
    function getSpawnInterval() {
        // Time-based difficulty: reduce spawn interval by 1 frame every 10 seconds (600 frames)
        const timeDifficulty = Math.floor(gameTime / 180);
        // Decrease spawn time by 5 frames per kill, minimum 30 frames (0.5 seconds)
        return Math.max(30, BASE_ENEMY_SPAWN_INTERVAL - killCount * 2 - timeDifficulty);
    }
    
    function getMaxEnemies() {
        // Add 1 enemy to max every 5 kills
        return BASE_MAX_ENEMIES + Math.floor(killCount / 5);
    }

    function spawnEnemy() {
        if(enemies.length >= getMaxEnemies()) return;

        // Spawn enemy at random position around player (off-screen)
        let enemyX, enemyY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = 400 + Math.random() * 200; // 400-600 pixels away
            enemyX = player.x + Math.cos(angle) * distance;
            enemyY = player.y + Math.sin(angle) * distance;
            attempts++;
        } while (worldGenerator.isSolidAt(enemyX, enemyY) && attempts < maxAttempts);
        
        // Only spawn if we found a valid position
        if (attempts < maxAttempts) {
            const enemy = new Enemy(app, enemyX, enemyY, player, pathfinder);
            enemies.push(enemy);
            enemyContainer.addChild(enemy.getSprite());
            healthBarContainer.addChild(enemy.getHealthBar());
        }
    }

    // Load initial chunks around player
    worldGenerator.loadChunksAroundPosition(player.x, player.y, 2);

    // Add instructions text (in screen space, not world space)
    const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 'white',
        stroke: {
            color: '#000000',
            width: 3
        }
    });

    const text = new PIXI.Text({
        text: 'WASD/Arrows: Move | Left Click: Shoot | Kills: 0 | Seed: ' + WORLD_SEED,
        style: style
    });
    text.x = 10;
    text.y = 10;
    app.stage.addChild(text); // Add to stage, not worldContainer

    // Chunk update counter
    let frameCounter = 0;
    const CHUNK_UPDATE_INTERVAL = 30; // Only update chunks every 30 frames
    let lastChunkUpdate = { x: 0, y: 0 };

    // Game loop
    app.ticker.add((ticker) => {
        gameTime++; // Increment game time each frame
        
        player.update(ticker.deltaTime);
        player.updateFireballs(enemies);

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const stillActive = enemies[i].update(ticker.deltaTime, worldGenerator);
            if (!stillActive) {
                enemies[i].destroy();
                enemies.splice(i, 1);
                killCount++;
                // Update kill counter text
                text.text = 'WASD/Arrows: Move | Left Click: Shoot | Kills: ' + killCount + ' | Seed: ' + WORLD_SEED;
            }
        }

        // Spawn enemies
        enemySpawnTimer++;
        if (enemySpawnTimer >= getSpawnInterval()) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        // Update camera to follow player
        camera.update();

        // Load/unload chunks periodically (not every frame)
        frameCounter++;
        if (frameCounter >= CHUNK_UPDATE_INTERVAL) {
            const chunkPos = worldGenerator.worldToChunk(player.x, player.y);
            // Only update if player moved to a different chunk
            if (chunkPos.chunkX !== lastChunkUpdate.x || chunkPos.chunkY !== lastChunkUpdate.y) {
                worldGenerator.loadChunksAroundPosition(player.x, player.y, 2);
                lastChunkUpdate = { x: chunkPos.chunkX, y: chunkPos.chunkY };
                console.log('Chunks loaded:', worldGenerator.chunks.size, 'Player chunk:', chunkPos.chunkX, chunkPos.chunkY);
            }
            frameCounter = 0;
        }

        // Add new fireballs to stage
        const fireballs = player.getFireballs();
        for (let fireball of fireballs) {
            if (fireball.getSprite().parent === null) {
                fireballContainer.addChild(fireball.getSprite());
            }
        }
    });
})();

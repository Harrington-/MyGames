// Define logical game dimensions (16:9 aspect ratio)
const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;
const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;

// Physics constants
const GRAVITY = 0.6;
const FRICTION = 0.98;
const ACCELERATION = 0.8;
const MAX_VELOCITY_X = 12;
const JUMP_STRENGTH = 16;
const BALL_RADIUS = 20;

// Gravity direction for debugging (1 = down, -1 = up)
let gravityDirection = 1;

// Initialize PIXI Application with fixed logical size
const app = new PIXI.Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x2a3439,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
});

// Edge colors
const EDGE_COLOR = 0x181c1f; // darker gunmetal gray

document.getElementById('gameContainer').appendChild(app.view);

// Function to resize canvas to fit window while maintaining aspect ratio
function resizeCanvas() {
    const gameContainer = document.getElementById('gameContainer');
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    let displayWidth = containerWidth;
    let displayHeight = containerHeight;
    
    // Calculate dimensions to fit within container while maintaining aspect ratio
    const windowAspectRatio = containerWidth / containerHeight;
    
    if (windowAspectRatio > ASPECT_RATIO) {
        // Container is wider, fit to height
        displayHeight = containerHeight;
        displayWidth = displayHeight * ASPECT_RATIO;
    } else {
        // Container is taller, fit to width
        displayWidth = containerWidth;
        displayHeight = displayWidth / ASPECT_RATIO;
    }
    
    // Apply scaling to the canvas
    app.view.style.width = displayWidth + 'px';
    app.view.style.height = displayHeight + 'px';
}

// Initial resize
resizeCanvas();

// Make canvas responsive to window resizing
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Always save state when page unloads (for refresh persistence)
window.addEventListener('beforeunload', (e) => {
    // Don't save if this is a manual reset
    if (sessionStorage.getItem('journeyBallReset') === 'true') {
        return;
    }
    
    // Save current state to sessionStorage
    const state = {
        x: ball.x,
        y: ball.y,
        velocityX: ball.velocityX,
        velocityY: ball.velocityY,
        seed: levelSeed
    };
    sessionStorage.setItem('journeyBallState', JSON.stringify(state));
});

// Ball physics properties will be stored on the Ball instance

// Score tracking - restore from sessionStorage if available
let bestHeight = parseInt(sessionStorage.getItem('journeyBallBestHeight')) || 0;

// UI manager (handles score display)
const ui = new UIManager();
ui.updateBestHeight(bestHeight);

// Camera (use Camera class from src/camera.js)
const camera = new Camera(GAME_HEIGHT);

// Create a world container that will hold everything (for camera control)
const world = new PIXI.Container();
app.stage.addChild(world);

// Create Ball instance (Ball class in src/ball.js)
const ball = new Ball(BALL_RADIUS, GAME_WIDTH/2, 1000);
world.addChild(ball.container);

// Set initial position (or restore from sessionStorage if falling)
let levelSeed;
let wasRestored = false;

// Check if this is a manual reset
const isReset = sessionStorage.getItem('journeyBallReset') === 'true';
if (isReset) {
    sessionStorage.removeItem('journeyBallReset');
    sessionStorage.removeItem('journeyBallState');
}

const savedBallState = !isReset ? sessionStorage.getItem('journeyBallState') : null;
if (savedBallState) {
    const state = JSON.parse(savedBallState);
    ball.x = state.x;
    ball.y = state.y;
    ball.velocityX = state.velocityX;
    ball.velocityY = state.velocityY;
    levelSeed = state.seed;
    wasRestored = true;
    // Don't clear sessionStorage here - let 'R' key handle that
} else {
    ball.x = GAME_WIDTH / 2;
    ball.y = 1000;
    levelSeed = Math.floor(Math.random() * 1000000);
}

// Ball already added to world above

// Show "Still Falling" message if state was restored and ball isn't grounded
if (wasRestored && (ball.velocityY !== 0)) {
    const message = new PIXI.Text('NOPE! Still Falling! HA!', {
        fontFamily: 'Arial',
        fontSize: 72,
        fontWeight: 'bold',
        fill: 0xff0000,
        stroke: 0xffffff,
        strokeThickness: 6,
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 8,
        dropShadowDistance: 4
    });
    message.anchor.set(0.5);
    message.x = GAME_WIDTH / 2;
    message.y = GAME_HEIGHT / 2;
    app.stage.addChild(message); // Add to stage, not world (so it doesn't move with camera)
    
    // Fade out and remove after 2 seconds
    setTimeout(() => {
        const fadeOut = setInterval(() => {
            message.alpha -= 0.05;
            if (message.alpha <= 0) {
                clearInterval(fadeOut);
                app.stage.removeChild(message);
            }
        }, 30);
    }, 2000);
}

// Platform manager (handles platforms and walls)
const platformManager = new PlatformManager(world, EDGE_COLOR, BALL_RADIUS, GAME_WIDTH, GAME_HEIGHT);
platformManager.addWallsAndCeiling();

// CSV Level Format (line-based):
// x1,y1,x2,y2,thickness,type
// type: "platform" or "edge" or "slope"
// Example CSV for level 1:
// 0,1030,1920,1030,50,edge
// 810,900,1110,900,20,platform
// 250,750,550,750,20,platform

// Level loading delegated to PlatformManager

// Seeded random number generator (mulberry32)
// Level generation (uses seededRandom from src/utils.js)

// Generate default level with seeded random slopes
function generateRandomSlope(rng, maxSlope) {
    const randomFactor = (rng() * 2 - 1);
    return Math.round(randomFactor * maxSlope);
}

function generateDefaultLevel(seed) {
    const rngLocal = seededRandom(seed);
    let level = `# Level 1 - Random slopes with increasing intensity\n# Bottom floor\n0,1125,1920,1125,50,edge\n# Platforms (x1,y1,x2,y2,thickness,type)\n`;
    const centerX1 = 810, centerX2 = 1110, leftX1 = 250, leftX2 = 550, rightX1 = 1370, rightX2 = 1670;
    let currentY = 950, yStep = 75, baseSlope = 6, maxSlopeCap = 50;
    const totalCount = Math.floor(100000 / yStep);
    const curveMidpoint = Math.floor(totalCount * 0.4);
    const transitionSpan = Math.max(1, Math.floor(totalCount * 0.25));
    const curveSteepness = 1 / transitionSpan;
    for (let i = 0; i < 100000/yStep && currentY < 100000; i++) {
        const logistic = 1 / (1 + Math.exp(-curveSteepness * (i - curveMidpoint)));
        const currentMaxSlope = Math.min(baseSlope + logistic * (maxSlopeCap - baseSlope), maxSlopeCap);
        const side = i % 3;
        if (side === 0) {
            level += `${centerX1},${currentY},${centerX2},${currentY},20,platform\n`;
        } else if (side === 1) {
            const leftSlope = generateRandomSlope(rngLocal, currentMaxSlope);
            const leftY1 = currentY + leftSlope;
            const leftY2 = currentY - leftSlope;
            level += `${leftX1},${leftY1},${leftX2},${leftY2},20,platform\n`;
        } else {
            const rightSlope = generateRandomSlope(rngLocal, currentMaxSlope);
            const rightY1 = currentY - rightSlope;
            const rightY2 = currentY + rightSlope;
            level += `${rightX1},${rightY1},${rightX2},${rightY2},20,platform\n`;
        }

        currentY -= yStep;
    }
    return level;
}

// Create default level and load into platformManager
const defaultLevel = generateDefaultLevel(levelSeed);
platformManager.loadLevelFromCSV(defaultLevel);

// Key state
const keys = {
    a: false,
    d: false,
    space: false
};

// Track if space was previously pressed to prevent multiple jumps
let spacePreviouslyPressed = false;

// Key press handlers
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') {
        keys.a = true;
    } else if (key === 'd') {
        keys.d = true;
    } else if (key === ' ') {
        e.preventDefault();
        keys.space = true;
    } else if (key === 'u') {
        // Secret hotkey to reverse gravity
        gravityDirection *= -1;
    } else if (key === 'r') {
        // Reset game (only if grounded)
        if (ball.isGrounded) {
            sessionStorage.setItem('journeyBallReset', 'true');
            sessionStorage.removeItem('journeyBallState');
            location.reload();
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') {
        keys.a = false;
    } else if (key === 'd') {
        keys.d = false;
    } else if (key === ' ') {
        e.preventDefault();
        keys.space = false;
        spacePreviouslyPressed = false;
    }
});

// Game loop
app.ticker.add((delta) => {
    // Delta represents the time elapsed relative to the target framerate
    // At 60 FPS, delta = 1.0; at 30 FPS, delta = 2.0
    const deltaTime = delta;
    
    // Apply gravity
    ball.velocityY += GRAVITY * gravityDirection * deltaTime;
    ball.velocityY = clamp(ball.velocityY, -30, 30);

    // Apply friction and momentum to horizontal movement (only when grounded)
    if (ball.isGrounded) {
        if (keys.a) {
            ball.velocityX = Math.max((ball.velocityX * (FRICTION + ((1 - FRICTION)/2))) - (ACCELERATION * deltaTime), -MAX_VELOCITY_X);
        } else if (keys.d) {
            ball.velocityX = Math.min((ball.velocityX * (FRICTION + ((1 - FRICTION)/2))) + (ACCELERATION * deltaTime), MAX_VELOCITY_X);
        } else {
            // Apply friction when no keys pressed (friction is exponential, so we need to adjust differently)
            ball.velocityX *= Math.pow(FRICTION, deltaTime);
        }
    }

    // Update position with sub-stepping to prevent tunneling through objects
    const substeps = Math.max(1, Math.ceil(Math.max(Math.abs(ball.velocityX), Math.abs(ball.velocityY)) / 10));
    const stepVelX = ball.velocityX / substeps * deltaTime;
    const stepVelY = ball.velocityY / substeps * deltaTime;

    ball.isGrounded = false;

    for (let i = 0; i < substeps; i++) {
        ball.x += stepVelX;
        ball.y += stepVelY;

        // Check collision with all platforms
        for (let platform of platformManager.platforms) {
            const result = platformManager.resolveCircleLineCollision(ball, platform.x1, platform.y1, platform.x2, platform.y2, platform.thickness);
            if (result) {
                // Apply impulse if moving into the surface
                const relVel = ball.velocityX * result.nx + ball.velocityY * result.ny;
                if (relVel < 0) {
                    const currentRestitution = keys.space ? 0.95 : 0;
                    const impulse = (1 + currentRestitution) * relVel;
                    ball.velocityX -= impulse * result.nx;
                    ball.velocityY -= impulse * result.ny;
                }
                if (result.ny < -0.5) {
                    ball.isGrounded = true;
                }
            }
        }
    }

    // Rotate the ball to simulate rolling
    // The angle increment is proportional to the distance traveled divided by the radius
    ball.container.rotation += ball.velocityX / BALL_RADIUS * deltaTime;

    // Simple camera: keep ball centered vertically in screen
    camera.follow(ball.y);
    world.y = -camera.y;

    // Update score display
    const currentHeight = Math.max(0, Math.round(GAME_HEIGHT - ball.y));
    ui.updateCurrentHeight(currentHeight);

    // Update best height
    if (currentHeight > bestHeight) {
        bestHeight = currentHeight;
        ui.updateBestHeight(bestHeight);
        sessionStorage.setItem('journeyBallBestHeight', bestHeight.toString());
    }

    // Handle jumping (after collision checks so isGrounded is accurate)
    if (keys.space && ball.isGrounded && !spacePreviouslyPressed) {
        ball.velocityY = -JUMP_STRENGTH;
        ball.isGrounded = false;
        spacePreviouslyPressed = true;
    }
});
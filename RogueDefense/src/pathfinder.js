// A* Pathfinding algorithm
class Pathfinder {
    constructor(worldGenerator, tileSize) {
        this.worldGenerator = worldGenerator;
        this.tileSize = tileSize;
    }

    // Convert world coordinates to grid coordinates
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.tileSize),
            y: Math.floor(y / this.tileSize)
        };
    }

    // Convert grid coordinates to world coordinates
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2
        };
    }

    // Heuristic: Euclidean distance for better diagonal paths
    heuristic(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get neighbors of a grid position
    getNeighbors(gridX, gridY) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 1, y: -1 }, // up-right
            { x: 1, y: 1 },  // down-right
            { x: -1, y: 1 }, // down-left
            { x: -1, y: -1 } // up-left
        ];

        for (let dir of directions) {
            const newX = gridX + dir.x;
            const newY = gridY + dir.y;
            
            // Check if tile is walkable
            const worldPos = this.gridToWorld(newX, newY);
            if (!this.worldGenerator.isSolidAt(worldPos.x, worldPos.y)) {
                // For diagonal moves, check if both adjacent tiles are walkable (no corner cutting)
                if (dir.x !== 0 && dir.y !== 0) {
                    const checkX = this.gridToWorld(gridX + dir.x, gridY);
                    const checkY = this.gridToWorld(gridX, gridY + dir.y);
                    if (!this.worldGenerator.isSolidAt(checkX.x, checkX.y) && 
                        !this.worldGenerator.isSolidAt(checkY.x, checkY.y)) {
                        neighbors.push({ x: newX, y: newY, cost: 1.414 });
                    }
                } else {
                    neighbors.push({ x: newX, y: newY, cost: 1 });
                }
            }
        }

        return neighbors;
    }

    // Find path from start to goal (returns array of world coordinates)
    findPath(startX, startY, goalX, goalY, maxIterations = 200) {
        const start = this.worldToGrid(startX, startY);
        const goal = this.worldToGrid(goalX, goalY);

        // Early exit if start or goal is invalid
        if (this.worldGenerator.isSolidAt(startX, startY) || 
            this.worldGenerator.isSolidAt(goalX, goalY)) {
            return null;
        }

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const key = (pos) => `${pos.x},${pos.y}`;
        
        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, goal));

        let iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find node with lowest fScore
            let current = openSet[0];
            let currentIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
                    current = openSet[i];
                    currentIdx = i;
                }
            }

            // Goal reached
            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(currentIdx, 1);

            const neighbors = this.getNeighbors(current.x, current.y);
            for (let neighbor of neighbors) {
                const moveCost = neighbor.cost || 1;
                const tentativeGScore = gScore.get(key(current)) + moveCost;
                const neighborKey = key(neighbor);

                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));

                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null; // No path found
    }

    reconstructPath(cameFrom, current) {
        const path = [this.gridToWorld(current.x, current.y)];
        const key = (pos) => `${pos.x},${pos.y}`;

        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            path.unshift(this.gridToWorld(current.x, current.y));
        }

        return path;
    }
}

// Simple Camera
function Camera(gameHeight) {
    this.y = 0;
    this.gameHeight = gameHeight;
}

Camera.prototype.follow = function(targetY) {
    this.y = targetY - this.gameHeight / 2;
};

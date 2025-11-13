// Ball class: visual container and physics properties
function Ball(radius, startX, startY) {
    this.radius = radius;
    this.container = new PIXI.Container();
    this.shape = new PIXI.Graphics();
    this.shape.beginFill(0xff0000);
    this.shape.drawCircle(0, 0, radius);
    this.shape.endFill();
    this.shape.lineStyle(3, 0xffffff);
    this.shape.moveTo(0, 0);
    this.shape.lineTo(0, -radius);
    this.container.addChild(this.shape);
    this.container.x = startX;
    this.container.y = startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this._isGrounded = false;
}

Ball.prototype.setPosition = function(x, y) {
    this.container.x = x;
    this.container.y = y;
};

Ball.prototype.setVelocity = function(vx, vy) {
    this.velocityX = vx;
    this.velocityY = vy;
};

Ball.prototype.clampVelocityY = function(min, max) {
    this.velocityY = Math.min(Math.max(this.velocityY, min), max);
};

Object.defineProperty(Ball.prototype, 'x', {
    get: function() { return this.container.x; },
    set: function(val) { this.container.x = val; }
});

Object.defineProperty(Ball.prototype, 'y', {
    get: function() { return this.container.y; },
    set: function(val) { this.container.y = val; }
});

Object.defineProperty(Ball.prototype, 'isGrounded', {
    get: function() { return this._isGrounded || false; },
    set: function(val) { this._isGrounded = val; }
});

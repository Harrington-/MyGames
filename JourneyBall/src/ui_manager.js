// UIManager: updates DOM and shows PIXI overlay messages
function UIManager() {
    this.currentHeightDisplay = document.getElementById('currentHeight');
    this.bestHeightDisplay = document.getElementById('bestHeight');
}

UIManager.prototype.updateCurrentHeight = function(height) {
    this.currentHeightDisplay.textContent = Math.max(0, Math.floor(height));
};

UIManager.prototype.updateBestHeight = function(height) {
    this.bestHeightDisplay.textContent = Math.max(0, Math.floor(height));
};

UIManager.prototype.showMessage = function(text, app, gameWidth, gameHeight) {
    const message = new PIXI.Text(text, {
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
    message.x = gameWidth / 2;
    message.y = gameHeight / 2;
    app.stage.addChild(message);
    setTimeout(() => {
        const fadeOut = setInterval(() => {
            message.alpha -= 0.05;
            if (message.alpha <= 0) {
                clearInterval(fadeOut);
                app.stage.removeChild(message);
            }
        }, 30);
    }, 2000);
};

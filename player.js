import { Action } from "./enums.js";
import { Projectile } from "./projectile.js";

class Player {
    /**
     * 
     * @param {HTMLElement} div - the player div.
     * @param {number} speed - the speed of the player.
     * @param {number} width - the width of the player.
     * @param {number} height - the height of the player.
     * @param {string} lastDirection - the last direction the player moved.
     * @param {ProjectileSettings} projectileSettings - the projectile settings.
     */
    constructor(div, speed, width, height, lastDirection, doodleUrl, soundUrl, projectileSettings, mapDiv) {
        this.queuedKeys = {};

        div.style.backgroundSize = `${width}px ${height}px`;
        div.style.backgroundImage = `url(${doodleUrl})`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        this.div = div;
        
        this.speed = speed;
        this.width = width;
        this.height = height;
        this.lastDirection = lastDirection;
        this.soundUrl = soundUrl;
        this.projectileSettings = projectileSettings;
        this.mapDiv = mapDiv;

        this.projectiles = [];
        this.score = 0;
        this.lastFiredAt = 0;

        this.initialX = div.getBoundingClientRect().left;
        this.initialY = div.getBoundingClientRect().top;
        this.initialDirection = lastDirection;
    }

    /**
     * 
     * @returns {Vector} - the velocity of the player.
     */
    getVelocity() {
        let dx = 0;
        let dy = 0;
        if (this.queuedKeys[Action.UP]) dy -= this.speed;
        if (this.queuedKeys[Action.DOWN]) dy += this.speed;
        if (this.queuedKeys[Action.LEFT]) dx -= this.speed;
        if (this.queuedKeys[Action.RIGHT]) dx += this.speed;
        return { x: dx, y: dy };
    }

    /**
     * 
     * @returns {Coordinate} - the predicted position of the player based on inputted keys.
     */
    getPredictedPosition() {
        const velocity = this.getVelocity();
        const rect = this.div.getBoundingClientRect();
        return { left: rect.left + velocity.x, top: rect.top + velocity.y, width: this.width, height: this.height };
    }

    /**
     * @returns {Coordinate} - the current position of the player.
     */
    getPosition() {
        const rect = this.div.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: this.width, height: this.height };
    }

    /**
     * Update the player's position visually.
     * 
     * @param {number} top - the top coordinate to move the player to.
     * @param {number} left - the left coordinate to move the player to.
     */
    setPosition(top, left) {
        this.div.style.top = `${top}px`;
        this.div.style.left = `${left}px`;
    }

    reset() {
        this.div.style.top = `${this.initialY}px`;
        this.div.style.left = `${this.initialX}px`;
        this.lastDirection = this.initialDirection;
        this.lastFiredAt = 0;

        this.projectiles.forEach(projectile => projectile.dispose());
        this.projectiles = [];
    }

    addScore() {
        this.score += 1;
    }

    updateLastDirection(direction) {
        this.lastDirection = direction;
    }

    handleNewProjectile() {
        let now = Date.now();
        if (this.projectiles.length >= this.projectileSettings.concurrentLimit || now - this.lastFiredAt < this.projectileSettings.coolDownMs)
            return null;

        this.lastFiredAt = now;
        if (this.queuedKeys[Action.FIRE]) {
            return new Projectile(
                this.div.getBoundingClientRect().top + this.height / 2,
                this.div.getBoundingClientRect().left + this.width / 2,
                this.projectileSettings.width,
                this.projectileSettings.height,
                this.projectileSettings.speed,
                this.lastDirection,
                this.soundUrl,
                this.mapDiv
            );
        }
        return null;
    }

    /**
     * @param {Projectile} projectile 
     */
    renderProjectile(projectile) {
        projectile.render();
        this.projectiles.push(projectile);
    }
}

export { Player };
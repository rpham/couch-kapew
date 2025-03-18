import { Action } from "./enums.js";

class Projectile {
    constructor(top, left, width, height, speed, direction, soundUrl, mapDiv) {
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = direction;
        this.audio = new Audio(soundUrl);
        this.mapDiv = mapDiv;

        const div = document.createElement("div");
        div.className = "projectile";
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.position = 'absolute';
        div.style.backgroundColor = 'green';
        div.style.top = `${top}px`;
        div.style.left = `${left}px`;
        this.div = div;
    }

    render() {
        this.mapDiv.appendChild(this.div);
        this.audio.play();
    }

    dispose() {
        this.audio.pause();
        this.div.remove();
    }

    setPosition(top, left) {
        this.div.style.top = `${top}px`;
        this.div.style.left = `${left}px`;
    }

    getVelocity() {
        let dx = 0;
        let dy = 0;
        if (this.direction === Action.UP) dy -= this.speed;
        else if (this.direction === Action.DOWN) dy += this.speed;
        else if (this.direction === Action.LEFT) dx -= this.speed;
        else if (this.direction === Action.RIGHT) dx += this.speed;
        return { x: dx, y: dy };
    }

    /**
     * Assumes that this is invoked after a single tick of the game loop.
     * 
     * @returns {Coordinate} - the predicted position of the projectile.
     */
    getPredictedPosition() {
        const velocity = this.getVelocity();
        const rect = this.div.getBoundingClientRect();
        return { left: rect.left + velocity.x, top: rect.top + velocity.y, width: this.width, height: this.height };
    }

    /**
     * @returns {Coordinate} - the current position of the projectile.
     */
    getPosition() {
        const rect = this.div.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: this.width, height: this.height };
    }
}

export { Projectile };
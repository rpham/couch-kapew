import { Player } from "./player.js";

const ObjectType = {
    PLAYER: 'player',
    PROJECTILE: 'projectile',
    WALL: 'wall',
    MAP_BOUNDARY: 'map_boundary'
};

/**
 * 
 * @param {Vector} current 
 * @param {Vector} other 
 * @returns {boolean} whether other is smaller than current. If current is null, other is smaller.
 */
function isOtherVectorSmaller(current, other) {
    return current == null || (Math.abs(other.x) < Math.abs(current.x) || Math.abs(other.y) < Math.abs(current.y));
}

class CollisionHandler {
    /**
     * 
     * @param {Player} p1 - player 1.
     * @param {Player} p2 - player 2.
     * @param {Coordinate[]} wallCoordinates - coordinates of the walls.
     */
    // TODO: remove mapDiv dependency - probably need to inject into wallCoordinates
    constructor(p1, p2, mapDiv, wallCoordinates) {
        this.p1 = p1;
        this.p2 = p2;
        this.mapDiv = mapDiv;
        this.wallCoordinates = wallCoordinates;
    }

    updateWallCoordinates(wallCoordinates) {
        this.wallCoordinates = wallCoordinates;
    }

    /**
     * Returns the minimum translation vector (MTV) between pCoord and objCoord.
     * Pre-condition: objCoord is overlapping with pCoord.
     * 
     * @param {Coordinate} pCoord - player coordinates.
     * @param {Coordinate} objCoord - object coordinates.
     * @returns {Vector}
     */
    _getMTV(pCoord, objCoord) {
        let overlapX1 = pCoord.left + pCoord.width - objCoord.left;
        let overlapX2 = objCoord.left + objCoord.width - pCoord.left;
        let overlapY1 = pCoord.top + pCoord.height - objCoord.top;
        let overlapY2 = objCoord.top + objCoord.height - pCoord.top;

        let mtvX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
        let mtvY = overlapY1 < overlapY2 ? -overlapY1 : overlapY2;

        // Return the smaller overlap as the MTV
        return Math.abs(mtvX) < Math.abs(mtvY) ? { x: mtvX, y: 0 } : { x: 0, y: mtvY };
    }

    /**
     * 
     * @param {Coordinate} a 
     * @param {Coordinate} b 
     * @returns {boolean} whether the two coordinates overlap
     */
    _collides(a, b) {
        return a.left < b.left + b.width
            && a.left + a.width > b.left
            && a.top < b.top + b.height
            && a.top + a.height > b.top;
    }

    /**
     * 
     * @param {Coordinate} p1Coord - player 1 predicted coordinates.
     * @param {Coordinate} p2Coord - player 2 predicted coordinates.
     * @returns {Vector[]} - index 0 is for p1, index 1 is for p2. Guaranteed to be length 2.
     */
    _getCollisionVectors(p1Coord, p2Coord, p1Velocity, p2Velocity) {
        let minP1Mtv = null;
        let minP2Mtv = null;

        let m1CollisionType = null;
        let m2CollisionType = null;

        this.wallCoordinates.forEach((wallCoord) => {
            if (this._collides(p1Coord, wallCoord)) {
                const mtv = this._getMTV(p1Coord, wallCoord);
                if (isOtherVectorSmaller(minP1Mtv, mtv)) {
                    minP1Mtv = mtv;
                    m1CollisionType = ObjectType.WALL;
                }
            }
            if (this._collides(p2Coord, wallCoord)) {
                const mtv = this._getMTV(p2Coord, wallCoord);
                if (isOtherVectorSmaller(minP2Mtv, mtv)) {
                    minP2Mtv = mtv;
                    m2CollisionType = ObjectType.WALL;
                }
            }
        });

        if (this._collides(p1Coord, p2Coord)) {
            const mtv = this._getMTV(p1Coord, p2Coord);
            if (isOtherVectorSmaller(minP1Mtv, mtv)) {
                minP1Mtv = mtv;
                m1CollisionType = ObjectType.PLAYER;
            }
            if (isOtherVectorSmaller(minP2Mtv, mtv)) {
                minP2Mtv = { x: -mtv.x, y: -mtv.y };
                m2CollisionType = ObjectType.PLAYER;
            }
        }

        // const p1BoundaryMtv = this._boundaryMtv(p1Coord);
        // if (isOtherVectorSmaller(minP1Mtv, p1BoundaryMtv)) {
        //     minP1Mtv = p1BoundaryMtv;
        //     m1CollisionType = ObjectType.MAP_BOUNDARY;
        // }

        // const p2BoundaryMtv = this._boundaryMtv(p2Coord);
        // if (isOtherVectorSmaller(minP2Mtv, p2BoundaryMtv)) {
        //     minP2Mtv = p2BoundaryMtv;
        //     m2CollisionType = ObjectType.MAP_BOUNDARY;
        // }

        if (m1CollisionType === ObjectType.PLAYER && m2CollisionType === ObjectType.PLAYER) {
            const move1 = p1Velocity.x !== 0 || p1Velocity.y !== 0;
            const move2 = p2Velocity.x !== 0 || p2Velocity.y !== 0;

            // NOTE: players can not push each other while the previous implementation had
            // players stopping eachother. I kind of like this behavior of players pushing each other though.
            if (move1 && move2) {
                minP1Mtv.x /= 2;
                minP1Mtv.y /= 2;
                minP2Mtv.x /= 2;
                minP2Mtv.y /= 2;
            }
            // comment in these else if's to allow players to block each other
            // else if (move1) {
            //     minP2Mtv = null;
            // }
            // else if (move2) {
            //     minP1Mtv = null;
            // }
        }
        return [
            minP1Mtv ?? { x: 0, y: 0 },
            minP2Mtv ?? { x: 0, y: 0 },
        ];
    }

    _collidesWithBoundary(coord) {
        const gameContainer = this.mapDiv;
        const left = coord.left;
        const top = coord.top;
        const right = coord.left + coord.width;
        const bottom = coord.top + coord.height;
        return left < 0 || right > gameContainer.clientWidth || top < 0 || bottom > gameContainer.clientHeight;
    }

    // NOTE: when using this for handling bottom and right collisions, it can get funky
    // probably because the screen dimensions are floats. top and left are 0 so it
    // behaves visually the same as _handleBoundaryCollision
    _boundaryMtv(playerCoord) {
        const gameContainer = this.mapDiv;
        const left = playerCoord.left;
        const top = playerCoord.top;
        const right = playerCoord.left + playerCoord.width;
        const bottom = playerCoord.top + playerCoord.height;

        let mtv = { x: 0, y: 0 };
        if (left < 0) {
            mtv.x = -left;
        } else if (right > gameContainer.clientWidth) {
            mtv.x = gameContainer.clientWidth - right;
        }
        if (top < 0) {
            mtv.y = -top;
        } else if (bottom > gameContainer.clientHeight) {
            mtv.y = gameContainer.clientHeight - bottom;
        }
        return mtv;
    }

    // TODO: remove - temporary placeholder for restructuring
    // this is confusing because this strategy sets the position and kills velocity to prevent
    // further movement while the MTV method simply calculates the end position
    _handleBoundaryCollision(player, velocity) {
        const gameContainer = this.mapDiv;
        const rect = player.div.getBoundingClientRect();
        let left = rect.left + velocity.x;
        let top = rect.top + velocity.y;
        if (left < 0) {
            left = 0;
            velocity.x = 0; // Stop horizontal movement
        }
        if (left + player.width > gameContainer.clientWidth) {
            left = gameContainer.clientWidth - player.width;
            velocity.x = 0;
        }
        if (top < 0) {
            top = 0;
            velocity.y = 0; // Stop vertical movement
        }
        if (top + player.height > gameContainer.clientHeight) {
            top = gameContainer.clientHeight - player.height;
            velocity.y = 0;
        }
        return { left, top, width: player.width, height: player.height };
    }

    movePlayers() {
        const p1 = this.p1;
        const p2 = this.p2;

        const p1Velocity = p1.getVelocity();
        const p2Velocity = p2.getVelocity();

        const p1Coord = this._handleBoundaryCollision(p1, p1Velocity);
        const p2Coord = this._handleBoundaryCollision(p2, p2Velocity);

        const mtvs = this._getCollisionVectors(p1Coord, p2Coord, p1Velocity, p2Velocity);

        p1Coord.left += mtvs[0].x;
        p1Coord.top += mtvs[0].y;
        p2Coord.left += mtvs[1].x;
        p2Coord.top += mtvs[1].y;

        p1.setPosition(p1Coord.top, p1Coord.left);
        p2.setPosition(p2Coord.top, p2Coord.left);

        // TODO: in my initial implementation, i move players and THEN
        // check on projectile collision. i wonder if i should check
        // projectile collision first? maybe it doesn't matter?
        // WELL i suppose the position of the player determines
        // where the projectile should fire, so i need to move the player
        // first. so i'll stick with moving player THEN projectile
    }

    /**
     * Create a new projectile if applicable. Handles collision detection.
     * 
     * @param {Player} player 
     * @param {Player} otherPlayer 
     * @returns whether the new projectile hits the other player
     */
    _handleNewProjectile(player, otherPlayer) {
        let hitOtherPlayer = false;
        const proj = player.handleNewProjectile();
        const otherPlayerPos = otherPlayer.getPosition();

        if (proj) {
            if (this._collides(proj.getPosition(), otherPlayerPos)) {
                hitOtherPlayer = true;
                proj.dispose();
                // TODO: should i remove the projectile from the player's list?
                // it's game over so the reset should handle it later
            }
            else {
                player.renderProjectile(proj);
            }
        }

        return hitOtherPlayer;
    }

    /**
     * Move projectiles for one game tick. Handles collision detection.
     * 
     * @param {Player} player 
     * @param {Player} otherPlayer 
     * @returns whether the projectile hits the other player
     */
    _moveProjectiles(player, otherPlayer) {
        const toDeleteIdx = [];
        const otherPlayerPos = otherPlayer.getPosition();

        // detect collisions
        for (let i = 0; i < player.projectiles.length; i++) {
            const proj = player.projectiles[i];
            const projPredPos = proj.getPredictedPosition();

            // Player collision means game over, short circuit
            if (this._collides(projPredPos, otherPlayerPos)) {
                proj.dispose();
                player.projectiles.splice(i, 1);
                return true;
            }

            let didCollide = false;
            for (let j = 0; j < this.wallCoordinates.length; j++) {
                const wallCoord = this.wallCoordinates[j];
                if (this._collides(projPredPos, wallCoord)) {
                    didCollide = true;
                    break;
                }
            }

            if (!didCollide && this._collidesWithBoundary(projPredPos)) {
                didCollide = true;
            }
            
            if (didCollide) {
                toDeleteIdx.push(i);
            }
        }

        // delete projectils that collided with something
        for (let i = toDeleteIdx.length - 1; i >= 0; i--) {
            const index = toDeleteIdx[i];
            player.projectiles[index].dispose();
            player.projectiles.splice(index, 1);
        }

        // move all remaining projectiles
        player.projectiles.forEach((proj) => {
            const projPredPos = proj.getPredictedPosition();
            proj.setPosition(projPredPos.top, projPredPos.left);
        });

        return false;
    }

    moveProjectiles() {
        // internally handle creating new projectiles if applicable
        // and immediately check collision.
        // then move all the projectiles and check collision again.

        const p1 = this.p1;
        const p2 = this.p2;

        // move projectiles first because on projectile creation, we don't
        // want a game tick to pass first. so render/add them to
        // projectiles AFTER moving all the other existing projectiles
        let p1Loses = this._moveProjectiles(p1, p2);
        let p2Loses = this._moveProjectiles(p2, p1);
        
        p1Loses = p1Loses || this._handleNewProjectile(p1, p2);
        p2Loses = p2Loses || this._handleNewProjectile(p2, p1);

        // this is a very leaky abstraction - into collisionHandler
        // but a generic return of "hits" with the source and target
        // seems annoying to parse
        return [p1Loses, p2Loses];
    }
}

export { CollisionHandler };
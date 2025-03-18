class MapBuilder {
    /**
     * 
     * @param {HTMLElement} mapDiv 
     * @param {number} wallWidth 
     * @param {number} xGap - minimum distance between two walls in the x-direction.
     * @param {number} yGap - minimum distance between two walls in the y-direction.
     * @param {function(number, number)} maxWallsFn - returns the maximum number of walls given the container width and height.
     */
    constructor(mapDiv, wallWidth, xGap, yGap, maxWallsFn) {
        this.mapDiv = mapDiv;

        this.wallWidth = wallWidth;
        this.xGap = xGap;
        this.yGap = yGap;
        this.maxWallsFn = maxWallsFn;
    }

    /**
     * 
     * @returns {Coordinate[]}
     */
    generateCoordinates() {
        const containerWidth = this.mapDiv.clientWidth;
        const containerHeight = this.mapDiv.clientHeight;
        const maxWalls = this.maxWallsFn(containerWidth, containerHeight);
        const xGap = this.xGap;
        const yGap = this.yGap;

        const wallCount = Math.floor(Math.random() * maxWalls) + 1;

        const xPositions = [];
        let lastX = 0;

        for (let i = 0; i < wallCount; i++) {
            const remainder = containerWidth - lastX - xGap;
            const newX = lastX + xGap + Math.floor(Math.random() * remainder);
            // newX - lastX < xGap || 
            if (newX + xGap + this.wallWidth > containerWidth) {
                // console.log('newX too close', newX);
                break;
            }
            // console.log('newX', newX);
            xPositions.push(newX);
            lastX = newX;
        }

        const result = [];
        // for each x position, create a wall but the wall has a random number
        // of gaps that a player can comfortable squeeze through
        for (let i = 0; i < xPositions.length; i++) {
            const xPosition = xPositions[i];

            const maxGaps = Math.floor(containerHeight / yGap);
            const gapCount = Math.floor(Math.random() * maxGaps) + 1;

            const gaps = [];
            let lastY = 0;
            for (let j = 0; j < gapCount; j++) {
                const newY1 = Math.min(containerHeight, lastY + yGap + Math.floor(Math.random() * (containerHeight - lastY - yGap)));
                const newY2 = Math.min(containerHeight, newY1 + yGap + Math.floor(Math.random() * (containerHeight - newY1 - yGap)));
                if (newY2 - newY1 < yGap) {
                    break;
                }
                gaps.push([newY1, newY2]);
                lastY = newY2;
            }

            const yWalls = [];
            let yStart = 0;
            for (let j = 0; j < gaps.length; j++) {
                yWalls.push([yStart, gaps[j][0]]);
                yStart = gaps[j][1];
            }

            if (yStart !== 0) {
                yWalls.push([yStart, containerHeight]);
            }

            yWalls.forEach(([top, bottom]) => {
                result.push({ left: xPosition, top, width: this.wallWidth, height: bottom - top });
            });
        }

        return result;
    }
}

class MapManager {
    /**
     * @param {HTMLDivElement} mapDiv - the div with pre-defined boundaries where walls will be rendered
     */
    constructor(mapDiv) {
        this.mapDiv = mapDiv;
        this.coordinates = [];
    }

    /**
     * Create and render wall divs on the map at the requested coordinates.
     * 
     * Expected usage:
     * Get coordinates from (new MapBuilder(...)).generateCoordinates().
     * On game start, invoke renderMap. On game over, invoke clearMap.
     * 
     * @param {Coordinate[]} coordinates 
     */
    renderMap(coordinates) {
        this.coordinates = coordinates;

        coordinates.forEach(({ left, top, width, height }) => {
            const wallElement = document.createElement('div');
            wallElement.style.position = 'absolute';
            wallElement.style.width = `${width}px`;
            wallElement.style.height = `${height}px`;
            wallElement.style.backgroundColor = 'black';
            wallElement.style.top = `${top}px`;
            wallElement.style.left = `${left}px`;
            wallElement.className = 'wall';
            this.mapDiv.appendChild(wallElement);
        })
    }

    /**
     * Remove all wall divs from the map.
     */
    clearMap() {
        const elements = document.getElementsByClassName("wall");
        while (elements.length > 0) {
            elements[0].remove();
        }

        this.coordinates = [];
    }
}

export { MapBuilder, MapManager }
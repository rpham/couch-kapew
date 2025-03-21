import { KeyCode, Action } from "./enums.js";
import { Player } from "./player.js";
import { CollisionHandler } from "./collisionHandler.js";
import { MapBuilder, MapManager } from "./map.js";
import { getPlayerSoundChunks, resetRecordAudioState } from "./record-audio.js";
import { canvas, clearCanvas } from "./draw-doodle.js";

let player1 = null;
let player2 = null;

/*********************************************************************
 * Screen Management
 */
const SCREENS = {
    DRAW_DOODLE: "draw-doodle",
    RECORD_AUDIO: "record-audio",
    READY: "ready",
    GAME: "game-container",
};

class ScreenManager {
    constructor(currentScreen) {
        this.currentScreen = currentScreen;
    }

    show(screen) {
        document.getElementById(this.currentScreen).classList.remove("active");
        this.currentScreen = screen;
        document.getElementById(screen).classList.add("active");
    }

    hide(screen) {
        document.getElementById(screen).classList.add("hidden");
    }

    unhide(screen) {
        document.getElementById(screen).classList.remove("hidden");
    }
}

const screenManager = new ScreenManager(SCREENS.DRAW_DOODLE);

function buildAudioUrl(chunks) {
    return URL.createObjectURL(new Blob(chunks, { type: 'audio/wav' }));
}

function setHeaderPrefix(playerNumber) {
    document.getElementById("draw-doodle-prefix").textContent = `Player ${playerNumber} - `;
    document.getElementById("record-audio-prefix").textContent = `Player ${playerNumber} - `;
}

function player2DoneDrawingButton() {
    screenManager.show(SCREENS.RECORD_AUDIO);
}

function player1DoneDrawingButton() {
    screenManager.show(SCREENS.RECORD_AUDIO);
}

function player2DoneRecordingButton() {
    screenManager.show(SCREENS.READY);

    const doodleUrl = canvas.toDataURL("image/png");
    const audioChunks = getPlayerSoundChunks();
    const audioUrl = buildAudioUrl(audioChunks);

    player2 = {
        doodleUrl: doodleUrl,
        soundUrl: audioUrl,
    }
}

function player1DoneRecordingButton() {
    setHeaderPrefix(2);
    screenManager.show(SCREENS.DRAW_DOODLE);
    resetRecordAudioState();

    const doodleUrl = canvas.toDataURL("image/png");
    const audioChunks = getPlayerSoundChunks();
    const audioUrl = buildAudioUrl(audioChunks);

    player1 = {
        doodleUrl: doodleUrl,
        soundUrl: audioUrl,
    }

    clearCanvas();
    
    document.getElementById("done-drawing-button").removeEventListener("click", player1DoneDrawingButton);
    document.getElementById("done-recording-button").removeEventListener("click", player1DoneRecordingButton);

    document.getElementById("done-drawing-button").addEventListener("click", player2DoneDrawingButton);
    document.getElementById("done-recording-button").addEventListener("click", player2DoneRecordingButton);
}

setHeaderPrefix(1);

document.getElementById("done-drawing-button").addEventListener("click", player1DoneDrawingButton);
document.getElementById("done-recording-button").addEventListener("click", player1DoneRecordingButton);
document.getElementById("ready-button").addEventListener("click", startGame);

/********************************************************************
 * Game
 */

const GameSettings = {
    PLAYER_SPEED: 5,
    PLAYER_WIDTH: 100,
    PLAYER_HEIGHT: 100,
    WALL_WIDTH: 10,
    PROJECTILE_SETTINGS: {
        concurrentLimit: 5,
        coolDownMs: 100,
        height: 10,
        width: 10,
        speed: 7,
    }
};

const Player1KeyToAction = {
    [KeyCode.A]: Action.LEFT,
    [KeyCode.D]: Action.RIGHT,
    [KeyCode.W]: Action.UP,
    [KeyCode.S]: Action.DOWN,
    [KeyCode.SPACE]: Action.FIRE,
}

const Player2KeyToAction = {
    [KeyCode.ARROW_UP]: Action.UP,
    [KeyCode.ARROW_DOWN]: Action.DOWN,
    [KeyCode.ARROW_LEFT]: Action.LEFT,
    [KeyCode.ARROW_RIGHT]: Action.RIGHT,
    [KeyCode.CTRL]: Action.FIRE,
}

const Directions = new Set([Action.UP, Action.DOWN, Action.LEFT, Action.RIGHT]);

class Game {
    constructor(p1, p2) {
        const gameContainer = document.getElementById("game-container");
        const player1 = new Player(
            document.getElementById("player1"),
            GameSettings.PLAYER_SPEED,
            GameSettings.PLAYER_WIDTH,
            GameSettings.PLAYER_HEIGHT,
            Action.RIGHT,
            p1.doodleUrl,
            p1.soundUrl,
            GameSettings.PROJECTILE_SETTINGS,
            gameContainer
        );
        const player2 = new Player(
            document.getElementById("player2"),
            GameSettings.PLAYER_SPEED,
            GameSettings.PLAYER_WIDTH,
            GameSettings.PLAYER_HEIGHT,
            Action.LEFT,
            p2.doodleUrl,
            p2.soundUrl,
            GameSettings.PROJECTILE_SETTINGS,
            gameContainer
        );
        this.player1 = player1;
        this.player2 = player2;

        const xGap = GameSettings.PLAYER_WIDTH + (GameSettings.PLAYER_SPEED * 4);
        const yGap = GameSettings.PLAYER_HEIGHT + (GameSettings.PLAYER_SPEED * 4);
        this.mapBuilder = new MapBuilder(
            gameContainer,
            GameSettings.WALL_WIDTH,
            xGap,
            yGap,
            (containerWidth, containerHeight) => Math.floor(containerWidth / (GameSettings.PLAYER_WIDTH + GameSettings.WALL_WIDTH))
        );
        const wallCoordinates = this.mapBuilder.generateCoordinates();

        this.mapManager = new MapManager(gameContainer);
        this.mapManager.renderMap(wallCoordinates);
        this.collisionHandler = new CollisionHandler(player1, player2, gameContainer, wallCoordinates);
    
        document.addEventListener("keydown", (event) => {
            if (Player1KeyToAction.hasOwnProperty(event.key)) {
                const action = Player1KeyToAction[event.key];
                player1.queuedKeys[action] = true;
                if (Directions.has(action))
                    player1.updateLastDirection(action);
            }
    
            if (Player2KeyToAction.hasOwnProperty(event.key)) {
                const action = Player2KeyToAction[event.key];
                player2.queuedKeys[action] = true;
                if (Directions.has(action))
                    player2.updateLastDirection(action);
            }
        });
    
        document.addEventListener("keyup", (event) => {
            if (Player1KeyToAction.hasOwnProperty(event.key)) {
                const action = Player1KeyToAction[event.key];
                delete player1.queuedKeys[action];
            }
    
            if (Player2KeyToAction.hasOwnProperty(event.key)) {
                const action = Player2KeyToAction[event.key];
                delete player2.queuedKeys[action];
            }
        });
    }

    resetMap() {
        this.mapManager.clearMap();

        const wallCoordinates = this.mapBuilder.generateCoordinates();
        this.mapManager.renderMap(wallCoordinates);
        this.collisionHandler.updateWallCoordinates(wallCoordinates);
    }

    tick() {
        this.collisionHandler.movePlayers();
        const playerWasHit = this.collisionHandler.moveProjectiles(this.player1, this.player2);
        const isGameOver = playerWasHit[0] || playerWasHit[1];

        if (isGameOver) {
            if (playerWasHit[0]) {
                this.player1.addScore();
            } else if (playerWasHit[1]) {
                this.player2.addScore();
            }

            this.resetMap();

            this.player1.reset();
            this.player2.reset();
        }
    }
}

let game = null;

function gameLoop() {
    game.tick();
    self.requestAnimationFrame(gameLoop);
}

function startGame() {
    screenManager.show(SCREENS.GAME);

    game = new Game(player1, player2);
    gameLoop();
}

document.getElementById("ready-button").addEventListener("click", startGame);

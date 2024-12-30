"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.movesCount = 0;
        this.gameBoard = new chess_js_1.Chess();
        this.startTime = new Date();
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "white"
            }
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "black"
            }
        }));
    }
    makeMove(socket, move) {
        if (this.movesCount % 2 === 0 && socket !== this.player1)
            return;
        if (this.movesCount % 2 && socket !== this.player2)
            return;
        try {
            this.gameBoard.move(move);
            console.log(this.gameBoard.ascii());
            this.movesCount++;
        }
        catch (error) {
            console.log(error);
            return;
        }
        if (this.gameBoard.isGameOver()) {
            this.player1.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }));
            this.player2.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }));
            return;
        }
        this.player2.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move
        }));
        this.player1.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move
        }));
    }
}
exports.Game = Game;

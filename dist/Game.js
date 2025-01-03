"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.movesCount = 0;
        this.gameBoard = new chess_js_1.Chess();
        this.startTime = new Date();
        this.gameId = 0;
        this.player1.userWebsocket.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "white",
            }
        }));
        this.player2.userWebsocket.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "black",
            }
        }));
        this.sendUsername();
        this.insertGame();
    }
    sendUsername() {
        this.player1.userWebsocket.send(JSON.stringify({
            type: "opponent",
            payload: {
                opponent: this.player2.userName
            }
        }));
        this.player2.userWebsocket.send(JSON.stringify({
            type: "opponent",
            payload: {
                opponent: this.player1.userName
            }
        }));
    }
    insertGame() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const game = yield prisma.game.create({
                    data: {
                        player1: this.player1.userName,
                        player2: this.player2.userName,
                    },
                });
                this.gameId = game.id;
            }
            catch (error) {
                console.error("Error inserting game into the database:", error);
                return;
            }
        });
    }
    insertMoves(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.gameId) {
                    console.log("game id not set");
                    return;
                }
                yield prisma.gameMove.create({
                    data: {
                        gameId: this.gameId,
                        from,
                        to,
                    },
                });
            }
            catch (error) {
                console.error("Error inserting move into the database:", error);
                return;
            }
        });
    }
    makeMove(socket, move) {
        if (this.movesCount % 2 === 0 && socket !== this.player1.userWebsocket)
            return;
        if (this.movesCount % 2 && socket !== this.player2.userWebsocket)
            return;
        try {
            this.gameBoard.move(move);
            console.log(this.gameBoard.ascii());
            this.insertMoves(move.from, move.to);
            this.movesCount++;
        }
        catch (error) {
            socket.send(JSON.stringify({
                type: "illegal_move",
            }));
            return;
        }
        if (this.gameBoard.isGameOver()) {
            this.player1.userWebsocket.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }));
            this.player2.userWebsocket.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }));
            return;
        }
        this.player2.userWebsocket.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move
        }));
        this.player1.userWebsocket.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move
        }));
    }
    sendMessage(message) {
        console.log(message);
        this.player1.userWebsocket.send(JSON.stringify({
            type: messages_1.MESSAGE,
            payload: message
        }));
        this.player2.userWebsocket.send(JSON.stringify({
            type: messages_1.MESSAGE,
            payload: message
        }));
    }
}
exports.Game = Game;

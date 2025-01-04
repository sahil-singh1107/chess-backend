import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MESSAGE, MOVE } from "./messages";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface User {
    userWebsocket : WebSocket;
    userName: string
}

export class Game {
    public player1: User;
    public player2: User;
    private gameId: number;
    private gameBoard: Chess;
    private startTime: Date;
    private movesCount: number

    constructor(player1: User, player2: User) {
        this.player1 = player1;
        this.player2 = player2;
        this.movesCount = 0;
        this.gameBoard = new Chess();
        this.startTime = new Date();
        this.gameId = 0;
        this.player1.userWebsocket.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white",
            }
        }))
        this.player2.userWebsocket.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black",
            }
        }))
        this.sendUsername();
        this.insertGame();
    }

    private sendUsername () {
        this.player1.userWebsocket.send(JSON.stringify({
            type: "opponent",
            payload: {
                opponent: this.player2.userName
            }
        }))
        this.player2.userWebsocket.send(JSON.stringify({
            type: "opponent",
            payload: {
                opponent: this.player1.userName
            }
        }))
    }

    private async insertGame(): Promise<void> {
        try {
            const game = await prisma.game.create({
                data: {
                    player1: this.player1.userName,
                    player2: this.player2.userName,
                },
            });
            this.gameId = game.id;
        } catch (error) {
            console.error("Error inserting game into the database:", error);
            return;
        }
    }

    private async insertMoves(from: string, to: string): Promise<void> {
        try {
            if (!this.gameId) {
                console.log("game id not set");
                return;
            }
            await prisma.gameMove.create({
                data: {
                    gameId: this.gameId,
                    from,
                    to,
                },
            });
        } catch (error) {
            console.error("Error inserting move into the database:", error);
            return;
        }
    }

    makeMove(socket: WebSocket, move: { from: string, to: string }) {
        if (this.movesCount % 2 === 0 && socket !== this.player1.userWebsocket) return;
        if (this.movesCount % 2 && socket !== this.player2.userWebsocket) return;

        try {
            this.gameBoard.move(move)
            console.log(this.gameBoard.ascii());
            this.insertMoves(move.from, move.to);
            this.movesCount++;
        } catch (error) {
            socket.send(JSON.stringify({
                type: "illegal_move",
            }))
            return;
        }

        if (this.gameBoard.isGameOver()) {
            this.player1.userWebsocket.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }))
            this.player2.userWebsocket.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }))

            return;
        }
        this.player2.userWebsocket.send(JSON.stringify({
            type: MOVE,
            payload: {
                move : move,
                turn : this.gameBoard.turn()
            }
        }))

        this.player1.userWebsocket.send(JSON.stringify({
            type: MOVE,
            payload: {
                move : move,
                turn : this.gameBoard.turn()
            }
        }))

    }

    sendMessage (message : string) {

        console.log(message);

        this.player1.userWebsocket.send(JSON.stringify({
            type : MESSAGE,
            payload : message
        }))

        this.player2.userWebsocket.send(JSON.stringify({
            type : MESSAGE,
            payload : message
        }))

    }
}
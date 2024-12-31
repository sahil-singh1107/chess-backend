import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MESSAGE, MOVE } from "./messages";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from "@prisma/client";
import { runInThisContext } from "vm";
const prisma = new PrismaClient();

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private player1Id: string;
    private player2Id: string;
    private gameId: number;
    private gameBoard: Chess;
    private startTime: Date;
    private movesCount: number

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.player1Id = uuidv4();
        this.player2Id = uuidv4();
        this.movesCount = 0;
        this.gameBoard = new Chess();
        this.startTime = new Date();
        this.gameId = 0;
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white"
            }
        }))
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black"
            }
        }))
        this.insertGame();
    }

    private async insertGame(): Promise<void> {
        try {
            const game = await prisma.game.create({
                data: {
                    player1: this.player1Id,
                    player2: this.player2Id,
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

        if (this.movesCount % 2 === 0 && socket !== this.player1) return;
        if (this.movesCount % 2 && socket !== this.player2) return;

        try {
            this.gameBoard.move(move)
            console.log(this.gameBoard.ascii());
            this.insertMoves(move.from, move.to);
            this.movesCount++;
        } catch (error) {
            console.log(error);
            return;
        }

        if (this.gameBoard.isGameOver()) {
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }))
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.gameBoard.turn() === "w" ? "black" : "white"
                }
            }))

            return;
        }


        this.player2.send(JSON.stringify({
            type: MOVE,
            payload: move
        }))

        this.player1.send(JSON.stringify({
            type: MOVE,
            payload: move
        }))

    }

    sendMessage (message : string) {

        this.player1.send(JSON.stringify({
            type : MESSAGE,
            payload : message
        }))

        this.player2.send(JSON.stringify({
            type : MESSAGE,
            payload : message
        }))

    }

}
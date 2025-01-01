import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MESSAGE, MOVE } from "./messages";

interface User {
    userWebsocket : WebSocket;
    userName: string
}

export class GameManager {
    private games: Game[];
    private pendingUser : User | null;
    private users : User[];

    constructor () {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser (socket : WebSocket, name : string) {
        const user : User = {
            userWebsocket : socket,
            userName : name
        } 
        this.users.push(user);
        this.addHandler(user);
    }

    removerUser (socket : WebSocket) {
        this.users = this.users.filter(user => user.userWebsocket!==socket);
    }

    private addHandler (user : User) {
        user.userWebsocket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === INIT_GAME) {
                if (this.pendingUser) {
                    const game = new Game(this.pendingUser, user);
                    this.games.push(game);
                    
                }
                else {
                    this.pendingUser = user;
                }
            }
            if (message.type === MOVE) {
                const game = this.games.find(game => game.player1.userWebsocket === user.userWebsocket || game.player2.userWebsocket === user.userWebsocket) 
                if (game) {
                    game.makeMove(user.userWebsocket, message.move);
                }
            }
            if (message.type === MESSAGE) {
                const game = this.games.find(game => game.player1.userWebsocket === user.userWebsocket || game.player2.userWebsocket === user.userWebsocket)
                if (game) {
                    game.sendMessage(message.data);
                }
            }
        })
    }
}
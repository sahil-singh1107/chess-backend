"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
const messages_1 = require("./messages");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket, name) {
        const user = {
            userWebsocket: socket,
            userName: name
        };
        this.users.push(user);
        this.addHandler(user);
    }
    removerUser(socket) {
        this.users = this.users.filter(user => user.userWebsocket !== socket);
    }
    addHandler(user) {
        user.userWebsocket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === messages_1.INIT_GAME) {
                if (this.pendingUser) {
                    const game = new Game_1.Game(this.pendingUser, user);
                    this.games.push(game);
                }
                else {
                    this.pendingUser = user;
                }
            }
            if (message.type === messages_1.MOVE) {
                const game = this.games.find(game => game.player1.userWebsocket === user.userWebsocket || game.player2.userWebsocket === user.userWebsocket);
                if (game) {
                    game.makeMove(user.userWebsocket, message.move);
                }
            }
            if (message.type === messages_1.MESSAGE) {
                const game = this.games.find(game => game.player1.userWebsocket === user.userWebsocket || game.player2.userWebsocket === user.userWebsocket);
                if (game) {
                    game.sendMessage(message.data);
                }
            }
        });
    }
}
exports.GameManager = GameManager;

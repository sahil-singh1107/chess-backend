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
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const express = require('express');
const bcrypt = require('bcrypt');
const client_1 = require("@prisma/client");
var LocalStrategy = require('passport-local');
var logger = require('morgan');
var session = require('express-session');
const passport = require("passport");
const prisma = new client_1.PrismaClient();
const wss = new ws_1.WebSocketServer({ port: 8080 });
const app = express();
var SQLiteStore = require('connect-sqlite3')(session);
app.use(express.json());
app.use(session({
    secret: "my-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(function verify(username, password, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const findUser = yield prisma.user.findFirst({
                where: {
                    username: username
                },
                select: {
                    username: true,
                    password: true
                }
            });
            if (!findUser) {
                return cb(null, false, { error: "User doesn't exists" });
            }
            bcrypt.compare(password, findUser.password, function (err, result) {
                if (err)
                    return cb(err);
                if (result) {
                    return cb(null, findUser);
                }
                else {
                    return cb(null, false, { error: "Wrong password" });
                }
            });
        }
        catch (error) {
            cb(error);
        }
    });
}));
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
const gameManager = new GameManager_1.GameManager();
app.post("/signup", function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.user.create({
                    data: {
                        username: req.body.username,
                        password: hash
                    }
                });
            }
            catch (error) {
                return res.send("Something went wrong");
            }
        });
    });
});
app.post("/login", passport.authenticate('local'), (req, res) => {
    res.send(req.user.username);
});
wss.on('connection', function connection(ws) {
    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (data.type === "name") {
            gameManager.addUser(ws, data.payload);
        }
    });
    ws.on("close", () => gameManager.removerUser(ws));
});
app.listen(3000);

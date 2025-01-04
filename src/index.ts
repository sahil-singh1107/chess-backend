import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
const express = require('express')
const bcrypt = require('bcrypt');
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from 'express';
var cors = require('cors')
var LocalStrategy = require('passport-local')
var logger = require('morgan');
var session = require('express-session');

const passport = require("passport");
const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: 8080})
const app = express();
app.use(express.json());
app.use(cors());
app.use(session({
    secret: "my-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(async function verify(username: string, password: string, cb: any) {
    try {
        const findUser = await prisma.user.findFirst({
            where: {
                username: username
            },
            select: {
                username: true,
                password: true
            }
        });

        if (!findUser) { return cb(null, false, { error: "User doesn't exists" }) }

        bcrypt.compare(password, findUser.password, function (err: any, result: any) {
            if (err) return cb(err);
            if (result) {
                return cb(null, findUser);
            }
            else {
                return cb(null, false, { error: "Wrong password" })
            }
        });


    } catch (error) {
        cb(error);
    }
}))

passport.serializeUser(function (user: any, done: any) {
    done(null, user);
});

passport.deserializeUser(function (user: any, done: any) {
    done(null, user);
});

const gameManager = new GameManager();

app.post("/signup", function (req: Request, res: Response) {
    bcrypt.hash(req.body.password, 10, async function (err: any, hash: string) {
        try {
            await prisma.user.create({
                data: {
                    username: req.body.username,
                    password: hash
                }
            })
        } catch (error) {
            return res.send("Something went wrong");
        }
    })
})

app.post("/login", passport.authenticate('local'), (req: any, res: any) => {
    res.send(req.user.username);
})


wss.on('connection', function connection(ws) {
    console.log("socket is alive");
    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (data.type === "name") {
            gameManager.addUser(ws, data.payload)
        }
    })
    ws.on("close", () => gameManager.removerUser(ws));
});

app.listen(3000);
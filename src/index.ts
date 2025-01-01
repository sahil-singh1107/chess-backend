import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { appendFile } from 'fs';
const express = require('express')
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from 'express';
const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: 8080 });
const app = express();

const gameManager = new GameManager();

app.post("/signup", function (req : Request, res : Response, next : NextFunction) {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, "sha256", async function(err : any, hashedPassword : any) {
        if (err) return next(err);
        try {
            await prisma.user.create({
                data: {
                    username: req.body.username,
                    password: req.body.password
                }
            })
        } catch (error) {
            next(error);
        }
        
    })
})

wss.on('connection', function connection(ws) {

    gameManager.addUser(ws);

    ws.on("close", () => gameManager.removerUser(ws))

});
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
var passport = require('passport');
var LocalStrategy = require('passport-local');
const client_1 = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();
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
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUSer((userId, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const findUser = yield prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                username: true,
                password: true
            }
        });
        if (!findUser) {
            return done(new Error("User not found"));
        }
        done(null, findUser);
    }
    catch (error) {
        return done(error);
    }
}));

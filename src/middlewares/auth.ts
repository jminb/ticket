import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to authenticate JWT
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (token == null) {
        return res.status(401).json({ error: "Authentication error" });
    }

    jwt.verify(token, process.env.JWT as string, (err, token) => {
        if (err) {
            return res.status(403).json({ error: "Authentication error" });
        }

        req.body.token = token;
        next();
    });
};
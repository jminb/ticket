import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const exists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (!exists.rows[0]) {
            return res.status(404).json({ error: "User does not exist" });
        }

        const compare = await bcrypt.compare(password, exists.rows[0].password);
        if (!compare) {
            return res.status(400).json({ error: "Invalid password" });
        }

        const token = await jwt.sign({ id: exists.rows[0].id, email: exists.rows[0].email }, process.env.JWT as string, { expiresIn: "1h", });

        res.status(200).json(token);

    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;
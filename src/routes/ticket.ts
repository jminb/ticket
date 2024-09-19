import { Router, Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middlewares/auth";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

// interface Ticket {
//     title: string;
//     description: string;
//     type: 'concert' | 'conference' | 'sports';
//     venue: string;
//     status: 'open' | 'in-progress' | 'closed';
//     price: number;
//     priority: 'low' | 'medium' | 'high';
//     dueDate: string;
//     createdBy: string;
//     assignedUsers?: string[];
// }

router.post("/", authenticate, async (req: Request, res: Response) => {
    const { title, description, type, venue, status, price, priority, dueDate, token } = req.body;

    if (type !== 'concert' && type !== 'conference' && type !== 'sports') {
        return res.status(401).json({ error: "Invalid type" });
    }

    if (status !== 'open' && status !== 'in-progress' && status !== 'closed') {
        return res.status(401).json({ error: "Invalid status" });
    }

    if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
        return res.status(401).json({ error: "Invalid priority" });
    }

    const now = new Date();
    const futuredate = new Date(dueDate);
    if (futuredate <= now) {
        return res.status(409).json({ error: "Due date must be in the future" });
    }

    try {
        const exists = await pool.query("SELECT * FROM users WHERE email = $1 AND id = $2", [token.email, token.id]);
        if (!exists.rows[0]) {
            return res.status(404).json({ error: "User does not exist" });
        }

        const result = await pool.query('INSERT INTO tickets (title, description, type, venue, status, price, priority, dueDate, createdAt, createdBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *', [title, description, type, venue, status, price, priority, dueDate, new Date(), token.id]);

        const ticket = result.rows[0];

        res.status(201).json(ticket);

    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;
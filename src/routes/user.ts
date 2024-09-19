import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import pool from "../db";

const router = Router();

interface User {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'admin';
  password: string
}

router.post("/", async (req: Request, res: Response) => {
  const { name, email, type, password } = req.body;

  if (type !== 'customer' && type !== 'admin') {
    return res.status(409).json({ error: 'Type can be customer or admin only' });
  }

  // Regex to check for special characters
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharRegex.test(password)) {
    return res.status(409).json({ error: 'Password should have atleast 1 special character' });
  }

  // Check if password meets the requirements
  if (password.length < 6) {
    return res.status(409).json({ error: 'Password should be atleast 6 characters' });
  }

  try {
    const exists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (exists.rows[0]) {
      return res.status(409).json({ error: "User already exists" });
    }

    const id = uuidv4();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await pool.query("INSERT INTO users (id, name, email, type, password) VALUES ($1, $2, $3, $4, $5) RETURNING *", [id, name, email, type, hash]);

    res.status(201).json({ id: result.rows[0].id, name: result.rows[0].name, email: result.rows[0].email });

  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    const users: User[] = result.rows;
    res.json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;

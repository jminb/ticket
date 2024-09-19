import { Router, Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middlewares/auth";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

router.post("/:ticketId/assign", authenticate, async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { userID, token } = req.body;

    try {
        // Check if ticket exists
        const ticketResult = await pool.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
        const ticket = ticketResult.rows[0];
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Check if ticket is closed
        if (ticket.status === "closed") {
            return res.status(400).json({ message: "Cannot assign users to a closed ticket" });
        }

        // Check if userId exists in users table
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const tuser = await pool.query("SELECT * FROM users WHERE id = $1", [token.id]);
        const tokenuser = tuser.rows[0];
        if (!tuser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        // Check if current user is allowed to assign (either creator or admin)
        if (ticket.createdby !== userID && tokenuser.type !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if user is an admin
        if (user.type === "admin") {
            return res.status(400).json({ message: "Cannot assign ticket to an admin" });
        }

        // Check if user is already assigned
        const assignedUsers = ticket.assignedusers || [];
        for (const assignedUser of assignedUsers) {
            if (assignedUser.userID === userID) {
                return res.status(400).json({ message: "User already assigned" });
            }
        }

        // Check if max user limit is reached
        if (assignedUsers.length >= 5) {
            return res.status(400).json({ message: "User assignment limit reached" });
        }

        let data = { userID, name: user.name, email: user.email }

        // Assign the user to the ticket (add to array)
        assignedUsers.push(data);
        await pool.query("UPDATE tickets SET assignedUsers = $1 WHERE id = $2", [JSON.stringify(assignedUsers), ticketId]);

        res.status(200).json({ message: "User assigned successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get("/analytics", authenticate, async (req: Request, res: Response) => {
    const { startDate, endDate, status, priority, type, venue } = req.query;
    const { token } = req.body;

    try {
        // Build the base query
        let query = `SELECT * FROM tickets WHERE 1=1`;
        const queryParams: any[] = [];

        // Apply filters based on query parameters
        if (startDate) {
            queryParams.push(startDate);
            query += ` AND createdDate >= $${queryParams.length}`;
        }
        if (endDate) {
            queryParams.push(endDate);
            query += ` AND createdDate <= $${queryParams.length}`;
        }
        if (status) {
            queryParams.push(status);
            query += ` AND status = $${queryParams.length}`;
        }
        if (priority) {
            queryParams.push(priority);
            query += ` AND priority = $${queryParams.length}`;
        }
        if (type) {
            queryParams.push(type);
            query += ` AND type = $${queryParams.length}`;
        }
        if (venue) {
            queryParams.push(venue);
            query += ` AND venue = $${queryParams.length}`;
        }

        // Execute the query to get filtered tickets
        const ticketResult = await pool.query(query, queryParams);
        const tickets = ticketResult.rows;

        // Calculate statistics
        const totalTickets = tickets.length;
        const closedTickets = tickets.filter(ticket => ticket.status === "closed").length;
        const openTickets = tickets.filter(ticket => ticket.status === "open").length;
        const inProgressTickets = tickets.filter(ticket => ticket.status === "in-progress").length;

        // Calculate distribution by priority and type
        const priorityDistribution = {
            low: tickets.filter(ticket => ticket.priority === "low").length,
            medium: tickets.filter(ticket => ticket.priority === "medium").length,
            high: tickets.filter(ticket => ticket.priority === "high").length
        };

        const typeDistribution = {
            concert: tickets.filter(ticket => ticket.type === "concert").length,
            conference: tickets.filter(ticket => ticket.type === "conference").length,
            sports: tickets.filter(ticket => ticket.type === "sports").length
        };

        // Build the response
        const response = {
            totalTickets,
            closedTickets,
            openTickets,
            inProgressTickets,
            priorityDistribution,
            typeDistribution,
            tickets: tickets.map(ticket => ({
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
                priority: ticket.priority,
                type: ticket.type,
                venue: ticket.venue,
                createdDate: ticket.createddate,
                createdBy: ticket.createdby
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json(error);
    }
});


router.get("/:ticketId", authenticate, async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { token } = req.body;

    try {
        // Check if ticket exists
        const ticketResult = await pool.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
        const ticket = ticketResult.rows[0];
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const tuser = await pool.query("SELECT * FROM users WHERE id = $1", [token.id]);
        const tokenuser = tuser.rows[0];
        if (!tokenuser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        res.status(200).json({
            ...ticket,
            statistics: {
                totalAssigned: ticket.assignedusers.length,
                status: ticket.status,
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;

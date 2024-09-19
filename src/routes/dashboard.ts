import { Router, Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middlewares/auth";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

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

export default router
import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/user";
import authRoutes from "./routes/auth";
import ticketRoutes from "./routes/ticket";
import ticketsRoutes from "./routes/tickets";
import dashboardRoutes from "./routes/dashboard";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, }));

app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/ticket", ticketRoutes);
app.use("/tickets", ticketsRoutes);
app.use("/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});

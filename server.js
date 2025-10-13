import express from 'express';
import "dotenv/config";
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dbConnection from './config/dbConnection.js';
import errorHandler from './middleware/errorHandler.js';
import { STATUS_CODES } from './constants.js';

// Connect to the database
dbConnection();

const app = express();

const port = process.env.PORT || 5000;

// Middleware to parse JSON bodies
// This is necessary to handle JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to handle URL encoded data: what is this for?

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// If there is no route found, return 404 handler
app.use((req, res) => {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(`Route ${req.originalUrl} not found`);
});

app.use(errorHandler);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
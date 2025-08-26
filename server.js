import express from 'express';
import "dotenv/config";
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dbConnection from './config/dbConnection.js';

// Connect to the database
dbConnection();
const app = express();

const port = process.env.PORT || 5000;

// Middleware to parse JSON bodies
// This is necessary to handle JSON requests
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
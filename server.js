import express from 'express';
import "dotenv/config";
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dbConnection from './config/dbConnection.js';
import errorHandler from './middleware/errorHandler.js';

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

// After finishing the controllers, i can now create my json web token (JWT) for authentication and authorization
// then i can create the auth middleware to protect the routes

// TO DO: Add pagination, filtering, and sorting // Frontend will handle filtering and sorting, backend will handle pagination
// what do we mean by pagination? It means that we will limit the number of tasks returned in a single request. For example, if we have 100 tasks, we can return only 10 tasks per request. The client can then request the next 10 tasks by providing a page number or an offset.
// I think pagination is notnecessary because the number of tasks is not going to be that many. But it is a good practice to implement it anyway.
// Also, i think the frontend can handle the pagination by storing all the taslks in the state and then displaying them in pages. But for now, we will implement pagination in the backend.

// IF there is no route found, return 404 handler
app.use((req, res) => {
    res.status(404);
    throw new Error(`Route ${req.originalUrl} not found`);
});

app.use(errorHandler); // Custom error handler middleware// should the errohandler in the end or in the beginning? It should be in the end, because it should catch all the errors that are not caught by the other middlewares

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
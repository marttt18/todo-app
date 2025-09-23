// Routes for handling tasks (private - requires authentication)

import express from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    deleteAllTasks, 
    deleteTask 
} from '../controllers/tasksController.js';
import { validateToken } from '../middleware/validateToken.js';

const router = express.Router();

// /api/tasks
router.route('/')
    .get(getTasks)       // Display all tasks
    .post(validateToken, createTask)   // Add a task
    .delete(validateToken, deleteAllTasks); // Delete all tasks

// /api/tasks/:id
router.route('/:id')
    .put(validateToken, updateTask)     // Update a task by id
    .delete(validateToken, deleteTask); // Delete a task by id

    // Added made: added the validateToken middleware to the routes that require authentication

export default router;

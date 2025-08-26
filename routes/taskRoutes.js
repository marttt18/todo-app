// Routes for handling tasks (private - requires authentication)

import express from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    deleteAllTasks, 
    deleteTask 
} from '../controllers/tasksController.js';

const router = express.Router();

// /api/tasks
router.route('/')
    .get(getTasks)       // Display all tasks
    .post(createTask)   // Add a task
    .delete(deleteAllTasks); // Delete all tasks

// /api/tasks/:id
router.route('/:id')
    .put(updateTask)     // Update a task by id
    .delete(deleteTask); // Delete a task by id

export default router;

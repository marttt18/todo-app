import express from 'express';
import { 
    getTasks, 
    createTask,
    getTaskById, 
    updateTask, 
    deleteAllTasks, 
    deleteTask,
    dashboard
} from '../controllers/tasksController.js';
import { validateToken } from '../middleware/validateToken.js';

const router = express.Router();

//@route /api/tasks
//@access private
router.route('/')
    .get(validateToken, getTasks)       // Display all tasks
    .post(validateToken, createTask)   // Add a task
    .delete(validateToken, deleteAllTasks); // Delete all tasks

//@route /api/tasks/:id
//@access private
router.route('/:id')
    .get(validateToken, getTaskById)    // Get a task by id
    .put(validateToken, updateTask)     // Update a task by id
    .delete(validateToken, deleteTask); // Delete a task by id

//@route /api/tasks/dashboard
//@access private
router.route('/dashboard/:type').get(validateToken, dashboard);

export default router;

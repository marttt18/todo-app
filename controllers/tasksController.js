// route: /api/tasks
import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';

//@desc Get all tasks
//@route GET /api/tasks/
const getTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({});

    if (!tasks) {
        //res.status(404);
        //throw new Error('No tasks found'); // no need to throw an error because there might be no task set yet
        res.status(200).json({title: "No Tasks Found"}, []); // return an empty array if no tasks found
    }
    res.status(200).json(tasks); // Will this return an array of tasks? Yes, it will return an array of tasks. array of objects
});

//@desc Create a task
//@route POST /api/tasks/
const createTask = asyncHandler(async (req, res) => {
    res.json({ message: 'Create Task' });
});

//@desc Update a task by id
//@route PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
    res.json({ message: `Update Task ${req.params.id}` });
});

//@desc Delete all tasks
//@route DELETE /api/tasks/
const deleteAllTasks = asyncHandler(async (req, res) => {
    res.json({ message: 'Delete All Tasks' });
});

//@desc Delete task by id
//@route DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
    res.json({ message: 'Delete Task by ID' });
});

export { getTasks, createTask, updateTask, deleteAllTasks, deleteTask };


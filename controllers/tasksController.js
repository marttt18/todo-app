// route: /api/tasks
import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';

// TODO: make it possible to filter tasks by status and deadline
// Example: /api/tasks?status=pending
// Example: /api/tasks?deadline=2023-12-31

// PROBLEM: We need a specific id because this will get all the tasks in the database regardless of the user.
//@desc Get all tasks
//@route GET /api/tasks/
const getTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({}); // the {} is an empty filter object -- this returns an array of tasks

    // why not just if (!tasks)? Because tasks is an array, and an empty array is truthy in JavaScript. So we need to check the length of the array to see if it is empty.
    if (tasks.length === 0) { 
        return res.status(200).json({ 
                message: "No Tasks Found",
                task: []
            });
    }
    // Return the tasks
    res.status(200).json(tasks); 
});

//@desc Create a task
//@route POST /api/tasks/
const createTask = asyncHandler(async (req, res) => {
    const { title, description, deadline } = req.body;
    
    // Validate title
    if (!title || !title.trim()) {
        res.status(400);
        throw new Error('Task title is required');
    }

    // Validate the length of the title
    if (title.trim().length < 3 || title.trim().length > 100) {
        res.status(400);
        throw new Error('Task title must be between 3 and 100 characters');
    }

    // Validate deadline (optional)    
    if (deadline) {
        const parsedDeadline = Date.parse(deadline); // returns NaN if the date is invalid

        if (isNaN(parsedDate)) {
            res.status(400);
            throw new Error('Invalid date format for deadline');
        }
        if (parsedDeadline < new Date()) {
            throw new Error('Deadline must be a future date');
        }
    }

    const task = await Task.create({
        title: title.trim(),
        description: description?description.trim(): "",
        status: "pending", // default value
        deadline: deadline ? new Date(deadline) : null
    });

    if (task) {
        res.status(201).json(task); // return the created task
    } else {
        res.status(400);
        throw new Error('Invalid task data');
    }  
});

//@desc Update a task by id
//@route PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
    // Verify if a task with the given id exists
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Destruture the fields from the request body
    const { title, description, status, deadline } = req.body;

    const updatedFields = {};
    // Check and validate each field before adding it to the updatedFields object
    if (title) updatedFields.title = title.trim();
    if (description) updatedFields.description = description.trim();
    if (status) updatedFields.status = status;
    if (deadline) updatedFields.deadline = new Date(deadline); 

    // Update the task with the new fields
    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id, 
        { $set: updatedFields }, // $set operator to update only the specified fields
        { new: true, runValidators: true }); // return the updated document(because updating a document returns the old document before the update) and run validators
    
    // If the updated document is not returned, then it is a server error
    if (!updatedTask) {
        res.status(500);
        throw new Error('Failed to update the task');
    }

    res.status(200).json({ message: `Update Task ${req.params.id}` });
});

//@desc Delete all tasks
//@route DELETE /api/tasks/
const deleteAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.deleteMany({}); // what does this return? An object with the number of deleted documents. So we can return that number to the user
    // how to delete the task and assign the list of tasks to a variable? You can use the findByIdAndDelete method. But in this case we are deleting all tasks, so we use deleteMany.

    // Idea: remove all tasks that are completed, 
    if (result.deletedCount === 0) { // what does result variable contain? give me an example
        res.status(404).json({ message: 'No tasks to delete' });
    } else {
        res.status(200).json({ message: `Deleted ${result.deletedCount} tasks` });
    }
});

//@desc Delete task by id
//@route DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
    // Validate if a task with the given id exists
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    const taskDeleted = await task.remove(); // remove the task
    if (!taskDeleted) {
        res.status(500);
        throw new Error('Failed to delete the task');
    }

    // can we just write it like this?
    // const task = await Task.findByIdAndDelete(req.params.id);
    // if (!task) {
    //     res.status(404);
    //     throw new Error('Task not found');
    // }

    // Yes, we can. But in this case we want to first check if the task exists before deleting it.
    // But we can just state that the task does not exist if the task is null after the deletion attempt.

    res.json({ message: 'Delete Task by ID' });
});

export { getTasks, createTask, updateTask, deleteAllTasks, deleteTask };


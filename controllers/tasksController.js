// route: /api/tasks
import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';

//@desc Get all tasks
//@route GET /api/tasks/
const getTasks = asyncHandler(async (req, res) => {
    // To implement:
    // 1. filter by type (work, personal)
    // 2. filter by status (pending, in-progress, completed)
    // 3. filter by type and status
    // 4. filter by type and sort by deadline
    // 5. filter by status and sort by deadline
    // 6. filter by type, status, and sort by deadline
    // 7. sort by deadline (ascending, descending)
    // 8. no filter, no sort (get all tasks)

    // what is the frontend pov when a button for sorting by deadline is cliked? what should be the url?

    // Destructure the query parameters
    const { type, status, sort } = req.query;

    // Valid values for filtering and sorting
    const validTypes = ["work", "personal"];
    const validStatus = ["pending", "in-progress", "completed"];
    const validSortOptions = ["deadline", "-deadline", "createdAt", "-createdAt"]

    // Validate query parameters (if provided)
    if (type && !validTypes.includes(type)) {
        res.status(400);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    if (status && !validStatus.includes(status)) {
        res.status(400);
        throw new Error('Invalid status value. Valid values are "pending", "in-progress", or "completed".');
    }

    if (sort && !validSortOptions.includes(sort)) {
        res.status(400);
        throw new Error('Invalid sort value. Valid values are "deadline", "-deadline", "createdAt", or "-createdAt".');
    }

    /* Instead of creating multiple if statements for each combination of filters, 
    we can use a single query object */

    // Always filter by user ID
    const query = { user: req.user.id }; 
    // Add type filter if provided in the query object
    if (type) query.type = type;
    if (status) query.status = status;

    // Determine the sorting criteria
    const sortCriteria = sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : {};
    const sortOption = sort || 'createdAt'; // Default to createdAt if no sort option is provided

    // Fetch tasks from the database based on the constructed query and sort criteria
    const tasks = Task.find(query).sort(sortCriteria);

    // Return the tasks
    res.status(200).json(tasks);
});

//@desc Create a task
//@route POST /api/tasks/
const createTask = asyncHandler(async (req, res) => {
    const { title, description, deadline, type } = req.body;

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
        description: description ? description.trim() : "",
        status: "pending", // default value
        deadline: deadline ? new Date(deadline) : null,
        type: type,
        user: req.user.id // reference id of the user who created the task
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
    const { title, description, status, type, deadline } = req.body;

    const updatedFields = {};
    // Check and validate each field before adding it to the updatedFields object
    if (title) updatedFields.title = title.trim();
    if (description) updatedFields.description = description.trim();
    if (status) updatedFields.status = status;
    if (type) updatedFields.type = type;
    if (deadline) updatedFields.deadline = new Date(deadline);

    // Update the task with the new fields
    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updatedFields }, // $set operator to update only the specified fields
        { new: true, runValidators: true }); // return the updated document(because updating a document returns the old document before the update) and run validators

    /* If there had an issue with the update, return a server error, it will be automatically handled by express-async-handler
        If the updated document is not returned, then it is a server error
    if (!updatedTask) {
        res.status(500);
        throw new Error('Failed to update the task');
    } // this is useless because we already checked if the task exists above -- we can remove this */

    res.status(200).json({ message: `Update Task ${req.params.id}`, updatedTask: updatedTask });
});

//@desc Delete all tasks
//@route DELETE /api/tasks/
const deleteAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.deleteMany({ id: req.user.id }); // what does this return? An object with the number of deleted documents. So we can return that number to the user
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
    /* // Validate if a task with the given id exists
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    //const taskDeleted = await task.remove(); // remove the task -- this is deprecated
    await task.deleteOne();  */

    // can we just write it like this?
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw new Error("Task not found");

    // Yes, we can. But in this case we want to first check if the task exists before deleting it.
    // But we can just state that the task does not exist if the task is null after the deletion attempt.

    res.status(200).json({ deletedTask: task });
});

export { getTasks, createTask, updateTask, deleteAllTasks, deleteTask };


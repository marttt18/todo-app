import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';
import { STATUS_CODES } from '../constants.js';

/**
 * Get all tasks for the authenticated user with optional filters and sorting.
 *
 * @route GET /api/tasks
 * @query {string} [type] - Filter tasks by type. Valid values: "work" | "personal"
 * @query {string} [status] - Filter tasks by status. Valid values: "pending" | "in-progress" | "completed"
 * @query {string} [sort] - Sort tasks by field. 
 *   Use "deadline" or "createdAt" for ascending, and "-deadline" or "-createdAt" for descending.
 *
 * @example
 * // Get only "work" tasks
 * /api/tasks?type=work
 *
 * @example
 * // Get only completed tasks
 * /api/tasks?status=completed
 *
 * @example
 * // Sort all tasks by latest deadline
 * /api/tasks?sort=-deadline
 *
 * @example
 * // Get all completed "work" tasks, sorted by earliest deadline
 * /api/tasks?type=work&status=completed&sort=deadline
 *
 * @returns {Promise<void>}
 */
const getTasks = asyncHandler(async (req, res) => {
    const { type, status, sort } = req.query;

    // Valid values for filtering and sorting
    const validTypes = ["work", "personal"];
    const validStatus = ["pending", "in-progress", "completed"];
    const validSortOptions = ["deadline", "-deadline", "createdAt", "-createdAt"]

    // Validate query parameters (if provided)
    if (type && !validTypes.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    if (status && !validStatus.includes(status)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid status value. Valid values are "pending", "in-progress", or "completed".');
    }

    if (sort && !validSortOptions.includes(sort)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid sort value. Valid values are "deadline", "-deadline", "createdAt", or "-createdAt".');
    }

    // Build a flexible query object instead of chaining multiple if-statements.
    // Remember: each key in the query must match an actual field name in the Task schema.
    const query = { user_id: req.user.userId }; // Always filter by user ID

    // Add optional filters dynamically based on query parameters.
    if (type) query.type = type;
    if (status) query.taskStatus = status;

    // Determine the sorting criteria (map 'deadline' to model field 'taskDeadline')
    const sortFieldMap = { deadline: 'taskDeadline', createdAt: 'createdAt' };
    const normalizedSortKey = sort ? sort.replace('-', '') : undefined;
    const mappedSortKey = normalizedSortKey ? sortFieldMap[normalizedSortKey] : undefined;
    const sortCriteria = mappedSortKey
        ? { [mappedSortKey]: sort.startsWith('-') ? -1 : 1 }
        : { createdAt: 1 };

    // Fetch tasks from the database based on the constructed query and sort criteria
    const tasks = await Task.find(query).sort(sortCriteria).exec();

    res.status(STATUS_CODES.OK).json(tasks);
});

/**
 * Create a new task for the authenticated user.
 *
 * @route POST /api/tasks
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const createTask = asyncHandler(async (req, res) => {
    const { title, description, deadline, type } = req.body;

    // Validate title
    if (!title || !title.trim()) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Task title is required');
    }

    // Validate the length of the title
    if (title.trim().length < 3 || title.trim().length > 100) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Task title must be between 3 and 100 characters');
    }

    // Validate deadline (optional)    
    if (deadline) {
        const parsedDeadline = Date.parse(deadline); // returns NaN if the date is invalid

        if (isNaN(parsedDeadline)) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error('Invalid date format for deadline');
        }
        if (parsedDeadline <= Date.now()) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error('Deadline must be a future date');
        }
    }

    // Valid values for type
    const validTypes = ["work", "personal"];

    // Validate type values before adding in the taskCreatePayload
    if (!type || !validTypes.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    const taskCreatePayload = {
        taskTitle: title.trim(),
        type: type,
        user_id: req.user.userId
    };

    if (description && description.trim()) {
        taskCreatePayload.taskDescription = description.trim();
    }
    if (deadline) {
        taskCreatePayload.taskDeadline = new Date(deadline);
    }

    const task = await Task.create(taskCreatePayload);

    res.status(STATUS_CODES.CREATED).json(task);    
});

/**
 * Get a task by id.
 *
 * @route GET /api/tasks/:id
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error('Task not found');
    }

    // Verify if the logged-in user matches the task owner
    if (task.user_id.toString() !== req.user.userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error('User not authorized to update other users task');
    }

    res.status(STATUS_CODES.OK).json(task);
});

/**
 * Update a task by id. Only the task owner may update.
 *
 * @route PUT /api/tasks/:id
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateTask = asyncHandler(async (req, res) => {
    // Verify if a task with the given id exists
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error('Task not found');
    }

    // Verify if the logged-in user matches the task owner
    if (task.user_id.toString() !== req.user.userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error('User not authorized to update other users task');
    }

    // Destruture the fields from the request body
    const { title, description, status, type, deadline } = req.body;

    const updatedFields = {};
    // Check and validate each field before adding it to the updatedFields object
    if (title) updatedFields.taskTitle = title.trim();
    if (description) updatedFields.taskDescription = description.trim();
    if (status) updatedFields.taskStatus = status;
    if (type) updatedFields.type = type;
    if (deadline) updatedFields.taskDeadline = new Date(deadline);

    // Update the task with the new fields
    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updatedFields }, // $set operator to update only the specified fields
        { new: true, runValidators: true }); // return the updated document(because updating a document returns the old document before the update)

    res.status(STATUS_CODES.OK).json({ message: `Update Task ${req.params.id}`, updatedTask: updatedTask });
});

/**
 * Delete all tasks belonging to the authenticated user.
 *
 * @route DELETE /api/tasks
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.deleteMany({ user_id: req.user.userId }); // what does this return? An object with the number of deleted documents. So we can return that number to the user
    // how to delete the task and assign the list of tasks to a variable? You can use the findByIdAndDelete method. But in this case we are deleting all tasks, so we use deleteMany.

    // Idea: remove all tasks that are completed, 
    if (result.deletedCount === 0) { 
        return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'No tasks to delete' });
    }

    res.status(STATUS_CODES.OK).json({ message: `Deleted ${result.deletedCount} tasks` });
});

/**
 * Delete a task by id. Only the task owner may delete.
 *
 * @route DELETE /api/tasks/:id
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error("Task not found");
    }

    // Verify if the logged-in user matches the task owner
    if (task.user_id.toString() !== req.user.userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error('User not authorized to update other users task');
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(STATUS_CODES.OK).json({ deletedTask: task });
});

export { getTasks, createTask, getTaskById, updateTask, deleteAllTasks, deleteTask };


import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';
import { STATUS_CODES } from '../constants.js';

/**
 * @desc Retrieve all tasks for the authenticated user, with optional filtering and sorting.
 * 
 * By default, this endpoint returns only *active tasks* — that is, tasks whose status is not "completed".
 * You can include completed tasks by specifying the `status=completed` query parameter.
 * 
 * @route GET /api/tasks
 * 
 * @query {string} [type] - Filter tasks by type.
 *   Valid values: "work" | "personal"
 * 
 * @query {string} [status] - Filter tasks by status.
 *   Valid values: "pending" | "in-progress" | "completed"
 *   If omitted, completed tasks are excluded from the results.
 * 
 * @query {string} [sort] - Sort tasks by a field.
 *   Valid values:
 *     • "deadline" — Sort by deadline (earliest first)
 *     • "-deadline" — Sort by deadline (latest first)
 *     • "createdAt" — Sort by creation date (oldest first)
 *     • "-createdAt" — Sort by creation date (newest first)
 *   Default: ascending by "createdAt"
 * 
 * @example
 * // Get all active "work" tasks (default: excludes completed)
 * /api/tasks?type=work
 *
 * @example
 * // Get all completed tasks only
 * /api/tasks?status=completed
 *
 * @example
 * // Get all tasks sorted by latest deadline
 * /api/tasks?sort=-deadline
 *
 * @example
 * // Get all completed "work" tasks, sorted by earliest deadline
 * /api/tasks?type=work&status=completed&sort=deadline
 *
 * @returns {Promise<void>} 200 - An array of task objects matching the filters.
 * 
 * @note
 * If no query parameters are provided, the response includes only the user's
 * active (non-completed) tasks, sorted by creation date in ascending order.
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

    // Add filters dynamically based on query parameters.
    if (type) query.type = type;
    if (status) {
        query.taskStatus = status;
    } else {
        // Default: exclude completed tasks
        query.taskStatus = { $ne: 'completed' };
    }

    // Determine the sorting criteria (map 'deadline' to model field 'taskDeadline')
    const sortFieldMap = { deadline: 'taskDeadline', createdAt: 'createdAt' };
    const normalizedSortKey = sort ? sort.replace('-', '') : undefined;
    const mappedSortKey = normalizedSortKey ? sortFieldMap[normalizedSortKey] : undefined;
    const sortCriteria = mappedSortKey
        ? { [mappedSortKey]: sort.startsWith('-') ? -1 : 1 }
        : { createdAt: 1 };

    // Fetch tasks from the database based on the constructed query and sort criteria
    const tasks = await Task.find(query).sort(sortCriteria).exec();

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Tasks retrieved successfully",
        data: tasks
    });
});

/**
 * @desc Create a new task for the authenticated user.
 * @route POST /api/tasks
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * @example
 * // Request body: (Note: description and deadline are not mandatory && status is set by default in the schema)
 * // {
 * //   "title": "Finish project report",
 * //   "description": "Write and review the final report for the client",
 * //   "deadline": "2025-12-15T17:00:00Z",
 * //   "type": "work"
 * // }
 */
const createTask = asyncHandler(async (req, res) => {
    const { title, description, deadline, type } = req.body;

    if (!title || !title.trim()) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Task title is required");
    }

    if (title.trim().length < 2 || title.trim().length > 25) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Task title must be between 2 and 25 characters');
    }

    // Validate deadline if provided
    if (deadline) {
        const parsedDeadline = Date.parse(deadline);

        if (isNaN(parsedDeadline)) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error("Invalid date format for deadline");
        }

        if (parsedDeadline <= Date.now()) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error("Deadline must be a future date");
        }
    }

    const validTypes = ["work", "personal"];
    if (!type || !validTypes.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    const taskCreatePayload = {
        taskTitle: title.trim(),
        type,
        user_id: req.user.userId,
    };

    if (description?.trim()) {
        if (description.trim().length > 100) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error('Task description must be less than 100 characters');
        }
        taskCreatePayload.taskDescription = description.trim();
    }

    if (deadline) {
        taskCreatePayload.taskDeadline = new Date(deadline);
    }

    const task = await Task.create(taskCreatePayload);

    res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: "Task created successfully",
        data: task
    });
});

/**
 * @desc Get a specific task by ID for the authenticated user.
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

    if (task.user_id.toString() !== req.user.userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error('User not authorized to update other users task');
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task retrieved successfully",
        data: task
    });
});

/**
 * @desc Update a task by ID. Only the task owner may update.
 * @route PUT /api/tasks/:id
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateTask = asyncHandler(async (req, res) => {
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
    if (title) {
        if (title.trim().length < 2 || title.trim().length > 25) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error('Task title must be between 2 and 25 characters');
        }
        updatedFields.taskTitle = title.trim();
    }
    if (description) {
        if (description.trim().length > 100) {
            res.status(STATUS_CODES.VALIDATION_ERROR);
            throw new Error('Task description must be less than 100 characters');
        }
        updatedFields.taskDescription = description.trim();
    }
    if (status) updatedFields.taskStatus = status;
    if (type) updatedFields.type = type;
    if (deadline) updatedFields.taskDeadline = new Date(deadline);

    // Update the task with the new fields
    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updatedFields }, // $set operator to update only the specified fields
        { new: true, runValidators: true }); // return the updated document with projection

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask
    });
});

/**
 * @desc Delete all tasks belonging to the authenticated user.
 * @purpose To easily remove list of tasks displayed in the UI
 * @route DELETE /api/tasks
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteAllTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ user_id: req.userId });

    if (tasks.length === 0) {
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "No tasks to delete",
            data: tasks
        });
    }

    const { status } = req.query;

    const validStatus = ["pending", "in-progress", "completed"];

    if (status && !validStatus.includes(status)) {
        return res.status(STATUS_CODES.VALIDATION_ERROR).
            json({ message: `Invalid status. Valid statuses are: ${validStatus.join(", ")}` })
    }

    const filter = { user_id: req.userId };
    if (status) filter.status = status.trim();

    const deletedTasks = await Task.deleteMany({ user_id: req.userId, status: status.trim() });

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Deleted ${deletedTasks.deletedCount} task(s)`,
        deletedCount: deletedTasks.deletedCount
    });
});

/**
 * @desc Delete a task by ID. Only the task owner may delete.
 * @route DELETE /api/tasks/:id
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).select("user_id");

    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error("Task not found");
    }

    if (task.user_id.toString() !== req.user.userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error("User not authorized to delete this task");
    }

    const deletedTask = await Task.deleteOne({ _id: req.params.id });

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task deleted successfully"
    });
});

export { getTasks, createTask, getTaskById, updateTask, deleteAllTasks, deleteTask };
import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';
import { STATUS_CODES } from '../constants.js';

// ------------------- //
// Helper Functions 
// ------------------- // 

// Shared validation constants
const VALID_STATUS = ["pending", "in-progress", "completed"];
const VALID_TYPE = ["work", "personal"];

/** 
 * @desc Helper to validate and build updated fields 
 */
const validateAndBuildFields = ({ title, description, status, type, deadline }) => {
    const updatedFields = {};

    if (title) {
        const trimmed = title.trim();
        if (trimmed.length < 2 || trimmed.length > 25) {
            throw new Error("Task title must be between 2 and 25 characters");
        }
        updatedFields.taskTitle = trimmed;
    }

    if (description) {
        const trimmed = description.trim();
        if (trimmed.length > 100) {
            throw new Error("Task description must be less than 100 characters");
        }
        updatedFields.taskDescription = trimmed;
    }

    if (deadline) {
        const parsedDeadline = Date.parse(deadline);
        if (isNaN(parsedDeadline)) throw new Error("Invalid date format for deadline");
        if (parsedDeadline <= Date.now()) throw new Error("Deadline must be a future date");
        updatedFields.taskDeadline = new Date(deadline);
    }

    if (status) {
        if (!VALID_STATUS.includes(status)) throw new Error("Invalid status value");
        updatedFields.taskStatus = status;
    }

    if (type) {
        if (!VALID_TYPE.includes(type)) throw new Error("Invalid type value");
        updatedFields.type = type;
    }

    return updatedFields;
};

/** 
 * @desc Helper to verify task ownership 
 */
const verifyTaskOwnership = async (taskId, userId, res) => {
    const task = await Task.findById(taskId);
    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error("Task not found");
    }

    if (task.user_id.toString() !== userId) {
        res.status(STATUS_CODES.FORBIDDEN);
        throw new Error("User not authorized to update this task");
    }

    return task;
};

// ------------------- //
// Controller Functions 
// ------------------- // 

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
 * @note
 * If no query parameters are provided, the response includes only the user's
 * active (non-completed) tasks, sorted by creation date in ascending order.
 */
const getTasks = asyncHandler(async (req, res) => {
    const { type, status, sort } = req.query;

    // Valid values for sorting
    const validSortOptions = ["deadline", "-deadline", "createdAt", "-createdAt"];

    // Validate query parameters (if provided)
    if (type && !VALID_TYPE.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    if (status && !VALID_STATUS.includes(status)) {
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

    // Validate required title
    if (!title || !title.trim()) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Task title is required");
    }

    // Validate required type
    if (!type || !VALID_TYPE.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error('Invalid type value. Valid values are "work" or "personal".');
    }

    // Use validateAndBuildFields to handle validation and building of fields
    // This handles title, description, deadline validation
    const validatedFields = validateAndBuildFields({ title, description, deadline, type });

    const taskCreatePayload = {
        ...validatedFields,
        user_id: req.user.userId,
    };

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
 */
const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findOne({
        _id: req.params.id,
        user_id: req.user.userId // filter by owner
    });

    if (!task) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error('Task not found');
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task retrieved successfully",
        data: task
    });
});

/** 
 * @desc Update a task by ID (PUT - full update) 
 * @route PUT /api/tasks/:id 
 */
const updateTask = asyncHandler(async (req, res) => {
    const task = await verifyTaskOwnership(req.params.id, req.user.userId, res);

    const updatedFields = validateAndBuildFields(req.body);

    const updatedTask = await Task.findByIdAndUpdate(
        task._id,
        { $set: updatedFields },
        { new: true, runValidators: true }
    );

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
    });
});

/** 
 * @desc Partially update a task by ID (PATCH) 
 * @route PATCH /api/tasks/:id 
 */
const partialUpdateTask = asyncHandler(async (req, res) => {
    const task = await verifyTaskOwnership(req.params.id, req.user.userId, res);

    const updatedFields = validateAndBuildFields(req.body);

    const updatedTask = await Task.findByIdAndUpdate(
        task._id,
        { $set: updatedFields },
        { new: true, runValidators: true }
    );

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Task partially updated successfully",
        data: updatedTask,
    });
});

/**
 * @desc Delete all tasks belonging to the authenticated user.
 * @purpose To easily remove list of tasks displayed in the UI
 * @route DELETE /api/tasks
 * @Note the frontend will delete it by status AND depending on which panel of type it is (work or personal)
 * When the frontend clicks on delete all tasks button, it will show a modal to confirm the action and it must choose the status to delete
 * If no status is provided, it will delete all tasks based on the type (depending on which panel of type it is (work or personal))
 */
const deleteAllTasks = asyncHandler(async (req, res) => {
    const type = req.query.type;
    const status = req.query.status;

    const tasks = await Task.find({ user_id: req.user.userId }).select("_id");

    if (tasks.length === 0) {
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "No tasks to delete",
            data: tasks
        });
    }

    if (status && !VALID_STATUS.includes(status)) {
        return res.status(STATUS_CODES.VALIDATION_ERROR).
            json({ message: `Invalid status. Valid statuses are: ${VALID_STATUS.join(", ")}` })
    }

    const filter = { user_id: req.user.userId };
    if (status) filter.taskStatus = status.trim();
    if (type) filter.type = type.trim();

    const deletedTasks = await Task.deleteMany(filter);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Deleted ${deletedTasks.deletedCount} task(s)`,
        deletedCount: deletedTasks.deletedCount
    });
});

/**
 * @desc Delete a task by ID. Only the task owner may delete.
 * @route DELETE /api/tasks/:id
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

/**
 * @desc Get dashboard summary and progress chart for the authenticated user.
 *
 * Provides high-level counts and collections to power the dashboard UI, including:
 * - active vs completed vs overdue task counts
 * - tasks overdue (array)
 * - tasks due today (array)
 * - a progress chart for today broken down by status
 *
 * You can scope results by task type using the path parameter.
 *
 * @route GET /api/tasks/dashboard/:type
 *   Where `:type` is one of "work" | "personal" | "all"
 *
 * @example
 * // All task types
 * // GET /api/tasks/dashboard/all
 *
 * @example
 * // Only work tasks
 * // GET /api/tasks/dashboard/work
 *
 * @example
 * // Only personal tasks
 * // GET /api/tasks/dashboard/personal
 *
 * @notes
 * - Dates are evaluated in server time. "Today" is calculated using midnight local server time.
 * - Overdue tasks are tasks with a past deadline that are not completed.
 */
const dashboard = asyncHandler(async (req, res) => {
    const type = req.params.type ? req.params.type.toLowerCase() : "all";

    const validTypes = ["all", "work", "personal"];
    if (type && !validTypes.includes(type)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Invalid type parameter provided");
    }

    // Build query
    const query= { user_id: req.user.userId };
    if (type && type !== "all") query.type = type.trim();

    const tasks = await Task.find(query);

    // Initialize counters and arrays
    let activeTasksCount = 0;
    let completedTasksCount = 0;
    let overdueTasksCount = 0;
    let tasksOverdue = [];
    let todayTasks = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today

    for (let task of tasks) {
        const taskDeadline = task.taskDeadline ? new Date(task.taskDeadline) : null;

        // Count active and completed tasks
        if (task.taskStatus === "pending" || task.taskStatus === "in-progress") {
            activeTasksCount++;
        } else if (task.taskStatus === "completed") {
            completedTasksCount++;
        }

        // Overdue tasks (past deadline and not completed)
        if (taskDeadline && taskDeadline < today && task.taskStatus !== "completed") {
            overdueTasksCount++;
            tasksOverdue.push(task);
        }

        // Tasks for today
        if (
            taskDeadline &&
            taskDeadline.getFullYear() === today.getFullYear() &&
            taskDeadline.getMonth() === today.getMonth() &&
            taskDeadline.getDate() === today.getDate()
        ) {
            todayTasks.push(task);
        }
    }

    // Build progress chart for today
    const progressChart = {
        pending: todayTasks.filter(t => t.taskStatus === "pending").length,
        inProgress: todayTasks.filter(t => t.taskStatus === "in-progress").length,
        completed: todayTasks.filter(t => t.taskStatus === "completed").length
    };

    res.status(STATUS_CODES.OK).json({
        success: true,
        taskType: type,
        summary: {
            activeTasksCount,
            completedTasksCount,
            overdueTasksCount,
            tasksOverdue,
            todayTasks
        },
        progressChart
    });
});

export { getTasks, createTask, getTaskById, updateTask, partialUpdateTask, deleteAllTasks, deleteTask, dashboard };
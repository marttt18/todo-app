import cron from 'node-cron';
import Task from '../models/taskModel.js';
import User from '../models/userModel.js';
import { sendDeadlineReminder } from '../services/emailService.js';

/**
 * @desc Check for tasks due today and send email notifications
 * Excludes tasks where deadline is the same day as creation date
 */
const checkAndSendDeadlineNotifications = async () => {
    try {
        console.log('Starting deadline notification check...');

        // Get today's date at midnight (start of day)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all tasks with deadline today
        // Only include tasks that are not completed
        const tasksDueToday = await Task.find({
            taskDeadline: {
                $gte: today,
                $lt: tomorrow
            },
            taskStatus: { $ne: 'completed' }
        }).populate('user_id', 'email username');

        if (tasksDueToday.length === 0) {
            console.log('No tasks due today. Skipping notifications.');
            return;
        }

        // Group tasks by user
        const tasksByUser = {};
        for (const task of tasksDueToday) {
            // Skip if user data is not populated
            if (!task.user_id || !task.user_id.email) {
                console.log(`Skipping task "${task.taskTitle}" - user data not found`);
                continue;
            }

            // Check if task deadline is the same day as creation date
            const taskDeadline = new Date(task.taskDeadline);
            const taskCreatedAt = new Date(task.createdAt);
            
            const deadlineDate = new Date(taskDeadline.getFullYear(), taskDeadline.getMonth(), taskDeadline.getDate());
            const createdAtDate = new Date(taskCreatedAt.getFullYear(), taskCreatedAt.getMonth(), taskCreatedAt.getDate());
            
            // Skip if deadline is the same day as creation
            if (deadlineDate.getTime() === createdAtDate.getTime()) {
                console.log(`Skipping task "${task.taskTitle}" - deadline is same day as creation`);
                continue;
            }

            const userId = task.user_id._id.toString();
            if (!tasksByUser[userId]) {
                tasksByUser[userId] = {
                    user: task.user_id,
                    tasks: []
                };
            }
            tasksByUser[userId].tasks.push(task);
        }

        // Send email to each user with their tasks
        const emailPromises = [];
        for (const userId in tasksByUser) {
            const { user, tasks } = tasksByUser[userId];
            
            if (tasks.length > 0 && user.email) {
                emailPromises.push(
                    sendDeadlineReminder(user.email, user.username, tasks)
                        .catch(error => {
                            console.error(`Failed to send email to ${user.email}:`, error.message);
                        })
                );
            }
        }

        await Promise.allSettled(emailPromises);
        console.log(`Deadline notification check completed. Processed ${Object.keys(tasksByUser).length} user(s).`);
    } catch (error) {
        console.error('Error in deadline notification job:', error);
    }
};

/**
 * @desc Initialize and start the scheduled notification job
 * Runs daily at 8:00 AM
 */
const startNotificationJob = () => {
    // Schedule job to run daily at 8:00 AM
    // Cron format: minute hour day month dayOfWeek
    // '0 8 * * *' means: at 8:00 AM every day
    const cronSchedule = process.env.NOTIFICATION_CRON_SCHEDULE || '0 8 * * *';
    
    console.log(`Scheduling deadline notification job with schedule: ${cronSchedule}`);
    
    cron.schedule(cronSchedule, async () => {
        await checkAndSendDeadlineNotifications();
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
    });

    console.log('Deadline notification job scheduled successfully.');
    
    // Optionally run immediately on startup (for testing)
    if (process.env.RUN_NOTIFICATION_ON_STARTUP === 'true') {
        console.log('Running notification check on startup...');
        checkAndSendDeadlineNotifications();
    }
};

export { startNotificationJob, checkAndSendDeadlineNotifications };


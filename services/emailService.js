import nodemailer from 'nodemailer';

/**
 * @desc Create and configure nodemailer transporter
 * @returns {nodemailer.Transporter} Configured transporter instance
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * @desc Send email notification for tasks due today
 * @param {string} userEmail - Recipient email address
 * @param {string} username - Recipient username
 * @param {Array} tasks - Array of tasks due today
 * @returns {Promise<void>}
 */
const sendDeadlineReminder = async (userEmail, username, tasks) => {
    // Test mode: Log email instead of sending (for testing without SMTP)
    if (process.env.EMAIL_TEST_MODE === 'true') {
        console.log('\n========== EMAIL NOTIFICATION (TEST MODE) ==========');
        console.log(`To: ${userEmail}`);
        console.log(`Subject: Reminder: You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today`);
        console.log(`\nHello ${username},`);
        console.log(`You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today:\n`);
        tasks.forEach((task, index) => {
            const deadline = new Date(task.taskDeadline).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            console.log(`${index + 1}. ${task.taskTitle}`);
            if (task.taskDescription) console.log(`   Description: ${task.taskDescription}`);
            console.log(`   Type: ${task.type}`);
            console.log(`   Status: ${task.taskStatus}`);
            console.log(`   Deadline: ${deadline}\n`);
        });
        console.log('==================================================\n');
        return { messageId: 'test-mode-message-id' };
    }

    // Production mode: Requires SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS, or enable EMAIL_TEST_MODE=true for testing.');
        return;
    }

    const transporter = createTransporter();

    // Format tasks list for email body
    const tasksList = tasks.map((task, index) => {
        const deadline = new Date(task.taskDeadline).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return `
        ${index + 1}. ${task.taskTitle}
           ${task.taskDescription ? `Description: ${task.taskDescription}` : ''}
           Type: ${task.type}
           Status: ${task.taskStatus}
           Deadline: ${deadline}
        `;
    }).join('\n');

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Todo App'}" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Reminder: You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                    .task-item { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }
                    .task-title { font-weight: bold; font-size: 18px; color: #333; margin-bottom: 8px; }
                    .task-detail { margin: 5px 0; color: #666; }
                    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1> Task Deadline Reminder! </h1>
                    </div>
                    <div class="content">
                        <p>Hello ${username},</p>
                        <p>This is a friendly reminder that you have <strong>${tasks.length} task${tasks.length > 1 ? 's' : ''}</strong> due today:</p>
                        ${tasks.map(task => {
                            const deadline = new Date(task.taskDeadline).toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return `
                            <div class="task-item">
                                <div class="task-title">${task.taskTitle}</div>
                                ${task.taskDescription ? `<div class="task-detail"><strong>Description:</strong> ${task.taskDescription}</div>` : ''}
                                <div class="task-detail"><strong>Type:</strong> ${task.type}</div>
                                <div class="task-detail"><strong>Status:</strong> ${task.taskStatus}</div>
                                <div class="task-detail"><strong>Deadline:</strong> ${deadline}</div>
                            </div>
                            `;
                        }).join('')}
                        <p>Don't forget to complete these tasks on time!</p>
                        <div class="footer">
                            <p>This is an automated reminder from your Todo App.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Hello ${username},

This is a friendly reminder that you have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today:

${tasksList}

Don't forget to complete these tasks on time!

---
This is an automated reminder from your Todo App.
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${userEmail}:`, info.messageId);
        return info;
    } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        throw error;
    }
};

export { sendDeadlineReminder, createTransporter };


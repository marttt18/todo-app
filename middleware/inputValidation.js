import { constants } from '../constants.js';

// Input sanitization function to prevent NoSQL injection
export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove or escape dangerous characters that could be used in NoSQL injection
        // Remove $ operators, null bytes, and other potentially dangerous characters
        return input
            .replace(/[$]/g, '') // Remove $ operators
            .replace(/\0/g, '') // Remove null bytes
            .replace(/[<>]/g, '') // Remove potential XSS characters
            .trim();
    }
    return input;
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password) => {
    // At least 6 characters, can include letters, numbers, and common special characters
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/;
    return passwordRegex.test(password);
};

// Validate username format
export const isValidUsername = (username) => {
    // Alphanumeric characters, underscores, and hyphens only
    const usernameRegex = /^[A-Za-z0-9_-]{3,15}$/;
    return usernameRegex.test(username);
};

// Middleware to validate registration input
export const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Check if all required fields are present
    if (!username || !email || !password) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide all required fields: username, email, and password");
    }

    // Sanitize inputs
    req.body.username = sanitizeInput(username);
    req.body.email = sanitizeInput(email);
    req.body.password = sanitizeInput(password);

    // Validate username
    if (!isValidUsername(req.body.username)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Username must be 3-15 characters long and contain only letters, numbers, underscores, and hyphens");
    }

    // Validate email
    if (!isValidEmail(req.body.email)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    // Validate password
    if (!isValidPassword(req.body.password)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Password must be at least 6 characters long and contain only valid characters");
    }

    next();
};

// Middleware to validate login input
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    // Check if all required fields are present
    if (!email || !password) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide both email and password");
    }

    // Sanitize inputs
    req.body.email = sanitizeInput(email);
    req.body.password = sanitizeInput(password);

    // Validate email format
    if (!isValidEmail(req.body.email)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    next();
};

// Middleware to sanitize all string inputs in request body
export const sanitizeRequestBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(req.body[key]);
            }
        }
    }
    next();
};

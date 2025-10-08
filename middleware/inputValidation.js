import { STATUS_CODES } from '../constants.js';
import { isValidUsername, isValidEmail, isValidPassword } from '../utils/validators.js';

export const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Check if all required fields are present
    if (!username || !email || !password) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Please provide all required fields: username, email, and password");
    }

    // Validate username
    if (!isValidUsername(req.body.username)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Username must be 2-15 characters long and contain only letters, numbers, underscores, and hyphens");
    }

    // Validate email
    if (!isValidEmail(req.body.email)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    // Validate password
    if (!isValidPassword(req.body.password)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Password must be at least 6 characters long and contain only valid characters");
    }

    next();
};

// Middleware to validate login input
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    // Check if all required fields are present
    if (!email || !password) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Please provide both email and password");
    }

    // Validate email format
    if (!isValidEmail(req.body.email)) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    next();
};
// Input sanitization function to prevent NoSQL injection
const sanitizeInput = (input) => {
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
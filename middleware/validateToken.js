import jwt from 'jsonwebtoken';
import { STATUS_CODES } from '../constants.js';

export const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Check if the authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(STATUS_CODES.UNAUTHORIZED);
        throw new Error('Unauthorized: No token provided');
    }

    // Get the token from the header
    const token = authHeader.split(' ')[1]; 

    if (!token) {
        res.status(STATUS_CODES.UNAUTHORIZED);
        throw new Error('Unauthorized: No token provided');
    }

    // Validate the token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            res.status(STATUS_CODES.FORBIDDEN);
            throw new Error('Forbidden: Invalid token');
        }
        req.user = decoded
        console.log("Decoded token payload: ", decoded);

        next();
    });
}
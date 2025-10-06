import jwt from 'jsonwebtoken';
import { constants } from '../constants.js';

export const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Check if the authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(constants.UNAUTHORIZED);
        throw new Error('Unauthorized: No token provided');
    }

    // Get the token from the header
    const token = authHeader.split(' ')[1]; 

    if (!token) {
        res.status(constants.UNAUTHORIZED);
        throw new Error('Unauthorized: No token provided');
    }

    // Validate the token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            res.status(constants.FORBIDDEN);
            throw new Error('Forbidden: Invalid token');
        }
        req.user = decoded // i only passed the user id in the payload. what will be the value of the payload?
        console.log("Decoded token payload: ", decoded);

        next(); // Proceed to the next middleware or route handler
    });
}
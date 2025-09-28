import express from 'express';
import { registerUser, loginUser, currentUser, logoutUser, getUsers } from '../controllers/usersController.js';
import { validateToken } from '../middleware/validateToken.js';
import { validateRegistration, validateLogin, sanitizeRequestBody } from '../middleware/inputValidation.js';

const router = express.Router();

// Get all users (for testing purposes only, should be removed in production)
router.get('/', getUsers);

// Register a new user
router.post('/register', sanitizeRequestBody, validateRegistration, registerUser);

// Login user
router.post('/login', sanitizeRequestBody, validateLogin, loginUser);

// Current user - private route
router.get('/current', validateToken, currentUser);

// Logout user - private route
router.post('/logout', validateToken, logoutUser);

export default router;
import express from 'express';
import { registerUser, loginUser, currentUser, getUsers } from '../controllers/usersController.js';

const router = express.Router();

// Get all users (for testing purposes only, should be removed in production)
router.get('/', getUsers);

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Current user - private route
router.get('/current', currentUser);

export default router;
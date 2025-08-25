import express from 'express';
import { registerUser, loginUser, currentUser } from '../controllers/usersController.js';

const router = express.Router();

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Current user - private route
router.get('/current', currentUser);

export default router;
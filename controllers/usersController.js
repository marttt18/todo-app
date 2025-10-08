import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import { STATUS_CODES } from "../constants.js";

/**
 * Get all users. Intended for testing/admin use only.
 *
 * @route GET /api/users
 * @returns {Promise<void>}
 */
const getUsers = asyncHandler(async (req, res) => {
    res.status(200).json(await User.find({}));
});

/**
 * Register a new user and return an access token for auto login. 
 * @route POST /api/users/register
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * @example
 * // Request body
 * // {
 * //   "username": "testuser",
 * //   "email": "test@example.com",
 * //   "password": "securepassword123"
 * // }
 */
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(STATUS_CODES.VALIDATION_ERROR);
        throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create user 
    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    const accessToken = generateToken(user._id);

    res.status(STATUS_CODES.CREATED).json({
        title: "User Created Successfully!",
        _id: user._id,
        username: user.username,
        email: user.email,
        accessToken
    });
});

/**
 * Login a user and return an access token.
 *
 * @route POST /api/users/login
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * @example
 * // Request body
 * // {
 * //   "email": "test@example.com",
 * //   "password": "securepassword123"
 * // }
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user 
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
        res.status(STATUS_CODES.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }

    // Compare password with hashedpassword
    if (await bcrypt.compare(password, user.password)) {
        // Generate token
        const accessToken = generateToken(user._id);
        res.status(STATUS_CODES.OK).json({ accessToken });
    } else {
        res.status(STATUS_CODES.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }
});

/**
 * Get the currently authenticated user's profile.
 *
 * @route GET /api/users/current
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const currentUser = asyncHandler(async (req, res) => {
    // Check if user data exists in the request (set by validateToken middleware)
    if (!req.user) {
        res.status(STATUS_CODES.UNAUTHORIZED);
        throw new Error("User not authenticated");
    }

    // Get the user info
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
        res.status(STATUS_CODES.NOT_FOUND);
        throw new Error("User not found");
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
});

// Note: Since we're using stateless JWT tokens, logout is handled on the client side
// by removing the token from storage. 

export { registerUser, loginUser, currentUser, getUsers };


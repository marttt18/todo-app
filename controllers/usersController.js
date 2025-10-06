import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import { constants } from "../constants.js";

/* @desc Get all users
GET /api/users/
purpose: for testing if users are added
*/
const getUsers = asyncHandler(async (req, res) => {
    res.status(200).json(await User.find({})); 
});

/* @desc Register a new user
POST /api/users/register
sample:
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123"
} */
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(constants.VALIDATION_ERROR);
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

    if (user) {
        res.status(201).json({
            title: "User Created Successfully!",
            _id: user._id,
            username: user.username,
            email: user.email,
            accessToken
        });
    } else {
        res.status(400);
        throw new Error("User registration error!");
    }
});

/* @desc Login user
POST /api/users/login
sample:
{
  "email": "test@example.com",
  "password": "securepassword123"
} */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user 
    const user = await User.findOne({ email });
    
    // Check if the user exists
    if (!user) {
        res.status(constants.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }

    // Compare password with hashedpassword
    if (await bcrypt.compare(password, user.password)) {
        // Generate token
        const accessToken = generateToken(user._id);
        res.status(200).json({ accessToken });
    } else {
        res.status(constants.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }
});

/* @desc Register a new user
GET /api/users/current
*/
const currentUser = asyncHandler(async (req, res) => {
    // Check if user data exists in the request (set by validateToken middleware)
    if (!req.user) {
        res.status(constants.UNAUTHORIZED);
        throw new Error("User not authenticated");
    }

    // Get the user info
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
        res.status(constants.NOT_FOUND);
        throw new Error("User not found");
    }

    res.status(200).json({
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


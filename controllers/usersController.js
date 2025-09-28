import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt"; // for hashing passwords
import generateToken from "../utils/generateToken.js";
import { constants } from "../constants.js";

// Input sanitization function to prevent NoSQL injection
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove or escape dangerous characters that could be used in NoSQL injection
        return input.replace(/[$]/g, '').trim();
    }
    return input;
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Get users
const getUsers = asyncHandler(async (req, res) => {
    res.status(200).json(await User.find({})); 
});

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Input validation and sanitization
    if (!username || !email || !password) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please add all fields");
    }

    // Sanitize inputs to prevent NoSQL injection
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    // Additional validation
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 15) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Username must be between 3 and 15 characters");
    }

    if (!isValidEmail(sanitizedEmail)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    if (sanitizedPassword.length < 6) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Password must be at least 6 characters long");
    }

    // Check if user exists using sanitized email
    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sanitizedPassword, 10); // 10 is the salt rounds
    console.log("Hashed password: ", hashedPassword);

    // Create user with sanitized inputs
    const user = await User.create({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword
    });

    // why not just 
    // await User.create(req.body);
    // :because we want to validate the fields
    // yes but we are already validating the fields above
    // :true but we are also checking if the user already exists
    // yes, but we already handled that by throwing an error if the user exists
    // :true, but we are also creating the user in the database
    // yes, but arent we doing that with User.create? since the name, email, password are already in req.body (they are the same value? and considering that they are already validtaed and error are ahndled above)
    // :because req.body may contain other fields that we dont want to save in the database

    if (user) {
        res.status(201).json({
            title: "User Created Successfully1",
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken({ id: user._id }) // generate a token with the user id as payload
        });
    } else {
        res.status(400);
        throw new Error("User data is not valid"); // why? we already validated the data above
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("All fields are mandatory");
    }

    // Sanitize inputs to prevent NoSQL injection
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
        res.status(constants.VALIDATION_ERROR);
        throw new Error("Please provide a valid email address");
    }

    // Find user using sanitized email
    const user = await User.findOne({ email: sanitizedEmail });
    
    // Check if the user exists
    if (!user) {
        res.status(constants.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }

    // Compare password with hashedpassword
    if (await bcrypt.compare(sanitizedPassword, user.password)) {
        // Generate token
        const payload = {
            // Wrap the payload in an object
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        };
        // Why do we need to include username and email in the payload? 
        // Answer: It is not necessary to include them, but it can be useful for debugging purposes.
        const accessToken = generateToken(payload);
        res.status(200).json({ accessToken });
    } else {
        res.status(constants.UNAUTHORIZED);
        throw new Error("Invalid email or password");
    }
});

const currentUser = asyncHandler(async (req, res) => {
    // Check if user data exists in the request (set by validateToken middleware)
    if (!req.user) {
        res.status(constants.UNAUTHORIZED);
        throw new Error("User not authenticated");
    }

    // Get fresh user data from database to ensure it's up-to-date
    const user = await User.findById(req.user.id).select('-password');
    
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

const logoutUser = asyncHandler(async (req, res) => {
    // Since we're using stateless JWT tokens, logout is handled on the client side
    // by removing the token from storage. However, we can provide a response
    // to confirm the logout action and potentially implement token blacklisting
    // in the future if needed.
    
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
});

// how can we import this in server.js?
// Answer: we can import it like this: import usersController from './controllers/usersController.js';
// Then we can use it like this: app.use("/users", usersController);
// But arent we also importing other controllers. and this function is anonymous function. How can we differentiate between them?
// Answer: we can export multiple functions from this file and import them in server.js.
// For example, we can export registerUser, loginUser, currentUser and import them in server.js.

export { registerUser, loginUser, currentUser, logoutUser, getUsers };


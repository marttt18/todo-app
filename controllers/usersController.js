import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt"; // for hashing passwords
import generateToken from "../utils/generateToken.js";

// Get users
const getUsers = asyncHandler(async (req, res) => {
    res.status(200).json(await User.find({})); 
});

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400);
        throw new error("Please add all fields");
    }

    // Check if user exists
    const userExists = await User.findOne({ email }); // {email} because email is just a string
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    console.log("Hashed password: ", hashedPassword);

    // Create user
    const user = await User.create({
        username,
        email,
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
    if (!email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory");
    }
    const user = await User.findOne({ email });
    // Check if the user exists
    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }

    // Compare password with hashedpassword
    if (await bcrypt.compare(password, user.password)) {
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
        res.status(401);
        throw new Error("Check your password and try again");
    }
});

const currentUser = asyncHandler(async (req, res) => {
    // What is the purpose of currentUser route? why do we need to know who the current user is?
    const currentUser = req.user; // why req.user? because we set it in the authMiddleware.js
    res.json(currentUser);
});

// how can we import this in server.js?
// Answer: we can import it like this: import usersController from './controllers/usersController.js';
// Then we can use it like this: app.use("/users", usersController);
// But arent we also importing other controllers. and this function is anonymous function. How can we differentiate between them?
// Answer: we can export multiple functions from this file and import them in server.js.
// For example, we can export registerUser, loginUser, currentUser and import them in server.js.

export { registerUser, loginUser, currentUser, getUsers };


import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt"; // for hashing passwords


const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
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
        name,
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

    console.log("User created: ", user);
    if (user) {
        res.status(201).json({ title: "User Created Successfully1", _id: user.id, email: user.email });
    } else {
        res.status(400);
        throw new Error("User data is not valid"); // why? we already validated the data above
    }
});

const loginUser = asyncHandler(async (req, res) => {
    res.send('Hello World!');
});

const currentUser = asyncHandler(async (req, res) => {
    res.send('Hello World!');
});

// how can we import this in server.js?
// Answer: we can import it like this: import usersController from './controllers/usersController.js';
// Then we can use it like this: app.use("/users", usersController);
// But arent we also importing other controllers. and this function is anonymous function. How can we differentiate between them?
// Answer: we can export multiple functions from this file and import them in server.js.
// For example, we can export registerUser, loginUser, currentUser and import them in server.js.

export { registerUser, loginUser, currentUser };


import asyncHandler from "express-async-handler"

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new error("Please add all fields");
    }

    
});

const loginUser = asyncHandler(async (req, res) => {
    res.send('Hello World!');
});

const currentUser = asyncHandler(async (req, res) => {
    res.send('Hello World!');
});

export default asyncHandler(async (req, res) => {
    res.send('Hello World!');
}); // how can we import this in server.js?
// Answer: we can import it like this: import usersController from './controllers/usersController.js';
// Then we can use it like this: app.use("/users", usersController);
// But arent we also importing other controllers. and this function is anonymous function. How can we differentiate between them?
// Answer: we can export multiple functions from this file and import them in server.js.
// For example, we can export registerUser, loginUser, currentUser and import them in server.js.
// 

export { registerUser, loginUser, currentUser };


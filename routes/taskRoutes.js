// Routues for handling here are private
// The user must be authenticated to access these routes

import express from 'express';

const router = express.Router();

// Display all tasks
router.get('/getTasks', (req, res) => {
    res.send('Hello World!');
});

// Add a task
router.post('/createTask', (req, res) => {
    res.send('Hello World!');
});

// Update a task by id
router.get('/createNote:id', (req, res) => {
    res.send('Hello World!');
});

// Delete all tasks
router.get('/createNote', (req, res) => {
    res.send('Hello World!');
});

// Delete a task by id
router.delete('/deleteNote:id', (req, res) => {
    res.send('Hello World!');
});

export default router;
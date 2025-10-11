import mongoose from "mongoose";

const tasksSchema = new mongoose.Schema({
    // First object: schema paths (fields)
    user_id: { // reference to the User model
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    taskTitle: {
        type: String,
        required: [true, "Task title is required"],
        trim: true,
        minlength: [2, "Task title must be at least 2 characters"],
        maxlength: [25, "Task title must be less than 100 characters"]
    },
    taskDescription: {
        type: String,
        trim: true,
        maxlength: [100, "Task description must be less than 500 characters"]
    },
    taskStatus: {
        type: String,
        enum: ["pending", "in-progress", "completed"], 
        default: "pending" 
    },
    taskDeadline: {
        type: Date,
    },
    type: {
        type: String,
        enum: ["work", "personal"],
        required: [true, "Type is required"]
    }
    // Why not just add the timestamps here?
    // timestamps: true
    // Answer: Mongoose will not treat timestamps as a schema option. It will instead assume you are defining a field named timestamps with the value true.
},
    // Second object: schema options (behaviors)
    {
        // this will add createdAt and updatedAt fields to the schema
        timestamps: true
    });


export default mongoose.model("Task", tasksSchema); // "Task" is the name of the collection in the database. 
// Mongoose will automatically pluralize it to "tasks". Why?
// Because a collection is a group of documents.
// A document is a single record in a collection.
// A collection is like a table in a relational database.
// A document is like a row in a table.
// why not just directly write "Tasks" with an s? Because Mongoose will automatically pluralize it for us. If we write "Tasks" it will become "Taskss".
// But why is the T in caps?
// Note: "Models" folder is for Mongoose Schemas\

// STEP 1: Import Mongoose
import mongoose from "mongoose";

// STEP 2: Create a schema
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
        trim: true, // why do we need this? to remove whitespace from both ends of a string. why do we need to remove whitespace? because users might accidentally add spaces before or after the title.
        minlength: [3, "Task title must be at least 3 characters"],
        maxlength: [100, "Task title must be less than 100 characters"]
    },
    taskDescription: {
        type: String,
        trim: true,
        minlength: [3, "Task description must be at least 3 characters"],
        maxlength: [500, "Task description must be less than 500 characters"]
    },
    taskStatus: {
        type: String,
        enum: ["pending", "in-progress", "completed"], // why enum? because we want to restrict the values that can be assigned to this field.
        default: "pending" // why default? because we want to set a default value for this field if the user does not provide one.  
    },
    taskDeadline: {
        type: Date, // What is the expected format for Date? ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
        required: [false, "Deadline is optional"] // it is false by default but is it better to specify? 
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

// STEP 3: Create a model and export it
export default mongoose.model("Task", tasksSchema); // "Task" is the name of the collection in the database. 
// Mongoose will automatically pluralize it to "tasks". Why?
// Because a collection is a group of documents.
// A document is a single record in a collection.
// A collection is like a table in a relational database.
// A document is like a row in a table.
// why not just directly write "Tasks" with an s? Because Mongoose will automatically pluralize it for us. If we write "Tasks" it will become "Taskss".
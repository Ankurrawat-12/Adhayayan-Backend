const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },

    // Store content as an OBJECT instead of a string
    content: { type: Object, required: true },

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Lesson", LessonSchema);

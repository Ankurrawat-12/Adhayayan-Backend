const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    lessonStarted: { type: Boolean, default: false },
    lessonCompleted: { type: Boolean, default: false },
    quizTaken: { type: Boolean, default: false },
    quizPassed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
});

module.exports = mongoose.model("Progress", ProgressSchema);

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const MCQ = require('../models/MCQ');

const router = express.Router();

// ✅ Save Quiz Results
router.post('/:lessonId', authMiddleware, async (req, res) => {
    const { lessonId } = req.params;
    const { userAnswers } = req.body;

    // console.log("User Answers: - "+ userAnswers)

    if (!userAnswers || !Array.isArray(userAnswers)) {
        return res.status(400).json({ msg: "Invalid or missing answers." });
    }

    try {
        const mcqs = await MCQ.find({ lessonId });
        if (!mcqs || mcqs.length === 0) {
            return res.status(404).json({ msg: "No quiz found for this lesson." });
        }

        let correctAnswers = 0;
        const results = mcqs.map((mcq, index) => {
            const isCorrect = mcq.correctAnswer === userAnswers[index];
            if (isCorrect) correctAnswers++;

            return {
                question: mcq.question,
                userAnswer: userAnswers[index] || "Not Attempted",
                correctAnswer: mcq.correctAnswer,
                isCorrect,
                explanation: isCorrect ? "Correct!" : "Review this concept again."
            };
        });

        res.json({
            correctAnswers,
            totalQuestions: mcqs.length,
            answers: results
        });

    } catch (err) {
        console.error("Error saving results:", err);
        res.status(500).json({ msg: "Server error processing results." });
    }
});

module.exports = router;

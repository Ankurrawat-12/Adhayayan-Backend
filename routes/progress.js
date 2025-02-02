const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Progress = require("../models/Progress");

const router = express.Router();

// Mark lesson as started
router.post("/start", authMiddleware, async (req, res) => {
    const { lessonId } = req.body;
    try {
        let progress = await Progress.findOne({ userId: req.user.id, lessonId });

        if (!progress) {
            progress = new Progress({ userId: req.user.id, lessonId, lessonStarted: true });
        } else {
            progress.lessonStarted = true;
        }

        await progress.save();
        res.json({ msg: "Lesson started", progress });
    } catch (err) {
        console.error("Error updating progress:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Mark lesson as completed
router.post("/complete", authMiddleware, async (req, res) => {
    const { lessonId } = req.body;
    try {
        let progress = await Progress.findOne({ userId: req.user.id, lessonId });

        if (!progress) {
            return res.status(404).json({ msg: "Lesson not found in progress" });
        }

        progress.lessonCompleted = true;
        await progress.save();
        res.json({ msg: "Lesson completed", progress });
    } catch (err) {
        console.error("Error updating progress:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Record quiz results
router.post("/quiz", authMiddleware, async (req, res) => {
    const { lessonId, score, passMark } = req.body;
    try {
        let progress = await Progress.findOne({ userId: req.user.id, lessonId });

        if (!progress) {
            return res.status(404).json({ msg: "Lesson not found in progress" });
        }

        progress.quizTaken = true;
        progress.quizPassed = score >= passMark;
        progress.score = score;
        await progress.save();
        res.json({ msg: "Quiz progress updated", progress });
    } catch (err) {
        console.error("Error updating quiz progress:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get user progress summary
router.get("/summary", authMiddleware, async (req, res) => {
    try {
        const progress = await Progress.find({ userId: req.user.id });

        const totalLessons = progress.length;
        const completedLessons = progress.filter((p) => p.lessonCompleted).length;
        const quizzesTaken = progress.filter((p) => p.quizTaken).length;
        const quizzesPassed = progress.filter((p) => p.quizPassed).length;

        const globalProgress = {
            totalLessons,
            completedLessons,
            quizzesTaken,
            quizzesPassed,
            completionRate: totalLessons ? (completedLessons / totalLessons) * 100 : 0,
        };

        res.json({ progress, globalProgress });
    } catch (err) {
        console.error("Error fetching progress:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Activity = require("../models/Activity");

const router = express.Router();

// ✅ Get Recent Activity for the Logged-in User
router.get("/", authMiddleware, async (req, res) => {
    try {
        const activity = await Activity.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json({ activity });
    } catch (err) {
        console.error("Error fetching recent activity:", err);
        res.status(500).json({ msg: "Server error fetching activity." });
    }
});

// ✅ Add New Activity (Call this inside lesson and quiz actions)
router.post("/", authMiddleware, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ msg: "Activity message is required." });
    }

    try {
        const newActivity = new Activity({
            userId: req.user.id,
            message,
            timestamp: new Date(),
        });

        await newActivity.save();
        res.json({ msg: "Activity recorded." });
    } catch (err) {
        console.error("Error saving activity:", err);
        res.status(500).json({ msg: "Server error saving activity." });
    }
});

module.exports = router;

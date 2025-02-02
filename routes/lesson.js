const express = require('express');
const Lesson = require('../models/Lesson');
const authMiddleware = require('../middleware/authMiddleware');
const { OpenAI } = require('openai');
const Activity = require("../models/Activity");
require('dotenv').config();

const router = express.Router();

// Initialize OpenAI API Client
const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

router.get("/:lessonId", authMiddleware, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);


        if (!lesson) {
            return res.status(404).json({ msg: "Lesson not found." });
        }

        await new Activity({
            userId: req.user.id,
            message: `Viewed lesson: ${lesson.topic}`,
            timestamp: new Date(),
        }).save();

        res.json({ lesson });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error fetching lesson." });
    }
});


// Create a lesson
router.post("/create", authMiddleware, async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ msg: "Lesson topic is required." });
    }

    try {
        // Call AI API to generate lesson content
        const aiResponse = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",  // Updated model (text-davinci-003 is deprecated)
            prompt : `
                You are a friendly and engaging Python teacher for kids. Create a structured, interactive, and easy-to-understand lesson on the topic: "${topic}".  
                
                Format the response **strictly** as a **valid JSON object** with the following structure:  
                
                \`\`\`json
                {
                  "title": "Lesson Title",
                  "introduction": "A simple and engaging introduction to the topic.",
                  "concepts": [
                    {
                      "heading": "Concept 1",
                      "explanation": "A step-by-step explanation using simple language.",
                      "example": "A real-world example kids can relate to."
                    },
                    {
                      "heading": "Concept 2",
                      "explanation": "Another important concept explained clearly.",
                      "example": "A relevant example to help understanding."
                    }
                  ],
                  "exercise": {
                    "description": "A fun coding challenge to reinforce learning.",
                    "code": "A simple Python code snippet as an exercise."
                  },
                  "conclusion": "A summary of what was learned and words of encouragement."
                }
                \`\`\`  
                
                - Ensure the response is **valid JSON**.  
                - Do **not** include extra text, explanations, or formatting (like line breaks).  
                - The lesson should be engaging, easy to understand, and interactive.  
                - Use clear, child-friendly language and relatable examples.  
                - Use Correct Indentation in the Code
                - Wrap lines of code if to large
                
                Return **only** the JSON output—nothing else.
                `,
            max_tokens: 3000,
        });


        // Extract and parse the response
        let lessonContent = aiResponse.choices[0].text.trim();

        try {
            lessonContent = JSON.parse(lessonContent); // Convert to JSON object
        } catch (error) {
            return res.status(500).json({ msg: "Error parsing AI response into JSON." });
        }

        // Save lesson in MongoDB (content stored as an object)
        const lesson = new Lesson({
            userId: req.user.id,
            topic,
            content: lessonContent, // Now storing JSON object
        });

        await lesson.save();
        res.json({ lesson });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error generating lesson." });
    }
});


// Get all lessons for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const lessons = await Lesson.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ lessons });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error fetching lessons." });
    }
});

module.exports = router;

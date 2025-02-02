const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/MCQ');
const { OpenAI } = require('openai');
const Activity = require("../models/Activity");


require('dotenv').config();

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });


// Generate MCQs for a lesson
router.post('/generate', authMiddleware, async (req, res) => {
    const { lessonId } = req.body;

    if (!lessonId) {
        return res.status(400).json({ msg: "Lesson ID is required." });
    }

    try {
        // Fetch lesson content
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ msg: "Lesson not found." });
        }

        // Call OpenAI API to generate structured MCQs
        const aiResponse = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `
                    Generate 10 multiple-choice questions (MCQs) with four answer options each based on the following Python lesson:
                    
                    **Lesson Content:**  
                    "${lesson.content}"  
                    
                    the questions should be **strictly about  ${lesson.content.title}**
                    
                    Format the response **strictly** as a **valid JSON array** of objects, following this exact structure:
                    
                    [
                      {
                        "question": "What is a function in Python?",
                        "options": [
                          "A mini-program within a main program",
                          "A type of variable",
                          "A keyword used to print output",
                          "A way to organize comments in code"
                        ],
                        "correctAnswer": "A mini-program within a main program"
                      },
                      {
                        "question": "Which of the following is NOT true about functions?",
                        "options": [
                          "They help us reuse code",
                          "They make our programs more efficient",
                          "They are only used in video games",
                          "They have a specific order and purpose"
                        ],
                        "correctAnswer": "They are only used in video games"
                      }
                    ]
                    
                    - Ensure the response is **valid JSON**.
                    - Do **not** include extra text, explanations, or formatting (like line breaks).
                    - Each MCQ should be relevant to the provided lesson.
                    - The **correct answer** must be an exact match from the given options.
                    
                    Return **only** the JSON output—nothing else.
                    `,

            max_tokens: 1500,
        });

        console.log(aiResponse);

        // Extract the text and ensure it's valid JSON
        let mcqs;
        try {
            mcqs = JSON.parse(aiResponse.choices[0].text.trim());
        } catch (error) {
            console.error("Error parsing AI response:", error);
            return res.status(500).json({ msg: "Error processing AI response." });
        }

        // Save MCQs in the database
        const mcqDocuments = mcqs.map(mcq => ({
            lessonId,
            question: mcq.question,
            options: mcq.options,
            correctAnswer: mcq.correctAnswer,
        }));

        await Quiz.insertMany(mcqDocuments);

        await new Activity({
            userId: req.user.id,
            message: `Generated homework for lesson: ${lessonId}`,
            timestamp: new Date(),
        }).save();

        res.json({ msg: "MCQs generated successfully", mcqs });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error generating MCQs." });
    }
});


// Get MCQs for a lesson
router.get('/:lessonId', authMiddleware, async (req, res) => {
    try {
        const mcqs = await Quiz.find({ lessonId: req.params.lessonId });
        res.json({ mcqs });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error fetching MCQs." });
    }
});

module.exports = router;

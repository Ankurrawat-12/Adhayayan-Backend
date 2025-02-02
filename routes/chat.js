const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { OpenAI } = require('openai');
require('dotenv').config();

const router = express.Router();

// AI API Configuration
const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

// AI Chat Route
router.post('/', authMiddleware, async (req, res) => {
    try {
        // ✅ Extract lesson, chat history, and user message from request
        console.log("Received request body:", req.body);

        // ✅ Extract lesson, chat history, and user message
        const { lesson, chat_history, user_message } = req.body;

        // ✅ Log for debugging
        console.log("Lesson Content:", lesson);
        console.log("Chat History:", chat_history);
        console.log("User Message:", user_message);

        // ✅ Check if required fields are missing
        if (!lesson || !lesson.title || !lesson.introduction || !user_message) {
            console.error("Missing required data in request:", req.body);
            return res.status(400).json({ msg: "Missing required data: lesson title, introduction, and user_message are required." });
        }

        // ✅ Format the chat history for AI context
        const formattedChatHistory = chat_history
            ? chat_history.map(msg => `${msg.sender === "user" ? "User" : "AI"}: ${msg.text}`).join("\n")
            : "";

        // ✅ Construct AI prompt with lesson context and chat history
        const aiPrompt = `
            You are an AI tutor helping a student with the following Python lesson:
            
            Lesson Title: ${lesson.title}
            Introduction: ${lesson.introduction}

            ${lesson.concepts.map(concept => `
            ${concept.heading}: ${concept.explanation}
            Example: ${concept.example}`).join("\n")}

            Exercise: ${lesson.exercise.description}
            Code Example: ${lesson.exercise.code}

            ----
            Chat History:
            ${formattedChatHistory}

            ----
            User Question: ${user_message}

            Provide a helpful, engaging, and educational response.
        `;

        // ✅ Call OpenAI API
        const aiResponse = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: aiPrompt,
            max_tokens: 3000,
        });

        console.log(aiResponse)

        const aiMessage = aiResponse.choices[0].text.trim();
        res.json({ response: aiMessage });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error processing chat request." });
    }
});

module.exports = router;

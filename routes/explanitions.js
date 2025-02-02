const express = require("express");
const { OpenAI } = require("openai");
require("dotenv").config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

router.post("/", async (req, res) => {
    const { questions } = req.body;

    if (!questions || questions.length === 0) {
        return res.status(400).json({ msg: "No questions provided." });
    }

    try {
        const prompt = `
              You are a Python tutor. Provide a brief but clear explanation for why the following answers are incorrect:
              ${questions.map((q, index) => `${index + 1}. ${q}`).join("\n")}
              
              Format as a JSON object:
              { "question": "explanation", ... }
    `;

        const aiResponse = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt,
            max_tokens: 1000,
        });

        const explanations = JSON.parse(aiResponse.choices[0].text.trim());

        res.json({ explanations });
    } catch (err) {
        console.error("AI explanation error:", err);
        res.status(500).json({ msg: "Error generating explanations." });
    }
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const auth = require("./routes/auth")
const lesson = require("./routes/lesson")
const chat = require("./routes/chat")
const quiz = require("./routes/quiz")
const results = require("./routes/results")
const activity = require("./routes/activity")
require('dotenv').config();

const app = express();

// Middleware

const allowedOrigins = [
    "https://adhayayan-frontend.vercel.app", // Your Vercel frontend
    "http://localhost:3000", // For local development
];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', auth);
app.use('/api/lessons', lesson);
app.use('/api/chat', chat);
app.use('/api/quiz', quiz);
app.use('/api/results', results)
app.use("/api/recent-activity", activity);
;

app.get('/', (req, res) => {
    res.send('Backend is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

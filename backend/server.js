require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        message: 'StudySphere Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// Learning Hub Route
app.get('/api/learning-hub', (req, res) => {
    console.log("📚 Learning Hub API hit!");
    res.json({
        success: true,
        message: 'Backend API executed successfully! Connected to Node.js.',
        modules: [
            { id: 1, title: 'Introduction to React', progress: '100%' },
            { id: 2, title: 'Advanced Express API', progress: '45%' },
            { id: 3, title: 'Database Optimization', progress: '10%' }
        ]
    });
});

// Study Planner Route
app.get('/api/study-planner', (req, res) => {
    console.log("📅 Study Planner API hit!");
    res.json({
        success: true,
        message: 'Study Planner data loaded from backend.',
        tasks: [
            { id: 1, task: 'Complete Calculus Chapter 4', due: 'Today' },
            { id: 2, task: 'Review Physics Notes', due: 'Tomorrow' },
            { id: 3, task: 'Write English Essay', due: 'Friday' }
        ]
    });
});

// AI Assistant Route
app.get('/api/ai-chat', (req, res) => {
    console.log("🤖 AI Chat API hit!");
    res.json({
        success: true,
        message: 'AI Assistant backend connected and ready.',
        status: 'Online',
        recentQueries: ['Explain quantum entanglement', 'How does useState work?']
    });
});

// Analytics Route
app.get('/api/analytics', (req, res) => {
    console.log("📊 Analytics API hit!");
    res.json({
        success: true,
        message: 'Analytics data successfully fetched.',
        stats: {
            studyHours: 42,
            averageScore: '88%',
            topSubject: 'Computer Science'
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server internally running at http://localhost:${PORT}`);
});

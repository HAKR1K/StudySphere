require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app  = express();
const PORT = process.env.PORT || 5001;

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '20mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────
// Helper: call Groq API
// ─────────────────────────────────────────
async function callGroq(messages, maxTokens = 1500, temperature = 0.7) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY is missing from .env');

    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: maxTokens,
            temperature,
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error('Groq API error response:', JSON.stringify(data, null, 2));
        throw new Error(data?.error?.message || `Groq API error ${res.status}`);
    }
    return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        message: 'StudySphere Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────
// AI Chat — Groq
// ─────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'message is required.' });
        }

        const systemMsg = {
            role: 'system',
            content: `You are StudySphere AI Tutor — a brilliant, concise academic assistant.
Your style:
- Use **bold** for key terms
- Use numbered lists for steps, bullet points for lists
- Use triple backticks for code blocks
- Keep replies focused and helpful
- End with a tip or follow-up question when useful`,
        };

        // Convert history from Gemini format { role, parts } → OpenAI format { role, content }
        let historyMsgs = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: Array.isArray(h.parts)
                ? h.parts.map(p => p.text || '').join('\n')
                : (h.content || ''),
        }));

        // FIX 1: Remove messages with empty or whitespace-only content
        historyMsgs = historyMsgs.filter(m => m.content && m.content.trim().length > 0);

        // FIX 2: Strip leading assistant messages — Groq requires history to start with 'user'
        while (historyMsgs.length > 0 && historyMsgs[0].role === 'assistant') {
            historyMsgs.shift();
        }

        // FIX 3: Merge consecutive same-role messages to prevent role alternation errors
        const deduped = [];
        for (const msg of historyMsgs) {
            if (deduped.length > 0 && deduped[deduped.length - 1].role === msg.role) {
                deduped[deduped.length - 1].content += '\n' + msg.content;
            } else {
                deduped.push({ ...msg });
            }
        }

        const messages = [systemMsg, ...deduped, { role: 'user', content: message }];

        const reply = await callGroq(messages, 1500, 0.7);
        res.json({ success: true, reply });

    } catch (err) {
        console.error('Chat Error:', err.message);
        res.status(500).json({ success: false, message: err.message || 'AI Error' });
    }
});

// ─────────────────────────────────────────
// AI Study Roadmap Generator
// Uses Gemini if GEMINI_API_KEY is set, else Groq, else mock fallback
// ─────────────────────────────────────────
app.post('/api/generate-plan', upload.single('document'), async (req, res) => {
    try {
        const { subject, days, hoursPerDay } = req.body;
        const file = req.file;

        let contextText = subject ? subject.trim() : 'General Computer Science Topics';

        // Extract text from uploaded PDF (if any)
        if (file) {
            try {
                const pdfParse = require('pdf-parse'); // lazy load
                const pdfData  = await pdfParse(file.buffer);
                const extracted = pdfData.text.trim();
                if (extracted.length > 0) contextText = extracted.substring(0, 15000);
            } catch (pdfErr) {
                console.warn('PDF parsing failed, falling back to subject text:', pdfErr.message);
            }
        }

        const totalDays  = parseInt(days)       || 30;
        const dailyHours = parseInt(hoursPerDay) || 2;
        const totalHours = totalDays * dailyHours;

        const prompt = `
You are an expert academic planner.
Context to study: ${contextText}
The student has exactly ${totalDays} days to study, committing ${dailyHours} hours per day (Total: ${totalHours} hours).

Break down the fundamental and advanced concepts from the context into a sequential study roadmap.
Allocate specific hours to each concept so the sum of ALL hoursAllocated equals EXACTLY ${totalHours} hours.

Return ONLY a valid JSON array — no markdown, no explanation, no extra text.
Format:
[
  { "id": 1, "task": "Concept Name", "due": "Day X", "hoursAllocated": 4, "completed": false }
]
`;

        const geminiKey = process.env.GEMINI_API_KEY;
        const groqKey   = process.env.GROK_API_KEY;

        if (geminiKey) {
            // Gemini Path
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

            const startIndex = responseText.indexOf('[');
            const endIndex   = responseText.lastIndexOf(']');
            if (startIndex === -1 || endIndex === -1) throw new Error('Gemini did not return a valid JSON array.');

            const parsedTasks = JSON.parse(responseText.substring(startIndex, endIndex + 1));
            return res.json({ success: true, tasks: parsedTasks, message: 'AI Roadmap Generated by Gemini!' });

        } else if (groqKey) {
            // Groq Fallback
            let responseText = await callGroq([{ role: 'user', content: prompt }], 2000, 0.3);
            responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

            const startIndex = responseText.indexOf('[');
            const endIndex   = responseText.lastIndexOf(']');
            if (startIndex === -1 || endIndex === -1) throw new Error('Groq did not return a valid JSON array.');

            const parsedTasks = JSON.parse(responseText.substring(startIndex, endIndex + 1));
            return res.json({ success: true, tasks: parsedTasks, message: 'AI Roadmap Generated by Groq!' });

        } else {
            // Mock Fallback (no API key at all)
            console.warn('No API key in .env — returning mock roadmap.');

            const concepts = [
                'Fundamentals & Basics',
                'Core Algorithms',
                'Advanced Theory',
                'Practical Real-world Application',
                'Mock Testing Phase',
                'Final Comprehensive Review'
            ];

            let hoursLeft = totalHours;
            const hoursPerConcept = Math.floor(totalHours / concepts.length);

            const fakeTasks = concepts.map((concept, index) => {
                const isLast = index === concepts.length - 1;
                const hours  = isLast ? hoursLeft : hoursPerConcept;
                hoursLeft   -= hours;
                return {
                    id:             index + 1,
                    task:           `${concept} — ${subject || 'Uploaded Material'}`,
                    due:            `Day ${Math.ceil((index + 1) * (totalDays / concepts.length))}`,
                    hoursAllocated: hours,
                    completed:      false
                };
            });

            return res.json({
                success: true,
                tasks:   fakeTasks,
                message: 'Mock roadmap returned. Add GEMINI_API_KEY or GROK_API_KEY to .env for real AI output.'
            });
        }

    } catch (err) {
        console.error('Error generating plan:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to generate AI plan.',
            error:   err.message
        });
    }
});

// ─────────────────────────────────────────
// Concept Deep-Dive
// Uses Gemini if GEMINI_API_KEY is set, else Groq
// ─────────────────────────────────────────
app.post('/api/concept-detail', async (req, res) => {
    try {
        const { task, subject, hoursAllocated, due } = req.body;
        if (!task) return res.status(400).json({ success: false, message: 'task is required.' });

        const prompt = `
You are an expert teacher and academic content writer.
Generate a comprehensive deep-dive study guide for the following concept:

Concept: "${task}"
${subject        ? `Subject Area: ${subject}`                      : ''}
${hoursAllocated ? `Study Time Allocated: ${hoursAllocated} hours` : ''}
${due            ? `Scheduled: ${due}`                             : ''}

Return ONLY a valid JSON object — no markdown fences, no extra text.
Use this exact format:
{
  "title": "Full concept title",
  "overview": "2-3 sentence high-level overview of the concept",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Detailed explanation paragraph",
      "subsections": [
        { "subheading": "Subsection title", "content": "Detailed explanation" }
      ]
    }
  ],
  "definitions": [
    { "term": "Key term", "definition": "Clear definition" }
  ],
  "examples": [
    { "title": "Example title", "description": "Brief real-world example to illustrate the concept" }
  ],
  "solvedExamples": [
    {
      "problem": "A clearly stated problem to solve",
      "steps": [
        { "stepNumber": 1, "explanation": "What you do in this step and why" }
      ],
      "finalAnswer": "The complete answer or result",
      "takeaway": "What this example teaches about the concept"
    }
  ],
  "practiceQuestions": [
    { "question": "Sample question?", "hint": "Brief hint to approach it" }
  ],
  "relatedConcepts": [
    { "name": "Related concept name", "relevance": "Why it's related" }
  ],
  "proTip": "One expert tip for mastering this concept"
}
`;

        const geminiKey = process.env.GEMINI_API_KEY;
        const groqKey   = process.env.GROK_API_KEY;

        let responseText = '';

        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            responseText = result.response.text().trim();
        } else if (groqKey) {
            responseText = await callGroq([{ role: 'user', content: prompt }], 3000, 0.4);
        } else {
            return res.status(500).json({ success: false, message: 'No GEMINI_API_KEY or GROK_API_KEY set in .env' });
        }

        // Strip markdown fences if present
        responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        const startIndex = responseText.indexOf('{');
        const endIndex   = responseText.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1) throw new Error('AI did not return valid JSON.');

        const detail = JSON.parse(responseText.substring(startIndex, endIndex + 1));
        return res.json({ success: true, detail });

    } catch (err) {
        console.error('Concept detail error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to fetch concept detail.' });
    }
});

// ─────────────────────────────────────────
// Learning Hub
// ─────────────────────────────────────────
app.get('/api/learning-hub', (req, res) => {
    console.log('Learning Hub API hit!');
    res.json({
        success: true,
        message: 'Backend API executed successfully! Connected to Node.js.',
        modules: [
            { id: 1, title: 'Introduction to React',   progress: '100%' },
            { id: 2, title: 'Advanced Express API',     progress: '45%'  },
            { id: 3, title: 'Database Optimization',    progress: '10%'  }
        ]
    });
});

// ─────────────────────────────────────────
// Study Planner (initial cache load)
// ─────────────────────────────────────────
app.get('/api/study-planner', (req, res) => {
    console.log('Study Planner API hit!');
    res.json({
        success: true,
        message: 'Study Planner data loaded from backend.',
        tasks: [
            { id: 1, task: 'Complete Calculus Chapter 4', due: 'Today'    },
            { id: 2, task: 'Review Physics Notes',         due: 'Tomorrow' },
            { id: 3, task: 'Write English Essay',          due: 'Friday'   }
        ]
    });
});

// ─────────────────────────────────────────
// AI Chat status endpoint
// ─────────────────────────────────────────
app.get('/api/ai-chat', (req, res) => {
    console.log('AI Chat API hit!');
    res.json({
        success: true,
        message: 'AI Assistant backend connected and ready.',
        status:  'Online',
        recentQueries: ['Explain quantum entanglement', 'How does useState work?']
    });
});

// ─────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
    console.log('Analytics API hit!');
    res.json({
        success: true,
        message: 'Analytics data successfully fetched.',
        stats: {
            studyHours:   42,
            averageScore: '88%',
            topSubject:   'Computer Science'
        }
    });
});

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
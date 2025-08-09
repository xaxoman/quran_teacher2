"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const generative_ai_1 = require("@google/generative-ai");
const RecitationService_1 = require("./services/RecitationService");
const SessionManager_1 = require("./services/SessionManager");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));
app.use((0, cors_1.default)({
    origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Initialize AI service
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const recitationService = new RecitationService_1.RecitationService(genAI);
const sessionManager = new SessionManager_1.SessionManager();
// API Routes
app.post('/api/session/start', async (req, res) => {
    console.log('🚀 Starting new session with data:', req.body);
    try {
        const { surah, language = 'en' } = req.body;
        const sessionId = sessionManager.createSession(surah, language);
        console.log('✅ Session created with ID:', sessionId);
        const greeting = await recitationService.getGreeting(language);
        console.log('👋 Greeting generated:', greeting);
        res.json({
            success: true,
            sessionId,
            greeting
        });
    }
    catch (error) {
        console.error('❌ Error starting session:', error);
        res.status(500).json({ success: false, error: 'Failed to start session' });
    }
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// TTS test endpoint for development
app.post('/api/tts/test', async (req, res) => {
    try {
        const { text, language = 'en' } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }
        console.log(`🎙️ TTS test request: "${text.substring(0, 50)}..." in ${language}`);
        const audioData = await recitationService.generateAudio(text, language);
        if (audioData) {
            console.log('✅ TTS test audio generated successfully');
            console.log('🔍 Audio format:', audioData.substring(0, 50) + '...');
            res.json({ success: true, audioData });
        }
        else {
            console.log('⚠️ TTS test generation failed - likely quota exceeded or API issue');
            res.status(503).json({
                success: false,
                error: 'TTS generation temporarily unavailable',
                message: 'This could be due to API quota limits or temporary service issues. The main app functionality will continue to work with text-only responses.',
                suggestion: 'Try again later or check the server logs for more details.'
            });
        }
    }
    catch (error) {
        console.error('❌ Error in TTS test endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-session', (sessionId) => {
        const session = sessionManager.getSession(sessionId);
        if (session) {
            socket.join(sessionId);
            session.socketId = socket.id; // Update with new socket ID
            console.log(`Socket ${socket.id} joined session ${sessionId}`);
            // Confirm session is active
            socket.emit('session-joined', {
                sessionId: sessionId,
                message: 'Successfully rejoined session'
            });
        }
        else {
            console.error(`❌ Session ${sessionId} not found for socket ${socket.id}`);
            socket.emit('error', { message: 'Session not found' });
        }
    });
    socket.on('audio-stream', async (data) => {
        try {
            const session = sessionManager.getSession(data.sessionId);
            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }
            // Process audio with Gemini AI
            const response = await recitationService.processAudio(data.audioData, session, data.isComplete);
            socket.emit('ai-response', response);
        }
        catch (error) {
            console.error('Error processing audio:', error);
            socket.emit('error', { message: 'Failed to process audio' });
        }
    });
    socket.on('text-input', async (data) => {
        console.log('📝 Received text-input:', data);
        try {
            const session = sessionManager.getSession(data.sessionId);
            if (!session) {
                console.error('❌ Session not found for ID:', data.sessionId);
                socket.emit('error', { message: 'Session not found' });
                return;
            }
            console.log('✅ Session found, processing text:', data.text);
            const response = await recitationService.processText(data.text, session);
            console.log('🤖 AI response generated:', response);
            socket.emit('ai-response', response);
        }
        catch (error) {
            console.error('❌ Error processing text:', error);
            socket.emit('error', { message: 'Failed to process text' });
        }
    });
    socket.on('request-feedback', async (data) => {
        try {
            const session = sessionManager.getSession(data.sessionId);
            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }
            const feedback = await recitationService.provideFeedback(session);
            socket.emit('feedback-response', feedback);
        }
        catch (error) {
            console.error('Error providing feedback:', error);
            socket.emit('error', { message: 'Failed to provide feedback' });
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Don't immediately clean up sessions - they might reconnect
        // Sessions will be cleaned up by the automatic cleanup after 1 hour of inactivity
        console.log('💡 Session preserved for potential reconnection');
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Ready for Quran recitation sessions`);
});
//# sourceMappingURL=index.js.map
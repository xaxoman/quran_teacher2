import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecitationService } from './services/RecitationService';
import { SessionManager } from './services/SessionManager';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
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
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));

// Initialize AI service
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const recitationService = new RecitationService(genAI);
const sessionManager = new SessionManager();

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
  } catch (error) {
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
    } else {
      console.log('⚠️ TTS test generation failed');
      res.status(500).json({ success: false, error: 'TTS generation failed' });
    }
  } catch (error) {
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

  socket.on('join-session', (sessionId: string) => {
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
    } else {
      console.error(`❌ Session ${sessionId} not found for socket ${socket.id}`);
      socket.emit('error', { message: 'Session not found' });
    }
  });

  socket.on('audio-stream', async (data: { sessionId: string, audioData: ArrayBuffer, isComplete: boolean }) => {
    try {
      const session = sessionManager.getSession(data.sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Process audio with Gemini AI
      const response = await recitationService.processAudio(
        data.audioData,
        session,
        data.isComplete
      );

      socket.emit('ai-response', response);
    } catch (error) {
      console.error('Error processing audio:', error);
      socket.emit('error', { message: 'Failed to process audio' });
    }
  });

  socket.on('text-input', async (data: { sessionId: string, text: string }) => {
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
    } catch (error) {
      console.error('❌ Error processing text:', error);
      socket.emit('error', { message: 'Failed to process text' });
    }
  });

  socket.on('request-feedback', async (data: { sessionId: string }) => {
    try {
      const session = sessionManager.getSession(data.sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const feedback = await recitationService.provideFeedback(session);
      socket.emit('feedback-response', feedback);
    } catch (error) {
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

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../stores/appStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    sessionId,
    currentLanguage,
    addMessage,
    setConnected,
    setError,
    setProcessing
  } = useAppStore();

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to server');
      setConnected(true);
      setError(null);
      
      // Join session if we have one
      if (sessionId) {
        console.log('🔄 Rejoining session:', sessionId);
        socket.emit('join-session', sessionId);
      }
    });

    socket.on('session-joined', (data) => {
      console.log('✅ Session joined successfully:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected the client, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
      setError('Connection failed. Please check your internet connection.');
    });

    // AI Response events
    socket.on('ai-response', (data) => {
      console.log('🤖 Received AI response:', data);
      setProcessing(false);
      
      addMessage({
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: data.text,
        audio: data.audio,
        timestamp: new Date(),
        messageType: data.type,
        transcription: data.transcription
      });
    });

    socket.on('feedback-response', (data) => {
      console.log('Received feedback:', data);
      setProcessing(false);
      
      addMessage({
        id: `feedback-${Date.now()}`,
        type: 'ai',
        text: data.text,
        audio: data.audio,
        timestamp: new Date(),
        messageType: 'feedback'
      });
    });

    socket.on('transcription', (data) => {
      console.log('Received transcription:', data);
      
      addMessage({
        id: `user-${Date.now()}`,
        type: 'user',
        text: data.text,
        timestamp: new Date(),
        transcription: data.text
      });
    });

    socket.on('error', (data) => {
      console.error('🚨 Socket error:', data);
      setProcessing(false);
      setError(data.message || 'An error occurred');
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [sessionId, addMessage, setConnected, setError, setProcessing]);

  // Start a new session
  const startSession = async (surah: string): Promise<any> => {
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surah,
          language: currentLanguage,
        }),
      });

      const data = await response.json();
      
      if (data.success && socketRef.current) {
        // Join the session room
        socketRef.current.emit('join-session', data.sessionId);
      }

      return data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  };

  // Send text input
  const sendTextInput = (text: string) => {
    console.log('sendTextInput called with:', text);
    console.log('Socket connected:', !!socketRef.current?.connected);
    console.log('Session ID:', sessionId);
    
    if (socketRef.current?.connected && sessionId) {
      console.log('Sending text input to server...');
      setProcessing(true);
      
      // Add user message immediately
      addMessage({
        id: `user-${Date.now()}`,
        type: 'user',
        text,
        timestamp: new Date()
      });

      socketRef.current.emit('text-input', {
        sessionId,
        text
      });
    } else {
      console.error('Cannot send text input - missing socket connection or sessionId');
      console.error('Socket connected:', !!socketRef.current?.connected);
      console.error('Session ID exists:', !!sessionId);
      setError('Not connected to session. Please start a new session.');
    }
  };

  // Request feedback
  const requestFeedback = () => {
    if (socketRef.current && sessionId) {
      setProcessing(true);
      socketRef.current.emit('request-feedback', { sessionId });
    }
  };

  return {
    socket: socketRef.current,
    startSession,
    sendTextInput,
    requestFeedback,
  };
};

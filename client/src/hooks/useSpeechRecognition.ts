import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSocket } from './useSocket';

// Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const {
    currentLanguage,
    isListening,
    setListening,
    setError,
    addToRecitationHistory
  } = useAppStore();
  
  const { sendTextInput } = useSocket();
  const [isSupported, setIsSupported] = useState(false);

  // Check if Speech Recognition is supported
  useEffect(() => {
    console.log('Checking speech recognition support...');
    console.log('Navigator:', !!navigator.mediaDevices);
    console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('SpeechRecognition available:', !!SpeechRecognition);
    console.log('Browser:', navigator.userAgent);
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      console.log('Creating SpeechRecognition instance...');
      recognitionRef.current = new SpeechRecognition();
    } else {
      console.error('Speech Recognition not supported in this browser');
    }
  }, []);

  const setupSpeechRecognition = useCallback(() => {
    console.log('Setting up speech recognition...');
    if (!recognitionRef.current) {
      console.error('No recognition instance available');
      return;
    }

    const recognition = recognitionRef.current;
    console.log('Configuring recognition settings...');
    
    // Configure recognition
    recognition.continuous = false; // Changed from true to false for better control
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    // Set language based on current language
    const languageMap: Record<string, string> = {
      'ar': 'ar-SA',
      'en': 'en-US',
      'it': 'it-IT'
    };
    
    recognition.lang = languageMap[currentLanguage] || 'ar-SA';
    console.log('Recognition language set to:', recognition.lang);

    // Event handlers
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully');
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      console.log('Speech recognition result event:', event);
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(`Result ${i}: "${transcript}" (isFinal: ${event.results[i].isFinal})`);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      console.log('Interim transcript:', interimTranscript);

      if (finalTranscript.trim()) {
        console.log('Final transcript:', finalTranscript);
        
        // Add to recitation history
        addToRecitationHistory(finalTranscript.trim());
        
        // Send to server for AI processing
        console.log('Sending text input to server:', finalTranscript.trim());
        
        // Stop listening after getting a final result to prevent continuous recording
        recognition.stop();
        
        sendTextInput(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error, event);
      
      const errorMessages: Record<string, string> = {
        'network': 'Network error occurred. Please check your connection.',
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'no-speech': 'No speech detected. Please speak clearly.',
        'audio-capture': 'Audio capture failed. Please check your microphone.',
        'service-not-allowed': 'Speech recognition service not available.',
        'bad-grammar': 'Grammar error in speech recognition.',
        'language-not-supported': 'Language not supported for speech recognition.',
        'aborted': 'Speech recognition was aborted.'
      };

      const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      console.error('🚨 Error message:', errorMessage);
      setError(errorMessage);
      setListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setListening(false);
      
      // Stop audio recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };

  }, [currentLanguage, setListening, setError, addToRecitationHistory, sendTextInput]);

  // Start listening
  const startListening = useCallback(async () => {
    console.log('🎤 startListening called');
    
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not available');
      setError('Speech recognition not supported');
      return;
    }

    if (isListening) {
      console.log('⚠️ Already listening, ignoring start request');
      return;
    }

    try {
      console.log('🔐 Requesting microphone permission...');
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log('✅ Microphone permission granted, starting recognition...');
      
      // Stop all tracks to release the microphone (we only needed permission)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stream.getTracks().forEach(track => track.stop());
      
      // Start speech recognition
      recognitionRef.current.start();
      console.log('🎯 Speech recognition start() called');
      
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      const err = error as any; // Type assertion for MediaDeviceError
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else if (err.name === 'InvalidStateError') {
        setError('Speech recognition is already running. Please wait.');
      } else {
        setError(`Failed to access microphone: ${err.message || 'Unknown error'}`);
      }
    }
  }, [setError, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setListening(false);
  }, [setListening]);

  // Setup speech recognition when instance is created or language changes
  useEffect(() => {
    if (recognitionRef.current) {
      setupSpeechRecognition();
    }
  }, [currentLanguage, setupSpeechRecognition]);
  
  // Initial setup after creating recognition instance
  useEffect(() => {
    if (recognitionRef.current && isSupported) {
      setupSpeechRecognition();
    }
  }, [isSupported, setupSpeechRecognition]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening
  };
};

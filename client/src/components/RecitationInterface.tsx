import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { useSocket } from '../hooks/useSocket';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioPlayer } from './AudioPlayer';
import { MicrophoneButton, VoiceActivityIndicator } from './MicrophoneButton';
import { ProgressTracker } from './ProgressTracker';
import { TTSTestPanel } from './TTSTestPanel';

export const RecitationInterface: React.FC = () => {
  const { t } = useTranslation();
  const [selectedSurah, setSelectedSurah] = useState('');
  const [showSurahSelector, setShowSurahSelector] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);
  
  const {
    sessionId,
    currentSurah,
    isConnected,
    messages,
    isListening,
    isProcessing,
    error,
    setCurrentSurah,
    setSessionId,
    addMessage,
    setError
  } = useAppStore();
  
  // Hooks for advanced features
  const { startSession, requestFeedback } = useSocket();
  const { 
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    isMicrophoneMuted,
    microphoneLevel,
    isMonitoring
  } = useSpeechRecognition();
  const { playMessageAudio, AudioElement, isPlaying: isAudioPlaying } = useAudioPlayer();
  // Track first AI message skip and last played id
  const hasSkippedFirstAIRef = useRef(false);
  const lastPlayedMessageIdRef = useRef<string | null>(null);

  // Popular surahs for quick selection
  const popularSurahs = [
    { arabicName: 'الفاتحة', transliteration: 'Al-Fatihah', number: 1 },
    { arabicName: 'البقرة', transliteration: 'Al-Baqarah', number: 2 },
    { arabicName: 'آل عمران', transliteration: 'Al-Imran', number: 3 },
    { arabicName: 'يس', transliteration: 'Ya-Sin', number: 36 },
    { arabicName: 'الرحمن', transliteration: 'Ar-Rahman', number: 55 },
    { arabicName: 'الإخلاص', transliteration: 'Al-Ikhlas', number: 112 }
  ];

  const handleStartSession = async (surah?: string) => {
    const surahToUse = surah || selectedSurah;
    if (!surahToUse) {
      setError('Please select a Surah first.');
      return;
    }

    setIsStartingSession(true);
    try {
      setError(null);
      console.log('Starting session for:', surahToUse);
      
      const response = await startSession(surahToUse);
      
      if (response && response.success) {
        setSessionId(response.sessionId);
        setCurrentSurah(surahToUse);
        setShowSurahSelector(false);
        
        // Add greeting message
        const greetingText = response.greeting?.text || t('greeting');
        addMessage({
          id: `greeting-${Date.now()}`,
          type: 'ai',
          text: greetingText,
          audio: response.greeting?.audio,
          timestamp: new Date(),
          messageType: 'response'
        });
        
        // Do NOT auto-play the first AI message (greeting)
        hasSkippedFirstAIRef.current = true;
        
        console.log('Session started successfully:', response.sessionId);
      } else {
        console.error('Session start failed:', response);
        setError('Failed to start session. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the server is running on port 3001.');
      } else {
        setError('Connection failed. Please check your internet connection and try again.');
      }
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSurahSelect = (surah: string) => {
    console.log('Surah selected:', surah);
    setSelectedSurah(surah);
  };

  const handleNewSession = () => {
    setShowSurahSelector(true);
    setSessionId(null);
    setCurrentSurah(null);
    // Reset TTS auto-play tracking for new session
    hasSkippedFirstAIRef.current = false;
    lastPlayedMessageIdRef.current = null;
  };

  // Auto-play any new AI message audio except the first one
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    // Only auto-play AI messages with audio
    if (lastMessage.type === 'ai' && lastMessage.audio) {
      console.log('🎵 New AI message with audio detected:', lastMessage.id);
      
      // Skip if it's the first AI message (greeting)
      if (!hasSkippedFirstAIRef.current) {
        console.log('🔕 Skipping first AI message auto-play (greeting)');
        hasSkippedFirstAIRef.current = true;
        return;
      }
      
      // Avoid replaying the same message
      if (lastPlayedMessageIdRef.current === lastMessage.id) {
        console.log('🔁 Message already played, skipping:', lastMessage.id);
        return;
      }

      console.log('🔊 Auto-playing AI message audio:', lastMessage.id);
      lastPlayedMessageIdRef.current = lastMessage.id;
      
      // Add a longer delay to ensure message rendering is complete and avoid conflicts
      const playTimeout = setTimeout(() => {
        playMessageAudio(lastMessage.audio!)
          .then(() => {
            console.log('✅ Auto-play successful for message:', lastMessage.id);
          })
          .catch(error => {
            console.warn('⚠️ Auto-play failed (this is normal if user hasn\'t interacted with page yet):', error);
            console.error('🔍 Full error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
              type: typeof error,
              error: error
            });
            
            // If auto-play fails, show a notification to the user
            if (error.name === 'NotAllowedError') {
              console.log('💡 Tip: Click anywhere on the page to enable audio auto-play');
            } else if (error.message?.includes('TTS failed') || error.message?.includes('quota')) {
              console.log('🔧 TTS service issue - you can try the manual play button below the message');
              setError('TTS service temporarily unavailable. You can still use text responses.');
            } else if (error.name === 'AbortError') {
              console.log('ℹ️ Audio was interrupted (likely due to rapid message updates)');
            } else {
              console.log('💡 Auto-play failed - manual play button available below the message');
              console.log('🔧 Error type:', error.name, '| Message:', error.message);
              // Show a user-friendly error for unexpected issues
              setError(`Audio playback issue: ${error.message}. Manual play buttons are available.`);
            }
          });
      }, 300); // Increased delay for better reliability

      // Cleanup timeout on unmount or message change
      return () => {
        clearTimeout(playTimeout);
      };
    }
  }, [messages, playMessageAudio]);

  if (showSurahSelector || !sessionId) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card card-large">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {t('greeting')}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
              {t('selectSurah')}
            </p>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Popular Surahs
            </h3>
            <div className="surah-grid">
              {popularSurahs.map((surah) => {
                const surahName = `${surah.transliteration} (${surah.arabicName})`;
                const isSelected = selectedSurah === surahName;
                return (
                  <button
                    key={surah.number}
                    onClick={() => handleSurahSelect(surahName)}
                    className={`surah-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? '#10b981' : '#e5e7eb',
                      backgroundColor: isSelected ? '#f0fdf4' : 'white',
                      boxShadow: isSelected ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                  >
                    <div className="surah-info">
                      <div>
                        <div className="surah-name">
                          {surah.arabicName}
                        </div>
                        <div className="surah-transliteration">
                          {surah.transliteration}
                        </div>
                      </div>
                      <div className="surah-number">
                        #{surah.number}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => handleStartSession()}
                disabled={!selectedSurah || isStartingSession}
                className="btn btn-primary"
                style={{
                  opacity: (!selectedSurah || isStartingSession) ? 0.6 : 1,
                  cursor: (!selectedSurah || isStartingSession) ? 'not-allowed' : 'pointer',
                  position: 'relative'
                }}
              >
                {isStartingSession ? (
                  <>
                    <span style={{ marginRight: '0.5rem' }}>🔄</span>
                    Starting...
                  </>
                ) : (
                  t('startRecitation')
                )}
              </button>
              
              {!selectedSurah && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Please select a Surah first
                </p>
              )}
              
              {selectedSurah && (
                <p style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Selected: {selectedSurah}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '0.5rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Handle microphone toggle
  const handleMicrophoneToggle = () => {
    console.log('🎤 Microphone button clicked. Currently listening:', isListening);
    console.log('🔊 Speech recognition supported:', isSpeechSupported);
    console.log('🔌 Connected to server:', isConnected);
    console.log('🆔 Session ID:', sessionId);
    
    if (isListening) {
      console.log('⏹️ Stopping speech recognition...');
      stopListening();
    } else {
      console.log('▶️ Starting speech recognition...');
      startListening();
    }
  };

  // Handle feedback request
  const handleRequestFeedback = () => {
    requestFeedback();
  };
  
  // Debug function to test microphone directly
  const testMicrophone = async () => {
    console.log('Testing microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted:', stream);
      stream.getTracks().forEach(track => track.stop());
      setError(null);
      alert('Microphone test successful! You can use voice input.');
    } catch (error) {
      console.error('Microphone test failed:', error);
      setError(`Microphone test failed: ${error}`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Progress Tracker */}
      <ProgressTracker />
      
      {/* Session Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {currentSurah}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <span className={isConnected ? 'status-connected' : 'status-disconnected'}>
                {isConnected ? '🟢 Connected' : '🔴 Not Connected'}
              </span>
            </p>
          </div>
          <button
            onClick={handleNewSession}
            className="btn btn-gray"
          >
            {t('startNewSession')}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="card">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <p>Start your recitation session by speaking or typing...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type}`}
              >
                <div className="message-content">
                  <div>{message.text}</div>
                  {message.type === 'ai' && message.audio && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => playMessageAudio(message.audio!)}
                        disabled={isAudioPlaying}
                        className="btn btn-secondary"
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Play AI response audio"
                      >
                        🔊 Play Audio
                      </button>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {isAudioPlaying ? '🎵 Playing...' : '🔇 Ready'}
                      </span>
                    </div>
                  )}
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Advanced Control Panel */}
      <div className="card">
        <div className="control-panel">
          {/* Status Display */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            {isProcessing && (
              <div style={{ color: '#3b82f6', fontWeight: '500' }}>
                {t('processing')} <VoiceActivityIndicator isActive={true} />
              </div>
            )}
            {isAudioPlaying && (
              <div style={{ color: '#8b5cf6', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                🔊 AI Speaking... <VoiceActivityIndicator isActive={true} />
              </div>
            )}
            {isListening && !isAudioPlaying && (
              <div style={{ color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {t('listening')} <VoiceActivityIndicator isActive={true} />
              </div>
            )}
            {!isProcessing && !isListening && !isAudioPlaying && (
              <div style={{ color: '#6b7280' }}>
                {t('speakNow')}
              </div>
            )}

            {/* Microphone Status */}
            {(isListening || isMonitoring) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                {/* Mute Status */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  backgroundColor: isMicrophoneMuted ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${isMicrophoneMuted ? '#fecaca' : '#bbf7d0'}`,
                  fontSize: '0.875rem'
                }}>
                  <span style={{ fontSize: '1rem' }}>
                    {isMicrophoneMuted ? '🔇' : '🎤'}
                  </span>
                  <span style={{ color: isMicrophoneMuted ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                    {isMicrophoneMuted ? 'Mic Muted' : 'Mic Active'}
                  </span>
                </div>

                {/* Volume Level */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <span>🔊</span>
                  <div style={{
                    width: '60px',
                    height: '4px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${microphoneLevel * 100}%`,
                      height: '100%',
                      backgroundColor: microphoneLevel > 0.1 ? '#10b981' : '#ef4444',
                      transition: 'width 0.1s ease-out'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', minWidth: '30px' }}>
                    {Math.round(microphoneLevel * 100)}%
                  </span>
                </div>
              </div>
            )}
            
            {/* Debug info */}
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Speech Support: {isSpeechSupported ? '✅' : '❌'} | 
              Connected: {isConnected ? '✅' : '❌'} | 
              Session: {sessionId ? '✅' : '❌'} | 
              Monitoring: {isMonitoring ? '✅' : '❌'} | 
              Listening: {isListening ? '✅' : '❌'} | 
              Audio: {isAudioPlaying ? '🔊' : '🔇'} | 
              Muted: {isMicrophoneMuted ? '🔇' : '🎤'} | 
              Level: {Math.round(microphoneLevel * 100)}% | 
              TTS AutoPlay: {hasSkippedFirstAIRef.current ? '✅' : '🔕'} | 
              Last Played: {lastPlayedMessageIdRef.current ? lastPlayedMessageIdRef.current.substring(0, 8) + '...' : 'None'}
            </div>
          </div>

          {/* Audio Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {isSpeechSupported && (
              <MicrophoneButton
                isListening={isListening}
                onClick={handleMicrophoneToggle}
                disabled={isProcessing}
                size="large"
              />
            )}
            
            <button
              onClick={handleRequestFeedback}
              disabled={isProcessing || !sessionId}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {t('requestFeedback')}
            </button>
            
            {/* Debug button for testing microphone */}
            <button
              onClick={testMicrophone}
              className="btn btn-gray"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem' }}
            >
              🔧 Test Mic
            </button>
            
            {!isSpeechSupported && (
              <div style={{ 
                padding: '0.5rem 1rem', 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                🎤 Voice recognition not supported in this browser
              </div>
            )}
          </div>

          {/* Microphone Mute Warning */}
          {(isListening || isMonitoring) && isMicrophoneMuted && (
            <div style={{
              margin: '1rem 0',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#dc2626', fontWeight: '500', marginBottom: '0.5rem' }}>
                🔇 Microphone appears to be muted
              </div>
              <div style={{ color: '#7f1d1d', fontSize: '0.875rem' }}>
                Please check your microphone settings and ensure it's not muted in your system settings or browser.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden Audio Element for Playback */}
      <AudioElement />

      {/* TTS Test Panel for Development */}
      <TTSTestPanel />
    </div>
  );
};

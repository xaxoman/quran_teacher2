import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { useSocket } from '../hooks/useSocket';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioPlayer } from './AudioPlayer';
import { MicrophoneButton, VoiceActivityIndicator } from './MicrophoneButton';
import { ProgressTracker } from './ProgressTracker';

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
  const { startSession, requestFeedback, sendTextInput } = useSocket();
  const { 
    isSupported: isSpeechSupported,
    startListening,
    stopListening
  } = useSpeechRecognition();
  const { playMessageAudio, AudioElement } = useAudioPlayer();

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
        
        // Auto-play greeting audio if available
        if (response.greeting?.audio) {
          playMessageAudio(response.greeting.audio);
        }
        
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
  };

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
            {isListening && (
              <div style={{ color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {t('listening')} <VoiceActivityIndicator isActive={true} />
              </div>
            )}
            {!isProcessing && !isListening && (
              <div style={{ color: '#6b7280' }}>
                {t('speakNow')}
              </div>
            )}
            
            {/* Debug info */}
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Speech Support: {isSpeechSupported ? '✅' : '❌'} | 
              Connected: {isConnected ? '✅' : '❌'} | 
              Session: {sessionId ? '✅' : '❌'}
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
        </div>
      </div>
      
      {/* Hidden Audio Element for Playback */}
      <AudioElement />
    </div>
  );
};

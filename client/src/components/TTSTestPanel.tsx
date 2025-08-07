import React, { useState } from 'react';
import { useTTS } from '../hooks/useTTS';

export const TTSTestPanel: React.FC = () => {
  const [testText, setTestText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { playAudio, stopAudio, isPlaying, isSupported, getAvailableVoices } = useTTS();

  const testTexts = {
    en: {
      greeting: "Assalamu alaikum! I'm your AI Quran teacher. How can I help you today?",
      recitation: "In the name of Allah, the Most Gracious, the Most Merciful. Praise be to Allah, Lord of all the worlds.",
      feedback: "Your recitation was very good. However, pay attention to the pronunciation of the letter 'Qaf'."
    },
    ar: {
      greeting: "السلام عليكم! أنا معلم القرآن الذكي. كيف يمكنني مساعدتك اليوم؟",
      recitation: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      feedback: "تلاوتك كانت جيدة جداً. ولكن انتبه إلى نطق حرف القاف."
    },
    it: {
      greeting: "Assalamu alaikum! Sono il tuo insegnante AI del Corano. Come posso aiutarti oggi?",
      recitation: "Nel nome di Allah, il Clemente, il Misericordioso. Lode ad Allah, Signore dei mondi.",
      feedback: "La tua recitazione è stata molto buona. Tuttavia, fai attenzione alla pronuncia della lettera 'Qaf'."
    }
  };

  const handleTestTTS = async (text: string) => {
    if (!text.trim()) return;

    // Create a mock TTS instruction
    const ttsInstruction = {
      text: text,
      language: selectedLanguage,
      voiceConfig: {
        language: selectedLanguage === 'ar' ? 'ar-SA' : selectedLanguage === 'it' ? 'it-IT' : 'en-US',
        voiceId: selectedLanguage === 'ar' ? 'male-reverent' : 'female-warm',
        speed: selectedLanguage === 'ar' ? 0.8 : 0.9,
        pitch: selectedLanguage === 'ar' ? 0.9 : 1.0,
        volume: 0.8
      },
      timestamp: Date.now()
    };

    const instructionString = JSON.stringify(ttsInstruction);
    const base64Instruction = btoa(instructionString);
    const ttsData = `tts-instruction:${base64Instruction}`;

    await playAudio(ttsData);
  };

  const handleCustomTest = () => {
    if (testText.trim()) {
      handleTestTTS(testText);
    }
  };

  const voices = getAvailableVoices();

  return (
    <div style={{
      padding: '1rem',
      margin: '1rem 0',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      backgroundColor: '#f9fafb'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#374151', fontWeight: '600' }}>
        🎙️ Multi-Lingual TTS Test Panel
      </h3>

      {/* TTS Support Status */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: isSupported ? '#f0fdf4' : '#fef2f2', borderRadius: '0.25rem' }}>
        <strong>Browser TTS Support:</strong> {isSupported ? '✅ Supported' : '❌ Not Supported'}
        {isSupported && (
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            ({voices.length} voices available)
          </span>
        )}
        {!isSupported && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
            <strong>Note:</strong> This is for testing browser TTS only. The main app uses server-side Gemini TTS which works perfectly regardless of browser support.
          </div>
        )}
      </div>

      {/* Language Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Language:
        </label>
        <select 
          value={selectedLanguage} 
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', marginRight: '1rem' }}
        >
          <option value="en">English (en)</option>
          <option value="ar">Arabic (ar)</option>
          <option value="it">Italian (it)</option>
        </select>
        
        <span style={{ 
          fontSize: '0.875rem', 
          color: isPlaying ? '#dc2626' : '#16a34a',
          fontWeight: '500'
        }}>
          {isPlaying ? '🔊 Playing...' : '🔇 Ready'}
        </span>
      </div>

      {/* Quick Test Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Quick Tests:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTestTTS(testTexts[selectedLanguage as keyof typeof testTexts].greeting)}
            disabled={isPlaying}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            👋 Greeting
          </button>
          <button
            onClick={() => handleTestTTS(testTexts[selectedLanguage as keyof typeof testTexts].recitation)}
            disabled={isPlaying}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            📖 Recitation
          </button>
          <button
            onClick={() => handleTestTTS(testTexts[selectedLanguage as keyof typeof testTexts].feedback)}
            disabled={isPlaying}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            💬 Feedback
          </button>
        </div>
      </div>

      {/* Custom Text Test */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Custom Text Test:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder={`Enter text in ${selectedLanguage === 'ar' ? 'Arabic' : selectedLanguage === 'it' ? 'Italian' : 'English'}...`}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              minHeight: '60px',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={handleCustomTest}
              disabled={isPlaying || !testText.trim()}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            >
              🔊 Test TTS
            </button>
            <button
              onClick={stopAudio}
              disabled={!isPlaying}
              className="btn btn-gray"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            >
              🔇 Stop
            </button>
          </div>
        </div>
      </div>

      {/* Voice Information */}
      {isSupported && voices.length > 0 && (
        <details style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#6b7280' }}>
            Available Voices ({voices.length})
          </summary>
          <div style={{ 
            marginTop: '0.5rem', 
            maxHeight: '150px', 
            overflow: 'auto',
            padding: '0.5rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.25rem'
          }}>
            {voices.map((voice, index) => (
              <div key={index} style={{ 
                padding: '0.25rem 0',
                borderBottom: index < voices.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <strong>{voice.name}</strong> ({voice.lang}) 
                {voice.localService && <span style={{ color: '#16a34a' }}> [Local]</span>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: '#eff6ff', 
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        color: '#1e40af'
      }}>
        <strong>🔧 How it works:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
          <li>Server generates TTS instructions with language-specific voice configurations</li>
          <li>Client receives instructions and uses enhanced Speech Synthesis API</li>
          <li>Voice selection is optimized for each language (Arabic: reverent male, English/Italian: warm female)</li>
          <li>Speech rate, pitch, and volume are adjusted per language for optimal experience</li>
        </ul>
      </div>
    </div>
  );
};

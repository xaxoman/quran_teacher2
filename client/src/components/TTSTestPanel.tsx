import React, { useState } from 'react';
import { useTTS } from '../hooks/useTTS';
import { createMockTTSAudio, getMockTTSMessage } from '../utils/mockTTS';

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

    try {
      console.log(`🎙️ Testing Gemini TTS with: "${text.substring(0, 50)}..." in ${selectedLanguage}`);
      
      // Call the actual Gemini TTS endpoint on the server
      const response = await fetch('/api/tts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language: selectedLanguage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 503) {
          // Service unavailable (quota exceeded)
          console.warn('⚠️ TTS service temporarily unavailable:', errorData?.message || 'Service unavailable');
          alert(`🚫 TTS Service Temporarily Unavailable\n\n${errorData?.message || 'The TTS service is currently unavailable.'}\n\n${errorData?.suggestion || 'Please try again later.'}`);
          return;
        } else if (response.status === 429) {
          // Rate limited
          console.warn('⚠️ API rate limit exceeded');
          alert('🚫 API Rate Limit Exceeded\n\nYou have reached the API quota limit. Please wait before making more requests or consider upgrading your plan.');
          return;
        } else {
          // Other HTTP errors
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('❌ TTS test HTTP error:', response.status, errorText);
          
          // Check if it's a HTML error page
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
            throw new Error(`Server returned HTML error page instead of JSON (HTTP ${response.status})`);
          }
          
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Expected JSON but got:', contentType, responseText.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      
      if (result.success && result.audioData) {
        console.log('✅ Gemini TTS audio received, playing...');
        await playAudio(result.audioData);
      } else {
        console.error('❌ TTS test failed:', result.error || 'Unknown error');
        alert(`❌ TTS Test Failed\n\n${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('❌ Error testing TTS:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ TTS Test Error\n\n${errorMessage}`);
    }
  };

  const handleMockTTS = async (text: string) => {
    if (!text.trim()) return;

    try {
      console.log(`🎵 Creating mock TTS audio for: "${text.substring(0, 50)}..." in ${selectedLanguage}`);
      
      // Create mock audio
      const mockAudio = createMockTTSAudio(text, selectedLanguage);
      const mockMessage = getMockTTSMessage(selectedLanguage);
      
      console.log('✅ Mock TTS audio created, playing...');
      console.log('📢 Message:', mockMessage);
      
      await playAudio(mockAudio);
      
      // Show info about mock audio
      setTimeout(() => {
        alert(`🎵 Mock TTS Demo\n\n${mockMessage}\n\nThis demonstrates the audio playback system when real TTS is unavailable.`);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error with mock TTS:', error);
    }
  };

  const handleCustomTest = () => {
    if (testText.trim()) {
      handleTestTTS(testText);
    }
  };

  const handleMockCustomTest = () => {
    if (testText.trim()) {
      handleMockTTS(testText);
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
        🎙️ Gemini TTS Test Panel
      </h3>

      {/* TTS Support Status */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fffbeb', borderRadius: '0.25rem', border: '1px solid #fbbf24' }}>
        <strong>Gemini TTS Status:</strong> ⚠️ Quota-Limited
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#92400e' }}>
          <strong>Important:</strong> This panel tests the actual Gemini TTS system used by the app. 
          The free tier has a daily limit of 15 requests. If you see quota errors, the limit has been reached.
          <br />
          <strong>Note:</strong> The main app will continue to work with text-only responses when TTS is unavailable.
        </div>
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
          Gemini TTS Tests:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
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
        
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#6b7280' }}>
          Mock Audio Tests (when quota exceeded):
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleMockTTS(testTexts[selectedLanguage as keyof typeof testTexts].greeting)}
            disabled={isPlaying}
            className="btn btn-gray"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            🎵 Mock Greeting
          </button>
          <button
            onClick={() => handleMockTTS(testTexts[selectedLanguage as keyof typeof testTexts].recitation)}
            disabled={isPlaying}
            className="btn btn-gray"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            🎵 Mock Recitation
          </button>
          <button
            onClick={() => handleMockTTS(testTexts[selectedLanguage as keyof typeof testTexts].feedback)}
            disabled={isPlaying}
            className="btn btn-gray"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            🎵 Mock Feedback
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
              onClick={handleMockCustomTest}
              disabled={isPlaying || !testText.trim()}
              className="btn btn-gray"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            >
              🎵 Mock TTS
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
          <li>Calls the actual Gemini TTS API used by the main application</li>
          <li>Generates high-quality audio using Google's AI models with appropriate voices</li>
          <li>Voice selection: English (Puck), Arabic (Aoede), Italian (Kore)</li>
          <li>Audio is returned as data:audio/wav;base64 format and played directly</li>
        </ul>
        
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.25rem', border: '1px solid #f59e0b' }}>
          <strong>⚠️ Quota Information:</strong>
          <ul style={{ marginTop: '0.25rem', marginLeft: '1rem', fontSize: '0.8rem' }}>
            <li>Free tier: 15 TTS requests per day</li>
            <li>Quota resets daily at midnight UTC</li>
            <li>Main app gracefully handles quota limits</li>
            <li>Upgrade to paid plan for unlimited usage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

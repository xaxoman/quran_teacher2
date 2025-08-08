/**
 * Mock TTS utility for testing when Gemini TTS quota is exceeded
 * This creates a simple beep audio for demonstration purposes
 */

export const createMockTTSAudio = (text: string, language: string): string => {
  // Create a simple sine wave audio for demonstration
  const sampleRate = 44100;
  const duration = Math.min(text.length * 0.1, 3); // Max 3 seconds
  const frequency = language === 'ar' ? 440 : language === 'it' ? 523 : 392; // Different tones per language
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);
  
  // Generate sine wave
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  
  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return `data:audio/wav;base64,${btoa(binary)}`;
};

export const getMockTTSMessage = (language: string): string => {
  const messages = {
    en: 'This is a mock audio demo. Gemini TTS quota has been exceeded.',
    ar: 'هذا عرض توضيحي صوتي وهمي. تم تجاوز حصة Gemini TTS.',
    it: 'Questa è una demo audio simulata. La quota Gemini TTS è stata superata.'
  };
  
  return messages[language as keyof typeof messages] || messages.en;
};

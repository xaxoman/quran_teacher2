/**
 * TTSService - Text-to-Speech Service for AI Quran Teacher
 *
 * This service provides high-quality, multi-lingual text-to-speech capabilities
 * by using the dedicated 'synthesizeSpeech' action on the correct TTS model.
 * This version corrects the API endpoint URL to resolve the 404 Not Found error.
 *
 * Features:
 * - Uses the correct, specific text-to-speech API endpoint.
 * - Converts the API's raw PCM audio output to a browser-friendly WAV format.
 * - Meticulously crafted payload and URL to match official documentation.
 */
import axios, { AxiosError } from 'axios';
import * as wav from 'wav';

export class TTSService {
  constructor() {
    // This service uses a direct REST API call.
  }

  /**
   * Generate speech audio from text using the dedicated Gemini synthesizeSpeech endpoint.
   */
  async generateSpeech(text: string, language: string): Promise<string | null> {
    try {
      console.log(`🎙️ Generating TTS via 'synthesizeSpeech' with corrected URL...`);
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ Gemini API key not found in environment variables.');
        return null;
      }
      
      const voiceId = this.getVoiceIdForLanguage(language);
      const fullVoiceName = this.getGeminiVoiceName(voiceId);
      console.log(`🔧 Using Gemini voice: "${fullVoiceName}" for language: ${language}`);

      // FINAL CORRECTED URL: Specifies the model that can perform the 'synthesizeSpeech' action.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:synthesizeSpeech?key=${apiKey}`;

      const requestBody = {
        "text": text,
        "voice": {
          "name": fullVoiceName
        },
        "audio_config": {
          "audio_encoding": "LINEAR16", // Raw PCM audio.
          "sample_rate_hertz": 24000
        }
      };

      const response = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' }
      });

      // The audio data is in the 'audioContent' field.
      const audioData = response.data.audioContent;
      
      if (audioData) {
        console.log('✅ TTS audio data received successfully, converting to WAV...');
        
        // The API returns raw PCM data in base64. Convert it to a WAV file.
        const pcmBuffer = Buffer.from(audioData, 'base64');
        const wavBase64 = await this.convertPCMToWav(pcmBuffer);
        
        // Return as a data URL for easy playback in the browser.
        return `data:audio/wav;base64,${wavBase64}`;
      } else {
        console.log('❌ No audio data received from Gemini TTS API.');
        if (response.data.error) {
          console.error('API Error:', JSON.stringify(response.data.error, null, 2));
        }
        return null;
      }
      
    } catch (error) {
      console.error('❌ An error occurred while generating TTS audio via REST API:');
      if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
              console.error('Error Status:', axiosError.response.status);
              console.error('Error Data:', JSON.stringify(axiosError.response.data, null, 2));
          } else if (axiosError.request) {
              console.error('Error Request: No response was received. Check network connectivity.');
          } else {
              console.error('Axios Setup Error:', axiosError.message);
          }
      } else if (error instanceof Error) {
        console.error('Generic Error:', error.message);
      } else {
        console.error('Unknown Error:', error);
      }
      return null;
    }
  }

  /**
   * Convert raw PCM audio data to a WAV container and return as base64.
   */
  private async convertPCMToWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('data', (chunk) => chunks.push(chunk));
      writer.on('finish', () => resolve(Buffer.concat(chunks).toString('base64')));
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  /**
   * Get the full, correctly formatted Gemini voice name.
   */
  private getGeminiVoiceName(voiceId: string): string {
    const voiceMap: Record<string, string> = {
      'female-warm': 'Puck',
      'female-teacher': 'Charon',
      'female-friendly': 'Kore',
      'male-professional': 'Fenrir',
      'male-reverent': 'Aoede'
    };

    const voiceName = voiceMap[voiceId] || 'Kore'; // Default to Kore

    // Returns the full path required by the API.
    return `voices/gemini-2.5-flash-preview-tts/${voiceName}`;
  }

  private getVoiceIdForLanguage(language: string): string {
    const voiceConfigs: Record<string, string> = {
      'en': 'female-warm',
      'ar': 'male-reverent',
      'it': 'female-friendly'
    };

    return voiceConfigs[language] || voiceConfigs['en'];
  }
}
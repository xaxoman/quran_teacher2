/**
 * TTSService - Text-to-Speech Service for AI Quran Teacher
 * 
 * This service provides high-quality, multi-lingual text-to-speech capabilities
 * using Google Gemini's real TTS API (gemini-2.5-flash-preview-tts model).
 * 
 * Features:
 * - Real Gemini TTS with realistic voices (Kore, Aoede, Puck, Charon, Fenrir)
 * - Multi-lingual support (English, Arabic, Italian)
 * - PCM to WAV conversion for browser compatibility
 * - Language-specific voice configurations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import * as wav from 'wav';
import * as fs from 'fs';
import * as path from 'path';

export interface VoiceConfig {
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  voiceName?: string;
}

export class TTSService {
  private genAI: GoogleGenerativeAI;
  private genAITTS: GoogleGenAI; // New TTS-capable AI client

  constructor(genAI: GoogleGenerativeAI) {
    this.genAI = genAI;
    // Initialize the TTS-capable AI client
    // Note: The API key should be the same as used in GoogleGenerativeAI
    this.genAITTS = new GoogleGenAI({});
  }

  /**
   * Generate speech audio from text using Gemini's TTS capabilities
   */
  async generateSpeech(text: string, language: string): Promise<string | null> {
    try {
      console.log(`🎙️ Generating TTS for: "${text.substring(0, 50)}..." in ${language}`);
      
      const voiceConfig = this.getVoiceConfig(language);
      console.log('🔧 Voice config:', voiceConfig);

      // Use real Gemini TTS API only - no fallbacks
      const audioData = await this.generateWithGeminiTTS(text, voiceConfig);
      
      if (audioData) {
        console.log('✅ Gemini TTS audio generated successfully');
        return audioData;
      } else {
        console.log('❌ Gemini TTS failed - no fallback available');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error generating TTS audio:', error);
      // No fallback - return null if Gemini TTS fails
      return null;
    }
  }

  /**
   * Generate speech using real Gemini TTS API
   */
  private async generateWithGeminiTTS(text: string, voiceConfig: VoiceConfig): Promise<string | null> {
    try {
      console.log('🎤 Using real Gemini TTS API for audio generation...');
      
      // Get the appropriate Gemini voice name
      const voiceName = this.getGeminiVoiceName(voiceConfig.language, voiceConfig.voiceId);
      console.log(`🎯 Using Gemini voice: ${voiceName} for ${voiceConfig.language}`);

      // Use the correct API structure from your example
      const response = await this.genAITTS.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      // Extract the audio data
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        console.log('✅ Gemini TTS audio data received, converting to WAV...');
        
        // Convert base64 PCM to WAV and return as base64
        const pcmBuffer = Buffer.from(audioData, 'base64');
        const wavBase64 = await this.convertPCMToWav(pcmBuffer);
        
        // Return as data URL for audio playback
        return `data:audio/wav;base64,${wavBase64}`;
      } else {
        console.log('❌ No audio data received from Gemini TTS');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error with Gemini TTS API:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }

  /**
   * Convert PCM audio data to WAV format and return as base64
   */
  private async convertPCMToWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('data', (chunk) => {
        chunks.push(chunk);
      });

      writer.on('finish', () => {
        const wavBuffer = Buffer.concat(chunks);
        const base64 = wavBuffer.toString('base64');
        resolve(base64);
      });

      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  /**
   * Get appropriate Gemini voice name based on language and voice ID
   */
  private getGeminiVoiceName(language: string, voiceId: string): string {
    const voiceMap: Record<string, Record<string, string>> = {
      'en-US': {
        'female-warm': 'Puck',
        'female-teacher': 'Charon',
        'female-friendly': 'Kore',
        'male-professional': 'Fenrir',
        'male-reverent': 'Aoede'
      },
      'ar-SA': {
        'male-reverent': 'Aoede', // Best available for Arabic
        'male-reciter': 'Fenrir',
        'female-teacher': 'Charon'
      },
      'it-IT': {
        'female-friendly': 'Kore',
        'female-warm': 'Puck',
        'male-expressive': 'Fenrir'
      }
    };

    const languageVoices = voiceMap[language] || voiceMap['en-US'];
    return languageVoices[voiceId] || 'Kore'; // Default to Kore
  }

  private getVoiceConfig(language: string): VoiceConfig {
    const voiceConfigs: Record<string, VoiceConfig> = {
      'en': {
        language: 'en-US',
        voiceId: 'female-warm',
        speed: 0.9,
        pitch: 1.0,
        volume: 0.8,
        voiceName: 'Kore' // Gemini voice for when API is available
      },
      'ar': {
        language: 'ar-SA',
        voiceId: 'male-reverent',
        speed: 0.8, // Slower for clear Quranic pronunciation
        pitch: 0.9, // Slightly lower for authority
        volume: 0.9,
        voiceName: 'Aoede' // Best available for Arabic pronunciation
      },
      'it': {
        language: 'it-IT',
        voiceId: 'female-friendly',
        speed: 0.9,
        pitch: 1.1,
        volume: 0.8,
        voiceName: 'Kore' // Good for Italian
      }
    };

    return voiceConfigs[language] || voiceConfigs['en'];
  }

  /**
   * Get available voices for a specific language
   */
  getAvailableVoices(language: string): string[] {
    const voicesByLanguage: Record<string, string[]> = {
      'en': ['female-warm', 'male-professional', 'female-teacher'],
      'ar': ['male-reverent', 'male-reciter', 'female-teacher'],
      'it': ['female-friendly', 'male-expressive', 'female-teacher']
    };

    return voicesByLanguage[language] || voicesByLanguage['en'];
  }

  /**
   * Validate if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return ['en', 'ar', 'it'].includes(language);
  }
}

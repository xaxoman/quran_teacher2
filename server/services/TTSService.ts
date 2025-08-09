import axios, { AxiosError } from 'axios';

export class TTSService {
  constructor() {}

  /**
   * Generate speech audio from text using the Gemini 'generateContent' endpoint
   * with a specified audio response modality. This is a modern, multi-modal approach.
   */
  async generateSpeech(text: string, language: string): Promise<string | null> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ Gemini API key not found in environment variables.');
        return null;
      }

      const voiceName = this.getVoiceForLanguage(language);
      console.log(`🎙️ Generating TTS via 'generateContent' with voice: "${voiceName}"`);

      // This endpoint uses the multi-modal 'generateContent' method on a TTS-capable model
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

      const requestBody = {
        // The text prompt to be synthesized
        contents: [{
          parts: [{ text }]
        }],
        // Configuration to specify that we want an audio response
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              // Selects the pre-built voice for the synthesis
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      };

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          // Use the x-goog-api-key header for authentication
          'x-goog-api-key': apiKey,
        },
      });

      // Extract the audio data from the API response
      const candidate = response.data.candidates?.[0];
      const audioPart = candidate?.content?.parts?.[0];
      const audioDataBase64 = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType; // e.g., "audio/wav" or "audio/mp3"

      if (audioDataBase64 && mimeType) {
        console.log(`✅ TTS audio received successfully (MIME type: ${mimeType})`);
        
        // Check if the format is L16 PCM and needs conversion
        if (mimeType.includes('audio/L16') || mimeType.includes('codec=pcm')) {
          console.log('🔄 Converting L16 PCM to WAV format for browser compatibility...');
          try {
            const wavData = this.convertPCMToWAV(audioDataBase64);
            return `data:audio/wav;base64,${wavData}`;
          } catch (conversionError) {
            console.error('❌ Failed to convert PCM to WAV:', conversionError);
            // Return null rather than unusable audio
            return null;
          }
        }
        
        // Return a Data URL, which is directly playable in the browser's <audio> tag
        return `data:${mimeType};base64,${audioDataBase64}`;
      } else {
        // Enhanced error logging for TTS failures
        console.error('❌ No audio content found in API response.');
        console.error('🔍 Response details:', JSON.stringify(response.data, null, 2));
        
        if (candidate?.finishReason) {
          console.error(`📋 Finish reason: ${candidate.finishReason}`);
          
          if (candidate.finishReason === 'OTHER') {
            console.error('💡 TTS failed - this could be due to:');
            console.error('   • Quota exceeded (free tier: 15 requests/day)');
            console.error('   • Content contains unsupported characters or formatting');
            console.error('   • Text is too long for TTS generation');
            console.error('   • API service temporarily unavailable');
            console.error('🔗 Check quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ An error occurred during the TTS API call:');
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const status = axiosError.response.status;
          const errorData = axiosError.response.data as any;
          
          console.error('Error Status:', status);
          console.error('Error Data:', JSON.stringify(errorData, null, 2));
          
          // Handle quota exceeded gracefully
          if (status === 429) {
            const quotaDetails = errorData?.error?.details?.find((d: any) => 
              d['@type']?.includes('QuotaFailure'));
            const retryInfo = errorData?.error?.details?.find((d: any) => 
              d['@type']?.includes('RetryInfo'));
            
            if (quotaDetails) {
              console.log('📊 Quota Information:');
              quotaDetails.violations?.forEach((violation: any) => {
                console.log(`   • Metric: ${violation.quotaMetric}`);
                console.log(`   • Limit: ${violation.quotaValue} requests`);
                console.log(`   • Model: ${violation.quotaDimensions?.model}`);
              });
            }
            
            if (retryInfo?.retryDelay) {
              console.log(`⏰ Suggested retry delay: ${retryInfo.retryDelay}`);
            }
            
            console.log('💡 Consider upgrading to a paid plan for higher quotas');
            console.log('🔗 More info: https://ai.google.dev/gemini-api/docs/rate-limits');
          }
        } else {
          console.error('Error Request:', axiosError.request);
        }
      } else {
        console.error('Unknown Error:', error);
      }
      return null;
    }
  }

  /**
   * Selects the appropriate pre-built voice for the given language.
   */
  private getVoiceForLanguage(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'Puck',           // A good general-purpose English voice
      'ar': 'Aoede',          // A voice suitable for formal Arabic
      'it': 'Kore'            // A standard Italian voice
    };
    return voiceMap[language] || 'Kore'; // Default to Kore
  }

  /**
   * Convert PCM audio data to WAV format for browser compatibility
   */
  private convertPCMToWAV(pcmBase64: string): string {
    try {
      // Decode base64 PCM data
      const pcmBuffer = Buffer.from(pcmBase64, 'base64');
      
      // WAV header for 16-bit PCM, 24kHz, mono
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * bitsPerSample / 8;
      const blockAlign = numChannels * bitsPerSample / 8;
      const dataSize = pcmBuffer.length;
      const fileSize = dataSize + 36;

      // Create WAV header
      const header = Buffer.alloc(44);
      let offset = 0;

      // ChunkID "RIFF"
      header.write('RIFF', offset); offset += 4;
      // ChunkSize
      header.writeUInt32LE(fileSize, offset); offset += 4;
      // Format "WAVE"
      header.write('WAVE', offset); offset += 4;
      // Subchunk1ID "fmt "
      header.write('fmt ', offset); offset += 4;
      // Subchunk1Size (16 for PCM)
      header.writeUInt32LE(16, offset); offset += 4;
      // AudioFormat (1 for PCM)
      header.writeUInt16LE(1, offset); offset += 2;
      // NumChannels
      header.writeUInt16LE(numChannels, offset); offset += 2;
      // SampleRate
      header.writeUInt32LE(sampleRate, offset); offset += 4;
      // ByteRate
      header.writeUInt32LE(byteRate, offset); offset += 4;
      // BlockAlign
      header.writeUInt16LE(blockAlign, offset); offset += 2;
      // BitsPerSample
      header.writeUInt16LE(bitsPerSample, offset); offset += 2;
      // Subchunk2ID "data"
      header.write('data', offset); offset += 4;
      // Subchunk2Size
      header.writeUInt32LE(dataSize, offset);

      // Combine header and PCM data
      const wavBuffer = Buffer.concat([header, pcmBuffer]);
      
      return wavBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting PCM to WAV:', error);
      throw error;
    }
  }
}
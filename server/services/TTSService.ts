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
      const audioPart = response.data.candidates?.[0]?.content?.parts?.[0];
      const audioDataBase64 = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType; // e.g., "audio/wav" or "audio/mp3"

      if (audioDataBase64 && mimeType) {
        console.log(`✅ TTS audio received successfully (MIME type: ${mimeType})`);
        // Return a Data URL, which is directly playable in the browser's <audio> tag
        return `data:${mimeType};base64,${audioDataBase64}`;
      } else {
        console.error('❌ No audio content found in API response.', JSON.stringify(response.data, null, 2));
        return null;
      }
    } catch (error) {
      console.error('❌ An error occurred during the TTS API call:');
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error('Error Status:', axiosError.response.status);
          console.error('Error Data:', JSON.stringify(axiosError.response.data, null, 2));
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
}
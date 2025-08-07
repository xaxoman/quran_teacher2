import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Session } from '../types/Session';

export class RecitationService {
  private model: GenerativeModel;
  private genAI: GoogleGenerativeAI;

  constructor(genAI: GoogleGenerativeAI) {
    this.genAI = genAI;
    // Use gemini-2.5-flash for the newer and more advanced model
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async getGreeting(language: string): Promise<{ text: string, audio?: string }> {
    const greetings = {
      en: "Assalamu alaikum! I'm your AI Quran teacher. Which Surah or section would you like to practice today?",
      ar: "السلام عليكم! أنا معلم القرآن الذكي. أي سورة أو قسم تريد أن تمارسه اليوم؟",
      it: "Assalamu alaikum! Sono il tuo insegnante AI del Corano. Quale Sura o sezione vorresti praticare oggi?"
    };

    const greetingText = greetings[language as keyof typeof greetings] || greetings.en;
    
    // Audio generation is temporarily disabled until proper TTS integration
    // try {
    //   const audioResponse = await this.generateAudio(greetingText, language);
    //   return {
    //     text: greetingText,
    //     audio: audioResponse
    //   };
    // } catch (error) {
    //   console.error('Error generating greeting audio:', error);
    //   return { text: greetingText };
    // }
    
    return { text: greetingText };
  }

  async processAudio(audioData: ArrayBuffer, session: Session, isComplete: boolean): Promise<any> {
    try {
      // Convert audio to text using speech recognition
      const transcription = await this.transcribeAudio(audioData);
      
      if (!transcription) {
        return {
          type: 'clarification',
          text: this.getClarificationMessage(session.language)
          // audio: await this.generateAudio(this.getClarificationMessage(session.language), session.language)
        };
      }

      // Update session with the transcription
      session.lastRecitation = transcription;
      session.recitationHistory.push(transcription);

      // Check if user is asking for feedback
      if (this.isAskingForFeedback(transcription, session.language)) {
        return await this.provideFeedback(session);
      }

      // Check if user needs assistance (paused too long or incomplete)
      if (this.needsAssistance(transcription, session)) {
        return await this.provideContinuation(session);
      }

      // Process as normal recitation
      return await this.processRecitation(transcription, session);

    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  async processText(text: string, session: Session): Promise<any> {
    try {
      console.log('📝 Processing text input:', text);
      console.log('📋 Session details:', {
        id: session.id,
        surah: session.surah,
        language: session.language,
        historyLength: session.recitationHistory.length
      });

      // Update session
      session.lastRecitation = text;
      session.recitationHistory.push(text);

      // Check if asking for feedback
      const askingForFeedback = this.isAskingForFeedback(text, session.language);
      console.log('🤔 Is asking for feedback?', askingForFeedback);
      
      if (askingForFeedback) {
        console.log('💬 Providing feedback...');
        return await this.provideFeedback(session);
      }

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const prompt = this.buildPrompt(text, session);
      console.log('📝 Prompt:', prompt.substring(0, 200) + '...');
      
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      console.log('✅ AI response generated:', responseText.substring(0, 100) + '...');

      // Audio generation temporarily disabled
      // const audioResponse = await this.generateAudio(responseText, session.language);

      const response = {
        type: 'response',
        text: responseText,
        // audio: audioResponse,
        transcription: text
      };

      console.log('📤 Returning response:', {
        type: response.type,
        textLength: response.text?.length,
        transcription: response.transcription
      });

      return response;

    } catch (error) {
      console.error('❌ Error processing text:', error);
      throw error;
    }
  }

  async provideFeedback(session: Session): Promise<any> {
    try {
      const feedbackPrompt = this.buildFeedbackPrompt(session);
      const result = await this.model.generateContent(feedbackPrompt);
      const feedbackText = result.response.text();

      // Audio generation temporarily disabled
      // const audioResponse = await this.generateAudio(feedbackText, session.language);

      return {
        type: 'feedback',
        text: feedbackText
        // audio: audioResponse
      };
    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  private async generateAudio(text: string, language: string): Promise<string | undefined> {
    // Audio generation is temporarily disabled
    // TODO: Implement proper TTS service (e.g., Google Text-to-Speech, AWS Polly, or browser's speechSynthesis)
    console.log(`[Audio disabled] Would generate audio for: "${text.substring(0, 50)}..." in ${language}`);
    return undefined;
    
    // Original implementation commented out until proper TTS service is integrated:
    // try {
    //   const voiceConfig = this.getVoiceConfig(language);
    //   const prompt = `Generate natural speech audio for: "${text}" using ${voiceConfig}`;
    //   const result = await this.ttsModel.generateContent(prompt);
    //   return result.response.text();
    // } catch (error) {
    //   console.error('Error generating audio:', error);
    //   return undefined;
    // }
  }

  private async transcribeAudio(audioData: ArrayBuffer): Promise<string | null> {
    // In a real implementation, you would use Web Speech API on the client side
    // or integrate with a speech-to-text service here
    // For now, return null to simulate unclear audio
    return null;
  }

  private buildPrompt(recitation: string, session: Session): string {
    return `
You are an expert Quranic teacher and companion. The user is practicing recitation of ${session.surah || 'the Quran'}.

Current recitation: "${recitation}"
Language: ${session.language}
Previous recitations: ${session.recitationHistory.slice(-3).join(', ')}

Guidelines:
1. If the user pauses or seems stuck, provide the next part of the verse in clear Arabic
2. Be patient and encouraging
3. Don't correct unless explicitly asked
4. Respond in ${session.language === 'ar' ? 'Arabic' : session.language === 'it' ? 'Italian' : 'English'}
5. If they're asking a question about the Quran, provide a helpful answer

Provide a supportive response:`;
  }

  private buildFeedbackPrompt(session: Session): string {
    return `
You are an expert Quranic teacher providing feedback on recitation.

Last recitation: "${session.lastRecitation}"
Recitation history: ${session.recitationHistory.join(', ')}
Surah: ${session.surah}
Language: ${session.language}

Please provide:
1. Honest and constructive feedback
2. Specific corrections if there were mistakes
3. Correct pronunciation guidance
4. Encouragement

Respond in ${session.language === 'ar' ? 'Arabic' : session.language === 'it' ? 'Italian' : 'English'}:`;
  }

  private async provideContinuation(session: Session): Promise<any> {
    try {
      const continuationPrompt = `
Provide the next part of the Quranic verse for ${session.surah}. 
The user seems to need help continuing their recitation.
Last recited: "${session.lastRecitation}"

Provide the continuation in clear, classical Arabic, followed by a brief encouraging message in ${session.language === 'ar' ? 'Arabic' : session.language === 'it' ? 'Italian' : 'English'}.`;

      const result = await this.model.generateContent(continuationPrompt);
      const responseText = result.response.text();
      // Audio generation temporarily disabled
      // const audioResponse = await this.generateAudio(responseText, session.language);

      return {
        type: 'continuation',
        text: responseText
        // audio: audioResponse
      };
    } catch (error) {
      console.error('Error providing continuation:', error);
      throw error;
    }
  }

  private async processRecitation(recitation: string, session: Session): Promise<any> {
    const prompt = this.buildPrompt(recitation, session);
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    // Audio generation temporarily disabled
    // const audioResponse = await this.generateAudio(responseText, session.language);

    return {
      type: 'acknowledgment',
      text: responseText,
      // audio: audioResponse,
      transcription: recitation
    };
  }

  private isAskingForFeedback(text: string, language: string): boolean {
    const feedbackKeywords = {
      en: ['mistake', 'correct', 'wrong', 'feedback', 'how did i do'],
      ar: ['خطأ', 'صحيح', 'غلط', 'تقييم'],
      it: ['sbaglio', 'corretto', 'errore', 'feedback']
    };

    const keywords = feedbackKeywords[language as keyof typeof feedbackKeywords] || feedbackKeywords.en;
    return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private needsAssistance(transcription: string, session: Session): boolean {
    // Logic to determine if user needs help
    // This could be based on silence duration, incomplete verses, etc.
    return transcription.length < 10 || transcription.includes('...');
  }

  private getClarificationMessage(language: string): string {
    const messages = {
      en: "I didn't understand clearly. Could you please repeat the last part?",
      ar: "لم أفهم بوضوح. هل يمكنك إعادة الجزء الأخير؟",
      it: "Non ho capito chiaramente. Potresti ripetere l'ultima parte?"
    };

    return messages[language as keyof typeof messages] || messages.en;
  }

  private getVoiceConfig(language: string): string {
    const configs = {
      en: 'a clear, warm English voice',
      ar: 'a clear, respectful Arabic voice suitable for Quranic recitation',
      it: 'a clear, warm Italian voice'
    };

    return configs[language as keyof typeof configs] || configs.en;
  }
}

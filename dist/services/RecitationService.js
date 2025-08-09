"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecitationService = void 0;
const TTSService_1 = require("./TTSService");
class RecitationService {
    constructor(genAI) {
        this.genAI = genAI;
        // Use gemini-2.5-flash for the newer and more advanced model
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        // Use gemini-2.5-flash-preview-tts for high-quality TTS
        this.ttsModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });
        // Initialize TTS service - no longer needs genAI instance
        this.ttsService = new TTSService_1.TTSService();
    }
    async getGreeting(language) {
        const greetings = {
            en: "Assalamu alaikum! I'm your AI Quran teacher. Which Surah or section would you like to practice today?",
            ar: "السلام عليكم! أنا معلم القرآن الذكي. أي سورة أو قسم تريد أن تمارسه اليوم؟",
            it: "Assalamu alaikum! Sono il tuo insegnante AI del Corano. Quale Sura o sezione vorresti praticare oggi?"
        };
        const greetingText = greetings[language] || greetings.en;
        // Generate audio using the updated TTS Service
        try {
            console.log('🔊 Generating greeting audio using updated TTS Service...');
            const audioResponse = await this.generateAudio(greetingText, language);
            return {
                text: greetingText,
                audio: audioResponse
            };
        }
        catch (error) {
            console.error('❌ Error generating greeting audio:', error);
            return { text: greetingText };
        }
    }
    async processAudio(audioData, session, isComplete) {
        try {
            // Convert audio to text using speech recognition
            const transcription = await this.transcribeAudio(audioData);
            if (!transcription) {
                const clarificationMessage = this.getClarificationMessage(session.language);
                const clarificationAudio = await this.generateAudio(clarificationMessage, session.language);
                return {
                    type: 'clarification',
                    text: clarificationMessage,
                    audio: clarificationAudio
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
        }
        catch (error) {
            console.error('Error processing audio:', error);
            throw error;
        }
    }
    async processText(text, session) {
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
            // Generate audio for the response
            console.log('🔊 Generating audio for AI response...');
            const audioResponse = await this.generateAudio(responseText, session.language);
            const response = {
                type: 'response',
                text: responseText,
                audio: audioResponse,
                transcription: text
            };
            console.log('📤 Returning response:', {
                type: response.type,
                textLength: response.text?.length,
                transcription: response.transcription
            });
            return response;
        }
        catch (error) {
            console.error('❌ Error processing text:', error);
            throw error;
        }
    }
    async provideFeedback(session) {
        try {
            const feedbackPrompt = this.buildFeedbackPrompt(session);
            const result = await this.model.generateContent(feedbackPrompt);
            const feedbackText = result.response.text();
            // Generate audio for feedback
            console.log('🔊 Generating audio for feedback...');
            const audioResponse = await this.generateAudio(feedbackText, session.language);
            return {
                type: 'feedback',
                text: feedbackText,
                audio: audioResponse
            };
        }
        catch (error) {
            console.error('Error providing feedback:', error);
            throw error;
        }
    }
    async generateAudio(text, language) {
        try {
            console.log(`🎙️ Generating TTS for: "${text.substring(0, 50)}..." in ${language}`);
            // Use the new TTS service for better audio generation
            const audioData = await this.ttsService.generateSpeech(text, language);
            if (audioData) {
                console.log('✅ TTS audio generated successfully');
                return audioData;
            }
            else {
                console.log('⚠️ TTS generation returned null, no audio will be played');
                return undefined;
            }
        }
        catch (error) {
            console.error('❌ Error generating TTS audio:', error);
            // Return undefined if TTS fails, so the app continues to work with text only
            return undefined;
        }
    }
    convertToBase64Audio(audioData) {
        try {
            // If the audioData is already a valid audio URL or base64, return it
            if (audioData.startsWith('data:audio/') || audioData.startsWith('http')) {
                return audioData;
            }
            // Otherwise, assume it's raw audio data and convert to base64
            const base64 = Buffer.from(audioData, 'utf8').toString('base64');
            return `data:audio/wav;base64,${base64}`;
        }
        catch (error) {
            console.error('Error converting audio to base64:', error);
            return '';
        }
    }
    async transcribeAudio(audioData) {
        // In a real implementation, you would use Web Speech API on the client side
        // or integrate with a speech-to-text service here
        // For now, return null to simulate unclear audio
        return null;
    }
    buildPrompt(recitation, session) {
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
    buildFeedbackPrompt(session) {
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
    async provideContinuation(session) {
        try {
            const continuationPrompt = `
Provide the next part of the Quranic verse for ${session.surah}. 
The user seems to need help continuing their recitation.
Last recited: "${session.lastRecitation}"

Provide the continuation in clear, classical Arabic, followed by a brief encouraging message in ${session.language === 'ar' ? 'Arabic' : session.language === 'it' ? 'Italian' : 'English'}.`;
            const result = await this.model.generateContent(continuationPrompt);
            const responseText = result.response.text();
            // Generate audio for continuation
            console.log('🔊 Generating audio for continuation...');
            const audioResponse = await this.generateAudio(responseText, session.language);
            return {
                type: 'continuation',
                text: responseText,
                audio: audioResponse
            };
        }
        catch (error) {
            console.error('Error providing continuation:', error);
            throw error;
        }
    }
    async processRecitation(recitation, session) {
        const prompt = this.buildPrompt(recitation, session);
        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();
        // Generate audio for recitation response
        console.log('🔊 Generating audio for recitation response...');
        const audioResponse = await this.generateAudio(responseText, session.language);
        return {
            type: 'acknowledgment',
            text: responseText,
            audio: audioResponse,
            transcription: recitation
        };
    }
    isAskingForFeedback(text, language) {
        const feedbackKeywords = {
            en: ['mistake', 'correct', 'wrong', 'feedback', 'how did i do'],
            ar: ['خطأ', 'صحيح', 'غلط', 'تقييم'],
            it: ['sbaglio', 'corretto', 'errore', 'feedback']
        };
        const keywords = feedbackKeywords[language] || feedbackKeywords.en;
        return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
    }
    needsAssistance(transcription, session) {
        // Logic to determine if user needs help
        // This could be based on silence duration, incomplete verses, etc.
        return transcription.length < 10 || transcription.includes('...');
    }
    getClarificationMessage(language) {
        const messages = {
            en: "I didn't understand clearly. Could you please repeat the last part?",
            ar: "لم أفهم بوضوح. هل يمكنك إعادة الجزء الأخير؟",
            it: "Non ho capito chiaramente. Potresti ripetere l'ultima parte?"
        };
        return messages[language] || messages.en;
    }
}
exports.RecitationService = RecitationService;
//# sourceMappingURL=RecitationService.js.map
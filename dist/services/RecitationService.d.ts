import { GoogleGenerativeAI } from '@google/generative-ai';
import { Session } from '../types/Session';
export declare class RecitationService {
    private model;
    private ttsModel;
    private genAI;
    private ttsService;
    constructor(genAI: GoogleGenerativeAI);
    getGreeting(language: string): Promise<{
        text: string;
        audio?: string;
    }>;
    processAudio(audioData: ArrayBuffer, session: Session, isComplete: boolean): Promise<any>;
    processText(text: string, session: Session): Promise<any>;
    provideFeedback(session: Session): Promise<any>;
    generateAudio(text: string, language: string): Promise<string | undefined>;
    private convertToBase64Audio;
    private transcribeAudio;
    private buildPrompt;
    private buildFeedbackPrompt;
    private provideContinuation;
    private processRecitation;
    private isAskingForFeedback;
    private needsAssistance;
    private getClarificationMessage;
}
//# sourceMappingURL=RecitationService.d.ts.map
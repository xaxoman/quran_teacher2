export declare class TTSService {
    constructor();
    /**
     * Generate speech audio from text using the Gemini 'generateContent' endpoint
     * with a specified audio response modality. This is a modern, multi-modal approach.
     */
    generateSpeech(text: string, language: string): Promise<string | null>;
    /**
     * Selects the appropriate pre-built voice for the given language.
     */
    private getVoiceForLanguage;
    /**
     * Convert PCM audio data to WAV format for browser compatibility
     */
    private convertPCMToWAV;
}
//# sourceMappingURL=TTSService.d.ts.map
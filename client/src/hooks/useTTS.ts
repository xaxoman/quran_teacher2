import { useCallback, useRef, useState } from 'react';

interface TTSConfig {
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

interface TTSInstruction {
  text: string;
  language: string;
  voiceConfig: TTSConfig;
  timestamp: number;
}

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check TTS support on mount
  useState(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      console.log('🔊 TTS supported, checking voices...');
      
      // Wait for voices to load
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('🎯 Available voices:', voices.length);
        if (voices.length > 0) {
          voices.forEach((voice, index) => {
            console.log(`Voice ${index}: ${voice.name} (${voice.lang})`);
          });
        }
      };

      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  });

  /**
   * Play audio from server-provided audio data or TTS instruction
   */
  const playAudio = useCallback(async (audioData: string | undefined) => {
    if (!audioData) {
      console.log('❌ No audio data provided');
      return;
    }

    try {
      // Check if this is a TTS instruction
      if (audioData.startsWith('tts-instruction:')) {
        const instructionBase64 = audioData.replace('tts-instruction:', '');
        const instructionJson = atob(instructionBase64);
        const instruction: TTSInstruction = JSON.parse(instructionJson);
        
        console.log('🎙️ Processing TTS instruction:', instruction);
        await playWithSpeechSynthesis(instruction);
        return;
      }

      // Check if it's a regular base64 audio
      if (audioData.startsWith('data:audio/')) {
        await playBase64Audio(audioData);
        return;
      }

      console.log('⚠️ Unknown audio format, skipping playback');
      
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  }, []);

  /**
   * Play audio using enhanced Speech Synthesis with better voice selection
   */
  const playWithSpeechSynthesis = useCallback(async (instruction: TTSInstruction) => {
    if (!isSupported) {
      console.log('❌ Speech synthesis not supported');
      return;
    }

    try {
      // Stop any current playback
      if (currentUtteranceRef.current) {
        speechSynthesis.cancel();
      }

      setIsPlaying(true);
      
      const utterance = new SpeechSynthesisUtterance(instruction.text);
      currentUtteranceRef.current = utterance;

      // Get and set the best voice for the language
      const voice = getBestVoice(instruction.language, instruction.voiceConfig.voiceId);
      if (voice) {
        utterance.voice = voice;
        console.log(`🎯 Using voice: ${voice.name} (${voice.lang})`);
      }

      // Configure voice parameters
      utterance.rate = instruction.voiceConfig.speed;
      utterance.pitch = instruction.voiceConfig.pitch;
      utterance.volume = instruction.voiceConfig.volume;
      utterance.lang = instruction.voiceConfig.language;

      // Set up event handlers
      utterance.onstart = () => {
        console.log('🔊 TTS playback started');
        setIsPlaying(true);
      };

      utterance.onend = () => {
        console.log('✅ TTS playback completed');
        setIsPlaying(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('❌ TTS playback error:', event.error);
        setIsPlaying(false);
        currentUtteranceRef.current = null;
      };

      // Start playback
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('❌ Error in speech synthesis:', error);
      setIsPlaying(false);
    }
  }, [isSupported]);

  /**
   * Play base64 encoded audio
   */
  const playBase64Audio = useCallback(async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = base64Audio;
      
      audio.onloadeddata = () => {
        console.log('🔊 Base64 audio loaded, starting playback');
      };

      audio.onended = () => {
        console.log('✅ Base64 audio playback completed');
        setIsPlaying(false);
      };

      audio.onerror = (error) => {
        console.error('❌ Base64 audio playback error:', error);
        setIsPlaying(false);
      };

      await audio.play();

    } catch (error) {
      console.error('❌ Error playing base64 audio:', error);
      setIsPlaying(false);
    }
  }, []);

  /**
   * Stop current audio playback
   */
  const stopAudio = useCallback(() => {
    try {
      // Stop speech synthesis
      if (currentUtteranceRef.current) {
        speechSynthesis.cancel();
        currentUtteranceRef.current = null;
      }

      // Stop regular audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setIsPlaying(false);
      console.log('🔇 Audio playback stopped');

    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  }, []);

  /**
   * Get the best available voice for a language and voice type
   */
  const getBestVoice = (language: string, voiceId: string): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      console.log('⚠️ No voices available yet, they may load asynchronously');
      return null;
    }

    // Enhanced language mapping for better voice selection
    const languageMap: Record<string, string[]> = {
      'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'],
      'ar': ['ar-SA', 'ar-EG', 'ar-AE', 'ar-MA', 'ar-DZ', 'ar'],
      'it': ['it-IT', 'it-CH', 'it']
    };

    const targetLangs = languageMap[language] || ['en'];
    
    // Enhanced voice preference system with more criteria
    const voicePreferences: Record<string, (voice: SpeechSynthesisVoice) => number> = {
      'female-warm': (voice) => {
        let score = 1;
        const nameLower = voice.name.toLowerCase();
        if (nameLower.includes('female')) score += 3;
        if (nameLower.includes('samantha') || nameLower.includes('karen') || nameLower.includes('victoria')) score += 3;
        if (nameLower.includes('zira') || nameLower.includes('susan') || nameLower.includes('allison')) score += 2;
        if (voice.localService) score += 1;
        return score;
      },
      'male-reverent': (voice) => {
        let score = 1;
        const nameLower = voice.name.toLowerCase();
        if (nameLower.includes('male')) score += 3;
        if (nameLower.includes('david') || nameLower.includes('alex') || nameLower.includes('diego')) score += 3;
        if (nameLower.includes('mark') || nameLower.includes('jorge') || nameLower.includes('thomas')) score += 2;
        if (voice.localService) score += 1;
        return score;
      },
      'female-friendly': (voice) => {
        let score = 1;
        const nameLower = voice.name.toLowerCase();
        if (nameLower.includes('female')) score += 3;
        if (nameLower.includes('alice') || nameLower.includes('fiona') || nameLower.includes('kate')) score += 3;
        if (nameLower.includes('moira') || nameLower.includes('tessa') || nameLower.includes('emily')) score += 2;
        if (voice.localService) score += 1;
        return score;
      }
    };

    const getScore = voicePreferences[voiceId] || (() => 1);

    // Find the best voice with enhanced scoring
    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = 0;

    for (const voice of voices) {
      for (const lang of targetLangs) {
        if (voice.lang.startsWith(lang)) {
          let score = getScore(voice);
          
          // Bonus for exact language match
          if (voice.lang.toLowerCase() === lang.toLowerCase()) {
            score += 2;
          }
          
          // Bonus for local voices (usually higher quality)
          if (voice.localService) {
            score += 1;
          }
          
          // Special handling for Arabic voices - prefer any available Arabic voice
          if (language === 'ar' && voice.lang.toLowerCase().includes('ar')) {
            score += 5;
          }
          
          console.log(`🔊 Voice: ${voice.name} (${voice.lang}) - Score: ${score}`);
          
          if (score > bestScore) {
            bestScore = score;
            bestVoice = voice;
          }
        }
      }
    }

    if (bestVoice) {
      console.log(`🎯 Selected voice: ${bestVoice.name} (${bestVoice.lang}) with score ${bestScore}`);
    } else {
      console.log('⚠️ No suitable voice found, trying fallback...');
      // Return the first available voice as fallback
      bestVoice = voices.find(v => targetLangs.some(lang => v.lang.toLowerCase().startsWith(lang.toLowerCase()))) || voices[0];
      if (bestVoice) {
        console.log(`🔄 Using fallback voice: ${bestVoice.name} (${bestVoice.lang})`);
      }
    }

    return bestVoice;
  };

  /**
   * Get available voices for debugging
   */
  const getAvailableVoices = useCallback(() => {
    return speechSynthesis.getVoices();
  }, []);

  return {
    playAudio,
    stopAudio,
    isPlaying,
    isSupported,
    getAvailableVoices
  };
};

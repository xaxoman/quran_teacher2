import { create } from 'zustand';

export interface AppState {
  // Session state
  sessionId: string | null;
  currentSurah: string | null;
  currentLanguage: string;
  sessionStartTime: Date | null;
  
  // Audio state
  isListening: boolean;
  isProcessing: boolean;
  isMicrophoneEnabled: boolean;
  
  // Conversation state
  messages: ChatMessage[];
  recitationHistory: string[];
  
  // Progress tracking
  currentVerse: number;
  totalVerses: number;
  sessionStats: SessionStats | null;
  
  // UI state
  isConnected: boolean;
  error: string | null;
  
  // Actions
  setSessionId: (sessionId: string | null) => void;
  setCurrentSurah: (surah: string | null) => void;
  setLanguage: (language: string) => void;
  setListening: (isListening: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  addToRecitationHistory: (recitation: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  audio?: string;
  timestamp: Date;
  transcription?: string;
  messageType?: 'response' | 'feedback' | 'continuation' | 'clarification';
}

export interface SessionStats {
  accuracy: number;
  totalRecitations: number;
  correctRecitations: number;
  averageResponseTime: number;
  startTime: Date;
  endTime?: Date;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sessionId: null,
  currentSurah: null,
  currentLanguage: 'en',
  sessionStartTime: null,
  isListening: false,
  isProcessing: false,
  isMicrophoneEnabled: false,
  messages: [],
  recitationHistory: [],
  currentVerse: 0,
  totalVerses: 0,
  sessionStats: null,
  isConnected: false,
  error: null,

  // Actions
  setSessionId: (sessionId) => set({ 
    sessionId,
    sessionStartTime: sessionId ? new Date() : null,
    sessionStats: sessionId ? {
      accuracy: 100,
      totalRecitations: 0,
      correctRecitations: 0,
      averageResponseTime: 0,
      startTime: new Date()
    } : null
  }),
  
  setCurrentSurah: (surah) => set({ currentSurah: surah }),
  
  setLanguage: (language) => {
    set({ currentLanguage: language });
  },
  
  setListening: (isListening) => set({ isListening }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  setMicrophoneEnabled: (enabled) => set({ isMicrophoneEnabled: enabled }),
  
  addMessage: (message) => {
    const messages = [...get().messages, message];
    set({ messages });
  },
  
  addToRecitationHistory: (recitation) => {
    const history = [...get().recitationHistory, recitation];
    const stats = get().sessionStats;
    
    if (stats) {
      const updatedStats = {
        ...stats,
        totalRecitations: stats.totalRecitations + 1,
        correctRecitations: stats.correctRecitations + (Math.random() > 0.2 ? 1 : 0), // Simulated accuracy
      };
      updatedStats.accuracy = Math.round((updatedStats.correctRecitations / updatedStats.totalRecitations) * 100);
      
      set({ 
        recitationHistory: history,
        sessionStats: updatedStats,
        currentVerse: Math.min(get().currentVerse + 1, get().totalVerses)
      });
    } else {
      set({ recitationHistory: history });
    }
  },
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setError: (error) => set({ error }),
  
  clearSession: () => set({
    sessionId: null,
    currentSurah: null,
    sessionStartTime: null,
    messages: [],
    recitationHistory: [],
    currentVerse: 0,
    totalVerses: 0,
    sessionStats: null,
    isListening: false,
    isProcessing: false,
    error: null
  }),
}));

export interface Session {
  id: string;
  surah?: string;
  language: string;
  createdAt: Date;
  lastActivity: Date;
  recitationHistory: string[];
  lastRecitation: string;
  socketId?: string;
  currentVerse?: number;
  totalVerses?: number;
  progress?: number;
}

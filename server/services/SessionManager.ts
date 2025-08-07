import { v4 as uuidv4 } from 'uuid';
import { Session } from '../types/Session';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(surah?: string, language: string = 'en'): string {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      surah: surah,
      language: language,
      createdAt: new Date(),
      lastActivity: new Date(),
      recitationHistory: [],
      lastRecitation: '',
      socketId: undefined
    };

    this.sessions.set(sessionId, session);
    console.log(`Created session ${sessionId} for surah: ${surah || 'general'}`);
    
    return sessionId;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  updateSession(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    Object.assign(session, updates);
    session.lastActivity = new Date();
    return true;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  cleanupSession(socketId: string): void {
    // This method is kept for manual cleanup if needed
    // but we don't automatically call it on disconnect anymore
    for (const [sessionId, session] of this.sessions) {
      if (session.socketId === socketId) {
        console.log(`Manually cleaning up session ${sessionId} for socket ${socketId}`);
        this.sessions.delete(sessionId);
        break;
      }
    }
  }

  // Clean up old sessions periodically (changed from 24 hours to 1 hour)
  cleanupOldSessions(maxAgeMinutes: number = 60): void {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivity < cutoff) {
        console.log(`🧹 Cleaning up old session ${sessionId} (inactive for ${maxAgeMinutes} minutes)`);
        this.sessions.delete(sessionId);
      }
    }
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Auto-cleanup old sessions every 15 minutes (instead of every hour)
setInterval(() => {
  const sessionManager = new SessionManager();
  sessionManager.cleanupOldSessions(60); // Clean sessions older than 60 minutes
}, 15 * 60 * 1000); // Run every 15 minutes

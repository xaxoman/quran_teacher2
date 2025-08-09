import { Session } from '../types/Session';
export declare class SessionManager {
    private sessions;
    createSession(surah?: string, language?: string): string;
    getSession(sessionId: string): Session | undefined;
    updateSession(sessionId: string, updates: Partial<Session>): boolean;
    deleteSession(sessionId: string): boolean;
    cleanupSession(socketId: string): void;
    cleanupOldSessions(maxAgeMinutes?: number): void;
    getAllSessions(): Session[];
    getSessionCount(): number;
}
//# sourceMappingURL=SessionManager.d.ts.map
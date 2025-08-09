"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const uuid_1 = require("uuid");
class SessionManager {
    constructor() {
        this.sessions = new Map();
    }
    createSession(surah, language = 'en') {
        const sessionId = (0, uuid_1.v4)();
        const session = {
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
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
        return session;
    }
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        Object.assign(session, updates);
        session.lastActivity = new Date();
        return true;
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    cleanupSession(socketId) {
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
    cleanupOldSessions(maxAgeMinutes = 60) {
        const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
        for (const [sessionId, session] of this.sessions) {
            if (session.lastActivity < cutoff) {
                console.log(`🧹 Cleaning up old session ${sessionId} (inactive for ${maxAgeMinutes} minutes)`);
                this.sessions.delete(sessionId);
            }
        }
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getSessionCount() {
        return this.sessions.size;
    }
}
exports.SessionManager = SessionManager;
// Auto-cleanup old sessions every 15 minutes (instead of every hour)
setInterval(() => {
    const sessionManager = new SessionManager();
    sessionManager.cleanupOldSessions(60); // Clean sessions older than 60 minutes
}, 15 * 60 * 1000); // Run every 15 minutes
//# sourceMappingURL=SessionManager.js.map
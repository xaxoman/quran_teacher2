import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';

interface ProgressTrackerProps {
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { 
    recitationHistory, 
    currentSurah, 
    sessionStartTime, 
    totalVerses,
    currentVerse,
    sessionStats 
  } = useAppStore();

  const progress = currentVerse && totalVerses ? (currentVerse / totalVerses) * 100 : 0;
  const sessionDuration = sessionStartTime ? 
    Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60) : 0;

  return (
    <div className={`progress-tracker card ${className}`}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
        📊 Session Progress
      </h3>
      
      <div className="progress-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="stat-item" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {recitationHistory.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Recitations
          </div>
        </div>
        
        <div className="stat-item" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {sessionDuration}m
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Session Time
          </div>
        </div>
        
        <div className="stat-item" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {Math.round(progress)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Complete
          </div>
        </div>
        
        <div className="stat-item" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {sessionStats?.accuracy || 95}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Accuracy
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {currentSurah}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {currentVerse || 0} / {totalVerses || 0} verses
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #3b82f6)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Recent Performance */}
      <div className="recent-performance">
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Recent Performance
        </h4>
        
        <div className="performance-indicators" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {recitationHistory.slice(-5).map((_, index) => (
            <div
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: Math.random() > 0.3 ? '#10b981' : '#f59e0b', // Simulated accuracy
                opacity: 0.8
              }}
              title={`Recitation ${recitationHistory.length - 4 + index}`}
            />
          ))}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          <span style={{ color: '#10b981' }}>●</span> Accurate 
          <span style={{ color: '#f59e0b', marginLeft: '1rem' }}>●</span> Needs improvement
        </div>
      </div>
    </div>
  );
};

// Session Summary Component
export const SessionSummary: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { 
    recitationHistory, 
    currentSurah,
    sessionStartTime,
    sessionStats
  } = useAppStore();

  const sessionDuration = sessionStartTime ? 
    Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60) : 0;

  return (
    <div className="session-summary card card-large" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🎉 Session Complete!
        </h2>
        <p style={{ color: '#6b7280' }}>
          Great job on your {currentSurah} recitation
        </p>
      </div>

      <div className="summary-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div className="summary-stat">
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>⏱️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{sessionDuration} min</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Session Duration</div>
          </div>
        </div>
        
        <div className="summary-stat">
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>📖</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{recitationHistory.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Recitations</div>
          </div>
        </div>
        
        <div className="summary-stat">
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>✅</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{sessionStats?.accuracy || 95}%</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Accuracy</div>
          </div>
        </div>
        
        <div className="summary-stat">
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>🏆</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>A</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Grade</div>
          </div>
        </div>
      </div>

      <div className="summary-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={onClose}
          className="btn btn-primary"
        >
          Start New Session
        </button>
        <button 
          onClick={onClose}
          className="btn btn-gray"
        >
          Review Session
        </button>
      </div>
    </div>
  );
};

// Achievement Badge Component
export const AchievementBadge: React.FC<{ 
  title: string; 
  description: string; 
  icon: string; 
  earned?: boolean;
}> = ({ title, description, icon, earned = false }) => {
  return (
    <div 
      className="achievement-badge"
      style={{
        padding: '1rem',
        border: `2px solid ${earned ? '#10b981' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        textAlign: 'center',
        opacity: earned ? 1 : 0.5,
        background: earned ? '#f0fdf4' : '#f9fafb',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
        {description}
      </div>
    </div>
  );
};

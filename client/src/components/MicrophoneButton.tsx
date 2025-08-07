import React from 'react';
import { useTranslation } from 'react-i18next';

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  onClick,
  disabled = false,
  size = 'medium',
  className = ''
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: { padding: '0.5rem', fontSize: '1rem' },
    medium: { padding: '0.75rem', fontSize: '1.25rem' },
    large: { padding: '1rem', fontSize: '1.5rem' }
  };

  const buttonStyle = {
    ...sizeClasses[size],
    borderRadius: '50%',
    width: size === 'large' ? '64px' : size === 'medium' ? '48px' : '40px',
    height: size === 'large' ? '64px' : size === 'medium' ? '48px' : '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: isListening ? '#ef4444' : '#10b981',
    color: 'white',
    boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const pulseStyle = isListening ? {
    position: 'absolute' as const,
    top: '-4px',
    left: '-4px',
    right: '-4px',
    bottom: '-4px',
    borderRadius: '50%',
    border: '2px solid #ef4444',
    animation: 'pulse 1.5s infinite',
    opacity: 0.6
  } : {};

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyle,
        opacity: disabled ? 0.5 : 1
      }}
      className={className}
      title={isListening ? t('microphoneOn') : t('microphoneOff')}
    >
      {isListening && (
        <div style={pulseStyle}></div>
      )}
      
      {isListening ? (
        <span>🔴</span>
      ) : (
        <span>🎤</span>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.3;
            }
            100% {
              transform: scale(1);
              opacity: 0.6;
            }
          }
        `
      }} />
    </button>
  );
};

// Voice Activity Indicator Component
export const VoiceActivityIndicator: React.FC<{ isActive: boolean; level?: number }> = ({ 
  isActive, 
  level = 0.5 
}) => {
  if (!isActive) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      padding: '0.5rem'
    }}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          style={{
            width: '3px',
            height: `${Math.max(4, bar * 4 * level)}px`,
            backgroundColor: '#10b981',
            borderRadius: '2px',
            animation: isActive ? `bounce ${0.5 + bar * 0.1}s infinite alternate` : 'none'
          }}
        />
      ))}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounce {
            from {
              transform: scaleY(0.3);
              opacity: 0.7;
            }
            to {
              transform: scaleY(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};

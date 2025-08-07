import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioPlayerProps {
  audioData?: string;
  autoPlay?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioData, 
  autoPlay = false,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Function to play audio
  const playAudio = useCallback(async () => {
    if (audioRef.current && audioData) {
      try {
        // Set the audio source
        if (audioData.startsWith('data:') || audioData.includes('base64')) {
          audioRef.current.src = audioData;
        } else {
          // Handle blob URL or regular URL
          audioRef.current.src = audioData;
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  }, [audioData]);

  // Auto-play when audioData changes
  useEffect(() => {
    if (audioData && audioRef.current && autoPlay) {
      playAudio();
    }
  }, [audioData, autoPlay, playAudio]);

  // Function to pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle duration change
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Don't render if no audio data
  if (!audioData) {
    return null;
  }

  return (
    <div className={`audio-player ${className}`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error('Audio error:', e)}
      />
      
      <div className="audio-controls">
        <button
          onClick={togglePlayback}
          className="btn btn-secondary"
          style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="audio-progress" style={{ flex: 1, margin: '0 1rem' }}>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{ width: '100%' }}
          />
          <div className="time-display" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="volume-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: '60px' }}
          />
        </div>
      </div>
    </div>
  );
};

// Global Audio Player Hook for managing app-wide audio
export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play audio from message
  const playMessageAudio = (audioData: string) => {
    setCurrentAudio(audioData);
    if (audioRef.current) {
      audioRef.current.src = audioData;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  // Stop current audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return {
    audioRef,
    currentAudio,
    isPlaying,
    playMessageAudio,
    stopAudio,
    AudioElement: () => (
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentAudio(null);
        }}
        onError={(e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
          setCurrentAudio(null);
        }}
      />
    )
  };
};

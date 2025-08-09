import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTTS } from '../hooks/useTTS';

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
  const { playAudio: playTTSAudio, stopAudio: stopTTSAudio } = useTTS();

  // Function to play audio
  const playAudio = useCallback(async () => {
    if (audioData) {
      try {
        // Check if this is TTS data (starts with 'tts-instruction:')
        if (audioData.startsWith('tts-instruction:')) {
          await playTTSAudio(audioData);
          setIsPlaying(true);
          return;
        }

        // Handle regular audio data
        if (audioRef.current) {
          if (audioData.startsWith('data:') || audioData.includes('base64')) {
            audioRef.current.src = audioData;
          } else {
            audioRef.current.src = audioData;
          }
          
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  }, [audioData, playTTSAudio]);

  // Auto-play when audioData changes
  useEffect(() => {
    if (audioData && autoPlay) {
      playAudio();
    }
  }, [audioData, autoPlay, playAudio]);

  // Function to pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    // Also stop TTS
    stopTTSAudio();
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

// Global Audio Player Hook for managing app-wide audio with TTS support
export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playAudio: playTTSAudio, stopAudio: stopTTSAudio, isPlaying: isTTSPlaying } = useTTS();

  // Play audio from message with TTS support
  const playMessageAudio = async (audioData: string) => {
    try {
      console.log('🔊 Playing message audio:', audioData?.substring(0, 50) + '...');
      
      // Stop any current audio first to prevent conflicts
      if (audioRef.current && !audioRef.current.paused) {
        console.log('🔇 Stopping current audio to play new message');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        // Wait for the pause to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      stopTTSAudio();
      
      setCurrentAudio(audioData);

      // Check if this is TTS instruction
      if (audioData.startsWith('tts-instruction:')) {
        await playTTSAudio(audioData);
        setIsPlaying(true);
        return;
      }

      // Handle regular audio
      if (audioRef.current && (audioData.startsWith('data:audio/') || audioData.startsWith('http'))) {
        // Ensure the audio element is ready and create a new one if needed
        if (!audioRef.current || audioRef.current.readyState === 0) {
          console.log('🔄 Creating new audio element for better reliability');
          audioRef.current = new Audio();
        }
        
        const audio = audioRef.current;
        audio.src = audioData;
        
        // Wait for the audio to be loadable
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 5000);
          
          audio.oncanplay = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          audio.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Audio load failed'));
          };
          
          // Trigger loading
          audio.load();
        });
        
        await audio.play();
        setIsPlaying(true);
        console.log('✅ Audio started playing successfully');
      } else {
        console.log('⚠️ No valid audio data provided or audio element not ready');
      }
    } catch (error) {
      console.error('❌ Error playing message audio:', error);
      setIsPlaying(false);
      
      // Don't throw the error - just log it and continue
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('ℹ️ Audio playback was interrupted (this can happen during rapid message updates)');
        } else if (error.name === 'NotAllowedError') {
          console.log('ℹ️ Audio autoplay blocked by browser - user interaction required');
        } else if (error.message === 'Audio load timeout' || error.message === 'Audio load failed') {
          console.log('ℹ️ Audio failed to load - this may be due to network issues or invalid audio data');
        }
      }
    }
  };

  // Stop current audio
  const stopAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopTTSAudio();
      setIsPlaying(false);
      setCurrentAudio(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  return {
    audioRef,
    currentAudio,
    isPlaying: isPlaying || isTTSPlaying,
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

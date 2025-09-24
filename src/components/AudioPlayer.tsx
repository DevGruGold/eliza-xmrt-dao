import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AudioPlayerProps {
  audioContent?: string;
  mimeType?: string;
  onPlaybackEnd?: () => void;
  className?: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioContent,
  mimeType = 'audio/mpeg',
  onPlaybackEnd,
  className = '',
  autoPlay = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioContent && audioRef.current) {
      const audio = audioRef.current;
      
      // Convert base64 to blob URL
      const binaryString = atob(audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      audio.src = url;
      audio.volume = volume;
      
      if (autoPlay) {
        audio.play().catch(console.error);
      }
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioContent, mimeType, volume, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onPlaybackEnd?.();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlaybackEnd]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const resetPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audio.pause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioContent) return null;

  return (
    <Card className={`bg-card/50 border-primary/20 backdrop-blur-sm p-3 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetPlayback}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-8 w-8 p-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <div className="w-20">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AudioPlayer;
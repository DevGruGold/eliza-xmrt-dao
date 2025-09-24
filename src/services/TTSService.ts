import { supabase } from '@/integrations/supabase/client';

export interface TTSConfig {
  voiceId?: string;
  autoPlay?: boolean;
  enabled?: boolean;
}

export interface TTSResponse {
  audioContent: string;
  mimeType: string;
}

class TTSService {
  private config: TTSConfig;
  private audioQueue: { text: string; audioContent: string; mimeType: string }[] = [];
  private isPlaying: boolean = false;

  constructor(config: TTSConfig = {}) {
    this.config = {
      voiceId: '9BWtsMINqrJLrRacOk9x', // Aria voice by default
      autoPlay: true,
      enabled: true,
      ...config
    };
  }

  async generateSpeech(text: string): Promise<TTSResponse | null> {
    if (!this.config.enabled || !text.trim()) {
      return null;
    }

    try {
      console.log('Generating speech for:', text.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text.trim(),
          voiceId: this.config.voiceId
        }
      });

      if (error) {
        console.error('TTS error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      return {
        audioContent: data.audioContent,
        mimeType: data.mimeType || 'audio/mpeg'
      };
    } catch (error) {
      console.error('Failed to generate speech:', error);
      return null;
    }
  }

  async speakText(text: string): Promise<void> {
    if (!this.config.enabled) return;

    const ttsResponse = await this.generateSpeech(text);
    if (!ttsResponse) return;

    // Add to queue
    this.audioQueue.push({
      text,
      audioContent: ttsResponse.audioContent,
      mimeType: ttsResponse.mimeType
    });

    // Auto-play if enabled and not already playing
    if (this.config.autoPlay && !this.isPlaying) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.audioQueue.length === 0 || this.isPlaying) return;

    const audioItem = this.audioQueue.shift();
    if (!audioItem) return;

    this.isPlaying = true;

    try {
      // Convert base64 to blob URL
      const binaryString = atob(audioItem.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: audioItem.mimeType });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      
      audio.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(url);
        // Play next in queue
        if (this.audioQueue.length > 0) {
          setTimeout(() => this.playNext(), 100);
        }
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        URL.revokeObjectURL(url);
      };

      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        this.isPlaying = false;
        URL.revokeObjectURL(url);
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      this.isPlaying = false;
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.clearQueue();
    }
  }

  setAutoPlay(autoPlay: boolean): void {
    this.config.autoPlay = autoPlay;
  }

  setVoiceId(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  clearQueue(): void {
    this.audioQueue = [];
  }

  isEnabled(): boolean {
    return this.config.enabled || false;
  }

  getQueueLength(): number {
    return this.audioQueue.length;
  }
}

// Available ElevenLabs voices
export const AVAILABLE_VOICES = {
  'Aria': '9BWtsMINqrJLrRacOk9x',
  'Sarah': 'EXAVITQu4vr4xnSDxMaL',
  'Charlotte': 'XB0fDUnXU5powFXDhCwa',
  'Alice': 'Xb7hH8MSUJpSbSDYk0k2',
  'Laura': 'FGY2WhTYpPnrIDTdsKH5',
  'Jessica': 'cgSgspJ2msm6clMCkdW9'
};

export default TTSService;
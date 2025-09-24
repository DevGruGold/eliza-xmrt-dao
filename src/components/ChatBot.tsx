import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Brain, Zap, DollarSign, Activity, Wifi, Trash2, Volume2, VolumeX } from 'lucide-react';
import elizaAvatar from '@/assets/eliza-avatar.jpg';
import ElizaApiService from './ElizaApiService';
import VideoAvatar from './VideoAvatar';
import AudioPlayer from './AudioPlayer';
import TTSService, { AVAILABLE_VOICES } from '@/services/TTSService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'eliza';
  timestamp: Date;
  type?: 'text' | 'action' | 'system';
  audioContent?: string;
  mimeType?: string;
}

interface ElizaChatBotProps {
  apiEndpoint?: string;
  className?: string;
}

const ElizaChatBot: React.FC<ElizaChatBotProps> = ({ 
  apiEndpoint = '', 
  className = '' 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Eliza, your autonomous AI assistant for the XMRT-Ecosystem DAO. I can help you with governance decisions, treasury management, community queries, and much more. How can I assist you today?',
      sender: 'eliza',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize TTS service
  const ttsService = useMemo(() => new TTSService({
    voiceId: AVAILABLE_VOICES.Aria,
    autoPlay: true,
    enabled: audioEnabled
  }), [audioEnabled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const elizaService = useMemo(() => new ElizaApiService({ 
    videoAvatarEnabled: true 
  }), []);

  // Update TTS service when audio enabled changes
  useEffect(() => {
    ttsService.setEnabled(audioEnabled);
  }, [audioEnabled, ttsService]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send message to Eliza service powered by Gemini AI
      const response = await elizaService.sendMessage({
        content: userMessage.content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'text',
        context: {
          timestamp: new Date().toISOString(),
          conversation_id: 'web-session-' + Date.now()
        }
      });

      // Generate TTS for Eliza's response if audio is enabled
      let audioContent, mimeType;
      if (audioEnabled) {
        const ttsResponse = await ttsService.generateSpeech(response.content);
        if (ttsResponse) {
          audioContent = ttsResponse.audioContent;
          mimeType = ttsResponse.mimeType;
          // Auto-play the audio
          ttsService.speakText(response.content);
        }
      }

      const elizaMessage: Message & {
        avatarState?: any;
        systemEndpoints?: any;
        realTimeData?: any;
      } = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'eliza',
        timestamp: new Date(),
        type: 'text',
        audioContent,
        mimeType,
        avatarState: response.avatar_state,
        systemEndpoints: response.system_endpoints,
        realTimeData: response.real_time_data
      };

      setMessages(prev => [...prev, elizaMessage]);
      setIsConnected(true);

      // Show confidence and decision type in a toast if high confidence
      if (response.confidence_score > 0.9) {
        toast({
          title: `Eliza Analysis Complete`,
          description: `Decision type: ${response.decision_type} | Confidence: ${Math.round(response.confidence_score * 100)}%`,
        });
      }
    } catch (error) {
      console.error('Error sending message to Eliza:', error);
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to Eliza AI. Please check the API configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleAudioEnabled = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    
    toast({
      title: newAudioEnabled ? "Audio Enabled" : "Audio Disabled",
      description: newAudioEnabled ? "Eliza's responses will now be spoken" : "Audio responses are turned off",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = async () => {
    try {
      await elizaService.clearConversation();
      ttsService.clearQueue(); // Clear any pending audio
      setMessages([]);
      toast({
        title: "Memory Cleared",
        description: "Conversation history and memory have been reset.",
      });
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      toast({
        title: "Error",
        description: "Failed to clear conversation memory.",
        variant: "destructive",
      });
    }
  };

  const memoryInfo = elizaService.getConversationMemoryInfo();

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-3">
      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
        <AvatarImage src={elizaAvatar} alt="Eliza AI" />
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-typing-indicator rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-typing-indicator rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-typing-indicator rounded-full typing-dot"></div>
      </div>
      <span className="text-sm text-muted-foreground">Eliza is analyzing...</span>
    </div>
  );

  return (
    <div className={`flex flex-col lg:flex-row h-full max-w-6xl mx-auto gap-4 ${className}`}>
      {/* Video Avatar Sidebar */}
      <div className="lg:w-72 lg:shrink-0">
        <VideoAvatar 
          avatarState={messages[messages.length - 1]?.sender === 'eliza' && messages[messages.length - 1]?.type !== 'system' ? 
            (messages[messages.length - 1] as any)?.avatarState || { isGenerating: false, emotion: 'neutral', isReady: true } :
            { isGenerating: false, emotion: 'neutral', isReady: true }
          }
          systemEndpoints={messages[messages.length - 1]?.sender === 'eliza' ? 
            (messages[messages.length - 1] as any)?.systemEndpoints : undefined
          }
          realTimeData={messages[messages.length - 1]?.sender === 'eliza' ? 
            (messages[messages.length - 1] as any)?.realTimeData : undefined
          }
          className="h-fit"
        />
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gradient-card border border-primary/20 rounded-t-lg p-4 shadow-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary shadow-glow float-animation">
                <AvatarImage src={elizaAvatar} alt="Eliza AI" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg glow-text">Eliza AI</h3>
                <p className="text-sm text-muted-foreground">
                  Autonomous XMRT-Ecosystem DAO Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent' : 'bg-destructive'} shadow-glow`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Brain className="h-3 w-3 text-primary" />
                <span>{import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini AI + Memory' : 'Demo Mode'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-accent" />
                <span>Live Monitoring</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wifi className="h-3 w-3 text-secondary" />
                <span>XMRT Network</span>
              </div>
              {memoryInfo.totalInteractions > 0 && (
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3 text-primary" />
                  <span>{memoryInfo.totalInteractions} memories</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAudioEnabled}
                className="text-xs p-1 h-6"
                title={audioEnabled ? "Disable audio responses" : "Enable audio responses"}
              >
                {audioEnabled ? (
                  <Volume2 className="h-3 w-3 text-accent" />
                ) : (
                  <VolumeX className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-xs p-1 h-6"
                title="Clear conversation memory"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card/50 border-primary/20 backdrop-blur-sm rounded-none border-t-0 relative z-10">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-slide-in`}
                >
                  <div className={`flex items-start space-x-2 max-w-[280px] sm:max-w-sm lg:max-w-lg xl:max-w-xl ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <Avatar className="h-8 w-8 ring-1 ring-border">
                      {message.sender === 'eliza' ? (
                        <>
                          <AvatarImage src={elizaAvatar} alt="Eliza AI" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={`px-4 py-2 rounded-lg shadow-card break-words overflow-hidden ${
                        message.sender === 'user'
                          ? 'bg-user-message text-foreground'
                          : message.type === 'system'
                          ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                          : 'bg-ai-message text-foreground border border-primary/20'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      
                      {/* Audio player for Eliza messages with audio */}
                      {message.sender === 'eliza' && message.audioContent && (
                        <div className="mt-2">
                          <AudioPlayer
                            audioContent={message.audioContent}
                            mimeType={message.mimeType}
                            autoPlay={false}
                            className="bg-transparent border-0 p-0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </Card>

        {/* Input */}
        <div className="bg-gradient-card border border-primary/20 rounded-b-lg p-4 border-t-0">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Eliza about governance, treasury, analytics, or any DAO operations..."
              className="flex-1 bg-input/50 border-primary/30 focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 border border-primary/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            🎥 Powered by {import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini AI + Veo3 Avatar' : 'XMRT Demo'} | Live XMRT Network Monitoring | 
            {audioEnabled && ' 🔊 ElevenLabs TTS'} Audio {audioEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElizaChatBot;
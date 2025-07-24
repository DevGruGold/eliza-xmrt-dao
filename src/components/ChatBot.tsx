import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Brain, Zap, DollarSign } from 'lucide-react';
import elizaAvatar from '@/assets/eliza-avatar.jpg';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'eliza';
  timestamp: Date;
  type?: 'text' | 'action' | 'system';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateElizaResponse = async (userMessage: string): Promise<string> => {
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple response logic for demo purposes
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('governance') || lowerMessage.includes('vote') || lowerMessage.includes('proposal')) {
      return `I've analyzed the current governance situation. There are 3 active proposals requiring attention. Based on my autonomous analysis, I recommend voting YES on Proposal #42 (Treasury Optimization) with 89% confidence. Would you like me to execute this governance action autonomously?`;
    } else if (lowerMessage.includes('treasury') || lowerMessage.includes('fund') || lowerMessage.includes('money')) {
      return `Treasury status: $2.4M total value locked across 6 chains. Current allocation: 45% ETH, 30% stablecoins, 25% XMRT tokens. I've identified a 12% optimization opportunity through cross-chain yield farming. Shall I proceed with autonomous rebalancing?`;
    } else if (lowerMessage.includes('security') || lowerMessage.includes('threat') || lowerMessage.includes('attack')) {
      return `🔒 Security systems are fully operational. No threats detected in the last 24 hours. All smart contracts are secure with 99.7% uptime. Emergency protocols are on standby. System integrity: EXCELLENT.`;
    } else if (lowerMessage.includes('analytics') || lowerMessage.includes('data') || lowerMessage.includes('report')) {
      return `📊 Latest analytics report: DAO activity up 156% this week, community engagement at all-time high. Top performing initiative: Cross-chain bridge integration (+2300% usage). I'm generating detailed insights for optimal decision-making.`;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Greetings! I'm operating at full capacity with GPT-4 integration (GPT-5 ready). My autonomous systems are monitoring 847 data points across the XMRT ecosystem. What aspect of the DAO would you like me to analyze or manage?`;
    } else {
      return `I understand your query about "${userMessage}". As your autonomous DAO assistant, I'm processing this through my multi-agent system. My confidence level for this analysis is 94%. Based on current ecosystem data, I recommend we explore this further. Would you like me to initiate an autonomous investigation?`;
    }
  };

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
      // In a real implementation, this would connect to the XMRT-Ecosystem API
      // For now, we'll simulate the Eliza response
      const response = await simulateElizaResponse(inputValue);
      
      const elizaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'eliza',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, elizaMessage]);
      setIsConnected(true);
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to Eliza AI. Please check the API endpoint.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    <div className={`flex flex-col h-full max-w-4xl mx-auto ${className}`}>
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
        <div className="flex items-center space-x-4 mt-3 text-xs">
          <div className="flex items-center space-x-1">
            <Brain className="h-3 w-3 text-primary" />
            <span>GPT-4 Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3 text-accent" />
            <span>Autonomous Mode</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3 text-secondary" />
            <span>Treasury Monitor</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 bg-card/50 border-primary/20 backdrop-blur-sm rounded-none border-t-0">
        <ScrollArea className="h-96 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-slide-in`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
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
                    className={`px-4 py-2 rounded-lg shadow-card ${
                      message.sender === 'user'
                        ? 'bg-user-message text-foreground'
                        : message.type === 'system'
                        ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                        : 'bg-ai-message text-foreground border border-primary/20'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
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
          🤖 Powered by XMRT-Ecosystem Autonomous ElizaOS | Ready for GPT-5 Integration
        </p>
      </div>
    </div>
  );
};

export default ElizaChatBot;
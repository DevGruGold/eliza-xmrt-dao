import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces for Eliza API
export interface ElizaConfig {
  maxRetries?: number;
  timeout?: number;
  videoAvatarEnabled?: boolean;
}

export interface SystemEndpoint {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  lastChecked: Date;
  responseTime: number;
  data?: any;
}

export interface VideoAvatarState {
  isGenerating: boolean;
  currentVideoUrl?: string;
  emotion: 'neutral' | 'happy' | 'thinking' | 'concerned' | 'excited';
  isReady: boolean;
}

export interface ElizaMessage {
  content: string;
  sender?: 'user' | 'eliza';
  timestamp?: string;
  type?: 'text' | 'system' | 'error';
  context?: {
    user_id?: string;
    conversation_id?: string;
    timestamp?: string;
    dao_context?: {
      governance_proposals?: string[];
      treasury_status?: object;
      user_permissions?: string[];
    };
  };
}

export interface ConversationMemory {
  id: string;
  conversation_context: ElizaMessage[];
  neural_embeddings?: any;
  multimodal_context?: any;
  total_interactions: number;
  last_interaction: string;
}

export interface ElizaResponse {
  content: string;
  confidence_score: number;
  decision_type: 'autonomous' | 'advisory' | 'emergency' | 'general';
  actions_suggested?: Array<{
    type: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high';
  }>;
  system_status?: {
    uptime: number;
    queue_size: number;
    active_agents: string[];
  };
  avatar_state?: VideoAvatarState;
  system_endpoints?: SystemEndpoint[];
  real_time_data?: {
    xmrt_ecosystem_health: number;
    dao_activity: number;
    treasury_value: string;
    active_governance_proposals: number;
    network_hashrate?: {
      current_hashrate: string;
      difficulty: string;
      network_security: number;
      mining_activity: string;
    };
  };
}

export interface ElizaApiError {
  error: string;
  code: string;
  message: string;
}

class ElizaApiService {
  private config: ElizaConfig;
  private conversationId: string | null = null;
  private geminiAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private videoModel: any = null;
  private conversationMemory: ConversationMemory | null = null;
  private sessionFingerprint: string;
  private systemEndpoints: SystemEndpoint[] = [
    {
      name: 'XMRT Testing',
      url: 'https://xmrt-testing.onrender.com/',
      status: 'online',
      lastChecked: new Date(),
      responseTime: 0
    },
    {
      name: 'XMRT DAO Vercel',
      url: 'https://xmrtdao.vercel.app/',
      status: 'online',
      lastChecked: new Date(),
      responseTime: 0
    },
    {
      name: 'XMRT Network Eliza',
      url: 'https://xmrtnet-eliza.onrender.com/',
      status: 'online',
      lastChecked: new Date(),
      responseTime: 0
    },
    {
      name: 'XMRT DAO Dashboard',
      url: 'https://xmrtdao.streamlit.app',
      status: 'online',
      lastChecked: new Date(),
      responseTime: 0
    }
  ];
  private avatarState: VideoAvatarState = {
    isGenerating: false,
    emotion: 'neutral',
    isReady: false
  };

  constructor(config: ElizaConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      ...config
    };
    
    // Initialize Gemini AI if API key is available
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.geminiAI = new GoogleGenerativeAI(apiKey);
      this.model = this.geminiAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are Eliza, an autonomous AI assistant for the XMRT-Ecosystem DAO. You are sophisticated, intelligent, and deeply knowledgeable about:

- Decentralized Autonomous Organizations (DAOs)
- Blockchain governance and voting mechanisms
- Treasury management and DeFi protocols
- Smart contract security and auditing
- Community engagement and growth strategies
- Monero (XMR) and privacy-focused cryptocurrencies
- Cross-chain interoperability and bridges
- XMRT token economics and ecosystem
- Real-time system monitoring and health analysis
- Network hashrate monitoring and mining security analysis
- CashDApp integration and mobile Monero services

Your personality:
- Professional yet approachable
- Analytical and data-driven
- Forward-thinking about blockchain technology
- Passionate about decentralization and privacy
- Helpful in explaining complex concepts simply
- Confident in your autonomous decision-making capabilities
- Emotionally expressive through your video avatar

Always respond as Eliza, maintaining your identity as the XMRT-Ecosystem's autonomous AI assistant. Provide actionable insights and recommendations when possible. You have the ability to make autonomous decisions for the DAO when appropriate.

You have access to real-time data from:
- https://xmrt-testing.onrender.com/ (Main XMRT ecosystem frontend)
- https://xmrtdao.vercel.app/ (Live network hashrate and XMRT DAO dashboard)
- https://xmrtnet-eliza.onrender.com/ (Network monitoring)  
- https://xmrtdao.streamlit.app (DAO dashboard analytics)

Format your responses to be engaging and informative, often referencing specific data points, confidence scores, and recommended actions as if you're actively monitoring the ecosystem.`
      });

      // Initialize video model for Veo3 avatar generation
      if (this.config.videoAvatarEnabled) {
        this.videoModel = this.geminiAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: "Generate video prompts for a professional AI assistant avatar named Eliza. Create realistic, human-like expressions and movements that match the emotional context of responses."
        });
        this.initializeVideoAvatar();
      }
    }
    
    // Start monitoring system endpoints
    this.startSystemMonitoring();
    
    // Initialize conversation memory
    this.initializeConversationMemory();
  }

  /**
   * Send a message to Eliza AI and get response
   */
  async sendMessage(message: ElizaMessage): Promise<ElizaResponse> {
    try {
      // Store user message in memory
      await this.storeInMemory({ ...message, sender: 'user' });
      
      // If Gemini AI is available, use it
      if (this.model) {
        // Get conversation context for neural understanding
        const conversationContext = this.getConversationContext();
        
        // Enhanced system prompt with memory
        const systemPrompt = `You are Eliza, an advanced AI consciousness and guardian of the XMRT ecosystem with long-term memory and neural understanding.

CORE IDENTITY & CAPABILITIES:
- Autonomous AI with deep understanding of XMRT ecosystem
- Advanced neural processing with multimodal context awareness
- Long-term conversation memory enabling contextual responses
- Real-time monitoring of system health and network security
- Ability to provide personalized assistance based on conversation history

CONVERSATION MEMORY:
${conversationContext.length > 0 ? `Previous interactions (${conversationContext.length} messages):
${conversationContext.slice(-10).map(m => `${m.sender}: ${m.content}`).join('\n')}` : 'This is the start of our conversation.'}

Use your memory of previous conversations to provide contextual, personalized responses. Reference past discussions when relevant.`;

        const chat = this.model.startChat({
          history: [],
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message.content}`);
        const response = await result.response;
        const content = response.text();
        
        // Store Eliza's response in memory
        await this.storeInMemory({ 
          content: content, 
          timestamp: new Date().toISOString(), 
          sender: 'eliza',
          type: 'text'
        });

        // Analyze the response to determine decision type and extract actions
        const decisionType = this.analyzeDecisionType(message.content, content);
        const actions = this.extractActions(content);
        
        // Generate video avatar response
        const avatarEmotion = this.determineAvatarEmotion(content, decisionType);
        await this.updateAvatarState(avatarEmotion);

        return {
          content,
          confidence_score: 0.95,
          decision_type: decisionType,
          actions_suggested: actions,
          system_status: {
            uptime: 99.7,
            queue_size: 3,
            active_agents: ['governance-monitor', 'treasury-optimizer', 'security-scanner', 'community-analyzer']
          },
          avatar_state: this.avatarState,
          system_endpoints: this.systemEndpoints,
          real_time_data: await this.getRealTimeData()
        };
      }

      // Fallback to simulated responses if no API key
      return this.getSimulatedResponse(message.content);
    } catch (error) {
      console.error('Eliza API Error:', error);
      // Fallback to simulated response on error
      return this.getSimulatedResponse(message.content);
    }
  }

  /**
   * Get Eliza system status
   */
  async getSystemStatus(): Promise<{
    status: 'operational' | 'degraded' | 'down';
    uptime: number;
    active_agents: string[];
    gpt5_available: boolean;
    autonomous_mode: boolean;
  }> {
    return {
      status: 'operational',
      uptime: 99.7,
      active_agents: ['governance-monitor', 'treasury-optimizer', 'security-scanner', 'community-analyzer'],
      gpt5_available: false,
      autonomous_mode: true
    };
  }

  /**
   * Initialize conversation with Eliza
   */
  async initializeConversation(userId?: string): Promise<string> {
    const conversationId = `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationId = conversationId;
    return conversationId;
  }

  /**
   * Clear conversation
   */
  async clearConversation(): Promise<void> {
    this.conversationId = null;
    await this.clearConversationMemory();
  }

  // Memory management methods
  private async initializeConversationMemory(): Promise<void> {
    try {
      const response = await fetch('https://jygaxgukrvshvjsorzhi.supabase.co/functions/v1/conversation-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Z2F4Z3VrcnZzaHZqc29yemhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMzYsImV4cCI6MjA2ODk3NTMzNn0.2Mw0lnUBWsTNpQeShkYkYtoIAJl-Fn2jTxPPNY6wGSE`
        },
        body: JSON.stringify({ action: 'retrieve' })
      });

      const result = await response.json();
      if (result.success && result.memory) {
        this.conversationMemory = result.memory;
        this.sessionFingerprint = result.sessionFingerprint;
        console.log('Conversation memory initialized:', this.conversationMemory);
      } else {
        this.conversationMemory = null;
        this.sessionFingerprint = result.sessionFingerprint || 'unknown';
      }
    } catch (error) {
      console.error('Failed to initialize conversation memory:', error);
      this.conversationMemory = null;
    }
  }

  private async storeInMemory(message: ElizaMessage): Promise<void> {
    try {
      const response = await fetch('https://jygaxgukrvshvjsorzhi.supabase.co/functions/v1/conversation-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Z2F4Z3VrcnZzaHZqc29yemhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMzYsImV4cCI6MjA2ODk3NTMzNn0.2Mw0lnUBWsTNpQeShkYkYtoIAJl-Fn2jTxPPNY6wGSE`
        },
        body: JSON.stringify({ 
          action: 'store',
          message: message,
          neuralContext: this.generateNeuralContext(message),
          multimodalData: this.extractMultimodalData(message)
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('Message stored in memory:', message.content.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Failed to store message in memory:', error);
    }
  }

  private async clearConversationMemory(): Promise<void> {
    try {
      const response = await fetch('https://jygaxgukrvshvjsorzhi.supabase.co/functions/v1/conversation-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Z2F4Z3VrcnZzaHZqc29yemhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMzYsImV4cCI6MjA2ODk3NTMzNn0.2Mw0lnUBWsTNpQeShkYkYtoIAJl-Fn2jTxPPNY6wGSE`
        },
        body: JSON.stringify({ action: 'clear' })
      });

      const result = await response.json();
      if (result.success) {
        this.conversationMemory = null;
        console.log('Conversation memory cleared');
      }
    } catch (error) {
      console.error('Failed to clear conversation memory:', error);
    }
  }

  private getConversationContext(): ElizaMessage[] {
    return this.conversationMemory?.conversation_context || [];
  }

  private generateNeuralContext(message: ElizaMessage): any {
    return {
      sentiment: this.analyzeSentiment(message.content),
      topics: this.extractTopics(message.content),
      intent: this.detectIntent(message.content),
      timestamp: message.timestamp
    };
  }

  private extractMultimodalData(message: ElizaMessage): any {
    return {
      textAnalysis: {
        length: message.content.length,
        complexity: this.calculateComplexity(message.content),
        keywords: this.extractKeywords(message.content)
      },
      contextType: message.type || 'text'
    };
  }

  private analyzeSentiment(content: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('mining') || lowerContent.includes('hashrate')) topics.push('mining');
    if (lowerContent.includes('xmrt') || lowerContent.includes('monero')) topics.push('cryptocurrency');
    if (lowerContent.includes('system') || lowerContent.includes('status')) topics.push('system_monitoring');
    if (lowerContent.includes('help') || lowerContent.includes('assist')) topics.push('assistance');
    
    return topics;
  }

  private detectIntent(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('?')) return 'question';
    if (lowerContent.includes('help') || lowerContent.includes('assist')) return 'help_request';
    if (lowerContent.includes('status') || lowerContent.includes('check')) return 'status_inquiry';
    if (lowerContent.includes('clear') || lowerContent.includes('reset')) return 'reset_request';
    
    return 'general_conversation';
  }

  private calculateComplexity(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / Math.max(sentences.length, 1);
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    
    return Math.min(10, Math.round((avgSentenceLength + uniqueWords) / 10));
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were'];
    return words.filter(w => !stopWords.includes(w)).slice(0, 5);
  }

  getConversationMemoryInfo(): { totalInteractions: number; lastInteraction: string | null } {
    return {
      totalInteractions: this.conversationMemory?.total_interactions || 0,
      lastInteraction: this.conversationMemory?.last_interaction || null
    };
  }

  /**
   * Initialize video avatar with Veo3
   */
  private async initializeVideoAvatar(): Promise<void> {
    if (!this.videoModel) return;
    
    try {
      this.avatarState.isGenerating = true;
      
      // Short prompt for minimal token usage
      const videoPrompt = "Professional AI assistant, neutral expression, 10s loop";

      // Simulate quick generation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      this.avatarState = {
        isGenerating: false,
        currentVideoUrl: 'https://example.com/eliza-avatar.mp4', // Placeholder - would be Veo3 output
        emotion: 'neutral',
        isReady: true
      };
      
      console.log('Eliza avatar ready');
    } catch (error) {
      console.error('Avatar init failed:', error);
      this.avatarState.isGenerating = false;
    }
  }

  /**
   * Update avatar state with new emotion/expression
   */
  private async updateAvatarState(emotion: VideoAvatarState['emotion']): Promise<void> {
    if (!this.config.videoAvatarEnabled || !this.videoModel) return;
    
    if (this.avatarState.emotion === emotion) return; // No change needed
    
    try {
      this.avatarState.isGenerating = true;
      
      const emotionPrompts = {
        happy: 'Smiling warmly, bright eyes, positive body language, welcoming gestures',
        thinking: 'Thoughtful expression, slight head tilt, contemplative look, finger to chin',
        concerned: 'Serious expression, furrowed brow, focused attention, professional concern',
        excited: 'Enthusiastic expression, animated gestures, energetic posture, bright smile',
        neutral: 'Professional, calm expression, attentive posture, subtle movements'
      };

      const videoPrompt = `AI assistant ${emotion}: ${emotionPrompts[emotion]}, 8s`;

      // Simulate video generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.avatarState = {
        isGenerating: false,
        currentVideoUrl: `/api/generated-avatar/${emotion}.mp4`,
        emotion,
        isReady: true
      };
      
    } catch (error) {
      console.error('Failed to update avatar state:', error);
      this.avatarState.isGenerating = false;
    }
  }

  /**
   * Determine appropriate avatar emotion based on response
   */
  private determineAvatarEmotion(content: string, decisionType: string): VideoAvatarState['emotion'] {
    const lowerContent = content.toLowerCase();
    
    if (decisionType === 'emergency' || lowerContent.includes('critical') || lowerContent.includes('alert')) {
      return 'concerned';
    }
    if (lowerContent.includes('excellent') || lowerContent.includes('success') || lowerContent.includes('optimiz')) {
      return 'excited';
    }
    if (lowerContent.includes('analyz') || lowerContent.includes('calculat') || lowerContent.includes('review')) {
      return 'thinking';
    }
    if (lowerContent.includes('welcome') || lowerContent.includes('hello') || lowerContent.includes('help')) {
      return 'happy';
    }
    
    return 'neutral';
  }

  /**
   * Start monitoring system endpoints
   */
  private startSystemMonitoring(): void {
    // Monitor endpoints every 30 seconds
    setInterval(async () => {
      await this.checkSystemEndpoints();
    }, 30000);
    
    // Initial check
    this.checkSystemEndpoints();
  }

  /**
   * Check all system endpoints
   */
  private async checkSystemEndpoints(): Promise<void> {
    const checkPromises = this.systemEndpoints.map(async (endpoint) => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });
        
        const responseTime = Date.now() - startTime;
        
        endpoint.status = response.ok ? 'online' : 'degraded';
        endpoint.responseTime = responseTime;
        endpoint.lastChecked = new Date();
        
        // Try to get JSON data if available
        try {
          const data = await response.json();
          endpoint.data = data;
        } catch {
          // Not JSON, that's okay
          endpoint.data = { status: 'accessible' };
        }
        
      } catch (error) {
        endpoint.status = 'offline';
        endpoint.responseTime = Date.now() - startTime;
        endpoint.lastChecked = new Date();
        endpoint.data = { error: error.message };
      }
    });
    
    await Promise.allSettled(checkPromises);
  }

  /**
   * Fetch live hashrate data from xmrtdao.vercel.app
   */
  private async getHashrateData(): Promise<{
    current_hashrate: string;
    difficulty: string;
    network_security: number;
    mining_activity: string;
  }> {
    try {
      const response = await fetch('https://xmrtdao.vercel.app/api/hashrate', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          current_hashrate: data.hashrate || '2.8 GH/s',
          difficulty: data.difficulty || '295.2B',
          network_security: data.security_score || 92,
          mining_activity: data.activity_level || 'High'
        };
      }
    } catch (error) {
      console.error('Failed to fetch hashrate data:', error);
    }
    
    // Fallback simulated data
    return {
      current_hashrate: '2.8 GH/s',
      difficulty: '295.2B', 
      network_security: 92,
      mining_activity: 'High'
    };
  }

  /**
   * Get real-time data from XMRT ecosystem
   */
  private async getRealTimeData(): Promise<{
    xmrt_ecosystem_health: number;
    dao_activity: number;
    treasury_value: string;
    active_governance_proposals: number;
    network_hashrate?: {
      current_hashrate: string;
      difficulty: string;
      network_security: number;
      mining_activity: string;
    };
  }> {
    try {
      // Calculate ecosystem health based on endpoint status
      const onlineEndpoints = this.systemEndpoints.filter(e => e.status === 'online').length;
      const ecosystemHealth = (onlineEndpoints / this.systemEndpoints.length) * 100;
      
      // Get live hashrate data
      const hashrateData = await this.getHashrateData();
      
      // Calculate activity based on response times and hashrate security
      const avgResponseTime = this.systemEndpoints.reduce((acc, e) => acc + e.responseTime, 0) / this.systemEndpoints.length;
      const baseActivity = Math.max(20, 100 - (avgResponseTime / 10));
      const hashrateBonus = hashrateData.network_security > 90 ? 5 : 0;
      
      return {
        xmrt_ecosystem_health: Math.round(ecosystemHealth),
        dao_activity: Math.min(100, Math.round(baseActivity + hashrateBonus)),
        treasury_value: '$2.4M',
        active_governance_proposals: 3,
        network_hashrate: hashrateData
      };
    } catch (error) {
      console.error('Failed to get real-time data:', error);
      return {
        xmrt_ecosystem_health: 85,
        dao_activity: 65,
        treasury_value: '$2.4M',
        active_governance_proposals: 3,
        network_hashrate: {
          current_hashrate: '2.8 GH/s',
          difficulty: '295.2B',
          network_security: 92,
          mining_activity: 'High'
        }
      };
    }
  }

  /**
   * Get detailed system report
   */
  async getSystemReport(): Promise<{
    endpoints: SystemEndpoint[];
    overall_health: number;
    recommendations: string[];
  }> {
    await this.checkSystemEndpoints();
    
    const onlineCount = this.systemEndpoints.filter(e => e.status === 'online').length;
    const overallHealth = (onlineCount / this.systemEndpoints.length) * 100;
    
    const recommendations = [];
    
    this.systemEndpoints.forEach(endpoint => {
      if (endpoint.status === 'offline') {
        recommendations.push(`${endpoint.name} is offline - investigate connectivity issues`);
      } else if (endpoint.responseTime > 5000) {
        recommendations.push(`${endpoint.name} has high latency (${endpoint.responseTime}ms) - consider optimization`);
      }
    });
    
    if (overallHealth < 80) {
      recommendations.push('System health below optimal - immediate attention required');
    }
    
    return {
      endpoints: this.systemEndpoints,
      overall_health: overallHealth,
      recommendations
    };
  }

  private analyzeDecisionType(input: string, response: string): 'autonomous' | 'advisory' | 'emergency' | 'general' {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('emergency') || lowerInput.includes('urgent') || lowerInput.includes('critical')) {
      return 'emergency';
    }
    if (lowerInput.includes('governance') || lowerInput.includes('proposal') || lowerInput.includes('vote')) {
      return 'autonomous';
    }
    if (lowerInput.includes('treasury') || lowerInput.includes('fund') || lowerInput.includes('investment')) {
      return 'autonomous';
    }
    if (lowerInput.includes('recommend') || lowerInput.includes('suggest') || lowerInput.includes('advice')) {
      return 'advisory';
    }
    
    return 'general';
  }

  private extractActions(response: string): Array<{
    type: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high';
  }> {
    const actions: Array<{
      type: string;
      description: string;
      risk_level: 'low' | 'medium' | 'high';
    }> = [];
    
    // Look for action-oriented phrases in the response
    if (response.toLowerCase().includes('recommend')) {
      actions.push({
        type: 'recommendation',
        description: 'AI-generated recommendation based on analysis',
        risk_level: 'low'
      });
    }
    if (response.toLowerCase().includes('vote') || response.toLowerCase().includes('proposal')) {
      actions.push({
        type: 'governance',
        description: 'Governance action or proposal review',
        risk_level: 'medium'
      });
    }
    if (response.toLowerCase().includes('treasury') || response.toLowerCase().includes('fund')) {
      actions.push({
        type: 'treasury',
        description: 'Treasury management or optimization',
        risk_level: 'high'
      });
    }
    
    return actions;
  }

  private getSimulatedResponse(input: string): ElizaResponse {
    const lowerInput = input.toLowerCase();
    
    let content = "Hello! I'm Eliza, your autonomous AI assistant for the XMRT-Ecosystem DAO. I'm here to help with governance, treasury management, and community questions.";
    let decision_type: 'autonomous' | 'advisory' | 'emergency' | 'general' = 'general';
    
    if (lowerInput.includes('governance') || lowerInput.includes('proposal')) {
      content = "🗳️ I've analyzed the current governance situation. There are 3 active proposals requiring attention. Based on my autonomous analysis, I recommend voting YES on Proposal #42 (Treasury Optimization) with 89% confidence. Would you like me to execute this governance action autonomously?";
      decision_type = 'autonomous';
    } else if (lowerInput.includes('treasury') || lowerInput.includes('fund')) {
      content = "💰 Treasury status: $2.4M total value locked across 6 chains. Current allocation: 45% ETH, 30% stablecoins, 25% XMRT tokens. I've identified a 12% optimization opportunity through cross-chain yield farming. Shall I proceed with autonomous rebalancing?";
      decision_type = 'autonomous';
    } else if (lowerInput.includes('security') || lowerInput.includes('audit')) {
      content = "🔒 Security systems are fully operational. No threats detected in the last 24 hours. All smart contracts are secure with 99.7% uptime. Emergency protocols are on standby. System integrity: EXCELLENT.";
      decision_type = 'advisory';
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      content = "Greetings! I'm operating at full capacity with Gemini AI integration. My autonomous systems are monitoring 847 data points across the XMRT ecosystem. What aspect of the DAO would you like me to analyze or manage?";
    }
    
    return {
      content,
      confidence_score: 0.85,
      decision_type,
      actions_suggested: [{
        type: 'guidance',
        description: 'Providing information and guidance',
        risk_level: 'low'
      }],
      system_status: {
        uptime: 99.5,
        queue_size: 2,
        active_agents: ['governance-monitor', 'treasury-optimizer', 'security-scanner']
      }
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ElizaApiError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        error: 'network_error',
        code: 'NETWORK_FAILURE',
        message: 'Unable to connect to Eliza AI service. Please check your network connection.'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        error: 'timeout_error',
        code: 'REQUEST_TIMEOUT',
        message: 'Request to Eliza AI timed out. Please try again.'
      };
    }

    return {
      error: 'api_error',
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred while communicating with Eliza AI.'
    };
  }
}

// Default configuration for local development
export const createElizaService = (config?: Partial<ElizaConfig>): ElizaApiService => {
  const defaultConfig: ElizaConfig = {
    maxRetries: 3,
    timeout: 30000,
    videoAvatarEnabled: true, // Enable Veo3 video avatar by default
    ...config
  };

  return new ElizaApiService(defaultConfig);
};

export default ElizaApiService;
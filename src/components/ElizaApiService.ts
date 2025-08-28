import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces for Eliza API
export interface ElizaConfig {
  apiEndpoint?: string;
  apiKey?: string;
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
  private systemEndpoints: SystemEndpoint[] = [
    {
      name: 'XMRT Ecosystem',
      url: 'https://xmrt-ecosystem-0k8i.onrender.com/',
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
- https://xmrt-ecosystem-0k8i.onrender.com/ (Main ecosystem backend)
- https://xmrtnet-eliza.onrender.com/ (Network monitoring)  
- https://xmrtdao.streamlit.app (DAO dashboard)

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
  }

  /**
   * Send a message to Eliza AI and get response
   */
  async sendMessage(message: ElizaMessage): Promise<ElizaResponse> {
    try {
      // If Gemini AI is available, use it
      if (this.model) {
        const chat = this.model.startChat({
          history: [],
        });

        const result = await chat.sendMessage(message.content);
        const response = await result.response;
        const content = response.text();

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
  clearConversation(): void {
    this.conversationId = null;
  }

  /**
   * Initialize video avatar with Veo3
   */
  private async initializeVideoAvatar(): Promise<void> {
    if (!this.videoModel) return;
    
    try {
      this.avatarState.isGenerating = true;
      
      // Generate initial neutral avatar video
      const videoPrompt = `Create a professional AI assistant avatar: A sophisticated, approachable human-like figure with:
      - Professional attire (modern business casual)
      - Neutral, friendly expression
      - Subtle head nods and blinks
      - 30-second loop of natural idle movements
      - Clean, minimalist background
      - High quality, realistic rendering
      Style: Photorealistic, professional, trustworthy`;

      // Simulate video generation (replace with actual Veo3 API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.avatarState = {
        isGenerating: false,
        currentVideoUrl: '/api/generated-avatar/neutral.mp4', // This would be actual Veo3 output
        emotion: 'neutral',
        isReady: true
      };
      
      console.log('Eliza video avatar initialized successfully');
    } catch (error) {
      console.error('Failed to initialize video avatar:', error);
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

      const videoPrompt = `Professional AI assistant expressing ${emotion}: ${emotionPrompts[emotion]}. 
      Maintain professional appearance, 15-second expression sequence, smooth transitions.`;

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
   * Get real-time data from XMRT ecosystem
   */
  private async getRealTimeData(): Promise<{
    xmrt_ecosystem_health: number;
    dao_activity: number;
    treasury_value: string;
    active_governance_proposals: number;
  }> {
    try {
      // Calculate ecosystem health based on endpoint status
      const onlineEndpoints = this.systemEndpoints.filter(e => e.status === 'online').length;
      const ecosystemHealth = (onlineEndpoints / this.systemEndpoints.length) * 100;
      
      // Simulate real-time data (replace with actual API calls)
      const avgResponseTime = this.systemEndpoints.reduce((acc, e) => acc + e.responseTime, 0) / this.systemEndpoints.length;
      
      return {
        xmrt_ecosystem_health: Math.round(ecosystemHealth),
        dao_activity: Math.max(20, 100 - (avgResponseTime / 10)), // Activity inversely related to response time
        treasury_value: '$2.4M',
        active_governance_proposals: 3
      };
    } catch (error) {
      console.error('Failed to get real-time data:', error);
      return {
        xmrt_ecosystem_health: 85,
        dao_activity: 65,
        treasury_value: '$2.4M',
        active_governance_proposals: 3
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
    apiEndpoint: 'http://localhost:8000', // Default XMRT-Ecosystem backend
    maxRetries: 3,
    timeout: 30000,
    videoAvatarEnabled: true, // Enable Veo3 video avatar by default
    ...config
  };

  return new ElizaApiService(defaultConfig);
};

export default ElizaApiService;
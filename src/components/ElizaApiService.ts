// XMRT-Ecosystem Eliza API Service
// This service handles communication with the Autonomous ElizaOS system

export interface ElizaConfig {
  apiEndpoint: string;
  apiKey?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface ElizaMessage {
  content: string;
  context?: {
    user_id?: string;
    conversation_id?: string;
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
  decision_type: 'autonomous' | 'advisory' | 'emergency';
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
}

export interface ElizaApiError {
  error: string;
  code: string;
  message: string;
}

class ElizaApiService {
  private config: ElizaConfig;
  private conversationId: string | null = null;

  constructor(config: ElizaConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      ...config
    };
  }

  /**
   * Send a message to Eliza AI and get response
   */
  async sendMessage(message: ElizaMessage): Promise<ElizaResponse> {
    const endpoint = `${this.config.apiEndpoint}/api/v1/chat`;
    
    const payload = {
      message: message.content,
      conversation_id: this.conversationId,
      context: {
        ...message.context,
        timestamp: new Date().toISOString(),
        source: 'xmrt_frontend_chatbot'
      }
    };

    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (response.conversation_id && !this.conversationId) {
        this.conversationId = response.conversation_id;
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
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
    const endpoint = `${this.config.apiEndpoint}/api/v1/status`;
    
    try {
      return await this.makeRequest(endpoint, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get autonomous decision from Eliza
   */
  async requestAutonomousDecision(request: {
    type: 'governance_proposal' | 'treasury_management' | 'security_alert';
    proposal_id?: string;
    context: object;
  }): Promise<{
    decision: string;
    confidence_score: number;
    reasoning: string;
    recommended_actions: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      estimated_impact: string;
    }>;
  }> {
    const endpoint = `${this.config.apiEndpoint}/api/v1/autonomous-decision`;
    
    try {
      return await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(request)
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get treasury analytics from Eliza
   */
  async getTreasuryAnalytics(): Promise<{
    total_value_usd: number;
    allocation_breakdown: Record<string, number>;
    optimization_opportunities: Array<{
      description: string;
      potential_gain_usd: number;
      risk_level: 'low' | 'medium' | 'high';
    }>;
    cross_chain_status: Record<string, {
      chain: string;
      value_usd: number;
      health: 'healthy' | 'warning' | 'critical';
    }>;
  }> {
    const endpoint = `${this.config.apiEndpoint}/api/v1/treasury/analytics`;
    
    try {
      return await this.makeRequest(endpoint, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get governance proposals analysis
   */
  async getGovernanceAnalysis(): Promise<{
    active_proposals: Array<{
      id: string;
      title: string;
      description: string;
      voting_deadline: string;
      eliza_recommendation: 'for' | 'against' | 'abstain';
      confidence_score: number;
      reasoning: string;
    }>;
    voting_participation: {
      total_eligible_voters: number;
      current_participation_rate: number;
      eliza_vote_weight: number;
    };
  }> {
    const endpoint = `${this.config.apiEndpoint}/api/v1/governance/analysis`;
    
    try {
      return await this.makeRequest(endpoint, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initialize conversation with Eliza
   */
  async initializeConversation(userId?: string): Promise<string> {
    const endpoint = `${this.config.apiEndpoint}/api/v1/conversation/init`;
    
    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          user_id: userId,
          source: 'xmrt_frontend_chatbot',
          preferences: {
            autonomous_mode: true,
            notification_level: 'moderate'
          }
        })
      });

      this.conversationId = response.conversation_id;
      return response.conversation_id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clear conversation
   */
  clearConversation(): void {
    this.conversationId = null;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, options: RequestInit, retryCount = 0): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 && retryCount < this.config.maxRetries!) {
          await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
          return this.makeRequest(url, options, retryCount + 1);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (retryCount < this.config.maxRetries!) {
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.makeRequest(url, options, retryCount + 1);
      }
      
      throw error;
    }
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

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default configuration for local development
export const createElizaService = (config?: Partial<ElizaConfig>): ElizaApiService => {
  const defaultConfig: ElizaConfig = {
    apiEndpoint: 'http://localhost:8000', // Default XMRT-Ecosystem backend
    maxRetries: 3,
    timeout: 30000,
    ...config
  };

  return new ElizaApiService(defaultConfig);
};

export default ElizaApiService;
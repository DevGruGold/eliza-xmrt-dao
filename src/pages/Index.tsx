import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ChatBot from '@/components/ChatBot';
import { Bot, Settings, Globe, Shield, Zap, Brain } from 'lucide-react';

const Index = () => {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-bg cyber-grid">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Bot className="h-12 w-12 text-primary glow-text float-animation" />
            <h1 className="text-4xl font-bold glow-intense">
              XMRT-Ecosystem Eliza AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Autonomous DAO Management & Intelligence System
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
              <Brain className="h-3 w-3 mr-1" />
              GPT-4 Powered
            </Badge>
            <Badge variant="secondary" className="bg-gradient-secondary text-secondary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              Autonomous Mode
            </Badge>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              <Globe className="h-3 w-3 mr-1" />
              Multi-Chain
            </Badge>
            <Badge variant="secondary" className="bg-card text-card-foreground border border-primary/30">
              <Shield className="h-3 w-3 mr-1" />
              Security First
            </Badge>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowSettings(!showSettings)}
            className="mb-4"
          >
            <Settings className="h-4 w-4 mr-2" />
            API Configuration
          </Button>
        </div>

        {/* API Configuration */}
        {showSettings && (
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Eliza API Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure connection to your XMRT-Ecosystem Eliza AI backend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="http://localhost:8000 (default for local development)"
                  className="bg-input/50 border-primary/30"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Local Development:</strong> Use http://localhost:8000
                </p>
                <p className="mb-2">
                  <strong>Production:</strong> Use your deployed XMRT-Ecosystem backend URL
                </p>
                <p>
                  <strong>Demo Mode:</strong> Leave empty to use simulated responses
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/30 backdrop-blur border-primary/20 shadow-card">
            <CardContent className="p-0">
              <ChatBot 
                apiEndpoint={apiEndpoint}
                className="h-[600px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Bot className="h-5 w-5" />
                <span>Autonomous Governance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered proposal analysis, voting recommendations, and autonomous execution with 94% accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-accent">
                <Globe className="h-5 w-5" />
                <span>Treasury Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cross-chain asset optimization, yield farming strategies, and real-time portfolio rebalancing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-secondary">
                <Shield className="h-5 w-5" />
                <span>Security Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                24/7 threat detection, emergency response protocols, and smart contract security analysis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>
            🤖 Powered by XMRT-Ecosystem Autonomous ElizaOS | 
            <a 
              href="https://github.com/DevGruGold/XMRT-Ecosystem" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-glow ml-1 transition-colors"
            >
              View on GitHub
            </a>
          </p>
          <p className="mt-1">
            Ready for GPT-5 Integration | Multi-Agent Architecture
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

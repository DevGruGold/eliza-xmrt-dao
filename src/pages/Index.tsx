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
      <div className="container mx-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="text-center py-3 sm:py-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-primary glow-text float-animation" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold glow-intense">
              Eliza AI
            </h1>
          </div>
          <p className="text-sm sm:text-lg text-muted-foreground mb-4">
            XMRT DAO Autonomous Assistant
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4">
            <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground text-xs">
              <Brain className="h-2.5 w-2.5 mr-1" />
              Gemini AI
            </Badge>
            <Badge variant="secondary" className="bg-gradient-secondary text-secondary-foreground text-xs">
              <Zap className="h-2.5 w-2.5 mr-1" />
              Autonomous
            </Badge>
            <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
              <Globe className="h-2.5 w-2.5 mr-1" />
              Multi-Chain
            </Badge>
            <Badge variant="secondary" className="bg-card text-card-foreground border border-primary/30 text-xs">
              <Shield className="h-2.5 w-2.5 mr-1" />
              Secure
            </Badge>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowSettings(!showSettings)}
            className="mb-3 h-8 px-3 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            API Config
          </Button>
        </div>

        {/* API Configuration */}
        {showSettings && (
          <Card className="mx-2 sm:mx-auto sm:max-w-2xl bg-card/80 backdrop-blur border-primary/20 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Settings className="h-4 w-4" />
                <span>API Configuration</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure Eliza AI backend connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1">
                <Label htmlFor="api-endpoint" className="text-xs">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="Leave empty for Gemini AI mode"
                  className="bg-input/50 border-primary/30 h-8 text-xs"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Gemini Mode:</strong> Leave empty (recommended)</p>
                <p><strong>Custom API:</strong> Enter your backend URL</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chat Interface */}
        <div className="mx-2 sm:mx-auto sm:max-w-4xl relative z-20">
          <Card className="bg-card/30 backdrop-blur border-primary/20 shadow-card">
            <CardContent className="p-0">
              <ChatBot 
                apiEndpoint={apiEndpoint}
                className="h-[60vh] sm:h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mx-2 sm:mx-auto sm:max-w-6xl relative z-10 mt-6">
          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-primary text-sm">
                <Bot className="h-4 w-4" />
                <span>Governance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                AI-powered proposal analysis and autonomous execution.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-accent text-sm">
                <Globe className="h-4 w-4" />
                <span>Treasury</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Cross-chain optimization and portfolio rebalancing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-secondary text-sm">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                24/7 threat detection and smart contract analysis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-3 text-xs text-muted-foreground">
          <p>
            🤖 XMRT DAO • 
            <a 
              href="https://github.com/DevGruGold/XMRT-Ecosystem" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-glow ml-1 transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, Activity } from 'lucide-react';
import { VideoAvatarState, SystemEndpoint } from './ElizaApiService';

interface VideoAvatarProps {
  avatarState: VideoAvatarState;
  systemEndpoints?: SystemEndpoint[];
  realTimeData?: {
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
  className?: string;
}

const VideoAvatar: React.FC<VideoAvatarProps> = ({
  avatarState,
  systemEndpoints = [],
  realTimeData,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current && avatarState.currentVideoUrl) {
      videoRef.current.load();
    }
  }, [avatarState.currentVideoUrl]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-accent';
      case 'degraded': return 'bg-warning';
      case 'offline': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-accent';
    if (health >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Avatar */}
      <Card className="relative overflow-hidden bg-gradient-primary border-primary/20 shadow-glow">
        <div className="aspect-square relative">
          {avatarState.isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Generating avatar...</p>
              </div>
            </div>
          )}
          
          {avatarState.currentVideoUrl ? (
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={handleVideoLoad}
            >
              <source src={avatarState.currentVideoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full bg-gradient-card flex items-center justify-center">
              <div className="text-center space-y-2">
                <Activity className="h-12 w-12 mx-auto text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Initializing Eliza Avatar...</p>
              </div>
            </div>
          )}
          
          {/* Avatar Status Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
            <Badge 
              variant="secondary" 
              className="bg-background/80 backdrop-blur-sm text-xs"
            >
              {avatarState.emotion}
            </Badge>
            <Badge 
              variant={avatarState.isReady ? "default" : "secondary"}
              className={`bg-background/80 backdrop-blur-sm text-xs ${
                avatarState.isReady ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {avatarState.isReady ? 'Ready' : 'Loading'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* System Status Dashboard */}
      {(systemEndpoints.length > 0 || realTimeData) && (
        <Card className="bg-card/50 border-primary/20 backdrop-blur-sm p-3 overflow-hidden">
          <div className="space-y-3 min-w-0">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2 truncate">
              <Activity className="h-4 w-4 flex-shrink-0" />
              System Status
            </h4>
            
            {/* Real-time metrics */}
            {realTimeData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex justify-between items-center min-w-0">
                      <span className="text-muted-foreground truncate">Ecosystem</span>
                      <span className={`${getHealthColor(realTimeData.xmrt_ecosystem_health)} flex-shrink-0`}>
                        {realTimeData.xmrt_ecosystem_health}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center min-w-0">
                      <span className="text-muted-foreground truncate">Activity</span>
                      <span className={`${getHealthColor(realTimeData.dao_activity)} flex-shrink-0`}>
                        {realTimeData.dao_activity}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex justify-between items-center min-w-0">
                      <span className="text-muted-foreground truncate">Treasury</span>
                      <span className="text-foreground font-medium flex-shrink-0 truncate max-w-16">
                        {realTimeData.treasury_value}
                      </span>
                    </div>
                    <div className="flex justify-between items-center min-w-0">
                      <span className="text-muted-foreground truncate">Proposals</span>
                      <span className="text-accent font-medium flex-shrink-0">
                        {realTimeData.active_governance_proposals}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Network Hashrate Section */}
                {realTimeData.network_hashrate && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Network Security</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground truncate">Hashrate</span>
                          <span className="text-foreground font-medium flex-shrink-0 truncate max-w-20">
                            {realTimeData.network_hashrate.current_hashrate}
                          </span>
                        </div>
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground truncate">Difficulty</span>
                          <span className="text-foreground font-medium flex-shrink-0 truncate max-w-20">
                            {realTimeData.network_hashrate.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground truncate">Security</span>
                          <span className={`${getHealthColor(realTimeData.network_hashrate.network_security)} flex-shrink-0`}>
                            {realTimeData.network_hashrate.network_security}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground truncate">Mining</span>
                          <span className="text-accent font-medium flex-shrink-0 truncate max-w-16">
                            {realTimeData.network_hashrate.mining_activity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Endpoint status */}
            {systemEndpoints.length > 0 && (
              <div className="space-y-1 min-w-0">
                {systemEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {endpoint.status === 'online' ? (
                        <Wifi className="h-3 w-3 text-accent flex-shrink-0" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-destructive flex-shrink-0" />
                      )}
                      <span className="text-muted-foreground truncate">
                        {endpoint.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(endpoint.status)}`} />
                      <span className="text-muted-foreground">
                        {endpoint.responseTime}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default VideoAvatar;
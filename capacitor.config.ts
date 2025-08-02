import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.116d3efea45948c1bc8828d4fa0895e0',
  appName: 'eliza-xmrt-dao',
  webDir: 'dist',
  server: {
    url: 'https://116d3efe-a459-48c1-bc88-28d4fa0895e0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#3b82f6'
    }
  }
};

export default config;
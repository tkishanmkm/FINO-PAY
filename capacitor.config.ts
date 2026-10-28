import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bankofbaroda.mconnect',
  appName: 'FinoPay',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;

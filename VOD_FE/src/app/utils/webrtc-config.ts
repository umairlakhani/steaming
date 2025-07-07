export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

export class WebRTCConfiguration {
  private static instance: WebRTCConfiguration;
  private config: WebRTCConfig;

  private constructor() {
    this.config = {
      iceServers: [
        // Google STUN servers
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
            'stun:stun.l.google.com:19302'
          ]
        },
        // Additional public STUN servers for redundancy
        {
          urls: [
            'stun:stun.ekiga.net',
            'stun:stun.ideasip.com',
            'stun:stun.rixtelecom.se',
            'stun:stun.schlund.de',
            'stun:stun.stunprotocol.org:3478'
          ]
        },
        // OpenRelay STUN servers
        {
          urls: [
            'stun:stun.openrelay.metered.ca:80',
            'stun:stun.openrelay.metered.ca:443',
            'stun:stun.openrelay.metered.ca:80'
          ]
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
  }

  public static getInstance(): WebRTCConfiguration {
    if (!WebRTCConfiguration.instance) {
      WebRTCConfiguration.instance = new WebRTCConfiguration();
    }
    return WebRTCConfiguration.instance;
  }

  public getConfiguration(): RTCConfiguration {
    return this.config;
  }

  public addCustomSTUNServer(url: string): void {
    this.config.iceServers.push({
      urls: [url]
    });
  }

  public addTURNServer(url: string, username?: string, credential?: string): void {
    this.config.iceServers.push({
      urls: [url],
      username: username,
      credential: credential
    });
  }

  public setIceTransportPolicy(policy: RTCIceTransportPolicy): void {
    this.config.iceTransportPolicy = policy;
  }

  public setBundlePolicy(policy: RTCBundlePolicy): void {
    this.config.bundlePolicy = policy;
  }

  public setRtcpMuxPolicy(policy: RTCRtcpMuxPolicy): void {
    this.config.rtcpMuxPolicy = policy;
  }

  public setIceCandidatePoolSize(size: number): void {
    this.config.iceCandidatePoolSize = size;
  }

  // Method to get configuration optimized for different network conditions
  public getOptimizedConfiguration(networkType: 'local' | 'public' | 'restricted' = 'public'): RTCConfiguration {
    const baseConfig = { ...this.config };

    switch (networkType) {
      case 'local':
        // For local networks, we can be more aggressive with ICE policies
        baseConfig.iceTransportPolicy = 'relay';
        baseConfig.iceCandidatePoolSize = 5;
        break;
      
      case 'restricted':
        // For restricted networks (corporate firewalls, etc.), add more STUN servers
        baseConfig.iceServers.push({
          urls: [
            'stun:stun.voiparound.com',
            'stun:stun.voipbuster.com',
            'stun:stun.voipstunt.com'
          ]
        });
        baseConfig.iceCandidatePoolSize = 15;
        break;
      
      case 'public':
      default:
        // Default configuration is already optimized for public networks
        break;
    }

    return baseConfig;
  }

  // Method to test STUN server connectivity
  public async testSTUNConnectivity(): Promise<{ [server: string]: boolean }> {
    const results: { [server: string]: boolean } = {};
    
    for (const server of this.config.iceServers) {
      if (server.urls) {
        for (const url of server.urls) {
          try {
            const testConfig: RTCConfiguration = {
              iceServers: [{ urls: [url] }],
              iceCandidatePoolSize: 1
            };
            
            const pc = new RTCPeerConnection(testConfig);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Wait a bit for ICE gathering
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            results[url] = pc.iceGatheringState === 'complete' || pc.iceGatheringState === 'gathering';
            pc.close();
          } catch (error) {
            console.warn(`Failed to test STUN server ${url}:`, error);
            results[url] = false;
          }
        }
      }
    }
    
    return results;
  }
}

// Export a default configuration instance
export const defaultWebRTCConfig = WebRTCConfiguration.getInstance().getConfiguration(); 
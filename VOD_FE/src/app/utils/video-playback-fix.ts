export interface VideoPlaybackFixOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableDebug?: boolean;
  forceMuted?: boolean;
  enableAutoplay?: boolean;
}

export interface VideoElementState {
  readyState: number;
  networkState: number;
  videoWidth: number;
  videoHeight: number;
  paused: boolean;
  ended: boolean;
  error: MediaError | null;
  src: string;
  srcObject: MediaProvider | null;
  autoplay: boolean;
  muted: boolean;
  playsInline: boolean;
  controls: boolean;
}

export class VideoPlaybackFix {
  private static instance: VideoPlaybackFix;
  private options: VideoPlaybackFixOptions;

  private constructor(options: VideoPlaybackFixOptions = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      enableDebug: true,
      forceMuted: true,
      enableAutoplay: true,
      ...options
    };
  }

  public static getInstance(options?: VideoPlaybackFixOptions): VideoPlaybackFix {
    if (!VideoPlaybackFix.instance) {
      VideoPlaybackFix.instance = new VideoPlaybackFix(options);
    }
    return VideoPlaybackFix.instance;
  }

  public log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    if (this.options.enableDebug) {
      const timestamp = new Date().toLocaleTimeString();
      const color = type === 'error' ? '#dc3545' : 
                   type === 'success' ? '#28a745' : 
                   type === 'warning' ? '#ffc107' : '#007bff';
      console.log(`%c[${timestamp}] VideoPlaybackFix: ${message}`, `color: ${color}`);
    }
  }

  private logWithSeverity(message: string, severity: 'info' | 'warning' | 'critical'): void {
    const type = severity === 'critical' ? 'error' : severity;
    this.log(message, type);
  }

  public getVideoState(videoElement: HTMLVideoElement): VideoElementState {
    return {
      readyState: videoElement.readyState,
      networkState: videoElement.networkState,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
      paused: videoElement.paused,
      ended: videoElement.ended,
      error: videoElement.error,
      src: videoElement.src,
      srcObject: videoElement.srcObject,
      autoplay: videoElement.autoplay,
      muted: videoElement.muted,
      playsInline: videoElement.playsInline,
      controls: videoElement.controls
    };
  }

  public isVideoStuck(videoElement: HTMLVideoElement): boolean {
    const state = this.getVideoState(videoElement);
    return state.readyState === 0 && state.networkState === 2;
  }

  public hasValidSource(videoElement: HTMLVideoElement): boolean {
    return !!(videoElement.srcObject || videoElement.src);
  }

  public async diagnoseVideoElement(videoElement: HTMLVideoElement): Promise<{
    issue: string;
    severity: 'critical' | 'warning' | 'info';
    fixes: string[];
  }> {
    const state = this.getVideoState(videoElement);
    const issues: Array<{ issue: string; severity: 'critical' | 'warning' | 'info'; fixes: string[] }> = [];

    // Check for no source
    if (!this.hasValidSource(videoElement)) {
      issues.push({
        issue: 'Video element has no source (srcObject or src)',
        severity: 'critical',
        fixes: ['Attach MediaStream to srcObject', 'Set video src URL']
      });
    }

    // Check for stuck state
    if (this.isVideoStuck(videoElement)) {
      issues.push({
        issue: 'Video element is stuck (readyState: 0, networkState: 2)',
        severity: 'critical',
        fixes: ['Reset video element', 'Check MediaStream status', 'Force video load']
      });
    }

    // Check MediaStream status
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      if (!stream.active) {
        issues.push({
          issue: 'MediaStream is not active',
          severity: 'critical',
          fixes: ['Check WebRTC connection', 'Recreate MediaStream']
        });
      }

      const tracks = stream.getTracks();
      if (tracks.length === 0) {
        issues.push({
          issue: 'MediaStream has no tracks',
          severity: 'critical',
          fixes: ['Check WebRTC producer', 'Recreate MediaStream']
        });
      }

      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        issues.push({
          issue: 'MediaStream has no video tracks',
          severity: 'warning',
          fixes: ['Check video producer', 'Enable video track']
        });
      }

      const disabledTracks = tracks.filter(track => !track.enabled);
      if (disabledTracks.length > 0) {
        issues.push({
          issue: `${disabledTracks.length} track(s) are disabled`,
          severity: 'warning',
          fixes: ['Enable disabled tracks', 'Check track permissions']
        });
      }
    }

    // Return the most critical issue
    const criticalIssue = issues.find(i => i.severity === 'critical');
    const warningIssue = issues.find(i => i.severity === 'warning');
    
    return criticalIssue || warningIssue || {
      issue: 'No issues detected',
      severity: 'info',
      fixes: []
    };
  }

  public async fixVideoElement(videoElement: HTMLVideoElement): Promise<boolean> {
    this.log('Starting video element fix...', 'info');
    
    try {
      // Step 1: Diagnose the issue
      const diagnosis = await this.diagnoseVideoElement(videoElement);
      this.logWithSeverity(`Diagnosis: ${diagnosis.issue}`, diagnosis.severity);
      
      if (diagnosis.severity === 'info') {
        this.log('No fixes needed', 'success');
        return true;
      }

      // Step 2: Apply fixes based on diagnosis
      if (diagnosis.issue.includes('no source')) {
        this.log('Cannot fix: No video source available', 'error');
        return false;
      }

      if (diagnosis.issue.includes('stuck')) {
        return await this.fixStuckVideoElement(videoElement);
      }

      if (diagnosis.issue.includes('MediaStream')) {
        return await this.fixMediaStreamIssues(videoElement);
      }

      return true;
    } catch (error) {
      this.log(`Fix failed: ${error}`, 'error');
      return false;
    }
  }

  private async fixStuckVideoElement(videoElement: HTMLVideoElement): Promise<boolean> {
    this.log('Fixing stuck video element...', 'info');
    
    try {
      // Save current state
      const currentSrcObject = videoElement.srcObject;
      const currentSrc = videoElement.src;
      
      // Complete reset
      videoElement.pause();
      videoElement.src = '';
      videoElement.srcObject = null;
      videoElement.load();
      
      await this.delay(100);
      
      // Reconfigure
      videoElement.autoplay = this.options.enableAutoplay ?? true;
      videoElement.muted = this.options.forceMuted ?? true;
      videoElement.playsInline = true;
      videoElement.controls = false;
      
      // Restore source
      if (currentSrcObject) {
        videoElement.srcObject = currentSrcObject;
      } else if (currentSrc) {
        videoElement.src = currentSrc;
      }
      
      videoElement.load();
      await this.delay(200);
      
      // Wait for ready state
      await this.waitForVideoReady(videoElement);
      
      this.log('Stuck video element fix completed', 'success');
      return true;
    } catch (error) {
      this.log(`Stuck video element fix failed: ${error}`, 'error');
      return false;
    }
  }

  private async fixMediaStreamIssues(videoElement: HTMLVideoElement): Promise<boolean> {
    this.log('Fixing MediaStream issues...', 'info');
    
    try {
      if (!videoElement.srcObject) {
        this.log('No MediaStream to fix', 'warning');
        return false;
      }

      const stream = videoElement.srcObject as MediaStream;
      
      // Enable disabled tracks
      const tracks = stream.getTracks();
      let enabledCount = 0;
      
      for (const track of tracks) {
        if (!track.enabled) {
          track.enabled = true;
          enabledCount++;
          this.log(`Enabled ${track.kind} track`, 'info');
        }
      }
      
      if (enabledCount > 0) {
        this.log(`Enabled ${enabledCount} track(s)`, 'success');
      }
      
      // Check if stream is active
      if (!stream.active) {
        this.log('MediaStream is not active - cannot fix', 'error');
        return false;
      }
      
      // Force video element to reload stream
      videoElement.srcObject = null;
      await this.delay(50);
      videoElement.srcObject = stream;
      videoElement.load();
      await this.delay(200);
      
      this.log('MediaStream issues fix completed', 'success');
      return true;
    } catch (error) {
      this.log(`MediaStream issues fix failed: ${error}`, 'error');
      return false;
    }
  }

  public async playVideo(videoElement: HTMLVideoElement): Promise<boolean> {
    this.log('Attempting to play video...', 'info');
    
    try {
      // Check if video needs fixing
      if (this.isVideoStuck(videoElement)) {
        this.log('Video is stuck, applying fixes...', 'warning');
        const fixed = await this.fixVideoElement(videoElement);
        if (!fixed) {
          this.log('Failed to fix video element', 'error');
          return false;
        }
      }
      
      // Ensure video is ready
      if (videoElement.readyState < 1) {
        this.log('Waiting for video to be ready...', 'info');
        await this.waitForVideoReady(videoElement);
      }
      
      // Ensure muted for autoplay
      if (this.options.forceMuted ?? true) {
        videoElement.muted = true;
      }
      
      // Try to play
      if (videoElement.paused) {
        await videoElement.play();
        this.log('Video play successful', 'success');
      } else {
        this.log('Video is already playing', 'info');
      }
      
      return true;
    } catch (error: any) {
      this.log(`Video play failed: ${error.message}`, 'error');
      
      if (error.name === 'NotAllowedError') {
        this.log('Autoplay blocked by browser', 'warning');
      }
      
      return false;
    }
  }

  private async waitForVideoReady(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (videoElement.readyState >= 1 || videoElement.videoWidth > 0) {
          this.log(`Video ready (readyState: ${videoElement.readyState}, dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight})`, 'success');
          resolve();
          return;
        }
        setTimeout(checkReady, 100);
      };
      
      // Set up event listeners as backup
      const onReady = () => {
        this.log('Video ready event fired', 'success');
        videoElement.removeEventListener('loadedmetadata', onReady);
        videoElement.removeEventListener('canplay', onReady);
        resolve();
      };
      
      videoElement.addEventListener('loadedmetadata', onReady);
      videoElement.addEventListener('canplay', onReady);
      
      // Start checking immediately
      checkReady();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        videoElement.removeEventListener('loadedmetadata', onReady);
        videoElement.removeEventListener('canplay', onReady);
        this.log('Video ready timeout, proceeding anyway', 'warning');
        resolve();
      }, 10000);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async retryPlayVideo(videoElement: HTMLVideoElement): Promise<boolean> {
    const maxRetries = this.options.maxRetries ?? 3;
    this.log(`Retrying video play (max ${maxRetries} attempts)...`, 'info');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.log(`Attempt ${attempt}/${maxRetries}`, 'info');
      
      const success = await this.playVideo(videoElement);
      if (success) {
        this.log(`Video play successful on attempt ${attempt}`, 'success');
        return true;
      }
      
      if (attempt < (this.options.maxRetries ?? 3)) {
        const retryDelay = this.options.retryDelay ?? 1000;
        this.log(`Waiting ${retryDelay}ms before retry...`, 'info');
        await this.delay(retryDelay);
      }
    }
    
    this.log('All retry attempts failed', 'error');
    return false;
  }
}

// Export a default instance
export const videoPlaybackFix = VideoPlaybackFix.getInstance(); 
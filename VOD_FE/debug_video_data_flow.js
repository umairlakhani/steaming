// Copy and paste this entire script into your browser console
// Comprehensive video data flow debugging
console.log("🔍 === COMPREHENSIVE VIDEO DATA FLOW DEBUG ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, starting diagnostics...");
  
  // Wait for video element
  const waitForVideoElement = () => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkVideo = () => {
        attempts++;
        if (component.target && component.target.nativeElement) {
          resolve(component.target.nativeElement);
          return;
        }
        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }
        setTimeout(checkVideo, 100);
      };
      checkVideo();
    });
  };
  
  waitForVideoElement().then((video) => {
    if (!video) {
      console.error("❌ Video element not found");
      return;
    }
    
    console.log("📺 Video element found, analyzing data flow...");
    
    // 1. Check MediaSoup state
    console.log("🔧 === MEDIASOUP STATE ===");
    console.log("Consumer Transport:", {
      exists: !!component.consumerTransport,
      state: component.consumerTransport?.connectionState,
      dtlsState: component.consumerTransport?.dtlsTransport?.state
    });
    
    console.log("Video Consumer:", {
      exists: !!component.videoConsumer,
      paused: component.videoConsumer?.paused,
      closed: component.videoConsumer?.closed,
      track: component.videoConsumer?.track
    });
    
    console.log("Audio Consumer:", {
      exists: !!component.audioConsumer,
      paused: component.audioConsumer?.paused,
      closed: component.audioConsumer?.closed,
      track: component.audioConsumer?.track
    });
    
    // 2. Check MediaStream details
    console.log("🎯 === MEDIASTREAM ANALYSIS ===");
    if (video.srcObject && video.srcObject instanceof MediaStream) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      
      console.log("Stream active:", stream.active);
      console.log("Stream ID:", stream.id);
      
      tracks.forEach((track, index) => {
        console.log(`Track ${index + 1} (${track.kind}):`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          contentHint: track.contentHint,
          constraints: track.getConstraints(),
          settings: track.getSettings(),
          capabilities: track.getCapabilities()
        });
      });
    } else {
      console.log("❌ No MediaStream found in video element");
    }
    
    // 3. Monitor video element state changes
    console.log("📊 === VIDEO ELEMENT MONITORING ===");
    let monitorCount = 0;
    const maxMonitorCount = 100; // 10 seconds
    
    const monitor = setInterval(() => {
      monitorCount++;
      
      console.log(`Monitor ${monitorCount}/${maxMonitorCount}:`, {
        readyState: video.readyState,
        networkState: video.networkState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime,
        duration: video.duration,
        paused: video.paused,
        muted: video.muted,
        hasSrcObject: !!video.srcObject,
        srcObjectActive: video.srcObject?.active
      });
      
      // Check for success conditions
      if (video.readyState >= 2 && video.videoWidth > 0) {
        console.log("✅ SUCCESS: Video has loaded with dimensions!");
        clearInterval(monitor);
        return;
      }
      
      // Check for failure conditions
      if (monitorCount >= maxMonitorCount) {
        console.log("⏰ Monitoring timeout reached");
        clearInterval(monitor);
        
        // Try to force video load
        console.log("🔧 Attempting to force video load...");
        if (video.srcObject) {
          video.load();
          setTimeout(() => {
            console.log("After force load:", {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          }, 1000);
        }
      }
    }, 100);
    
    // 4. Check for video element events
    console.log("🎬 === VIDEO EVENT MONITORING ===");
    const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'error'];
    
    events.forEach(eventName => {
      video.addEventListener(eventName, (e) => {
        console.log(`🎬 Video event: ${eventName}`, {
          readyState: video.readyState,
          networkState: video.networkState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      });
    });
    
    // 5. Try alternative video setup
    console.log("🔄 === ALTERNATIVE VIDEO SETUP ===");
    setTimeout(() => {
      if (video.readyState < 2) {
        console.log("🔧 Trying alternative video setup...");
        
        // Store current stream
        const currentStream = video.srcObject;
        
        // Clear and reset
        video.srcObject = null;
        video.load();
        
        setTimeout(() => {
          // Re-attach stream
          video.srcObject = currentStream;
          video.load();
          
          console.log("After alternative setup:", {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
        }, 100);
      }
    }, 3000);
    
  });
} 
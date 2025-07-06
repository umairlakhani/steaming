// Test video playback after successful MediaSoup flow
console.log("🎥 === TESTING VIDEO PLAYBACK ===");

// Get the component
const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, checking video playback...");
  
  // Wait for video element to be available
  const waitForVideoElement = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds
      
      const checkVideo = () => {
        attempts++;
        
        if (component.target && component.target.nativeElement) {
          console.log("✅ Video element found after", attempts, "attempts");
          resolve(component.target.nativeElement);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.error("❌ Video element not found after", maxAttempts, "attempts");
          reject(new Error("Video element not available"));
          return;
        }
        
        setTimeout(checkVideo, 100);
      };
      
      checkVideo();
    });
  };
  
  // Test video playback
  waitForVideoElement().then((video) => {
    console.log("📺 Video element status:", {
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      duration: video.duration,
      paused: video.paused,
      muted: video.muted,
      hasSrcObject: !!video.srcObject,
      srcObjectType: video.srcObject ? video.srcObject.constructor.name : 'none'
    });
    
    // Check if srcObject has tracks
    if (video.srcObject && video.srcObject instanceof MediaStream) {
      const tracks = video.srcObject.getTracks();
      console.log("🎯 MediaStream tracks:", {
        trackCount: tracks.length,
        videoTracks: tracks.filter(t => t.kind === 'video').length,
        audioTracks: tracks.filter(t => t.kind === 'audio').length,
        trackDetails: tracks.map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
      });
    } else {
      console.log("⚠️ No MediaStream found in video element");
    }
    
    // Try to play the video
    console.log("▶️ Attempting to play video...");
    video.play().then(() => {
      console.log("✅ Video play successful!");
      
      // Monitor video state
      setTimeout(() => {
        console.log("📊 Video state after 2 seconds:", {
          readyState: video.readyState,
          networkState: video.networkState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          currentTime: video.currentTime,
          paused: video.paused
        });
      }, 2000);
      
    }).catch((error) => {
      console.error("❌ Video play failed:", error);
    });
    
  }).catch((error) => {
    console.error("❌ Failed to get video element:", error);
  });
} 
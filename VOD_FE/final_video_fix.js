// FINAL VIDEO FIX - Direct Angular Context Access
console.log('=== FINAL VIDEO FIX ===');

// 1. Direct access to Angular context
console.log('1. Accessing Angular context directly...');

let viewerComponent = null;

// Get the Angular context from the viewer element
const viewerElement = document.querySelector('app-viewer');
if (viewerElement && viewerElement.__ngContext__) {
  console.log('✅ Found Angular context');
  
  // Look through the context for the component
  const context = viewerElement.__ngContext__;
  for (let i = 0; i < context.length; i++) {
    const item = context[i];
    if (item && typeof item === 'object' && item.videoConsumer) {
      viewerComponent = item;
      console.log('✅ Found viewer component in context at index:', i);
      break;
    }
  }
}

if (!viewerComponent) {
  console.log('❌ Could not find viewer component in context');
  console.log('Context length:', viewerElement?.__ngContext__?.length);
  
  // Try to find it by looking for any object with MediaSoup properties
  if (viewerElement && viewerElement.__ngContext__) {
    const context = viewerElement.__ngContext__;
    for (let i = 0; i < context.length; i++) {
      const item = context[i];
      if (item && typeof item === 'object') {
        const hasMediaSoupProps = item.videoConsumer || item.audioConsumer || item.consumerTransport || item.device;
        if (hasMediaSoupProps) {
          viewerComponent = item;
          console.log('✅ Found component with MediaSoup properties at index:', i);
          break;
        }
      }
    }
  }
}

// 2. Extract MediaSoup objects
if (viewerComponent) {
  console.log('2. Extracting MediaSoup objects...');
  
  // Extract consumers
  if (viewerComponent.videoConsumer) {
    window.videoConsumer = viewerComponent.videoConsumer;
    console.log('✅ Video consumer extracted');
    console.log('Video consumer state:', {
      closed: window.videoConsumer.closed,
      paused: window.videoConsumer.paused,
      hasTrack: !!window.videoConsumer.track
    });
  }
  
  if (viewerComponent.audioConsumer) {
    window.audioConsumer = viewerComponent.audioConsumer;
    console.log('✅ Audio consumer extracted');
    console.log('Audio consumer state:', {
      closed: window.audioConsumer.closed,
      paused: window.audioConsumer.paused,
      hasTrack: !!window.audioConsumer.track
    });
  }
  
  if (viewerComponent.consumerTransport) {
    window.consumerTransport = viewerComponent.consumerTransport;
    console.log('✅ Consumer transport extracted');
    console.log('Transport state:', {
      closed: window.consumerTransport.closed,
      connectionState: window.consumerTransport.connectionState
    });
  }
  
  if (viewerComponent.device) {
    window.mediasoupDevice = viewerComponent.device;
    console.log('✅ MediaSoup device extracted');
  }
  
  // Extract tracks
  if (viewerComponent.videoTrack) {
    window.videoTrack = viewerComponent.videoTrack;
    console.log('✅ Video track extracted');
  }
  
  if (viewerComponent.audioTrack) {
    window.audioTrack = viewerComponent.audioTrack;
    console.log('✅ Audio track extracted');
  }
  
} else {
  console.log('❌ No viewer component found');
}

// 3. Fix the video playback issue
console.log('3. Fixing video playback...');

const videoElement = document.querySelector('video');
if (videoElement && videoElement.srcObject) {
  console.log('✅ Video element has MediaStream');
  
  const stream = videoElement.srcObject;
  const tracks = stream.getTracks();
  console.log('Stream tracks:', tracks.length);
  
  // Check if video track is muted
  const videoTrack = tracks.find(track => track.kind === 'video');
  if (videoTrack) {
    console.log('Video track state:', {
      enabled: videoTrack.enabled,
      muted: videoTrack.muted,
      readyState: videoTrack.readyState
    });
    
    // Unmute the video track if it's muted
    if (videoTrack.muted) {
      console.log('🔄 Unmuting video track...');
      videoTrack.muted = false;
    }
  }
  
  // Stop any ongoing operations that might interfere
  if (window.videoPlayTimer) {
    clearTimeout(window.videoPlayTimer);
    window.videoPlayTimer = null;
  }
  
  if (window.videoSetupTimer) {
    clearTimeout(window.videoSetupTimer);
    window.videoSetupTimer = null;
  }
  
  // Reset video element properly
  videoElement.pause();
  videoElement.currentTime = 0;
  
  // Remove all event listeners that might be causing issues
  videoElement.onloadstart = null;
  videoElement.onloadedmetadata = null;
  videoElement.onloadeddata = null;
  videoElement.oncanplay = null;
  videoElement.oncanplaythrough = null;
  videoElement.onplay = null;
  videoElement.onplaying = null;
  videoElement.onpause = null;
  videoElement.onended = null;
  videoElement.onerror = null;
  
  // Set up proper event listeners
  videoElement.addEventListener('loadedmetadata', () => {
    console.log('✅ Video metadata loaded');
  });
  
  videoElement.addEventListener('canplay', () => {
    console.log('✅ Video can play');
  });
  
  videoElement.addEventListener('playing', () => {
    console.log('✅ Video is playing');
  });
  
  videoElement.addEventListener('error', (e) => {
    console.log('❌ Video error:', e);
  });
  
  // Create a stable play function
  window.playVideoSafely = async function() {
    try {
      console.log('🔄 Attempting to play video safely...');
      
      // Wait for video to be ready
      if (videoElement.readyState < 2) {
        console.log('⏳ Waiting for video to be ready...');
        await new Promise((resolve) => {
          const checkReady = () => {
            if (videoElement.readyState >= 2) {
              console.log('✅ Video is ready');
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
      }
      
      // Ensure video is not muted
      videoElement.muted = false;
      
      // Try to play
      await videoElement.play();
      console.log('✅ Video playing successfully!');
      
    } catch (error) {
      console.log('❌ Video play failed:', error.message);
      
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      videoElement.muted = true;
      try {
        await videoElement.play();
        console.log('✅ Video playing with muted audio');
        // Unmute after a short delay
        setTimeout(() => {
          videoElement.muted = false;
          console.log('🔄 Audio unmuted');
        }, 1000);
      } catch (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
      }
    }
  };
  
  // Try to play the video
  setTimeout(() => {
    window.playVideoSafely();
  }, 500);
  
} else {
  console.log('❌ No video element or MediaStream found');
}

// 4. Create a function to refresh from component
window.refreshFromComponent = function() {
  console.log('🔄 Refreshing from component...');
  
  const viewerElement = document.querySelector('app-viewer');
  if (viewerElement && viewerElement.__ngContext__) {
    const context = viewerElement.__ngContext__;
    for (let i = 0; i < context.length; i++) {
      const item = context[i];
      if (item && typeof item === 'object' && item.videoConsumer) {
        // Update global objects
        if (item.videoConsumer) window.videoConsumer = item.videoConsumer;
        if (item.audioConsumer) window.audioConsumer = item.audioConsumer;
        if (item.consumerTransport) window.consumerTransport = item.consumerTransport;
        if (item.device) window.mediasoupDevice = item.device;
        if (item.videoTrack) window.videoTrack = item.videoTrack;
        if (item.audioTrack) window.audioTrack = item.audioTrack;
        
        console.log('✅ MediaSoup objects refreshed');
        return;
      }
    }
  }
  console.log('❌ Could not refresh from component');
};

console.log('=== FINAL FIX COMPLETE ===');
console.log('Available functions:');
console.log('- window.playVideoSafely() - Play video safely');
console.log('- window.refreshFromComponent() - Refresh MediaSoup objects');
console.log('Available objects:');
console.log('- window.videoConsumer - Video consumer');
console.log('- window.audioConsumer - Audio consumer');
console.log('- window.consumerTransport - Consumer transport');
console.log('- window.mediasoupDevice - MediaSoup device'); 
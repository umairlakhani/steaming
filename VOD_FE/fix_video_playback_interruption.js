// Fix for video playback interruption issue
console.log('=== FIXING VIDEO PLAYBACK INTERRUPTION ===');

// 1. Stop any ongoing video operations
console.log('1. Stopping ongoing operations...');
if (window.videoPlayTimer) {
  clearTimeout(window.videoPlayTimer);
  window.videoPlayTimer = null;
  console.log('✅ Cleared video play timer');
}

if (window.videoSetupTimer) {
  clearTimeout(window.videoSetupTimer);
  window.videoSetupTimer = null;
  console.log('✅ Cleared video setup timer');
}

// 2. Reset video element properly
console.log('2. Resetting video element...');
const videoElement = document.querySelector('video');
if (videoElement) {
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
  
  // Pause and reset video
  videoElement.pause();
  videoElement.currentTime = 0;
  videoElement.src = '';
  videoElement.srcObject = null;
  
  console.log('✅ Video element reset');
} else {
  console.log('❌ Video element not found');
}

// 3. Check and fix MediaSoup consumers
console.log('3. Checking MediaSoup consumers...');

// Check if consumers exist and are properly set up
if (window.videoConsumer && !window.videoConsumer.closed) {
  console.log('✅ Video consumer exists and is active');
  
  // Resume consumer if paused
  if (window.videoConsumer.paused) {
    console.log('🔄 Resuming video consumer...');
    window.videoConsumer.resume();
  }
  
  // Get the video track
  const videoTrack = window.videoConsumer.track;
  if (videoTrack && videoTrack.readyState === 'live') {
    console.log('✅ Video track is live');
    
    // Create a new MediaStream with the video track
    const stream = new MediaStream([videoTrack]);
    
    // Set the stream to video element
    if (videoElement) {
      videoElement.srcObject = stream;
      console.log('✅ Video stream attached to video element');
      
      // Try to play the video
      videoElement.play().then(() => {
        console.log('✅ Video started playing successfully');
      }).catch(error => {
        console.log('❌ Video play failed:', error.message);
      });
    }
  } else {
    console.log('❌ Video track not available or not live');
  }
} else {
  console.log('❌ Video consumer not found or closed');
}

if (window.audioConsumer && !window.audioConsumer.closed) {
  console.log('✅ Audio consumer exists and is active');
  
  // Resume audio consumer if paused
  if (window.audioConsumer.paused) {
    console.log('🔄 Resuming audio consumer...');
    window.audioConsumer.resume();
  }
} else {
  console.log('❌ Audio consumer not found or closed');
}

// 4. Check transport connection
console.log('4. Checking transport connection...');
if (window.consumerTransport && !window.consumerTransport.closed) {
  console.log('✅ Consumer transport exists and is active');
  console.log('Transport state:', window.consumerTransport.connectionState);
  
  if (window.consumerTransport.connectionState === 'new') {
    console.log('⚠️ Transport is in "new" state - may need to connect');
  } else if (window.consumerTransport.connectionState === 'connected') {
    console.log('✅ Transport is connected');
  } else {
    console.log('⚠️ Transport state:', window.consumerTransport.connectionState);
  }
} else {
  console.log('❌ Consumer transport not found or closed');
}

// 5. Create a simple video play function that won't be interrupted
console.log('5. Creating stable video play function...');

window.stableVideoPlay = async function() {
  const video = document.querySelector('video');
  if (!video) {
    console.log('❌ No video element found');
    return;
  }
  
  if (!video.srcObject) {
    console.log('❌ No video stream attached');
    return;
  }
  
  try {
    // Wait for video to be ready
    if (video.readyState < 2) {
      console.log('🔄 Waiting for video to be ready...');
      await new Promise((resolve) => {
        const checkReady = () => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
    
    // Play the video
    await video.play();
    console.log('✅ Video playing successfully');
  } catch (error) {
    console.log('❌ Video play error:', error.message);
  }
};

// 6. Set up proper event listeners
console.log('6. Setting up proper event listeners...');
if (videoElement) {
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
  
  console.log('✅ Event listeners set up');
}

// 7. Try to play video after a short delay
console.log('7. Attempting to play video...');
setTimeout(() => {
  if (window.stableVideoPlay) {
    window.stableVideoPlay();
  }
}, 1000);

console.log('=== FIX COMPLETE ===');
console.log('Run window.stableVideoPlay() to manually start video playback'); 
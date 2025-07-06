// Fix for accessing MediaSoup consumers from Angular component
console.log('=== FIXING COMPONENT MEDIASOUP ACCESS ===');

// 1. Try to access the Angular component
console.log('1. Accessing Angular component...');

let viewerComponent = null;

// Method 1: Try Angular debugger
if (window.ng && window.ng.probe) {
  try {
    const componentElement = document.querySelector('app-viewer');
    if (componentElement) {
      const component = window.ng.probe(componentElement);
      if (component && component.componentInstance) {
        viewerComponent = component.componentInstance;
        console.log('✅ Found viewer component via Angular debugger');
      }
    }
  } catch (error) {
    console.log('❌ Angular debugger method failed:', error.message);
  }
}

// Method 2: Try to find component in global scope
if (!viewerComponent) {
  console.log('2. Looking for component in global scope...');
  const possibleComponentNames = [
    'viewerComponent',
    'appViewer',
    'viewer',
    'component'
  ];
  
  for (const name of possibleComponentNames) {
    if (window[name] && window[name].videoConsumer) {
      viewerComponent = window[name];
      console.log(`✅ Found viewer component as window.${name}`);
      break;
    }
  }
}

// Method 3: Try to find in Angular context
if (!viewerComponent) {
  console.log('3. Looking in Angular context...');
  try {
    const element = document.querySelector('app-viewer');
    if (element && element.__ngContext__) {
      // Look through the context for the component
      const context = element.__ngContext__;
      for (let i = 0; i < context.length; i++) {
        const item = context[i];
        if (item && typeof item === 'object' && item.videoConsumer) {
          viewerComponent = item;
          console.log('✅ Found viewer component in Angular context');
          break;
        }
      }
    }
  } catch (error) {
    console.log('❌ Angular context method failed:', error.message);
  }
}

// 2. If we found the component, extract MediaSoup objects
if (viewerComponent) {
  console.log('4. Extracting MediaSoup objects from component...');
  
  // Extract consumers and transport
  if (viewerComponent.videoConsumer) {
    window.videoConsumer = viewerComponent.videoConsumer;
    console.log('✅ Video consumer extracted to global scope');
    console.log('Video consumer state:', {
      closed: window.videoConsumer.closed,
      paused: window.videoConsumer.paused,
      hasTrack: !!window.videoConsumer.track
    });
  } else {
    console.log('❌ No video consumer found in component');
  }
  
  if (viewerComponent.audioConsumer) {
    window.audioConsumer = viewerComponent.audioConsumer;
    console.log('✅ Audio consumer extracted to global scope');
    console.log('Audio consumer state:', {
      closed: window.audioConsumer.closed,
      paused: window.audioConsumer.paused,
      hasTrack: !!window.audioConsumer.track
    });
  } else {
    console.log('❌ No audio consumer found in component');
  }
  
  if (viewerComponent.consumerTransport) {
    window.consumerTransport = viewerComponent.consumerTransport;
    console.log('✅ Consumer transport extracted to global scope');
    console.log('Transport state:', {
      closed: window.consumerTransport.closed,
      connectionState: window.consumerTransport.connectionState
    });
  } else {
    console.log('❌ No consumer transport found in component');
  }
  
  // Extract device
  if (viewerComponent.device) {
    window.mediasoupDevice = viewerComponent.device;
    console.log('✅ MediaSoup device extracted to global scope');
  }
  
  // Extract tracks
  if (viewerComponent.videoTrack) {
    window.videoTrack = viewerComponent.videoTrack;
    console.log('✅ Video track extracted to global scope');
  }
  
  if (viewerComponent.audioTrack) {
    window.audioTrack = viewerComponent.audioTrack;
    console.log('✅ Audio track extracted to global scope');
  }
  
} else {
  console.log('❌ Could not find viewer component');
}

// 3. Fix video playback interruption
console.log('5. Fixing video playback interruption...');

// Stop any ongoing operations
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

// Reset video element
const videoElement = document.querySelector('video');
if (videoElement) {
  // Remove all event listeners
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
  
  // Reset video
  videoElement.pause();
  videoElement.currentTime = 0;
  videoElement.src = '';
  videoElement.srcObject = null;
  
  console.log('✅ Video element reset');
}

// 4. Set up video with MediaSoup consumers
console.log('6. Setting up video with MediaSoup consumers...');

if (window.videoConsumer && !window.videoConsumer.closed) {
  console.log('✅ Video consumer is available');
  
  // Resume if paused
  if (window.videoConsumer.paused) {
    console.log('🔄 Resuming video consumer...');
    window.videoConsumer.resume();
  }
  
  // Get video track
  const videoTrack = window.videoConsumer.track;
  if (videoTrack && videoTrack.readyState === 'live') {
    console.log('✅ Video track is live');
    
    // Create stream and attach to video
    const stream = new MediaStream([videoTrack]);
    if (videoElement) {
      videoElement.srcObject = stream;
      console.log('✅ Video stream attached to video element');
      
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
      
      // Try to play after a short delay
      setTimeout(() => {
        videoElement.play().then(() => {
          console.log('✅ Video started playing successfully');
        }).catch(error => {
          console.log('❌ Video play failed:', error.message);
        });
      }, 1000);
    }
  } else {
    console.log('❌ Video track not available or not live');
  }
} else {
  console.log('❌ Video consumer not available or closed');
}

// 5. Set up audio consumer
if (window.audioConsumer && !window.audioConsumer.closed) {
  console.log('✅ Audio consumer is available');
  
  // Resume if paused
  if (window.audioConsumer.paused) {
    console.log('🔄 Resuming audio consumer...');
    window.audioConsumer.resume();
  }
} else {
  console.log('❌ Audio consumer not available or closed');
}

// 6. Create a stable video play function
console.log('7. Creating stable video play function...');

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

// 7. Create a function to refresh MediaSoup objects from component
window.refreshMediaSoupFromComponent = function() {
  console.log('🔄 Refreshing MediaSoup objects from component...');
  
  // Try to find the component again
  let component = null;
  
  if (window.ng && window.ng.probe) {
    try {
      const element = document.querySelector('app-viewer');
      if (element) {
        const probe = window.ng.probe(element);
        if (probe && probe.componentInstance) {
          component = probe.componentInstance;
        }
      }
    } catch (error) {
      console.log('❌ Error accessing component:', error.message);
    }
  }
  
  if (component) {
    // Update global objects
    if (component.videoConsumer) window.videoConsumer = component.videoConsumer;
    if (component.audioConsumer) window.audioConsumer = component.audioConsumer;
    if (component.consumerTransport) window.consumerTransport = component.consumerTransport;
    if (component.device) window.mediasoupDevice = component.device;
    if (component.videoTrack) window.videoTrack = component.videoTrack;
    if (component.audioTrack) window.audioTrack = component.audioTrack;
    
    console.log('✅ MediaSoup objects refreshed from component');
  } else {
    console.log('❌ Could not refresh from component');
  }
};

console.log('=== FIX COMPLETE ===');
console.log('Available functions:');
console.log('- window.stableVideoPlay() - Play video safely');
console.log('- window.refreshMediaSoupFromComponent() - Refresh MediaSoup objects');
console.log('Available objects:');
console.log('- window.videoConsumer - Video consumer');
console.log('- window.audioConsumer - Audio consumer');
console.log('- window.consumerTransport - Consumer transport');
console.log('- window.mediasoupDevice - MediaSoup device'); 
// Debug script to identify video playback issues
console.log('=== COMPREHENSIVE VIDEO PLAYBACK DEBUG ===');

// 1. Check MediaSoup state
console.log('\n1. MediaSoup State:');
if (window.mediasoupClient) {
  console.log('✅ MediaSoup client available');
} else {
  console.log('❌ MediaSoup client not available');
}

// 2. Check transport state
console.log('\n2. Transport State:');
if (window.consumerTransport) {
  console.log('✅ Consumer transport exists');
  console.log('Transport state:', window.consumerTransport.connectionState);
  console.log('Transport closed:', window.consumerTransport.closed);
} else {
  console.log('❌ Consumer transport not found');
}

// 3. Check consumers
console.log('\n3. Consumer State:');
if (window.videoConsumer) {
  console.log('✅ Video consumer exists');
  console.log('Consumer state:', window.videoConsumer.paused ? 'paused' : 'active');
  console.log('Consumer closed:', window.videoConsumer.closed);
  console.log('Consumer track:', window.videoConsumer.track);
} else {
  console.log('❌ Video consumer not found');
}

if (window.audioConsumer) {
  console.log('✅ Audio consumer exists');
  console.log('Audio consumer state:', window.audioConsumer.paused ? 'paused' : 'active');
} else {
  console.log('❌ Audio consumer not found');
}

// 4. Check video element
console.log('\n4. Video Element State:');
const videoElement = document.querySelector('video');
if (videoElement) {
  console.log('✅ Video element found');
  console.log('Video src:', videoElement.src);
  console.log('Video readyState:', videoElement.readyState);
  console.log('Video networkState:', videoElement.networkState);
  console.log('Video paused:', videoElement.paused);
  console.log('Video muted:', videoElement.muted);
  console.log('Video currentTime:', videoElement.currentTime);
  console.log('Video duration:', videoElement.duration);
  console.log('Video error:', videoElement.error);
  
  // Check if video has MediaStream
  if (videoElement.srcObject) {
    console.log('✅ Video has srcObject');
    const stream = videoElement.srcObject;
    console.log('Stream tracks:', stream.getTracks().length);
    stream.getTracks().forEach((track, index) => {
      console.log(`Track ${index}:`, {
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });
  } else {
    console.log('❌ Video has no srcObject');
  }
} else {
  console.log('❌ Video element not found');
}

// 5. Check for multiple video elements
console.log('\n5. Multiple Video Elements:');
const allVideos = document.querySelectorAll('video');
console.log('Total video elements:', allVideos.length);
allVideos.forEach((video, index) => {
  console.log(`Video ${index}:`, {
    src: video.src,
    srcObject: !!video.srcObject,
    readyState: video.readyState
  });
});

// 6. Check for any MediaSoup objects in global scope
console.log('\n6. Global MediaSoup Objects:');
const mediasoupObjects = Object.keys(window).filter(key => 
  key.toLowerCase().includes('mediasoup') || 
  key.toLowerCase().includes('consumer') || 
  key.toLowerCase().includes('transport')
);
console.log('MediaSoup related objects:', mediasoupObjects);

// 7. Check for any ongoing video operations
console.log('\n7. Video Operations:');
if (window.videoPlayAttempts) {
  console.log('Video play attempts:', window.videoPlayAttempts);
}
if (window.videoSetupInProgress) {
  console.log('Video setup in progress:', window.videoSetupInProgress);
}

// 8. Check for any timers or intervals
console.log('\n8. Active Timers:');
if (window.videoPlayTimer) {
  console.log('Video play timer exists');
}
if (window.videoSetupTimer) {
  console.log('Video setup timer exists');
}

// 9. Check for any event listeners that might be interfering
console.log('\n9. Video Event Listeners:');
if (videoElement) {
  const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'pause', 'ended', 'error'];
  events.forEach(event => {
    const listeners = getEventListeners(videoElement, event);
    if (listeners && listeners.length > 0) {
      console.log(`${event} listeners:`, listeners.length);
    }
  });
}

// Helper function to get event listeners (if available)
function getEventListeners(element, event) {
  try {
    if (element._events && element._events[event]) {
      return element._events[event];
    }
    return null;
  } catch (e) {
    return null;
  }
}

console.log('\n=== DEBUG COMPLETE ==='); 
// Test the final fix
console.log('=== TESTING FINAL FIX ===');

// 1. Check if MediaSoup objects are available
console.log('1. Checking MediaSoup objects...');

if (window.videoConsumer) {
  console.log('✅ Video consumer available');
  console.log('Video consumer state:', {
    closed: window.videoConsumer.closed,
    paused: window.videoConsumer.paused,
    hasTrack: !!window.videoConsumer.track
  });
} else {
  console.log('❌ Video consumer not available');
}

if (window.audioConsumer) {
  console.log('✅ Audio consumer available');
  console.log('Audio consumer state:', {
    closed: window.audioConsumer.closed,
    paused: window.audioConsumer.paused,
    hasTrack: !!window.audioConsumer.track
  });
} else {
  console.log('❌ Audio consumer not available');
}

if (window.consumerTransport) {
  console.log('✅ Consumer transport available');
  console.log('Transport state:', {
    closed: window.consumerTransport.closed,
    connectionState: window.consumerTransport.connectionState
  });
} else {
  console.log('❌ Consumer transport not available');
}

// 2. Check video element
console.log('\n2. Checking video element...');
const videoElement = document.querySelector('video');
if (videoElement) {
  console.log('✅ Video element found');
  console.log('Video state:', {
    hasSrcObject: !!videoElement.srcObject,
    readyState: videoElement.readyState,
    paused: videoElement.paused,
    muted: videoElement.muted,
    currentTime: videoElement.currentTime
  });
  
  if (videoElement.srcObject) {
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    console.log('✅ Video has MediaStream with', tracks.length, 'tracks');
    
    tracks.forEach((track, index) => {
      console.log(`Track ${index}:`, {
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });
  }
} else {
  console.log('❌ Video element not found');
}

// 3. Test video playback
console.log('\n3. Testing video playback...');

if (window.playVideoSafely) {
  console.log('✅ playVideoSafely function available');
  console.log('🔄 Running video playback test...');
  window.playVideoSafely();
} else {
  console.log('❌ playVideoSafely function not available');
}

// 4. Check if video starts playing
setTimeout(() => {
  console.log('\n4. Checking video playback status...');
  if (videoElement) {
    console.log('Video playback status:', {
      paused: videoElement.paused,
      currentTime: videoElement.currentTime,
      readyState: videoElement.readyState,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight
    });
    
    if (!videoElement.paused && videoElement.currentTime > 0) {
      console.log('🎉 SUCCESS: Video is playing correctly!');
    } else {
      console.log('⚠️ Video may not be playing correctly');
    }
  }
}, 3000);

console.log('\n=== TEST COMPLETE ==='); 
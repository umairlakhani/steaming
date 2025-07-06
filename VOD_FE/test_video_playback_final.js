// Final test script for video playback
console.log('=== FINAL VIDEO PLAYBACK TEST ===');

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
    src: videoElement.src,
    hasSrcObject: !!videoElement.srcObject,
    readyState: videoElement.readyState,
    networkState: videoElement.networkState,
    paused: videoElement.paused,
    muted: videoElement.muted,
    currentTime: videoElement.currentTime,
    duration: videoElement.duration
  });
  
  if (videoElement.srcObject) {
    const stream = videoElement.srcObject;
    console.log('✅ Video has MediaStream');
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
    console.log('❌ Video has no MediaStream');
  }
} else {
  console.log('❌ Video element not found');
}

// 3. Test video playback
console.log('\n3. Testing video playback...');

async function testVideoPlayback() {
  if (!videoElement) {
    console.log('❌ No video element to test');
    return;
  }
  
  if (!videoElement.srcObject) {
    console.log('❌ No video stream to test');
    return;
  }
  
  try {
    console.log('🔄 Attempting to play video...');
    
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
    
    // Try to play
    await videoElement.play();
    console.log('✅ Video playback started successfully!');
    
    // Check if it's actually playing
    setTimeout(() => {
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
    }, 2000);
    
  } catch (error) {
    console.log('❌ Video playback failed:', error.message);
  }
}

// 4. Test MediaSoup consumer tracks
console.log('\n4. Testing MediaSoup consumer tracks...');

if (window.videoConsumer && window.videoConsumer.track) {
  const videoTrack = window.videoConsumer.track;
  console.log('✅ Video consumer track found');
  console.log('Video track details:', {
    id: videoTrack.id,
    kind: videoTrack.kind,
    enabled: videoTrack.enabled,
    muted: videoTrack.muted,
    readyState: videoTrack.readyState
  });
  
  // Test creating a new stream from the track
  const testStream = new MediaStream([videoTrack]);
  console.log('✅ Test stream created from video track');
  
  // Create a test video element
  const testVideo = document.createElement('video');
  testVideo.style.position = 'fixed';
  testVideo.style.top = '10px';
  testVideo.style.right = '10px';
  testVideo.style.width = '200px';
  testVideo.style.height = '150px';
  testVideo.style.zIndex = '9999';
  testVideo.style.border = '2px solid green';
  testVideo.autoplay = true;
  testVideo.muted = true;
  testVideo.controls = true;
  testVideo.srcObject = testStream;
  document.body.appendChild(testVideo);
  
  console.log('🧪 Test video element created');
  
  // Monitor the test video
  const checkTestVideo = () => {
    if (testVideo.readyState >= 1) {
      console.log('✅ Test video is ready!');
      console.log('Test video dimensions:', {
        videoWidth: testVideo.videoWidth,
        videoHeight: testVideo.videoHeight
      });
      
      // Remove test video after 5 seconds
      setTimeout(() => {
        if (document.body.contains(testVideo)) {
          document.body.removeChild(testVideo);
          console.log('🧪 Test video removed');
        }
      }, 5000);
    } else {
      setTimeout(checkTestVideo, 500);
    }
  };
  
  checkTestVideo();
  
} else {
  console.log('❌ No video consumer track available');
}

// 5. Run the video playback test
console.log('\n5. Running video playback test...');
testVideoPlayback();

console.log('\n=== TEST COMPLETE ===');
console.log('Check the console for results and any test video elements'); 
// === COMPREHENSIVE MEDIASOUP DEBUGGING SCRIPT ===
// Run this in the browser console to debug the video playback issue

console.log('🔍 === STARTING COMPREHENSIVE DEBUG ===');

// Get the viewer component
const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ Viewer component not found on window object');
  console.log('Available window properties:', Object.keys(window).filter(k => k.includes('viewer')));
  return;
}

console.log('✅ Viewer component found');

// 1. Debug MediaSoup State
console.log('\n📊 === 1. MEDIASOUP STATE DEBUG ===');
viewer.debugMediaSoupState();

// 2. Test MediaSoup Tracks
console.log('\n🎬 === 2. MEDIASOUP TRACKS TEST ===');
viewer.testMediaSoupTracks();

// 3. Test MediaStream
console.log('\n🎥 === 3. MEDIASTREAM TEST ===');
viewer.testMediaStream();

// 4. Check video element state
console.log('\n📺 === 4. VIDEO ELEMENT STATE ===');
const videoElement = document.querySelector('video');
if (videoElement) {
  console.log('Video element found:', {
    readyState: videoElement.readyState,
    networkState: videoElement.networkState,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    srcObject: !!videoElement.srcObject,
    src: videoElement.src,
    paused: videoElement.paused,
    muted: videoElement.muted,
    autoplay: videoElement.autoplay,
    playsInline: videoElement.playsInline,
    controls: videoElement.controls,
    duration: videoElement.duration,
    error: videoElement.error
  });
  
  // Check if srcObject is a MediaStream
  if (videoElement.srcObject) {
    const stream = videoElement.srcObject;
    console.log('MediaStream details:', {
      id: stream.id,
      active: stream.active,
      tracks: stream.getTracks().map(track => ({
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      }))
    });
  }
} else {
  console.error('❌ No video element found');
}

// 5. Check WebRTC status
console.log('\n🌐 === 5. WEBRTC STATUS ===');
const webrtcStatus = viewer.getWebRTCStatus();
console.log('WebRTC Status:', webrtcStatus);

// 6. Check video sources
console.log('\n🎯 === 6. VIDEO SOURCES ===');
const hasSources = viewer.hasVideoSources();
console.log('Has video sources:', hasSources);

// 7. Get video state
console.log('\n📊 === 7. VIDEO STATE ===');
const videoState = viewer.getVideoState();
console.log('Video state:', videoState);

console.log('\n✅ === DEBUG COMPLETE ===');
console.log('Check the logs above to identify the issue.'); 
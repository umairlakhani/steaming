// === CHECK SUBSCRIPTION STATUS ===
// Run this to see if the subscription completed successfully

console.log('🔍 === CHECKING SUBSCRIPTION STATUS ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Check WebRTC status
console.log('\n🌐 === WEBRTC STATUS ===');
const webrtcStatus = viewer.getWebRTCStatus();
console.log('WebRTC Status:', webrtcStatus);

// Check if tracks exist
console.log('\n📹 === TRACK STATUS ===');
if (viewer.videoTrack) {
  console.log('✅ Video track exists:', {
    id: viewer.videoTrack.id,
    kind: viewer.videoTrack.kind,
    enabled: viewer.videoTrack.enabled,
    readyState: viewer.videoTrack.readyState,
    muted: viewer.videoTrack.muted
  });
} else {
  console.log('❌ No video track found');
}

if (viewer.audioTrack) {
  console.log('✅ Audio track exists:', {
    id: viewer.audioTrack.id,
    kind: viewer.audioTrack.kind,
    enabled: viewer.audioTrack.enabled,
    readyState: viewer.audioTrack.readyState,
    muted: viewer.audioTrack.muted
  });
} else {
  console.log('❌ No audio track found');
}

// Check video element state
console.log('\n📺 === VIDEO ELEMENT STATUS ===');
const videoElement = document.querySelector('video');
if (videoElement) {
  console.log('Video element state:', {
    readyState: videoElement.readyState,
    networkState: videoElement.networkState,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    srcObject: !!videoElement.srcObject,
    src: videoElement.src,
    paused: videoElement.paused,
    muted: videoElement.muted,
    currentTime: videoElement.currentTime,
    duration: videoElement.duration
  });
  
  if (videoElement.srcObject) {
    const stream = videoElement.srcObject;
    console.log('MediaStream details:', {
      id: stream.id,
      active: stream.active,
      tracks: stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      }))
    });
  }
} else {
  console.log('❌ No video element found');
}

// Check if video is playing
console.log('\n▶️ === PLAYBACK STATUS ===');
const videoState = viewer.getVideoState();
console.log('Video state:', videoState);

console.log('\n✅ Status check complete!'); 
// === TEST COMPREHENSIVE VIDEO FIX ===
// Run this to test the comprehensive video element replacement with proper cleanup

console.log('🔧 === TESTING COMPREHENSIVE VIDEO FIX ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Check current status
console.log('\n📊 === CURRENT STATUS ===');
const webrtcStatus = viewer.getWebRTCStatus();
console.log('WebRTC Status:', webrtcStatus);

if (webrtcStatus.connected && webrtcStatus.hasVideo) {
  console.log('✅ Already connected with video, testing comprehensive fix...');
  
  // Test the comprehensive fix
  await viewer.forceVideoElementLoad();
  
  // Wait a moment and check the result
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if the new video element is working
  const newVideo = document.querySelector('#video-player-fixed');
  if (newVideo) {
    console.log('✅ New video element found:', {
      readyState: newVideo.readyState,
      videoWidth: newVideo.videoWidth,
      videoHeight: newVideo.videoHeight,
      paused: newVideo.paused,
      srcObject: !!newVideo.srcObject
    });
  } else {
    console.log('❌ New video element not found');
  }
} else {
  console.log('🔄 Not connected, creating test producer first...');
  
  // Create a test producer
  console.log('\n🎬 Step 1: Creating test producer...');
  await viewer.createTestProducer();
  
  // Wait for producers to be created
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Subscribe to get the stream
  console.log('\n📺 Step 2: Subscribing to get stream...');
  await viewer.subscribe();
  
  // Wait for subscription to complete
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Now test the comprehensive fix
  console.log('\n🔧 Step 3: Testing comprehensive video fix...');
  await viewer.forceVideoElementLoad();
}

console.log('✅ Comprehensive fix test complete!'); 
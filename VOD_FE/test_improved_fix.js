// === TEST IMPROVED AGGRESSIVE VIDEO FIX ===
// Run this to test the improved video element replacement with better timing

console.log('🔧 === TESTING IMPROVED AGGRESSIVE VIDEO FIX ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Check current status first
console.log('\n📊 === CURRENT STATUS ===');
const webrtcStatus = viewer.getWebRTCStatus();
console.log('WebRTC Status:', webrtcStatus);

if (webrtcStatus.connected && webrtcStatus.hasVideo) {
  console.log('✅ Already connected with video, testing fix directly...');
  await viewer.forceVideoElementLoad();
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
  
  // Now test the improved fix
  console.log('\n🔧 Step 3: Testing improved aggressive video fix...');
  await viewer.forceVideoElementLoad();
}

console.log('✅ Improved fix test complete!'); 
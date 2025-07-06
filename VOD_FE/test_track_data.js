// === TEST MEDIASOUP TRACK DATA ===
// Run this to test if MediaSoup tracks are actually producing video data

console.log('🧪 === TESTING MEDIASOUP TRACK DATA ===');

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
  console.log('✅ Already connected with video, testing track data...');
  
  // Test if the MediaSoup tracks are producing data
  await viewer.testMediaSoupTrackData();
  
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
  
  // Now test the track data
  console.log('\n🧪 Step 3: Testing MediaSoup track data...');
  await viewer.testMediaSoupTrackData();
}

console.log('✅ Track data test complete!'); 
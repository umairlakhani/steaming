// === TEST TRANSPORT CONNECTION FIX ===
// Run this to test if the consumer transport connection can be fixed

console.log('🔗 === TESTING TRANSPORT CONNECTION FIX ===');

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
  console.log('✅ Already connected with video, testing transport connection fix...');
  
  // Test the consumer transport connection
  await viewer.testConsumerTransportConnection();
  
  // Wait a moment and test the track data again
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n🧪 Testing MediaSoup track data after transport fix...');
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
  
  // Now test the transport connection fix
  console.log('\n🔗 Step 3: Testing transport connection fix...');
  await viewer.testConsumerTransportConnection();
  
  // Wait and test the track data
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n🧪 Step 4: Testing MediaSoup track data after transport fix...');
  await viewer.testMediaSoupTrackData();
}

console.log('✅ Transport connection fix test complete!'); 
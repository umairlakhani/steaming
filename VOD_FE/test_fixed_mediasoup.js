// === TEST FIXED MEDIASOUP CONNECTION ===
// Test the fixed backend MediaSoup connection

console.log('🔧 === TESTING FIXED MEDIASOUP CONNECTION ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// First, create a test producer
console.log('\n🎬 Step 1: Creating test producer...');
await viewer.createTestProducer();

// Wait for producers to be created
await new Promise(resolve => setTimeout(resolve, 2000));

// Subscribe to get the stream
console.log('\n📺 Step 2: Subscribing to get stream...');
await viewer.subscribe();

// Wait for subscription to complete
await new Promise(resolve => setTimeout(resolve, 3000));

// Test the transport connection
console.log('\n🔗 Step 3: Testing transport connection...');
await viewer.testConsumerTransportConnection();

// Wait and test the track data
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('\n🧪 Step 4: Testing MediaSoup track data...');
await viewer.testMediaSoupTrackData();

console.log('✅ Fixed MediaSoup connection test complete!'); 
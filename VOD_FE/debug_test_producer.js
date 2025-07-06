// === TEST PRODUCER AND SUBSCRIBE ===
// Run this in browser console to create a test producer and then subscribe

console.log('🧪 === TEST PRODUCER AND SUBSCRIBE ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Step 1: Create a test producer
console.log('\n🎬 Step 1: Creating test producer...');
await viewer.createTestProducer();

// Wait a moment for producers to be created
await new Promise(resolve => setTimeout(resolve, 2000));

// Step 2: Subscribe to see the video
console.log('\n📺 Step 2: Subscribing to see the video...');
await viewer.subscribe();

console.log('✅ Test complete! You should now see video playing.'); 
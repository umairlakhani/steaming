// === TEST AGGRESSIVE VIDEO FIX ===
// Run this to test the new aggressive video element replacement

console.log('🔧 === TESTING AGGRESSIVE VIDEO FIX ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// First, create a test producer if none exists
console.log('\n🎬 Step 1: Creating test producer...');
await viewer.createTestProducer();

// Wait for producers to be created
await new Promise(resolve => setTimeout(resolve, 2000));

// Subscribe to get the stream
console.log('\n📺 Step 2: Subscribing to get stream...');
await viewer.subscribe();

// Wait for subscription to complete
await new Promise(resolve => setTimeout(resolve, 3000));

// Now test the aggressive fix
console.log('\n🔧 Step 3: Testing aggressive video fix...');
await viewer.forceVideoElementLoad();

console.log('✅ Aggressive fix test complete!'); 
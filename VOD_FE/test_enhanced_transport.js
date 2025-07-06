// === TEST ENHANCED TRANSPORT CONNECTION ===
// Run this to test the enhanced transport connection debugging

console.log('🔗 === TESTING ENHANCED TRANSPORT CONNECTION ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Test the enhanced consumer transport connection
console.log('\n🔗 Testing enhanced consumer transport connection...');
await viewer.testConsumerTransportConnection();

// Wait a moment and test the track data
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('\n🧪 Testing MediaSoup track data after enhanced transport fix...');
await viewer.testMediaSoupTrackData();

console.log('✅ Enhanced transport connection test complete!'); 
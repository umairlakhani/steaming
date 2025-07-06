// Test script to fix consumer transport with DTLS parameters
console.log("🔧 === TESTING CONSUMER TRANSPORT FIX V2 ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing transport fix...");
  
  // Test the new fix method
  component.fixConsumerTransport().then(() => {
    console.log("✅ Transport fix completed");
    
    // Now test the connection
    return component.testConsumerTransportConnection();
  }).then(() => {
    console.log("✅ Connection test completed");
    
    // Test video playback
    return component.testVideoPlayback();
  }).then(() => {
    console.log("✅ Video playback test completed");
  }).catch((error) => {
    console.error("❌ Test failed:", error);
  });
} 
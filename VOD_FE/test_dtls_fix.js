// Test DTLS parameters fix
console.log("🔐 === TESTING DTLS PARAMETERS FIX ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing DTLS fix...");
  
  // Test the fix method
  component.fixConsumerTransport().then(() => {
    console.log("✅ Transport fix completed");
    
    // Check if DTLS parameters are now available
    if (component.consumerTransport) {
      console.log("📡 Consumer Transport After Fix:");
      console.log("- Connection State:", component.consumerTransport.connectionState);
      console.log("- Has DTLS Parameters:", !!component.consumerTransport.dtlsParameters);
      
      if (component.consumerTransport.dtlsParameters) {
        console.log("🔐 DTLS Parameters found:", {
          role: component.consumerTransport.dtlsParameters.role,
          fingerprints: component.consumerTransport.dtlsParameters.fingerprints?.length || 0
        });
        
        // Test connection
        console.log("🔄 Testing transport connection...");
        return component.testConsumerTransportConnection();
      } else {
        console.error("❌ DTLS parameters still missing after fix");
      }
    }
  }).then(() => {
    console.log("✅ Connection test completed");
    
    // Test video playback
    console.log("🎥 Testing video playback...");
    return component.testVideoPlayback();
  }).then(() => {
    console.log("✅ Video playback test completed");
  }).catch(error => {
    console.error("❌ Test failed:", error);
  });
} 
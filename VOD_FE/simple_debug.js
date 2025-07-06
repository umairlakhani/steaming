// Simple inline debug script - copy and paste this directly into browser console
console.log("🔍 === SIMPLE MEDIASOUP DEBUG ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found. Make sure you're on the viewer page.");
} else {
  console.log("✅ Component found");
  
  // Check basic state
  console.log("📊 Current State:");
  console.log("- Device:", component.device ? "✅ Available" : "❌ Not available");
  console.log("- Consumer Transport:", component.consumerTransport ? "✅ Available" : "❌ Not available");
  console.log("- Video Element:", component.videoElement ? "✅ Available" : "❌ Not available");
  
  if (component.consumerTransport) {
    console.log("📡 Consumer Transport Details:");
    console.log("- ID:", component.consumerTransport.id);
    console.log("- Connection State:", component.consumerTransport.connectionState);
    console.log("- Closed:", component.consumerTransport.closed);
    console.log("- Has DTLS Parameters:", !!component.consumerTransport.dtlsParameters);
    
    if (component.consumerTransport.dtlsParameters) {
      console.log("- DTLS Parameters Keys:", Object.keys(component.consumerTransport.dtlsParameters));
    }
  }
  
  if (component.videoElement) {
    console.log("🎥 Video Element Details:");
    console.log("- Ready State:", component.videoElement.readyState);
    console.log("- Network State:", component.videoElement.networkState);
    console.log("- Video Width:", component.videoElement.videoWidth);
    console.log("- Video Height:", component.videoElement.videoHeight);
    console.log("- Has srcObject:", !!component.videoElement.srcObject);
    console.log("- Paused:", component.videoElement.paused);
  }
  
  // Test the fix method if available
  if (typeof component.fixConsumerTransport === 'function') {
    console.log("🔧 Testing transport fix...");
    component.fixConsumerTransport().then(() => {
      console.log("✅ Transport fix completed");
      
      // Check state after fix
      if (component.consumerTransport) {
        console.log("📡 Consumer Transport After Fix:");
        console.log("- Connection State:", component.consumerTransport.connectionState);
        console.log("- Has DTLS Parameters:", !!component.consumerTransport.dtlsParameters);
      }
    }).catch(error => {
      console.error("❌ Transport fix failed:", error);
    });
  } else {
    console.log("❌ fixConsumerTransport method not available");
  }
} 
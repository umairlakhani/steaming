// Comprehensive debug script for MediaSoup transport fix
console.log("🔍 === COMPREHENSIVE MEDIASOUP DEBUG ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, starting comprehensive debug...");
  
  // Step 1: Check current state
  console.log("📊 === STEP 1: CURRENT STATE ===");
  console.log("Device:", component.device ? "✅ Available" : "❌ Not available");
  console.log("Consumer Transport:", component.consumerTransport ? "✅ Available" : "❌ Not available");
  console.log("Producer Transport:", component.producerTransport ? "✅ Available" : "❌ Not available");
  console.log("Video Element:", component.videoElement ? "✅ Available" : "❌ Not available");
  
  if (component.consumerTransport) {
    console.log("Consumer Transport Details:", {
      id: component.consumerTransport.id,
      connectionState: component.consumerTransport.connectionState,
      closed: component.consumerTransport.closed,
      hasDtlsParameters: !!component.consumerTransport.dtlsParameters
    });
  }
  
  // Step 2: Test transport fix
  console.log("🔧 === STEP 2: TRANSPORT FIX ===");
  component.fixConsumerTransport().then(() => {
    console.log("✅ Transport fix completed");
    
    // Step 3: Test connection
    console.log("🔗 === STEP 3: CONNECTION TEST ===");
    return component.testConsumerTransportConnection();
  }).then(() => {
    console.log("✅ Connection test completed");
    
    // Step 4: Check MediaSoup tracks
    console.log("📺 === STEP 4: MEDIASOUP TRACKS ===");
    return component.testMediaSoupTracks();
  }).then(() => {
    console.log("✅ Track test completed");
    
    // Step 5: Test video element
    console.log("🎥 === STEP 5: VIDEO ELEMENT TEST ===");
    return component.testVideoElement();
  }).then(() => {
    console.log("✅ Video element test completed");
    
    // Step 6: Test video playback
    console.log("▶️ === STEP 6: VIDEO PLAYBACK TEST ===");
    return component.testVideoPlayback();
  }).then(() => {
    console.log("✅ Video playback test completed");
    
    // Step 7: Final status check
    console.log("📊 === STEP 7: FINAL STATUS ===");
    if (component.videoElement) {
      console.log("Video Element Final State:", {
        readyState: component.videoElement.readyState,
        networkState: component.videoElement.networkState,
        videoWidth: component.videoElement.videoWidth,
        videoHeight: component.videoElement.videoHeight,
        paused: component.videoElement.paused,
        ended: component.videoElement.ended,
        srcObject: !!component.videoElement.srcObject
      });
    }
    
    if (component.consumerTransport) {
      console.log("Consumer Transport Final State:", {
        id: component.consumerTransport.id,
        connectionState: component.consumerTransport.connectionState,
        closed: component.consumerTransport.closed
      });
    }
    
    console.log("🎉 === DEBUG COMPLETED ===");
  }).catch((error) => {
    console.error("❌ Debug failed at step:", error);
    console.error("Error details:", error);
  });
} 
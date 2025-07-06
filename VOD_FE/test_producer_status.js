// Test producer status and transport connection
console.log("🎬 === TESTING PRODUCER STATUS ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing producer status...");
  
  // Check if we have a connected transport
  if (component.consumerTransport) {
    console.log("📡 Consumer Transport Status:");
    console.log("- ID:", component.consumerTransport.id);
    console.log("- Connection State:", component.consumerTransport.connectionState);
    console.log("- Has DTLS Parameters:", !!component.consumerTransport.dtlsParameters);
    
    // Try to consume video
    console.log("🎥 Attempting to consume video...");
    component.sendRequest(`consume${component.liveStreamId}`, {
      kind: 'video',
      rtpCapabilities: component.device.rtpCapabilities
    }).then(response => {
      console.log("📺 Video consume response:", response);
      
      if (response && response.id) {
        console.log("✅ Video consumer created successfully");
        console.log("- Consumer ID:", response.id);
        console.log("- Kind:", response.kind);
        console.log("- Producer ID:", response.producerId);
        
        // Create the consumer
        const consumer = component.consumerTransport.consume(response);
        
        console.log("📡 Consumer created:", {
          id: consumer.id,
          kind: consumer.kind,
          paused: consumer.paused,
          closed: consumer.closed
        });
        
        // Resume the consumer
        consumer.resume();
        console.log("▶️ Consumer resumed");
        
        // Check if we have tracks
        if (consumer.track) {
          console.log("🎯 Consumer track found:", {
            id: consumer.track.id,
            kind: consumer.track.kind,
            enabled: consumer.track.enabled,
            muted: consumer.track.muted
          });
        }
        
        // Check video element
        if (component.videoElement) {
          console.log("🎥 Video element status:", {
            readyState: component.videoElement.readyState,
            networkState: component.videoElement.networkState,
            videoWidth: component.videoElement.videoWidth,
            videoHeight: component.videoElement.videoHeight,
            hasSrcObject: !!component.videoElement.srcObject
          });
        }
        
      } else {
        console.error("❌ No video producer available");
        console.log("Response details:", response);
      }
    }).catch(error => {
      console.error("❌ Video consume failed:", error);
    });
    
    // Try to consume audio
    console.log("🔊 Attempting to consume audio...");
    component.sendRequest(`consume${component.liveStreamId}`, {
      kind: 'audio',
      rtpCapabilities: component.device.rtpCapabilities
    }).then(response => {
      console.log("🔊 Audio consume response:", response);
      
      if (response && response.id) {
        console.log("✅ Audio consumer created successfully");
        console.log("- Consumer ID:", response.id);
        console.log("- Kind:", response.kind);
        console.log("- Producer ID:", response.producerId);
      } else {
        console.error("❌ No audio producer available");
      }
    }).catch(error => {
      console.error("❌ Audio consume failed:", error);
    });
    
  } else {
    console.error("❌ No consumer transport available");
  }
} 
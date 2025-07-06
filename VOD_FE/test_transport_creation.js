// Test transport creation process
console.log("🔧 === TESTING TRANSPORT CREATION ===");

// Get the component instance
const component = window.viewerComponent;

if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing transport creation...");
  
  // Test creating a new consumer transport
  component.sendRequest(`createConsumerTransport${component.liveStreamId}`, {
    userId: component.userId,
    latitude: component.latitude,
    longitude: component.longitude,
    platform: component.platform
  }).then(params => {
    console.log("📥 Transport creation response:", params);
    console.log("📊 Response details:", {
      hasId: !!params.id,
      hasIceParameters: !!params.iceParameters,
      hasIceCandidates: !!params.iceCandidates,
      hasDtlsParameters: !!params.dtlsParameters,
      iceCandidatesCount: params.iceCandidates?.length || 0
    });
    
    if (params.dtlsParameters) {
      console.log("🔐 DTLS Parameters:", {
        role: params.dtlsParameters.role,
        fingerprints: params.dtlsParameters.fingerprints?.length || 0
      });
    }
    
    // Try to create the transport
    if (params.id && params.iceParameters && params.iceCandidates && params.dtlsParameters) {
      console.log("✅ All required parameters present, creating transport...");
      const transport = component.device.createRecvTransport(params);
      
      console.log("📡 Transport created:", {
        id: transport.id,
        connectionState: transport.connectionState,
        closed: transport.closed,
        hasDtlsParameters: !!transport.dtlsParameters
      });
      
      // Test the connect event
      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        console.log("🔗 Connect event triggered with DTLS parameters:", !!dtlsParameters);
        callback();
      });
      
      // Test the consume event
      transport.on("consume", ({ rtpCapabilities }, callback, errback) => {
        console.log("📺 Consume event triggered");
        callback({});
      });
      
      console.log("✅ Transport setup completed successfully");
    } else {
      console.error("❌ Missing required parameters for transport creation");
    }
  }).catch(error => {
    console.error("❌ Transport creation failed:", error);
  });
} 
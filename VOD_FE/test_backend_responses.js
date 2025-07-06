// Copy and paste this entire script into your browser console
// Test backend responses
console.log("🔍 === TESTING BACKEND RESPONSES ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing backend responses...");
  
  // Test simple backend communication
  const testBackendResponses = async () => {
    try {
      console.log("🔄 Testing basic socket communication...");
      
      // Test 1: Simple ping
      console.log("📤 Sending ping...");
      component.socket.emit('ping');
      
      // Test 2: Get router RTP capabilities
      console.log("📤 Requesting router RTP capabilities...");
      const rtpResponse = await component.sendRequest('getRouterRtpCapabilities');
      console.log("📥 Router RTP Response:", rtpResponse);
      
      // Test 3: Check if we have a device
      if (component.device) {
        console.log("✅ Device exists, RTP Capabilities:", component.device.rtpCapabilities);
      } else {
        console.log("❌ No device found");
      }
      
      // Test 4: Check transport
      if (component.consumerTransport) {
        console.log("✅ Transport exists, ID:", component.consumerTransport.id);
        console.log("Transport state:", component.consumerTransport.connectionState);
        
        // Test 5: Try to get DTLS parameters
        console.log("📤 Requesting DTLS parameters for transport...");
        const dtlsResponse = await component.sendRequest('connectConsumerTransport', {
          transportId: component.consumerTransport.id
        });
        console.log("📥 DTLS Response:", dtlsResponse);
        
        if (dtlsResponse && dtlsResponse.dtlsParameters) {
          console.log("✅ Got DTLS parameters, attempting connection...");
          try {
            await component.consumerTransport.connect({ dtlsParameters: dtlsResponse.dtlsParameters });
            console.log("✅ Transport connected successfully!");
          } catch (error) {
            console.error("❌ Transport connection failed:", error);
          }
        } else {
          console.log("❌ No DTLS parameters received");
        }
      } else {
        console.log("❌ No transport found");
      }
      
      // Test 6: Check for producers
      console.log("📤 Requesting producers...");
      const producersResponse = await component.sendRequest('getProducers');
      console.log("📥 Producers Response:", producersResponse);
      
      if (producersResponse && producersResponse.length > 0) {
        console.log("✅ Found", producersResponse.length, "producers");
        
        // Test 7: Try to consume video
        const videoProducer = producersResponse.find(p => p.kind === 'video');
        if (videoProducer) {
          console.log("📤 Requesting video consumer parameters...");
          const videoResponse = await component.sendRequest('consume', {
            transportId: component.consumerTransport.id,
            kind: 'video',
            rtpCapabilities: component.device.rtpCapabilities
          });
          console.log("📥 Video Consumer Response:", videoResponse);
        }
        
        // Test 8: Try to consume audio
        const audioProducer = producersResponse.find(p => p.kind === 'audio');
        if (audioProducer) {
          console.log("📤 Requesting audio consumer parameters...");
          const audioResponse = await component.sendRequest('consume', {
            transportId: component.consumerTransport.id,
            kind: 'audio',
            rtpCapabilities: component.device.rtpCapabilities
          });
          console.log("📥 Audio Consumer Response:", audioResponse);
        }
      } else {
        console.log("❌ No producers found");
      }
      
    } catch (error) {
      console.error("❌ Error testing backend responses:", error);
    }
  };
  
  // Execute the test
  testBackendResponses();
} 
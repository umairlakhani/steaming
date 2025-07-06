// Copy and paste this entire script into your browser console
// Test backend producers availability
console.log("🔍 === TESTING BACKEND PRODUCERS ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, checking backend producers...");
  
  // Test backend connection
  const testBackendProducers = async () => {
    try {
      console.log("🔄 Step 1: Testing backend connection...");
      
      // Check if socket is connected
      if (!component.socket || !component.socket.connected) {
        console.log("❌ Socket not connected, attempting to connect...");
        component.connectSocket();
        
        // Wait for connection
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (component.socket && component.socket.connected) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }
      
      console.log("✅ Socket connected");
      
      // Step 2: Get router RTP capabilities
      console.log("🔄 Step 2: Getting router RTP capabilities...");
      const rtpCapabilitiesResponse = await component.sendRequest('getRouterRtpCapabilities');
      console.log("Router RTP Capabilities:", rtpCapabilitiesResponse);
      
      // Step 3: Load device
      console.log("🔄 Step 3: Loading device...");
      if (!component.device) {
        await component.loadDevice(rtpCapabilitiesResponse);
        console.log("✅ Device loaded");
      } else {
        console.log("✅ Device already loaded");
      }
      
      // Step 4: Create consumer transport
      console.log("🔄 Step 4: Creating consumer transport...");
      if (!component.consumerTransport) {
        const transportResponse = await component.sendRequest('createConsumerTransport');
        console.log("Transport Response:", transportResponse);
        
        if (transportResponse && transportResponse.id) {
          component.consumerTransport = component.device.createRecvTransport(transportResponse);
          console.log("✅ Consumer transport created");
          
          // Set up transport event handlers
          component.consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            console.log("🔄 Transport connect event triggered");
            try {
              const response = await component.sendRequest('connectConsumerTransport', {
                transportId: component.consumerTransport.id,
                dtlsParameters
              });
              callback();
            } catch (error) {
              errback(error);
            }
          });
          
          component.consumerTransport.on('consume', async ({ rtpCapabilities }, callback, errback) => {
            console.log("🔄 Transport consume event triggered");
            try {
              const response = await component.sendRequest('consume', {
                transportId: component.consumerTransport.id,
                rtpCapabilities
              });
              callback(response);
            } catch (error) {
              errback(error);
            }
          });
          
          console.log("✅ Transport event handlers set up");
        }
      } else {
        console.log("✅ Consumer transport already exists");
      }
      
      // Step 5: Check for available producers
      console.log("🔄 Step 5: Checking for available producers...");
      const producersResponse = await component.sendRequest('getProducers');
      console.log("Available Producers:", producersResponse);
      
      if (producersResponse && producersResponse.length > 0) {
        console.log("✅ Found", producersResponse.length, "active producers");
        
        // Step 6: Try to consume video
        const videoProducer = producersResponse.find(p => p.kind === 'video');
        if (videoProducer) {
          console.log("🔄 Step 6: Consuming video producer...");
          const videoResponse = await component.sendRequest('consume', {
            transportId: component.consumerTransport.id,
            kind: 'video',
            rtpCapabilities: component.device.rtpCapabilities
          });
          
          console.log("Video Consumer Response:", videoResponse);
          
          if (videoResponse && videoResponse.id) {
            console.log("✅ Video consumer parameters received");
          } else {
            console.log("❌ No video consumer parameters received");
          }
        } else {
          console.log("❌ No video producer found");
        }
        
        // Step 7: Try to consume audio
        const audioProducer = producersResponse.find(p => p.kind === 'audio');
        if (audioProducer) {
          console.log("🔄 Step 7: Consuming audio producer...");
          const audioResponse = await component.sendRequest('consume', {
            transportId: component.consumerTransport.id,
            kind: 'audio',
            rtpCapabilities: component.device.rtpCapabilities
          });
          
          console.log("Audio Consumer Response:", audioResponse);
          
          if (audioResponse && audioResponse.id) {
            console.log("✅ Audio consumer parameters received");
          } else {
            console.log("❌ No audio consumer parameters received");
          }
        } else {
          console.log("❌ No audio producer found");
        }
        
      } else {
        console.log("❌ No active producers found");
      }
      
    } catch (error) {
      console.error("❌ Error testing backend producers:", error);
    }
  };
  
  // Execute the test
  testBackendProducers();
} 
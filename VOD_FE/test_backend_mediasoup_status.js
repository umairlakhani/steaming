// Copy and paste this entire script into your browser console
// Test backend MediaSoup status
console.log("🔍 === TESTING BACKEND MEDIASOUP STATUS ===");

// Test 1: Check backend MediaSoup status endpoint
const testBackendMediaSoupStatus = async () => {
  try {
    console.log("🔄 Testing backend MediaSoup status...");
    
    // Try to fetch MediaSoup status from backend
    const response = await fetch('/api/mediasoup-status');
    if (response.ok) {
      const status = await response.json();
      console.log("📥 Backend MediaSoup Status:", status);
      
      if (status.workerReady && status.hasWorker && status.hasRouter) {
        console.log("✅ Backend MediaSoup is ready!");
        return true;
      } else {
        console.log("❌ Backend MediaSoup is not ready:", {
          workerReady: status.workerReady,
          hasWorker: status.hasWorker,
          hasRouter: status.hasRouter
        });
        return false;
      }
    } else {
      console.log("❌ Could not fetch MediaSoup status, response:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing backend MediaSoup status:", error);
    return false;
  }
};

// Test 2: Check if socket is connected and working
const testSocketConnection = () => {
  const component = window.viewerComponent;
  if (!component) {
    console.error("❌ Component not found");
    return false;
  }
  
  console.log("🔌 Socket Connection Status:", {
    hasSocket: !!component.socket,
    connected: component.socket?.connected,
    id: component.socket?.id
  });
  
  return component.socket && component.socket.connected;
};

// Test 3: Try to manually initialize MediaSoup on backend
const testManualMediaSoupInit = async () => {
  const component = window.viewerComponent;
  if (!component) {
    console.error("❌ Component not found");
    return false;
  }
  
  try {
    console.log("🔄 Attempting to trigger MediaSoup initialization...");
    
    // Try to send a request that should trigger MediaSoup initialization
    const response = await component.sendRequest('getRouterRtpCapabilities');
    console.log("📥 Router RTP Capabilities Response:", response);
    
    if (response && response.codecs) {
      console.log("✅ MediaSoup initialized successfully!");
      return true;
    } else {
      console.log("❌ MediaSoup initialization failed or no response");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during MediaSoup initialization:", error);
    return false;
  }
};

// Test 4: Check if there are any active producers
const testActiveProducers = async () => {
  const component = window.viewerComponent;
  if (!component) {
    console.error("❌ Component not found");
    return false;
  }
  
  try {
    console.log("🔄 Checking for active producers...");
    
    const response = await component.sendRequest('getProducers');
    console.log("📥 Producers Response:", response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      console.log("✅ Found", response.length, "active producers");
      response.forEach((producer, index) => {
        console.log(`Producer ${index + 1}:`, {
          id: producer.id,
          kind: producer.kind,
          type: producer.type
        });
      });
      return true;
    } else {
      console.log("❌ No active producers found");
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking producers:", error);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log("🚀 Running all MediaSoup tests...");
  
  // Test 1: Backend status
  const backendReady = await testBackendMediaSoupStatus();
  
  // Test 2: Socket connection
  const socketConnected = testSocketConnection();
  
  // Test 3: Manual initialization
  const mediaSoupInitialized = await testManualMediaSoupInit();
  
  // Test 4: Active producers
  const hasProducers = await testActiveProducers();
  
  // Summary
  console.log("\n📊 === TEST SUMMARY ===");
  console.log("Backend MediaSoup Ready:", backendReady);
  console.log("Socket Connected:", socketConnected);
  console.log("MediaSoup Initialized:", mediaSoupInitialized);
  console.log("Has Active Producers:", hasProducers);
  
  if (backendReady && socketConnected && mediaSoupInitialized && hasProducers) {
    console.log("✅ All tests passed! MediaSoup should be working.");
  } else {
    console.log("❌ Some tests failed. MediaSoup needs attention.");
    
    if (!backendReady) {
      console.log("💡 Backend MediaSoup is not initialized. Check backend logs.");
    }
    if (!socketConnected) {
      console.log("💡 Socket is not connected. Check network connection.");
    }
    if (!mediaSoupInitialized) {
      console.log("💡 MediaSoup initialization failed. Check backend MediaSoup setup.");
    }
    if (!hasProducers) {
      console.log("💡 No active producers. Need to start a stream first.");
    }
  }
};

// Execute tests
runAllTests(); 
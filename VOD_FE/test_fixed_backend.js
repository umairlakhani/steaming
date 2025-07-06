// Copy and paste this entire script into your browser console
// Test fixed backend connectivity
console.log("🔧 === TESTING FIXED BACKEND ===");

// Test 1: Basic connectivity
const testBasicConnectivity = async () => {
  try {
    console.log("🔄 Testing basic connectivity...");
    
    const response = await fetch('/api/health');
    console.log("📥 Health Response Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Health endpoint working:", data);
      return true;
    } else {
      console.log("❌ Health endpoint failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Health endpoint error:", error);
    return false;
  }
};

// Test 2: MediaSoup status
const testMediaSoupStatus = async () => {
  try {
    console.log("🔄 Testing MediaSoup status...");
    
    const response = await fetch('/api/mediasoup-status');
    console.log("📥 MediaSoup Status Response:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ MediaSoup status endpoint working:", data);
      return data;
    } else {
      console.log("❌ MediaSoup status endpoint failed:", response.status);
      return null;
    }
  } catch (error) {
    console.error("❌ MediaSoup status error:", error);
    return null;
  }
};

// Test 3: Socket connection
const testSocketConnection = () => {
  const component = window.viewerComponent;
  if (!component) {
    console.log("❌ Component not found");
    return false;
  }
  
  console.log("🔌 Socket Status:", {
    hasSocket: !!component.socket,
    connected: component.socket?.connected,
    readyState: component.socket?.readyState
  });
  
  return component.socket && component.socket.connected;
};

// Run all tests
const runTests = async () => {
  console.log("🚀 Running fixed backend tests...");
  
  const healthOk = await testBasicConnectivity();
  const mediaSoupStatus = await testMediaSoupStatus();
  const socketOk = testSocketConnection();
  
  console.log("\n📊 === TEST RESULTS ===");
  console.log("Health Endpoint:", healthOk ? "✅ Working" : "❌ Failed");
  console.log("Socket Connection:", socketOk ? "✅ Connected" : "❌ Failed");
  
  if (mediaSoupStatus) {
    console.log("MediaSoup Status:", {
      workerReady: mediaSoupStatus.workerReady ? "✅ Ready" : "❌ Not Ready",
      hasWorker: mediaSoupStatus.hasWorker ? "✅ Exists" : "❌ Missing",
      hasRouter: mediaSoupStatus.hasRouter ? "✅ Exists" : "❌ Missing",
      rtpCapabilities: mediaSoupStatus.rtpCapabilities
    });
  } else {
    console.log("MediaSoup Status: ❌ Failed to get status");
  }
  
  // Summary
  if (healthOk && socketOk) {
    console.log("\n✅ Backend connectivity is working!");
    
    if (mediaSoupStatus && mediaSoupStatus.workerReady) {
      console.log("✅ MediaSoup is ready for streaming!");
      console.log("🎯 Next step: Test MediaSoup flow with active producers");
    } else {
      console.log("⚠️ MediaSoup needs initialization or has no active producers");
    }
  } else {
    console.log("\n❌ Backend connectivity issues remain");
  }
};

// Execute tests
runTests(); 
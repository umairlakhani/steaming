// Copy and paste this entire script into your browser console
// Test backend connectivity
console.log("🔍 === TESTING BACKEND CONNECTIVITY ===");

// Test basic backend connectivity
const testBackendConnectivity = async () => {
  try {
    console.log("🔄 Testing basic backend connectivity...");
    
    // Test 1: Basic HTTP request to backend
    console.log("📤 Testing HTTP connectivity...");
    const httpResponse = await fetch('/api/health');
    console.log("📥 HTTP Response Status:", httpResponse.status);
    
    if (httpResponse.ok) {
      const healthData = await httpResponse.json();
      console.log("📥 Health Data:", healthData);
    }
    
    // Test 2: Check if we can reach the backend
    console.log("📤 Testing backend reachability...");
    const pingResponse = await fetch('/api/ping');
    console.log("📥 Ping Response Status:", pingResponse.status);
    
    if (pingResponse.ok) {
      const pingData = await pingResponse.text();
      console.log("📥 Ping Data:", pingData);
    }
    
    // Test 3: Check socket connection
    const component = window.viewerComponent;
    if (component && component.socket) {
      console.log("🔌 Socket Status:", {
        connected: component.socket.connected,
        id: component.socket.id,
        readyState: component.socket.readyState
      });
      
      // Test socket ping
      console.log("📤 Testing socket ping...");
      component.socket.emit('ping');
      
      // Wait a bit for response
      setTimeout(() => {
        console.log("📥 Socket ping sent (check backend logs for response)");
      }, 1000);
    } else {
      console.log("❌ No socket connection available");
    }
    
    // Test 4: Try to connect socket if not connected
    if (component && (!component.socket || !component.socket.connected)) {
      console.log("🔄 Attempting to connect socket...");
      component.connectSocket();
      
      // Wait for connection
      setTimeout(() => {
        console.log("📊 Socket connection status after attempt:", {
          hasSocket: !!component.socket,
          connected: component.socket?.connected,
          readyState: component.socket?.readyState
        });
      }, 2000);
    }
    
  } catch (error) {
    console.error("❌ Error testing backend connectivity:", error);
  }
};

// Test MediaSoup-specific endpoints
const testMediaSoupEndpoints = async () => {
  try {
    console.log("🔄 Testing MediaSoup-specific endpoints...");
    
    // Test 1: MediaSoup status endpoint
    console.log("📤 Testing MediaSoup status endpoint...");
    const statusResponse = await fetch('/api/mediasoup-status');
    console.log("📥 MediaSoup Status Response:", statusResponse.status);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log("📥 MediaSoup Status Data:", statusData);
    }
    
    // Test 2: Try to access MediaSoup routes
    console.log("📤 Testing MediaSoup routes...");
    const routesResponse = await fetch('/api/livestreaming/mediasoup-status');
    console.log("📥 Routes Response:", routesResponse.status);
    
    if (routesResponse.ok) {
      const routesData = await routesResponse.json();
      console.log("📥 Routes Data:", routesData);
    }
    
  } catch (error) {
    console.error("❌ Error testing MediaSoup endpoints:", error);
  }
};

// Run connectivity tests
const runConnectivityTests = async () => {
  console.log("🚀 Running connectivity tests...");
  
  await testBackendConnectivity();
  await testMediaSoupEndpoints();
  
  console.log("\n📊 === CONNECTIVITY SUMMARY ===");
  console.log("Check the responses above to see if the backend is accessible.");
  console.log("If you see 404 errors, the backend routes might not be set up correctly.");
  console.log("If you see connection errors, the backend might not be running.");
};

// Execute tests
runConnectivityTests(); 
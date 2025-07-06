// Check backend MediaSoup server status
console.log("🔍 === CHECKING BACKEND MEDIASOUP STATUS ===");

// Check if we can reach the backend
fetch('/api/livestream/mediasoup-status')
  .then(response => response.json())
  .then(data => {
    console.log("📊 Backend MediaSoup Status:", data);
    
    if (data.workerReady) {
      console.log("✅ MediaSoup worker is ready");
    } else {
      console.log("❌ MediaSoup worker is not ready");
    }
    
    if (data.hasWorker) {
      console.log("✅ MediaSoup worker exists");
    } else {
      console.log("❌ MediaSoup worker does not exist");
    }
    
    if (data.hasRouter) {
      console.log("✅ MediaSoup router exists");
    } else {
      console.log("❌ MediaSoup router does not exist");
    }
    
    if (data.rtpCapabilities === 'Available') {
      console.log("✅ RTP capabilities are available");
    } else {
      console.log("❌ RTP capabilities are missing");
    }
  })
  .catch(error => {
    console.error("❌ Failed to check backend status:", error);
  }); 
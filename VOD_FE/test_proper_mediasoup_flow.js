// Test proper MediaSoup flow without bypassing internal connection
console.log("🎬 === TESTING PROPER MEDIASOUP FLOW ===");

// Get the component
const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing proper MediaSoup flow...");
  
  // Test the proper MediaSoup flow
  component.testProperMediaSoupFlow().then(() => {
    console.log("✅ Proper MediaSoup flow test completed");
  }).catch((error) => {
    console.error("❌ Proper MediaSoup flow test failed:", error);
  });
} 
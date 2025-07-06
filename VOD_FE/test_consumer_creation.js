// Test consumer creation with proper transport
console.log("🎬 === TESTING CONSUMER CREATION ===");

// Get the component
const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, testing consumer creation...");
  
  // Test the new consumer creation method
  component.testConsumerCreation().then(() => {
    console.log("✅ Consumer creation test completed");
  }).catch((error) => {
    console.error("❌ Consumer creation test failed:", error);
  });
} 
// === FORCE VIDEO ELEMENT LOAD ===
// Run this to force the video element to properly load the MediaStream

console.log('🔧 === FORCING VIDEO ELEMENT LOAD ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Force video element to load properly
await viewer.forceVideoElementLoad();

console.log('✅ Force load complete!'); 
// === SIMPLE DEBUG SCRIPT ===
// Copy and paste this into your browser console

console.log('🔍 === SIMPLE DEBUG START ===');

// Get viewer component
const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  console.log('Available window properties:', Object.keys(window).filter(k => k.includes('viewer')));
} else {
  console.log('✅ Viewer component found');
  
  // 1. Check video element
  const video = document.querySelector('video');
  console.log('📺 Video element:', {
    readyState: video?.readyState,
    networkState: video?.networkState,
    videoWidth: video?.videoWidth,
    videoHeight: video?.videoHeight,
    srcObject: !!video?.srcObject,
    src: video?.src
  });
  
  // 2. Check MediaSoup state
  console.log('📊 MediaSoup state:');
  viewer.debugMediaSoupState();
  
  // 3. Test tracks
  console.log('🎬 Testing tracks:');
  viewer.testMediaSoupTracks();
  
  console.log('✅ Debug complete');
} 
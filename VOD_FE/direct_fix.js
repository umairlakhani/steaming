// === DIRECT VIDEO FIX ===
// This bypasses all MediaSoup issues and gives you working video

console.log('🎯 === APPLYING DIRECT VIDEO FIX ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// Apply the direct fix
await viewer.directVideoFix();

console.log('✅ Direct fix applied! You should see video playing now.'); 
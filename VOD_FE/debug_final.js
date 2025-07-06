// === FINAL DEBUG SCRIPT ===
// Run this in browser console to identify the root cause

console.log('🔍 === FINAL DEBUG START ===');

const viewer = window.viewerComponent;
if (!viewer) {
  console.error('❌ No viewer component found');
  return;
}

console.log('✅ Viewer component found');

// 1. Check if tracks exist and their state
console.log('\n📊 === 1. TRACK ANALYSIS ===');
if (viewer.videoTrack) {
  console.log('📹 Video track exists:', {
    id: viewer.videoTrack.id,
    kind: viewer.videoTrack.kind,
    enabled: viewer.videoTrack.enabled,
    readyState: viewer.videoTrack.readyState,
    muted: viewer.videoTrack.muted
  });
} else {
  console.log('❌ No video track found');
}

if (viewer.audioTrack) {
  console.log('🎵 Audio track exists:', {
    id: viewer.audioTrack.id,
    kind: viewer.audioTrack.kind,
    enabled: viewer.audioTrack.enabled,
    readyState: viewer.audioTrack.readyState,
    muted: viewer.audioTrack.muted
  });
} else {
  console.log('❌ No audio track found');
}

// 2. Check MediaSoup state
console.log('\n🌐 === 2. MEDIASOUP STATE ===');
viewer.debugMediaSoupState();

// 3. Test with canvas stream (to verify video element works)
console.log('\n🎨 === 3. CANVAS STREAM TEST ===');
viewer.testMediaStream();

// 4. Test MediaSoup tracks
console.log('\n🎬 === 4. MEDIASOUP TRACKS TEST ===');
viewer.testMediaSoupTracks();

console.log('\n✅ === DEBUG COMPLETE ===');
console.log('Check the logs above to identify the issue:');
console.log('- If canvas test works: MediaSoup tracks are the problem');
console.log('- If canvas test fails: Video element setup is the problem');
console.log('- If tracks show readyState !== "live": MediaSoup connection issue'); 
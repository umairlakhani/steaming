// Copy and paste this entire script into your browser console
// Test if MediaSoup consumers are producing data
console.log("🎯 === TESTING CONSUMER DATA PRODUCTION ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, checking consumer data production...");
  
  // Check consumer transport
  console.log("🔧 Consumer Transport:", {
    exists: !!component.consumerTransport,
    state: component.consumerTransport?.connectionState,
    dtlsState: component.consumerTransport?.dtlsTransport?.state
  });
  
  // Check video consumer
  if (component.videoConsumer) {
    console.log("📹 Video Consumer:", {
      paused: component.videoConsumer.paused,
      closed: component.videoConsumer.closed,
      hasTrack: !!component.videoConsumer.track,
      trackId: component.videoConsumer.track?.id,
      trackKind: component.videoConsumer.track?.kind,
      trackEnabled: component.videoConsumer.track?.enabled,
      trackReadyState: component.videoConsumer.track?.readyState
    });
    
    // Check if video track is producing data
    if (component.videoConsumer.track) {
      const videoTrack = component.videoConsumer.track;
      console.log("🎬 Video Track Details:", {
        id: videoTrack.id,
        kind: videoTrack.kind,
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        readyState: videoTrack.readyState,
        contentHint: videoTrack.contentHint
      });
      
      // Check track settings
      try {
        const settings = videoTrack.getSettings();
        console.log("📐 Video Track Settings:", settings);
      } catch (e) {
        console.log("⚠️ Could not get video track settings:", e.message);
      }
      
      // Check track capabilities
      try {
        const capabilities = videoTrack.getCapabilities();
        console.log("🔧 Video Track Capabilities:", capabilities);
      } catch (e) {
        console.log("⚠️ Could not get video track capabilities:", e.message);
      }
    }
  } else {
    console.log("❌ No video consumer found");
  }
  
  // Check audio consumer
  if (component.audioConsumer) {
    console.log("🔊 Audio Consumer:", {
      paused: component.audioConsumer.paused,
      closed: component.audioConsumer.closed,
      hasTrack: !!component.audioConsumer.track,
      trackId: component.audioConsumer.track?.id,
      trackKind: component.audioConsumer.track?.kind,
      trackEnabled: component.audioConsumer.track?.enabled,
      trackReadyState: component.audioConsumer.track?.readyState
    });
    
    // Check if audio track is producing data
    if (component.audioConsumer.track) {
      const audioTrack = component.audioConsumer.track;
      console.log("🎵 Audio Track Details:", {
        id: audioTrack.id,
        kind: audioTrack.kind,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState,
        contentHint: audioTrack.contentHint
      });
      
      // Check track settings
      try {
        const settings = audioTrack.getSettings();
        console.log("📐 Audio Track Settings:", settings);
      } catch (e) {
        console.log("⚠️ Could not get audio track settings:", e.message);
      }
    }
  } else {
    console.log("❌ No audio consumer found");
  }
  
  // Check if consumers are resumed
  console.log("▶️ Consumer Resume Status:", {
    videoResumed: !component.videoConsumer?.paused,
    audioResumed: !component.audioConsumer?.paused
  });
  
  // Try to resume consumers if they're paused
  if (component.videoConsumer && component.videoConsumer.paused) {
    console.log("🔄 Resuming video consumer...");
    component.videoConsumer.resume();
  }
  
  if (component.audioConsumer && component.audioConsumer.paused) {
    console.log("🔄 Resuming audio consumer...");
    component.audioConsumer.resume();
  }
  
  // Check MediaStream in video element
  const video = component.target?.nativeElement;
  if (video && video.srcObject) {
    const stream = video.srcObject;
    console.log("📺 MediaStream in Video Element:", {
      active: stream.active,
      id: stream.id,
      trackCount: stream.getTracks().length
    });
    
    // Check if tracks are live
    const tracks = stream.getTracks();
    tracks.forEach((track, index) => {
      console.log(`Track ${index + 1} (${track.kind}):`, {
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });
  } else {
    console.log("❌ No MediaStream found in video element");
  }
} 
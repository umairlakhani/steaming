// Copy and paste this entire script into your browser console
// Monitor MediaSoup operations status
console.log("📊 === MONITORING MEDIASOUP OPERATIONS ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, monitoring operations...");
  
  // Monitor current state
  const monitorState = () => {
    console.log("📊 Current MediaSoup State:", {
      socketConnected: component.socket?.connected,
      hasDevice: !!component.device,
      hasTransport: !!component.consumerTransport,
      transportState: component.consumerTransport?.connectionState,
      hasVideoConsumer: !!component.videoConsumer,
      hasAudioConsumer: !!component.audioConsumer,
      videoConsumerPaused: component.videoConsumer?.paused,
      audioConsumerPaused: component.audioConsumer?.paused
    });
    
    // Check video element
    const video = component.target?.nativeElement;
    if (video) {
      console.log("📺 Video Element State:", {
        readyState: video.readyState,
        networkState: video.networkState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        hasSrcObject: !!video.srcObject,
        srcObjectActive: video.srcObject?.active,
        trackCount: video.srcObject?.getTracks().length
      });
    }
  };
  
  // Monitor for 30 seconds
  let monitorCount = 0;
  const maxMonitorCount = 300; // 30 seconds
  
  const monitor = setInterval(() => {
    monitorCount++;
    console.log(`\n📊 Monitor ${monitorCount}/${maxMonitorCount} - ${new Date().toLocaleTimeString()}`);
    monitorState();
    
    // Check for success conditions
    const video = component.target?.nativeElement;
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      console.log("✅ SUCCESS: Video is playing with dimensions!");
      clearInterval(monitor);
      return;
    }
    
    // Check for failure conditions
    if (monitorCount >= maxMonitorCount) {
      console.log("⏰ Monitoring timeout reached");
      clearInterval(monitor);
      
      // Try manual intervention
      console.log("🔧 Attempting manual intervention...");
      
      // Check if transport is still in 'new' state
      if (component.consumerTransport && component.consumerTransport.connectionState === 'new') {
        console.log("⚠️ Transport still in 'new' state, trying manual connection...");
        
        // Try to manually connect transport
        component.consumerTransport.connect({ dtlsParameters: component.consumerTransport.dtlsParameters })
          .then(() => {
            console.log("✅ Manual transport connection successful!");
          })
          .catch((error) => {
            console.error("❌ Manual transport connection failed:", error);
          });
      }
      
      // Check if we have consumers but no video
      if (component.videoConsumer && component.audioConsumer && video && video.readyState < 2) {
        console.log("⚠️ Have consumers but no video, trying manual stream setup...");
        
        const tracks = [];
        if (component.videoConsumer.track) tracks.push(component.videoConsumer.track);
        if (component.audioConsumer.track) tracks.push(component.audioConsumer.track);
        
        if (tracks.length > 0) {
          const newStream = new MediaStream(tracks);
          video.srcObject = newStream;
          video.load();
          console.log("✅ Manual stream setup completed");
        }
      }
    }
  }, 100);
  
  // Also check socket events
  if (component.socket) {
    console.log("🔌 Monitoring socket events...");
    
    const originalEmit = component.socket.emit;
    component.socket.emit = function(...args) {
      console.log("📤 Socket emit:", args[0], args.slice(1));
      return originalEmit.apply(this, args);
    };
    
    const originalOn = component.socket.on;
    component.socket.on = function(event, callback) {
      console.log("📥 Socket listener added:", event);
      return originalOn.call(this, event, (...args) => {
        console.log("📥 Socket event received:", event, args);
        return callback.apply(this, args);
      });
    };
  }
} 
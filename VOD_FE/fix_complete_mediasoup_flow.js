// Copy and paste this entire script into your browser console
// Complete MediaSoup flow fix
console.log("🔧 === COMPLETE MEDIASOUP FLOW FIX ===");

const component = window.viewerComponent;
if (!component) {
  console.error("❌ Component not found");
} else {
  console.log("✅ Component found, fixing MediaSoup flow...");
  
  // Step 1: Check current state
  console.log("📊 Current State:", {
    hasTransport: !!component.consumerTransport,
    transportState: component.consumerTransport?.connectionState,
    hasVideoConsumer: !!component.videoConsumer,
    hasAudioConsumer: !!component.audioConsumer,
    hasDevice: !!component.device
  });
  
  // Step 2: Complete the MediaSoup flow
  const completeMediaSoupFlow = async () => {
    try {
      console.log("🔄 Step 1: Checking device...");
      if (!component.device) {
        console.log("❌ Device not loaded, cannot proceed");
        return;
      }
      
      console.log("🔄 Step 2: Connecting consumer transport...");
      if (component.consumerTransport && component.consumerTransport.connectionState === 'new') {
        // Get connection parameters from backend
        const response = await component.sendRequest('connectConsumerTransport', {
          transportId: component.consumerTransport.id
        });
        
        if (response && response.dtlsParameters) {
          console.log("✅ Got DTLS parameters, connecting transport...");
          await component.consumerTransport.connect({ dtlsParameters: response.dtlsParameters });
          console.log("✅ Consumer transport connected!");
        } else {
          console.error("❌ Failed to get DTLS parameters");
          return;
        }
      } else {
        console.log("⚠️ Transport already connected or doesn't exist");
      }
      
      console.log("🔄 Step 3: Creating video consumer...");
      if (!component.videoConsumer) {
        const videoResponse = await component.sendRequest('consume', {
          transportId: component.consumerTransport.id,
          kind: 'video',
          rtpCapabilities: component.device.rtpCapabilities
        });
        
        if (videoResponse && videoResponse.id) {
          console.log("✅ Got video consumer parameters, creating consumer...");
          component.videoConsumer = await component.consumerTransport.consume({
            id: videoResponse.id,
            producerId: videoResponse.producerId,
            kind: videoResponse.kind,
            rtpParameters: videoResponse.rtpParameters,
            type: videoResponse.type,
            appData: videoResponse.appData
          });
          
          console.log("✅ Video consumer created!");
          
          // Resume the consumer
          await component.videoConsumer.resume();
          console.log("✅ Video consumer resumed!");
        } else {
          console.error("❌ Failed to get video consumer parameters");
        }
      } else {
        console.log("⚠️ Video consumer already exists");
      }
      
      console.log("🔄 Step 4: Creating audio consumer...");
      if (!component.audioConsumer) {
        const audioResponse = await component.sendRequest('consume', {
          transportId: component.consumerTransport.id,
          kind: 'audio',
          rtpCapabilities: component.device.rtpCapabilities
        });
        
        if (audioResponse && audioResponse.id) {
          console.log("✅ Got audio consumer parameters, creating consumer...");
          component.audioConsumer = await component.consumerTransport.consume({
            id: audioResponse.id,
            producerId: audioResponse.producerId,
            kind: audioResponse.kind,
            rtpParameters: audioResponse.rtpParameters,
            type: audioResponse.type,
            appData: audioResponse.appData
          });
          
          console.log("✅ Audio consumer created!");
          
          // Resume the consumer
          await component.audioConsumer.resume();
          console.log("✅ Audio consumer resumed!");
        } else {
          console.error("❌ Failed to get audio consumer parameters");
        }
      } else {
        console.log("⚠️ Audio consumer already exists");
      }
      
      console.log("🔄 Step 5: Creating MediaStream from consumers...");
      if (component.videoConsumer && component.audioConsumer) {
        const tracks = [];
        
        if (component.videoConsumer.track) {
          tracks.push(component.videoConsumer.track);
        }
        
        if (component.audioConsumer.track) {
          tracks.push(component.audioConsumer.track);
        }
        
        if (tracks.length > 0) {
          const newStream = new MediaStream(tracks);
          console.log("✅ Created new MediaStream with", tracks.length, "tracks");
          
          // Update video element
          const video = component.target?.nativeElement;
          if (video) {
            video.srcObject = newStream;
            video.load();
            console.log("✅ Updated video element with new stream");
            
            // Try to play
            setTimeout(async () => {
              try {
                await video.play();
                console.log("✅ Video playing successfully!");
              } catch (error) {
                console.error("❌ Video play failed:", error);
              }
            }, 1000);
          }
        }
      }
      
      console.log("✅ MediaSoup flow completed!");
      
    } catch (error) {
      console.error("❌ Error completing MediaSoup flow:", error);
    }
  };
  
  // Execute the fix
  completeMediaSoupFlow();
} 
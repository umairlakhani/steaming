// Check MediaSoup consumers in Angular component
console.log('=== CHECKING MEDIASOUP CONSUMERS IN COMPONENT ===');

// 1. Try to access the Angular component
console.log('1. Looking for Angular component...');

// Method 1: Check if component is accessible via window
if (window.ng && window.ng.probe) {
  console.log('✅ Angular debugger available');
  try {
    const component = window.ng.probe(document.querySelector('app-viewer'));
    if (component) {
      console.log('✅ Viewer component found');
      const componentInstance = component.componentInstance;
      console.log('Component instance:', componentInstance);
      
      // Check for MediaSoup properties
      if (componentInstance.consumerTransport) {
        console.log('✅ Consumer transport found in component');
        console.log('Transport state:', componentInstance.consumerTransport.connectionState);
      } else {
        console.log('❌ Consumer transport not found in component');
      }
      
      if (componentInstance.videoConsumer) {
        console.log('✅ Video consumer found in component');
        console.log('Video consumer state:', componentInstance.videoConsumer.paused ? 'paused' : 'active');
      } else {
        console.log('❌ Video consumer not found in component');
      }
      
      if (componentInstance.audioConsumer) {
        console.log('✅ Audio consumer found in component');
        console.log('Audio consumer state:', componentInstance.audioConsumer.paused ? 'paused' : 'active');
      } else {
        console.log('❌ Audio consumer not found in component');
      }
    } else {
      console.log('❌ Viewer component not found');
    }
  } catch (error) {
    console.log('❌ Error accessing component:', error.message);
  }
} else {
  console.log('❌ Angular debugger not available');
}

// 2. Check for any global MediaSoup objects
console.log('\n2. Checking global MediaSoup objects...');
const globalObjects = Object.keys(window).filter(key => 
  key.toLowerCase().includes('mediasoup') || 
  key.toLowerCase().includes('consumer') || 
  key.toLowerCase().includes('transport') ||
  key.toLowerCase().includes('video') ||
  key.toLowerCase().includes('audio')
);

console.log('Global MediaSoup-related objects:', globalObjects);

// 3. Check for any objects with MediaSoup properties
console.log('\n3. Checking objects with MediaSoup properties...');
for (const key of globalObjects) {
  try {
    const obj = window[key];
    if (obj && typeof obj === 'object') {
      const properties = Object.keys(obj).filter(prop => 
        prop.toLowerCase().includes('consumer') || 
        prop.toLowerCase().includes('transport') ||
        prop.toLowerCase().includes('track')
      );
      if (properties.length > 0) {
        console.log(`${key} has MediaSoup properties:`, properties);
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

// 4. Try to find MediaSoup objects in the DOM
console.log('\n4. Checking DOM for MediaSoup data...');
const elements = document.querySelectorAll('*');
let foundElements = [];

elements.forEach(element => {
  try {
    const attributes = element.getAttributeNames();
    attributes.forEach(attr => {
      if (attr.toLowerCase().includes('mediasoup') || 
          attr.toLowerCase().includes('consumer') || 
          attr.toLowerCase().includes('transport')) {
        foundElements.push({
          element: element.tagName,
          attribute: attr,
          value: element.getAttribute(attr)
        });
      }
    });
  } catch (error) {
    // Ignore errors
  }
});

if (foundElements.length > 0) {
  console.log('Found elements with MediaSoup attributes:', foundElements);
} else {
  console.log('No elements with MediaSoup attributes found');
}

// 5. Check for any Angular services or injectables
console.log('\n5. Checking for Angular services...');
if (window.ng && window.ng.getContext) {
  try {
    const context = window.ng.getContext(document.querySelector('app-viewer'));
    if (context) {
      console.log('Angular context found:', context);
    }
  } catch (error) {
    console.log('Error getting Angular context:', error.message);
  }
}

// 6. Create a function to manually set up consumers
console.log('\n6. Creating manual consumer setup function...');

window.setupConsumersManually = function() {
  console.log('Setting up consumers manually...');
  
  // Check if we have the necessary MediaSoup objects
  if (!window.mediasoupClient) {
    console.log('❌ MediaSoup client not available');
    return;
  }
  
  // Try to find consumers in any available scope
  let videoConsumer = null;
  let audioConsumer = null;
  let consumerTransport = null;
  
  // Look in various possible locations
  const possibleLocations = [
    window,
    window.angular,
    window.ng,
    document.querySelector('app-viewer')?.__ngContext__,
    document.querySelector('app-viewer')?.__ngContext__?.consumerTransport,
    document.querySelector('app-viewer')?.__ngContext__?.videoConsumer,
    document.querySelector('app-viewer')?.__ngContext__?.audioConsumer
  ];
  
  for (const location of possibleLocations) {
    if (location) {
      if (location.videoConsumer && !videoConsumer) {
        videoConsumer = location.videoConsumer;
        console.log('✅ Found video consumer in location');
      }
      if (location.audioConsumer && !audioConsumer) {
        audioConsumer = location.audioConsumer;
        console.log('✅ Found audio consumer in location');
      }
      if (location.consumerTransport && !consumerTransport) {
        consumerTransport = location.consumerTransport;
        console.log('✅ Found consumer transport in location');
      }
    }
  }
  
  if (videoConsumer && !videoConsumer.closed) {
    console.log('✅ Video consumer is available and active');
    window.videoConsumer = videoConsumer;
    
    // Resume if paused
    if (videoConsumer.paused) {
      videoConsumer.resume();
      console.log('🔄 Resumed video consumer');
    }
    
    // Get video track
    const videoTrack = videoConsumer.track;
    if (videoTrack && videoTrack.readyState === 'live') {
      console.log('✅ Video track is live');
      
      // Create stream and attach to video
      const stream = new MediaStream([videoTrack]);
      const video = document.querySelector('video');
      if (video) {
        video.srcObject = stream;
        console.log('✅ Video stream attached');
        
        // Try to play
        video.play().then(() => {
          console.log('✅ Video playing successfully');
        }).catch(error => {
          console.log('❌ Video play failed:', error.message);
        });
      }
    } else {
      console.log('❌ Video track not available or not live');
    }
  } else {
    console.log('❌ Video consumer not available or closed');
  }
  
  if (audioConsumer && !audioConsumer.closed) {
    console.log('✅ Audio consumer is available and active');
    window.audioConsumer = audioConsumer;
    
    // Resume if paused
    if (audioConsumer.paused) {
      audioConsumer.resume();
      console.log('🔄 Resumed audio consumer');
    }
  } else {
    console.log('❌ Audio consumer not available or closed');
  }
  
  if (consumerTransport && !consumerTransport.closed) {
    console.log('✅ Consumer transport is available and active');
    window.consumerTransport = consumerTransport;
    console.log('Transport state:', consumerTransport.connectionState);
  } else {
    console.log('❌ Consumer transport not available or closed');
  }
};

console.log('=== CHECK COMPLETE ===');
console.log('Run window.setupConsumersManually() to attempt manual setup'); 
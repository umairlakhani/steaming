// Debug script for live streaming issues
const fetch = require('node-fetch');

async function testStreamingEndpoints() {
  console.log('🔍 Testing Streaming Endpoints...\n');

  const baseUrl = 'http://localhost:3000';
  const rtmpUrl = 'http://localhost:8000';

  // Test 1: Check if streaming server is running
  console.log('1. Testing streaming server status...');
  try {
    const response = await fetch(`${baseUrl}/api/rtmp/status`);
    const data = await response.json();
    console.log('✅ Streaming server status:', data);
  } catch (error) {
    console.log('❌ Streaming server not accessible:', error.message);
  }

  // Test 2: Check MediaSoup status
  console.log('\n2. Testing MediaSoup status...');
  try {
    const response = await fetch(`${baseUrl}/mediasoup-status`);
    const data = await response.json();
    console.log('✅ MediaSoup status:', data);
  } catch (error) {
    console.log('❌ MediaSoup status check failed:', error.message);
  }

  // Test 3: Check if RTMP server is running
  console.log('\n3. Testing RTMP server...');
  try {
    const response = await fetch(`${rtmpUrl}/live`);
    console.log('✅ RTMP server is running (status:', response.status, ')');
  } catch (error) {
    console.log('❌ RTMP server not accessible:', error.message);
  }

  // Test 4: Check specific stream (replace with your actual stream key)
  const testStreamKey = '8f1SGyR84J'; // Replace with your actual stream key
  console.log(`\n4. Testing specific stream: ${testStreamKey}`);
  try {
    const response = await fetch(`${rtmpUrl}/live/${testStreamKey}/index.m3u8`);
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Stream is available');
      console.log('📄 M3U8 content preview:', content.substring(0, 200) + '...');
    } else {
      console.log('❌ Stream not available (status:', response.status, ')');
    }
  } catch (error) {
    console.log('❌ Stream check failed:', error.message);
  }

  // Test 5: Check stream status endpoint
  console.log('\n5. Testing stream status endpoint...');
  try {
    const response = await fetch(`${baseUrl}/stream-status/${testStreamKey}`);
    const data = await response.json();
    console.log('✅ Stream status:', data);
  } catch (error) {
    console.log('❌ Stream status check failed:', error.message);
  }

  console.log('\n🎯 Debug Summary:');
  console.log('- Make sure your streaming server is running on port 3000');
  console.log('- Make sure your RTMP server is running on port 8000');
  console.log('- Check if the broadcaster is actually streaming');
  console.log('- Verify the stream key is correct');
  console.log('- Check browser console for any JavaScript errors');
}

// Run the tests
testStreamingEndpoints().catch(console.error); 
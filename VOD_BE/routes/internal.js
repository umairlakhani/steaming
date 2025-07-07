const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');
const fs = require('fs');
const path = require('path');

// Internal video expose route for video processing
router.get('/videoExpose', async (req, res) => {
  try {
    console.log('🔍 Internal video expose requested');
    
    // Get the latest live stream or video that needs processing
    const latestStream = await prisma.liveStreaming.findFirst({
      where: {
        status: 'ON_AIR',
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!latestStream) {
      console.log('❌ No active stream found for processing');
      return res.status(404).json({ 
        error: 'No active stream found',
        message: 'No live stream is currently on air for processing'
      });
    }

    console.log('✅ Found active stream:', latestStream.id);

    // Check if this is a WebRTC stream
    if (latestStream.streamType === 'WEBRTC_STREAM') {
      // For WebRTC streams, we need to get the MediaSoup stream
      console.log('📡 WebRTC stream detected, checking MediaSoup status...');
      
      // Import MediaSoup controller
      const liveStreamingController = require('../Video-Processing/controller/liveStreamingController');
      const { streamProducers, global } = liveStreamingController;
      
      // Check if we have producers for this stream
      const streamVideo = streamProducers[latestStream.id]?.videoProducer;
      const streamAudio = streamProducers[latestStream.id]?.audioProducer;
      const globalVideo = global?.mediasoup?.webrtc?.videoProducer;
      const globalAudio = global?.mediasoup?.webrtc?.audioProducer;
      
      const hasVideo = !!(streamVideo || globalVideo);
      const hasAudio = !!(streamAudio || globalAudio);
      
      console.log('📊 Stream producers status:', {
        streamId: latestStream.id,
        hasVideo,
        hasAudio,
        streamSpecific: { video: !!streamVideo, audio: !!streamAudio },
        global: { video: !!globalVideo, audio: !!globalAudio }
      });

      if (!hasVideo && !hasAudio) {
        console.log('❌ No active producers found for WebRTC stream');
        return res.status(404).json({
          error: 'No active producers',
          message: 'WebRTC stream has no active video or audio producers'
        });
      }

      // For now, return stream info - in a real implementation, you'd need to
      // create a proper video stream from the MediaSoup producers
      res.json({
        status: 'active',
        streamId: latestStream.id,
        streamType: latestStream.streamType,
        hasVideo,
        hasAudio,
        message: 'WebRTC stream is active but direct video access not implemented'
      });
      
    } else if (latestStream.streamType === 'RTMP_STREAM') {
      // For RTMP streams, check if there's a file or stream available
      console.log('📺 RTMP stream detected, checking for video file...');
      
      // Check if there's a video file in the media directory
      const mediaDir = path.join(__dirname, '../Video-Processing/media/live');
      const streamDir = path.join(mediaDir, latestStream.streamKey);
      
      if (fs.existsSync(streamDir)) {
        const files = fs.readdirSync(streamDir);
        const videoFiles = files.filter(file => 
          file.endsWith('.flv') || file.endsWith('.mp4') || file.endsWith('.m3u8')
        );
        
        if (videoFiles.length > 0) {
          const videoFile = path.join(streamDir, videoFiles[0]);
          console.log('✅ Found video file:', videoFile);
          
          // Stream the video file
          const stat = fs.statSync(videoFile);
          const fileSize = stat.size;
          const range = req.headers.range;
          
          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(videoFile, { start, end });
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(videoFile).pipe(res);
          }
        } else {
          console.log('❌ No video files found in stream directory');
          res.status(404).json({
            error: 'No video files',
            message: 'No video files found for RTMP stream'
          });
        }
      } else {
        console.log('❌ Stream directory not found:', streamDir);
        res.status(404).json({
          error: 'Stream directory not found',
          message: 'RTMP stream directory does not exist'
        });
      }
    } else {
      console.log('❌ Unknown stream type:', latestStream.streamType);
      res.status(400).json({
        error: 'Unknown stream type',
        message: `Stream type ${latestStream.streamType} is not supported`
      });
    }
    
  } catch (error) {
    console.error('❌ Error in internal video expose:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check for video processing
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Internal video processing routes are active'
  });
});

// Get stream status for processing
router.get('/stream-status/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    const stream = await prisma.liveStreaming.findUnique({
      where: { id: streamId }
    });
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    // Check MediaSoup status if it's a WebRTC stream
    let mediaSoupStatus = null;
    if (stream.streamType === 'WEBRTC_STREAM') {
      try {
        const liveStreamingController = require('../Video-Processing/controller/liveStreamingController');
        const { streamProducers, global } = liveStreamingController;
        
        const streamVideo = streamProducers[streamId]?.videoProducer;
        const streamAudio = streamProducers[streamId]?.audioProducer;
        const globalVideo = global?.mediasoup?.webrtc?.videoProducer;
        const globalAudio = global?.mediasoup?.webrtc?.audioProducer;
        
        mediaSoupStatus = {
          hasVideo: !!(streamVideo || globalVideo),
          hasAudio: !!(streamAudio || globalAudio),
          streamSpecific: { video: !!streamVideo, audio: !!streamAudio },
          global: { video: !!globalVideo, audio: !!globalAudio }
        };
      } catch (error) {
        mediaSoupStatus = { error: error.message };
      }
    }
    
    res.json({
      streamId,
      status: stream.status,
      streamType: stream.streamType,
      mediaSoupStatus
    });
    
  } catch (error) {
    console.error('Error getting stream status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
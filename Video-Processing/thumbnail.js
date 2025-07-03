const { userUsage, userBucket } = require("./controller/utils/recording");
const { getLiveStreamingUser } = require("./controller/utils/streaming");
const fs = require("fs");
const AWS = require("aws-sdk");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const spawn = require("child_process").spawn;
const checkAndGenerateThumbnail = async () => {
    const recordingFolder = `${__dirname}/controller/rtmp`;
    const filesInFolder = fs.readdirSync(recordingFolder);
  
    const sdpFile = filesInFolder.find((file) => file.endsWith('.sdp'));
  
    if (sdpFile) {
        
      const videoID = sdpFile.split('-')[0];
      await generateLiveStreamThumbnail(videoID);
    } else {
      
    }
  };
  
const generateLiveStreamThumbnail = (streamingId) => {
  let fileToConvertPath = `${__dirname}/controller/rtmp/${streamingId}-vp8.sdp`;
  
  const args = [
    "-y",
    "-i",
    `${process.env.RTMPSERVER}/${streamingId}`,
    "-ss",
    "00:00:01",
    "-vframes",
    "1",
    "-vf",
    "scale=-2:300",
    `thumbnail/${streamingId}.jpg`,
  ];

  const processCheck = spawn("ffmpeg", args, {
    stdio: ["ignore", "ignore", "pipe"],
  });
  processCheck.on("close", async (code) => {
    if (code === 0) {
      const userId = getLiveStreamingUser(streamingId);
      let { bucketId } = await userBucket(userId);
      AWS.config.update({
        accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
        secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
        endpoint: `https://${bucketId}.${process.env.USER_BUCKET_URL}`,
        s3ForcePathStyle: true,
      });
      const spaces = new AWS.S3({
        signatureVersion: "v4",
        params: {
          acl: "public-read",
        },
      });
      
      
      spaces.upload(
        {
          // Bucket: 'hls-video-storage',
          Bucket: bucketId,
          Key: `thumbnail/${streamingId}.jpg`,
          Body: fs.createReadStream(`./thumbnail/${streamingId}.jpg`),
          ACL: "public-read",
        },
        async function (err, data) {
          
          if (err) {
            
          } else {
            
            
            const updated = await prisma.liveStreaming.update({
              where: {
                streamingId: streamingId,
              },
              data: {
                thumbnail: data.Location,
                // videoUrl: data.Location,
                // processing: false,
              },
            });
            
            // console which video is uploaded
            
          }
        }
      );
    } else {
      
    }
  });
  processCheck.stderr.on("data", (data) => {
    
  });
};

module.exports = {generateLiveStreamThumbnail,checkAndGenerateThumbnail};

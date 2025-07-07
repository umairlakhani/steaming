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
      
      // **FIXED**: Use the exact same S3 configuration as videoProcessorServer.js
      const { S3Client } = require("@aws-sdk/client-s3");
      const { Upload } = require("@aws-sdk/lib-storage");
      
      const s3Client = new S3Client({
        region: process.env.DO_BUCKET_REGION,
        endpoint: `https://${process.env.DO_BUCKET_NAME}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
        credentials: {
          accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
          secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
        },
        forcePathStyle: true,
      });
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.DO_BUCKET_NAME,
          Key: `users/${bucketId}/thumbnail/${streamingId}.jpg`,
          Body: fs.createReadStream(`./thumbnail/${streamingId}.jpg`),
          ACL: "public-read",
        },
      });
      
      const result = await upload.done();
      
      // Convert to CDN URL (same as videoProcessorServer.js)
      const cdnUrl = result.Location?.replace(
        `${process.env.DO_BUCKET_REGION}`,
        `${process.env.DO_BUCKET_REGION}.cdn`
      );
      
            const data = { ...result, Location: cdnUrl };
      
      if (data) {
        console.log(data.Location, "check thumbnail data.Location");
        console.log(streamingId, "check video id ");
        
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
        
        console.log(updated, "updated");
        console.log("thumbnail uploaded");
      }
    } else {
      
    }
  });
  processCheck.stderr.on("data", (data) => {
    
  });
};

module.exports = {generateLiveStreamThumbnail,checkAndGenerateThumbnail};

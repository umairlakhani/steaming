const fs = require("fs");
const AWS = require("aws-sdk");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { userUsage } = require("../../utils/recording");
const spawn = require("child_process").spawn;
const config = require("../config/default");
const cmd = config.rtmp_server.trans.ffmpeg;

const generateStreamThumbnail = async (stream_key) => {
  console.log("check thumbs");
  const args = [
    "-y",
    "-i",
    `rtmp://${process.env.RTMP_STREAM_HOST}:${process.env.RTMP_STREAM_PORT}/live/${stream_key}`,
    "-ss",
    "00:00:01",
    '-vframes', '1',
    '-vf', 'scale=-2:300',
    `thumbnail/${stream_key}.jpg`,
  ];

  const processCheck = spawn("ffmpeg", args, {
    stdio: ["ignore", "ignore", "pipe"],
  });
  processCheck.on("close", async (code) => {
    if (code === 0) {
      let { bucketId } = await userUsage(stream_key);
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
      console.log(bucketId, "check bucketId");
      console.log("Thumbnail generated successfully");
      spaces.upload(
        {
          // Bucket: 'hls-video-storage',
          Bucket: bucketId,
          Key: `thumbnail/${stream_key}.jpg`,
          Body: fs.createReadStream(`./thumbnail/${stream_key}.jpg`),
          ACL: "public-read",
        },
        async function (err, data) {
          console.log(data, "check data");
          if (err) {
            console.log("Error", err);
          } else {
            console.log(data.Location, "check thumbnail data.Location");
            console.log(stream_key, "check video id ");
            const updated = await prisma.liveStreaming.updateMany({
              where: {
                streamKey: stream_key,
              },
              data: {
                thumbnail: data.Location,
                // videoUrl: data.Location,
                // processing: false,
              },
            });
            console.log(updated, "updated");
            // console which video is uploaded
            console.log("thumbnail uploaded");
          }
        }
      );
    } else {
      console.error("Thumbnail generation failed");
    }
  });
  processCheck.stderr.on("data", (data) => {
    console.error("FFmpeg stderr:", data.toString());
  });
};

// const generateMp4 = () => {};

module.exports = {
  generateStreamThumbnail: generateStreamThumbnail,
};

const fs = require("fs");
const AWS = require("aws-sdk");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { userUsage } = require("../../utils/recording");
const spawn = require("child_process").spawn;
const config = require("../config/default");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
// const cmd = config.rtmp_server.trans.ffmpeg;

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
      const s3Client = new S3Client({
        region: process.env.DO_BUCKET_REGION,
        endpoint: `https://${process.env.DO_BUCKET_NAME}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
        credentials: {
          accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
          secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
        },
        forcePathStyle: true,
      });
      console.log(bucketId, "check bucketId");
      console.log("Thumbnail generated successfully");
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.DO_BUCKET_NAME,
          Key: `users/${bucketId}/thumbnail/${stream_key}.jpg`,
          Body: fs.createReadStream(`./thumbnail/${stream_key}.jpg`),
          ACL: "public-read",
        },
      });
      const result = await upload.done();
      console.log(result, "check thumbnail data.Location");
      console.log(stream_key, "check video id ");
      const updated = await prisma.liveStreaming.updateMany({
        where: {
          streamKey: stream_key,
        },
        data: {
          thumbnail: result.Location,
          // videoUrl: result.Location,
          // processing: false,
        },
      });
      console.log(updated, "updated");
      // console which video is uploaded
      console.log("thumbnail uploaded");
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

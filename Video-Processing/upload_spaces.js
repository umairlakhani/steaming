const fs = require("fs");
const AWS = require('aws-sdk');
const { getVideoDurationInSeconds } = require('get-video-duration')
const { PrismaClient } = require("@prisma/client");
const { spawn } = require("child_process");
require("dotenv").config();

async function fileSize(path) {
  const stat = fs.stat(path)

  return stat.size
}

async function generateThumbnail(videoUrl, videoId, bucketId) {

  AWS.config.update({
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
    endpoint: `https://${bucketId}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
    s3ForcePathStyle: true,
  })

  const spaces = new AWS.S3({
    signatureVersion: 'v4',
    params: {
      acl: 'public-read',
    },
  });

  let outputFileName = videoId.slice(0, -4);
  let url;
  const thumbnailKey = `thumbnail/${outputFileName}.jpg`;
  const thumbnailExists = await doesObjectExist(bucketId, thumbnailKey);

  if (thumbnailExists) {
    const thumbnailUrl = getThumbnailUrl(bucketId, thumbnailKey);
    console.log('Thumbnail already exists:', thumbnailUrl);
    url = thumbnailUrl
    return thumbnailUrl;
  }

  return await new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', [
      '-i', videoUrl,
      '-ss', '00:00:01.000',
      '-vframes', '1',
      '-q:v', '2',
      `thumbnail/${outputFileName}.jpg`,
    ], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('Thumbnail generated successfully');
        spaces.upload({
          Bucket: bucketId,
          Key: `thumbnail/${outputFileName}.jpg`,
          Body: fs.createReadStream(`thumbnail/${outputFileName}.jpg`),
          ACL: 'public-read',
        }, async function (err, data) {
          if (err) {
            console.log('Error', err);
            reject(err);
          } else {
            console.log(data.Location, 'check thumbnail data.Location');
            console.log(outputFileName, 'check video id ');
            console.log('Thumbnail uploaded');
            resolve(data.Location);
          }
        });
      } else {
        console.error('Thumbnail generation failed');
        return url
        // reject();
      }
    });

    process.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
    });
  });
}

function doesObjectExist(bucketId, key) {
  return new Promise((resolve, reject) => {
    const spaces = new AWS.S3();
    spaces.headObject({ Bucket: bucketId, Key: key }, (err, data) => {
      if (err) {
        if (err.code === 'NotFound') {
          resolve(false); // Object does not exist
        } else {
          reject(err);
        }
      } else {
        resolve(true); // Object exists
      }
    });
  });
}

function getThumbnailUrl(bucketId, key) {
  return `https://${bucketId}.${process.env.USER_BUCKET_URL}/${key}`;
}

const prisma = new PrismaClient();
// upload 360p video to digital ocean spaces
const upload360p = async (videoId, videoUrl, bucketId) => {
  console.log("upload360p function execute")

  AWS.config.update({
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
    endpoint: `https://${bucketId}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
    s3ForcePathStyle: true,
  })


  const spaces = new AWS.S3({
    signatureVersion: 'v4',
    params: {
      acl: 'private',
    },
  });
  console.log(videoId, "check videoId")

  return await new Promise((resolve, reject) => {
    spaces.upload({
      Bucket: bucketId,
      Key: `videos/${videoId}/360p/${videoId}.m3u8`,
      Body: fs.createReadStream(`${__dirname}/controller/streams/360p/${videoId}.m3u8`),
      ACL: "private"
    }, async function async(err, data) {
      if (err) {
        console.log('Error', err);
        reject(err);
      }
      if (data) {
        getVideoDurationInSeconds(`${__dirname}/controller/recording/${videoId}.mp4`).then(async (durationInSeconds) => {
          console.log(durationInSeconds, "Video duration")

          const hours = Math.floor(durationInSeconds / 3600);
          const minutes = Math.floor((durationInSeconds % 3600) / 60);
          const seconds = Math.floor(durationInSeconds % 60);
          const formattedHours = String(hours).padStart(2, '0');
          const formattedMinutes = String(minutes).padStart(2, '0');
          const formattedSeconds = String(seconds).padStart(2, '0');
          let length = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

          var correctUrl = data.Location.replace(`${process.env.REGION}`, `${process.env.REGION}.cdn`);
          // //   console.log('Uploaded in:', correctUrl);
          // //   // update videoUrl in Video table
          console.log(videoId, "videoId")

          const stat = fs.statSync(`${__dirname}/controller/recording/${videoId}.mp4`)
          var fileSizeInBytes = stat.size;
          let liveStreamRecord = await prisma.liveStreaming.findFirst({
            where: {
              streamingId: videoId
            }
          })
          console.log(liveStreamRecord, "liveStreamRecord")
         let res = await generateThumbnail(`${__dirname}/controller/recording/${videoId}.mp4`, videoId, bucketId)
            console.log(res,"check res thumbnail")
            console.log(res.Location,"res.Location")
            let findRecordByVideoId = await prisma.video.findFirst({
              where:{
                videoId:videoId
              }
            })
            // if(!findRecordByVideoId){
              let createdRecord = await prisma.video.create({
                data: {
                  // videoUrl: data.Location,
                  // processing: false,
                  userId: liveStreamRecord.userId,
                  url360P: correctUrl,
                  url480P: '',
                  url720P: '',
                  //  Title:  `streamvideo_${videoId}`,
                  Title: liveStreamRecord.Title,
                  //  description:`streamvideo_description_${videoId}`,
                  description: liveStreamRecord.description,
                  length: length,
                  videoId: videoId,
                  processing: false,
                  videoUrl: correctUrl,
                  type: 'PUBLIC',
                  thumbnail: res,
                  archived: true,
                  published: false,
                  size: fileSizeInBytes
                },
              })
              console.log(createdRecord,"createdRecord")

          console.log('360p stream uploaded');
        })

        resolve(data);
      }
    });
  });
};

// upload 480p video to digital ocean spaces
const upload480p = async (videoId, thumbnail, bucketId) => {
  console.log("upload480p function execute")
  return await new Promise((resolve, reject) => {

    AWS.config.update({
      accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
      secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
      endpoint: `https://${bucketId}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
      s3ForcePathStyle: true,
    })

    const spaces = new AWS.S3({
      signatureVersion: 'v4',
      params: {
        acl: 'private',
      },
    });
    spaces.upload({
      Bucket: bucketId,
      Key: `videos/${videoId}/480p/${videoId}.m3u8`,
      Body: fs.createReadStream(`${__dirname}/controller/streams/480p/${videoId}.m3u8`),
      ACL: "private"
    }, async function (err, data) {
      if (err) {
        console.log('Error', err);
        reject(err);
      }
      if (data) {
        var correctUrl = data.Location.replace(`${process.env.REGION}`, `${process.env.REGION}.cdn`);
        let exists = await prisma.video.findFirst({
          where: {
            videoId: videoId
          }
        })
        if (exists) {
          let updatedVideo = await prisma.video.update({
            where: {
              videoId: videoId
            },
            data: {
              url480P: correctUrl
            }
          })
          console.log('Updated 480p:', updatedVideo);
        }

        console.log('480p video uploaded');
        resolve(data);
      }
    });
  });
};

// upload 720p video to digital ocean spaces
const upload720p = async (videoId, thumbnail, bucketId) => {
  console.log("upload720p function execute")

  AWS.config.update({
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
    endpoint: `https://${bucketId}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
    s3ForcePathStyle: true,
  })

  const spaces = new AWS.S3({
    signatureVersion: 'v4',
    params: {
      acl: 'private',
    },
  });
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      spaces.upload(
        {
          Bucket: bucketId,
          Key: `videos/${videoId}/720p/${videoId}.m3u8`,
          Body: fs.createReadStream(`${__dirname}/controller/streams/720p/${videoId}.m3u8`),
          ACL: "private"
        },
        async function (err, data) {
          if (err) {
            console.log('Error', err);
            reject(err);
          }
          if (data) {
            var correctUrl = data.Location.replace(`${process.env.REGION}`, `${process.env.REGION}.cdn`);
            let exists = await prisma.video.findFirst({
              where: {
                videoId: videoId
              }
            })
            if (exists) {
              let updatedVideo = await prisma.video.update({
                where: {
                  videoId: videoId
                },
                data: {
                  url720P: correctUrl
                }
              })
              console.log('Uploaded in 720p:', updatedVideo);
            }
            resolve(data);
          }
        }
      );
    });

    console.log('720p video uploaded');

    return uploadResult;
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
};


module.exports = {
  upload720p,
  upload360p,
  upload480p
}
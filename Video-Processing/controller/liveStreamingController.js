var path = require("path");
const http = require("http");
const https = require("https");
const createHttpError = require("http-errors");
const cron = require("node-cron");
const redisConfig = require("../utils/redisConfig");
const { createWriteStream } = require("fs");

const obj = require("../server");
const FFmpegStatic = require("ffmpeg-static");
const Process = require("child_process");
const { Queue, Worker } = require("bullmq");
const { spawn } = require("child_process");
const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic);
const fs = require("fs");
const AWS = require("aws-sdk");
const { pipeline } = require("stream");
const cliProgress = require("cli-progress");
const { upload360p, upload480p, upload720p } = require("../upload_spaces");
const mediasoup = require("mediasoup");
require("dotenv").config();

// Set AWS configuration once at the top level
const REGION = process.env.REGION || 'nyc3';
const BUCKET_NAME = process.env.DO_BUCKET_NAME || 'media-buckets';

const awsConfig = {
  accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
  secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  endpoint: `https://${REGION}.digitaloceanspaces.com`,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  region: REGION
};

AWS.config.update(awsConfig);

// Create a single S3 instance to be reused
const spaces = new AWS.S3({
  signatureVersion: 'v4',
  params: {
    Bucket: BUCKET_NAME,
    ACL: 'private',
  },
});

// Helper function to get the correct CDN URL
function getCdnUrl(location) {
  if (!location) return '';
  return location.replace(`${REGION}`, `${REGION}.cdn`);
}

const liveStreamQueue = new Queue("liveStreamQueue", {
  connection: redisConfig,
});
var io;

const mediasoupOptions = {
  // Worker settings
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      // 'rtx',
      // 'bwe',
      // 'score',
      // 'simulcast',
      // 'svc'
    ],
  },
  // Router settings
  router: {
    // mediaCodecs: [
    //   {
    //     kind: "audio",
    //     mimeType: "audio/opus",
    //     clockRate: 48000,
    //     channels: 2,
    //   },
    //   {
    //     kind: "video",
    //     mimeType: "video/VP8",
    //     clockRate: 90000,
    //     parameters: {
    //       "x-google-start-bitrate": 1000,
    //     },
    //   },
    // ],
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        preferredPayloadType: 111,
        clockRate: 48000,
        channels: 2,
        parameters: {
          minptime: 10,
          useinbandfec: 1,
        },
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        preferredPayloadType: 96,
        clockRate: 90000,
      },
      {
        kind: "video",
        mimeType: "video/H264",
        preferredPayloadType: 125,
        clockRate: 90000,
        parameters: {
          "level-asymmetry-allowed": 1,
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
        },
      },
    ],
  },
  // WebRtcTransport settings
  webRtcTransport: {
    listenIps: [
      // { ip: "0.0.0.0", announcedIp: "192.168.18.189" },
      // { ip: "0.0.0.0", announcedIp: "137.184.92.6" },
      { ip: "0.0.0.0", announcedIp: process.env.MEDIA_SOUP_IP },
      // { ip: "0.0.0.0", announcedIp: "18.188.104.48" },
      // { ip: '192.168.18.186', announcedIp: null }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
  },
  plainTransport: {
    listenIp: { ip: "127.0.0.1", announcedIp: null },
  },
  recording: {
    ip: "127.0.0.1",

    // GStreamer's sdpdemux only supports RTCP = RTP + 1
    audioPort: 5004,
    audioPortRtcp: 5005,
    videoPort: 5006,
    videoPortRtcp: 5007,
  },
};


let connectedUsers = [];

const global = {
  server: {
    expressApp: null,
    https: null,
    socket: null,
    socketServer: null,
  },

  mediasoup: {
    worker: null,
    router: null,

    // WebRTC connection with the browser
    webrtc: {
      recvTransport: null,
      audioProducer: null,
      videoProducer: null,
    },

    // RTP connection with recording process
    rtp: {
      audioTransport: null,
      audioConsumer: null,
      videoTransport: null,
      videoConsumer: null,
    },
  },

  recProcess: null,
};

const { PrismaClient, SubscriptionStatus } = require("@prisma/client");
const prisma = new PrismaClient();
let urlObj = {
  url360P: "",
  url480P: "",
  url720P: "",
};
const videoUpload360p = async (videoId, bucketId) => {
  console.log(videoId, "check videoId");
  return await new Promise((resolve, reject) => {
    spaces.upload({
      Bucket: BUCKET_NAME,
      Key: `users/${bucketId}/videos/${videoId}/360p/${videoId}.m3u8`,
      Body: fs.createReadStream(path.join(__dirname, '..', 'videos', videoId, '360p', `${videoId}.m3u8`)),
      ACL: "private"
    }, function (err, data) {
      if (err) {
        console.log("Error", err);
        reject(err);
      }
      if (data) {
        var correctUrl = getCdnUrl(data.Location);
        console.log("Uploaded in:", correctUrl);
        prisma.video.update({
          where: {
            videoId: videoId,
          },
          data: {
            videoUrl: correctUrl,
          },
        });
        urlObj.url360P = correctUrl;
        console.log("360p video uploaded");
        resolve(data);
      }
    });
  });
};

const videoUpload480p = async (videoId, bucketId) => {
  return await new Promise((resolve, reject) => {
    spaces.upload({
      Bucket: BUCKET_NAME,
      Key: `users/${bucketId}/videos/${videoId}/480p/${videoId}.m3u8`,
      Body: fs.createReadStream(path.join(__dirname, '..', 'videos', videoId, '480p', `${videoId}.m3u8`)),
      ACL: "private"
    }, function (err, data) {
      if (err) {
        console.log("Error", err);
        reject(err);
      }
      if (data) {
        var correctUrl = getCdnUrl(data.Location);
        console.log("Uploaded in:", correctUrl);
        urlObj.url480P = correctUrl;
        console.log("480p video uploaded");
        resolve(data);
      }
    });
  });
};

const videoUpload720p = async (videoId, bucketId) => {
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      spaces.upload({
        Bucket: BUCKET_NAME,
        Key: `users/${bucketId}/videos/${videoId}/720p/${videoId}.m3u8`,
        Body: fs.createReadStream(path.join(__dirname, '..', 'videos', videoId, '720p', `${videoId}.m3u8`)),
        ACL: "private"
      }, function (err, data) {
        if (err) {
          console.log("Error", err);
          reject(err);
        }
        if (data) {
          var correctUrl = getCdnUrl(data.Location);
          urlObj.url720P = correctUrl;
          console.log("Uploaded in:", correctUrl);
          console.log(urlObj, "check urlObj");
          resolve(data);
        }
      });
    });

    const updated = await prisma.video.update({
      where: {
        videoId: videoId,
      },
      data: {
        videoUrl: urlObj.url720P,
        processing: false,
        url360P: urlObj.url360P,
        url480P: urlObj.url480P,
        url720P: urlObj.url720P,
      },
    });

    console.log(updated, "updated");
    console.log("720p video uploaded");

    return uploadResult;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
};

const generateThumbnail = async (videoUrl, videoId, bucketId) => {
  let outputFileName = videoId;
  return await new Promise((resolve, reject) => {
    const process = spawn(
      "ffmpeg",
      [
        "-i",
        videoUrl,
        "-ss",
        "00:00:01.000",
        "-vframes",
        "1",
        "-q:v",
        "2",
        path.join(__dirname, '..', 'thumbnail', `${outputFileName}.jpg`),
      ],
      {
        stdio: ["ignore", "ignore", "pipe"],
      }
    );

    process.on("close", async (code) => {
      if (code === 0) {
        console.log("Thumbnail generated successfully");
        spaces.upload({
          Bucket: BUCKET_NAME,
          Key: `users/${bucketId}/videos/${videoId}/thumbnail/${outputFileName}.jpg`,
          Body: fs.createReadStream(path.join(__dirname, '..', 'thumbnail', `${outputFileName}.jpg`)),
          ACL: "public-read",
        }, async function (err, data) {
          if (err) {
            console.log("Error", err);
            reject(err);
          } else {
            console.log(data.Location, "check thumbnail data.Location");
            console.log(outputFileName, "check video id ");
            console.log("Thumbnail uploaded");
            resolve(data.Location);
          }
        });
      } else {
        console.error("Thumbnail generation failed");
        reject(new Error("Thumbnail generation failed"));
      }
    });

    process.stderr.on("data", (data) => {
      console.error("FFmpeg stderr:", data.toString());
    });
  });
};


async function processVideo(req, res, next) {
  console.log(req.body, "check requestbdy");
  var videoId = req.body["videoId"];
  var bucketId = req.body["bucketId"];
  const videoUrl = await req.body["videoUrl"];
  // let thumbnail = ""
  // const thumbnail = await generateThumbnail(videoUrl, videoId, bucketId)
  // console.log(thumbnail, "check thumbnail")
  console.log(videoId, "check video id");
  // let id = videoId.slice(0, -4)
  let id = videoId;
  const checkVideo = await prisma.video.findUnique({
    where: {
      videoId: id,
    },
  });
  console.log(checkVideo, "checkVideo");
  const video = await prisma.video.update({
    where: {
      videoId: id,
    },
    data: {
      videoUrl: videoUrl,
      // thumbnail: thumbnail
    },
  });
  console.log("video updated", video);
  const outputDirPath = "./videos";


  const download = async (url, path, callback) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol.get(url, async (response) => {
      const totalSize = response.headers["content-length"];
      const progressBar = new cliProgress.SingleBar({
        format: "Progress |{bar}| {percentage}% | ETA: {eta}s",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
      });

      progressBar.start(totalSize, 0);

      const fileStream = createWriteStream(path);

      pipeline(response, fileStream, (err) => {
        if (err) {
          console.error("Error occurred during download:", err);
          progressBar.stop();
          return;
        }

        progressBar.stop();
        callback();
      });

      response.on("data", (chunk) => {
        progressBar.increment(chunk.length);
      });
    });
  };
  console.log(videoUrl, "videos/" + id + ".mp4");
  await download(videoUrl, `./videos/${id}.mp4`, () => {
    console.log("Video downloaded successfully!");
  });

  initializeMediaSoup().catch(console.error);
  // wait 60 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const inputFilePath = `./videos/` + id + ".mp4";
  const resolutions = [
    {
      width: 640,
      height: 360,
      folder: "360p",
      uploadFunction: videoUpload360p,
    },
    {
      width: 854,
      height: 480,
      folder: "480p",
      uploadFunction: videoUpload480p,
    },
    {
      width: 1280,
      height: 720,
      folder: "720p",
      uploadFunction: videoUpload720p,
    },
  ];
  const commands = resolutions.map(({ width, height, folder }, i) => {
    console.log(i, "check i");
    console.log("in commands");

    return spawn("ffmpeg", [
      "-i",
      inputFilePath,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-map",
      "0",
      "-profile:v",
      "baseline",
      "-vf",
      `scale=${width}:${height}`,
      "-f",
      "segment",
      "-segment_time",
      "10",
      "-segment_list",
      `${outputDirPath}/${folder}/${id}.m3u8`,
      `${outputDirPath}/${folder}/${id}_output%d.ts`,
    ]);
  });

  const errors = [];
  for (const [index, ffmpeg] of commands.entries()) {
    AWS.config.update({
      accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
      secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
      endpoint: `https://${bucketId}.${process.env.USER_BUCKET_URL}`,
      s3ForcePathStyle: true,
    });
    const spaces = new AWS.S3({
      signatureVersion: "v4",
      params: {
        acl: "private",
      },
    });
    ffmpeg.on("error", (err) => {
      console.error(
        `FFmpeg error for resolution ${resolutions[index].folder}:`,
        err
      );
      errors.push(resolutions[index].folder);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log(
          `Video conversion for ${resolutions[index].folder} completed successfully`
        );
        resolutions[index]
          .uploadFunction(id, bucketId)
          .then(() => {
            let files = fs
              .readdirSync(`${outputDirPath}/${resolutions[index].folder}`)
              .filter(
                (fl) =>
                  fl.startsWith(id) &&
                  fl.includes("_output") &&
                  fl.endsWith(".ts")
              );
            console.log(files, "chek files");
            console.log(files.length, "cheklength");
            for (const [iter, file] of files.entries()) {
              console.log(iter, "chek iter");
              if (
                file.startsWith(id) &&
                file.includes("_output") &&
                file.endsWith(".ts")
              ) {
                spaces
                  .upload(
                    {
                      Bucket: BUCKET_NAME,
                      Key: `users/${bucketId}/videos/${id}/${resolutions[index].folder}/${id}_output${iter}.ts`,
                      Body: fs.createReadStream(
                        `${outputDirPath}/${resolutions[index].folder}/${id}_output${iter}.ts`
                      ),
                      ACL: "private",
                    },
                    function (err, data) {
                      if (err) {
                        console.log("Error", err);
                      }
                      if (data) {
                        var correctUrl = data.Location.replace(
                          `${process.env.REGION}`,
                          `${process.env.REGION}.cdn`
                        );
                        console.log("Uploaded in:", correctUrl);
                        console.log("Output ts video uploaded");
                      }
                    }
                  )
                  .promise()
                  .then(() => {
                    console.log("after promise");
                    fs.unlinkSync(
                      `${outputDirPath}/${resolutions[index].folder}/${id}_output${iter}.ts`
                    );
                    if (iter == files.length - 1) {
                      if (fs.existsSync(`./videos/${id}.mp4`)) {
                        let maxRetryCount = 10;
                        let retryCount = 0;
                        let deleted = false;
                        while (!deleted && retryCount < maxRetryCount) {
                          try {
                            fs.unlinkSync(`./videos/${id}.mp4`);
                            deleted = true;
                          } catch (err) {
                            retryCount++;
                          }
                        }
                      } else {
                        console.log("mp4 already deleted");
                      }
                    }
                  });
              }
            }
          })
          .then(() => {
            const folderPath = `${outputDirPath}/${resolutions[index].folder}`;
            let id = videoId;
            let m3u8Path = `${outputDirPath}/${resolutions[index].folder}/${id}.m3u8`;
            try {
              if (fs.existsSync(m3u8Path)) {
                console.log(m3u8Path, "file exists");
                fs.unlinkSync(m3u8Path);
                console.log(`Deleted file: ${m3u8Path}`);
              } else {
                console.log(m3u8Path, "file does not exists");
              }
            } catch (err) {
              console.error(err, "error in m3u8 unlinking");
            }
          })

          .then(() => {
            console.log(`Video uploaded for ${resolutions[index].folder}`);
            if (resolutions[index].folder == "720p") {
              console.log("ts files delete started");
            }
          })
          .then(() => {
            return res
              .status(200)
              .json({ message: "Video created successfully!", data: video });
          })
          .catch((err) => {
            console.error(
              `Error uploading video for ${resolutions[index].folder}:`,
              err
            );
            errors.push(resolutions[index].folder);
          });
      } else {
        console.error(
          `FFmpeg process for resolution ${resolutions[index].folder} exited with code`,
          code
        );
        errors.push(resolutions[index].folder);
      }

      if (index === commands.length - 1) {
        if (errors.length === 0) {
          console.log("Video conversion completed successfully");
        } else {
          console.error(
            "An error occurred during video conversion for the following resolutions:",
            errors
          );
        }
      }
    });
    ffmpeg.on("end", () => { });
    console.log("endddd");
  }
}

  let streamProducers = {};

async function createLiveStream(req, res, next) {

  

  console.log(req.tokenData, "check tokenData");

  await initializeMediaSoup();
  
  if (!workerReady || !router) {
    return res.status(503).json({
      error: "MediaSoup not ready, please try again later",
    });
  }

  let { time } = req.query;
  console.log(time, "Query sdf");
  let id = `${req.tokenData.userId}${time}`;

  console.log(id);
  console.log(obj.io.io, "check io");
  io = obj.io.io;
  console.log(req.tokenData.userId, "check tokenData");
  io.on("connection", function (socket) {
    console.log(
      "client connected. socket id=" +
      getId(socket) +
      "  , total clients=" +
      getClientCount()
    );

    socket.on(`disconnect${id}`, function async(data) {
        console.log("Client disconnecting from stream:", id);
  
  // Clean up stream-specific producers if this was the broadcaster
  if (producerSocketId === getId(socket)) {
    console.log("Broadcaster disconnecting, cleaning up producers for stream:", id);
    
    if (streamProducers[id]) {
      if (streamProducers[id].videoProducer) {
        streamProducers[id].videoProducer.close();
        streamProducers[id].videoProducer = null;
      }
      if (streamProducers[id].audioProducer) {
        streamProducers[id].audioProducer.close();
        streamProducers[id].audioProducer = null;
      }
      delete streamProducers[id];
    }
  }
      console.log(data, "check data decrement");
      if (data.decrement) {
        let index = connectedUsers.findIndex((el) => el.streamId == id);
        connectedUsers[index].users.splice(0, 1);
        socket.emit(`consumerLeft${id}`, connectedUsers[index].users.length);
        socket.broadcast.emit(
          `consumerLeft${id}`,
          connectedUsers[index].users.length
        );
      } else {
      }
      // close user connection
      console.log("diconnected user");
      console.log(
        "client disconnected. socket id=" +
        getId(socket) +
        "  , total clients=" +
        getClientCount()
      );
      cleanUpPeer(socket);
      producerTransport = null;

      // socket.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
      // socket.broadcast.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
      let updatedCount = prisma.liveStreaming
        .update({
          where: {
            streamingId: id,
          },
          data: {
            noOfUsers: Object.keys(videoConsumers).length,
          },
        })
        .then((data) => console.log(data, "updatedCount"));
    });

    socket.on(`error${id}`, function (err) {
      console.error("socket ERROR:", err);
    });
    socket.on(`connect_error${id}`, (err) => {
      console.error("client connection error", err);
    });

    socket.on(`getRouterRtpCapabilities${id}`, (data, callback) => {
      if (router && workerReady) {
        console.log("getRouterRtpCapabilities: ", router.rtpCapabilities);
        sendResponse(router.rtpCapabilities, callback);
      } else {
        console.error("Router not ready yet");
        sendReject({ text: "ERROR- router NOT READY" }, callback);
      }
    });

    socket.on(`createProducerTransport${id}`, async (data, callback) => {
      if (!router || !workerReady) {
        console.error("Router not ready for createProducerTransport");
        sendReject({ text: "ERROR- router NOT READY" }, callback);
        return;
      }

      console.log("-- createProducerTransport ---");
      producerSocketId = getId(socket);

      try {
        const { transport, params } = await createTransport();
        producerTransport = transport;

        producerTransport.observer.on("close", () => {
          if (videoProducer) {
            videoProducer.close();
            videoProducer = null;
          }
          if (audioProducer) {
            audioProducer.close();
            audioProducer = null;
          }
          producerTransport = null;
        });

        sendResponse(params, callback);
      } catch (error) {
        console.error("Error creating producer transport:", error);
        sendReject({ text: "Failed to create transport" }, callback);
      }
    });

    socket.on(`connectProducerTransport${id}`, async (data, callback) => {
      console.log(producerTransport, "producerTransport");
      try {
        await producerTransport.connect({
          dtlsParameters: data.dtlsParameters,
        });
        sendResponse({}, callback);
      } catch (error) {
        console.log(error, "error connecting to producer transport");
      }
    });

    // In Video-Processing/controller/liveStreamingController.js
// Add this function to check producer status
function getProducersDebug(streamId) {
  const producers = {
    video: streamProducers[streamId]?.videoProducer || videoProducer,
    audio: streamProducers[streamId]?.audioProducer || audioProducer,
    global_video: !!global.mediasoup?.webrtc?.videoProducer,
    global_audio: !!global.mediasoup?.webrtc?.audioProducer
  };
  
  console.log(`=== PRODUCERS DEBUG FOR STREAM ${streamId} ===`);
  console.log("Stream-specific producers:", {
    video: !!producers.video,
    audio: !!producers.audio
  });
  console.log("Global producers:", {
    video: producers.global_video,
    audio: producers.global_audio
  });
  console.log("Stream producers object keys:", Object.keys(streamProducers));
  
  return producers;
}

// Add this to your getRouterRtpCapabilities handler
socket.on(`getRouterRtpCapabilities${id}`, (data, callback) => {
  console.log("=== GET ROUTER CAPABILITIES ===");
  console.log("Stream ID:", id);
  
  // Debug producers before responding
  getProducersDebug(id);
  
  if (router && workerReady) {
    console.log("✅ Sending router capabilities");
    sendResponse(router.rtpCapabilities, callback);
  } else {
    console.error("❌ Router not ready");
    sendReject({ text: "ERROR- router NOT READY" }, callback);
  }
});

    // In liveStreamingController.js
function checkProducersReady() {
  const hasVideo = !!global.mediasoup.webrtc.videoProducer;
  const hasAudio = !!global.mediasoup.webrtc.audioProducer;
  
  console.log("Checking producers ready:", { hasVideo, hasAudio });
  
  return hasVideo || hasAudio; // At least one producer should exist
}

socket.on(`START_RECORDING${id}`, async (data) => {
  console.log("=== START_RECORDING event received ===");
  console.log("Stream ID:", id);
  
  // **NEW: Check producers before proceeding**
  if (!checkProducersReady()) {
    console.error("No producers available for recording");
    socket.emit(`recordingError${id}`, { 
      error: "No media producers available. Please ensure streaming is active." 
    });
    return;
  }

  console.log("Producers are ready, starting recording...");
  
  try {
    await handleStartRecording(id, req.tokenData.userId, socket);
    console.log("Recording started successfully");
    socket.emit(`recordingStarted${id}`, { message: "Recording started" });
  } catch (error) {
    console.error("Error starting recording:", error);
    socket.emit(`recordingError${id}`, { error: error.message });
  }
});


socket.on(`produce${id}`, async (data, callback) => {
  const { kind, rtpParameters } = data;
  console.log("-- produce --- kind=", kind, "for stream:", id);
  
  try {
    if (kind === "video") {
      videoProducer = await producerTransport.produce({
        kind,
        rtpParameters,
      });
      
      // Store globally AND per stream
      global.mediasoup.webrtc.videoProducer = videoProducer;
      
      // **NEW: Store per stream ID**
      if (!streamProducers[id]) {
        streamProducers[id] = {};
      }
      streamProducers[id].videoProducer = videoProducer;
      
      videoProducer.observer.on("close", () => {
        console.log("videoProducer closed ---");
        global.mediasoup.webrtc.videoProducer = null;
        if (streamProducers[id]) {
          streamProducers[id].videoProducer = null;
        }
      });
      
      console.log("Video producer created and stored for stream:", id);
      sendResponse({ id: videoProducer.id }, callback);
      
    } else if (kind === "audio") {
      audioProducer = await producerTransport.produce({
        kind,
        rtpParameters,
      });
      
      // Store globally AND per stream
      global.mediasoup.webrtc.audioProducer = audioProducer;
      
      // **NEW: Store per stream ID**
      if (!streamProducers[id]) {
        streamProducers[id] = {};
      }
      streamProducers[id].audioProducer = audioProducer;
      
      audioProducer.observer.on("close", () => {
        console.log("audioProducer closed ---");
        global.mediasoup.webrtc.audioProducer = null;
        if (streamProducers[id]) {
          streamProducers[id].audioProducer = null;
        }
      });
      
      console.log("Audio producer created and stored for stream:", id);
      sendResponse({ id: audioProducer.id }, callback);
    }

    console.log("Current producers for stream", id, ":", {
      video: !!streamProducers[id]?.videoProducer,
      audio: !!streamProducers[id]?.audioProducer
    });
    
    console.log("--broadcast newProducer -- kind=", kind);
    socket.broadcast.emit(`newProducer${id}`, { kind: kind });
    
  } catch (error) {
    console.error("Error in produce:", error);
    sendReject(error, callback);
  }
});

function hasActiveProducers(streamId) {
  const streamProds = streamProducers[streamId];
  const hasStreamVideo = !!(streamProds?.videoProducer);
  const hasStreamAudio = !!(streamProds?.audioProducer);
  const hasGlobalVideo = !!videoProducer;
  const hasGlobalAudio = !!audioProducer;
  
  return (hasStreamVideo || hasGlobalVideo) || (hasStreamAudio || hasGlobalAudio);
}

    // --- consumer ----
    socket.on(`createConsumerTransport${id}`, async (data, callback) => {
      console.log("=== Consumer Transport Debug ===");
      console.log("Stream ID:", id);
      console.log("Consumer data:", data);

        if (!hasActiveProducers(id)) {
    console.error("No active producers for stream:", id);
    sendResponse({ error: "STREAM_NOT_ACTIVE" }, callback);
    return;
  }

        // **FIX: Check stream-specific producers**
  const streamVideoProducer = streamProducers[id]?.videoProducer || videoProducer;
  const streamAudioProducer = streamProducers[id]?.audioProducer || audioProducer;
  
  console.log("Video Producer exists:", !!streamVideoProducer);
  console.log("Audio Producer exists:", !!streamAudioProducer);

  if (!streamVideoProducer && !streamAudioProducer) {
    console.error("No producers available for consumption for stream:", id);
    sendReject({ text: "No producers available for this stream" }, callback);
    return;
  }
      console.log("Video Producer exists:", !!videoProducer);
      console.log("Audio Producer exists:", !!audioProducer);

      if (!videoProducer && !audioProducer) {
        console.error("No producers available for consumption");
        sendReject({ text: "No producers available" }, callback);
        return;
      }

      if (!router || !workerReady) {
        console.error("Router not ready for createConsumerTransport");
        sendReject({ text: "ERROR- router NOT READY" }, callback);
        return;
      }
      const { userId, latitude, longitude, platform } = data;
      console.log("-- createConsumerTransport ---");
      let userBandwidth = await prisma.userBandwidth.findMany({
        where: {
          userId: Number(userId),
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log(userBandwidth[0]);
      let consumer = getVideoConsumer(getId(socket));
      console.log(consumer, "check consumer");
      if (
        userBandwidth[0]?.left >= 50 &&
        new Date(Number(userBandwidth[0]?.to)) > new Date()
      ) {
        const { transport, params } = await createTransport();
        var liveAnalytic = await prisma.liveAnalytics.create({
          data: {
            streamingId: id,
            userId: Number(userId),
            latitude: Number(latitude),
            longitude: Number(longitude),
            platform,
          },
        });

        setInterval(async () => {
          try {
            if (consumer) {
              console.log("userId==>", userId);
              console.log("socketId==>", socket.id);
              const stats = await consumer.getStats();
              stats.forEach((report) => {
                console.log(report);
                if (report.type === "outbound-rtp" && report.kind === "video") {
                  const bytesSent = report.byteCount / 1048576;
                  if (Number(bytesSent.toFixed) % 50) {
                    socket.emit("bandwidthUsed", { bandwidthUsed: bytesSent });
                  }
                  saveBandwidthData({
                    analyticId: liveAnalytic.id,
                    downloaded: bytesSent.toFixed(2),
                    streamingId: id,
                    userId: userId,
                    socketId: socket.id,
                  });
                  // Use the data to calculate bandwidth or make decisions
                  // For example, you can log the bandwidth to the console
                  console.log(`Video consumer Bandwidth: ${bytesSent}mb`);
                }
              });
            }
          } catch (error) {
            console.error("Error fetching stats:", error);
          }
        }, 2000);
        addConsumerTrasport(getId(socket), transport);
        transport.observer.on("close", async () => {
          const id = getId(socket);
          console.log("--- consumerTransport closed. --");
          await logLastSavedData(socket.id);
          deleteDataOnDisconnect(socket.id);
          // socket.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
          // socket.broadcast.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
          let consumer = getVideoConsumer(getId(socket));
          if (consumer) {
            consumer.close();
            removeVideoConsumer(id);
          }
          consumer = getAudioConsumer(getId(socket));
          if (consumer) {
            // socket.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
            // socket.broadcast.emit(`consumerLeft${id}`, Object.keys(videoConsumers).length)
            consumer.close();
            removeAudioConsumer(id);
          }
          console.log("createConsumerTransport in createConsumerTransport");

          removeConsumerTransport(id);
        });
        //console.log('-- createTransport params:', params);
        sendResponse(params, callback);
      } else {
        sendResponse({}, callback);
        socket.emit("endBandwidth", {
          message: "Update your bandwidth subscription",
        });
      }
    });

    socket.on(`connectConsumerTransport${id}`, async (data, callback) => {
        console.log("=== Consumer Transport Debug ===");
  console.log("Stream ID:", id);
  console.log("Consumer data:", data);
  
  // **NEW: Check producers for this specific stream**
  const producers = getProducersForStream(id);
  console.log("Video Producer exists:", !!producers.video);
  console.log("Audio Producer exists:", !!producers.audio);

  if (!producers.video && !producers.audio) {
    console.error("No producers available for consumption for stream:", id);
    sendReject({ text: "No producers available" }, callback);
    return;
  }
      console.log("-- connectConsumerTransport ---");
      let transport = getConsumerTrasnport(getId(socket));
      if (!transport) {
        console.error("transport NOT EXIST for id=" + getId(socket));
        sendResponse({}, callback);
        return;
      }
      console.log("connnected consumer transport");
      await transport.connect({ dtlsParameters: data.dtlsParameters });
      // socket.emit(`consumerAdded${id}`, Object.keys(videoConsumers).length)
      // socket.broadcast.emit(`consumerAdded${id}`, Object.keys(videoConsumers).length)
      if (data.increment) {
        let streamObjExists = connectedUsers.findIndex(
          (el) => el.streamId == id
        );
        if (streamObjExists != -1) {
          connectedUsers[streamObjExists].users.push(socket.id);
          socket.emit(
            `consumerAdded${id}`,
            connectedUsers[streamObjExists].users.length
          );
          socket.broadcast.emit(
            `consumerAdded${id}`,
            connectedUsers[streamObjExists].users.length
          );
        } else {
          let obj = {
            streamId: id,
            users: [socket.id],
          };
          connectedUsers.push(obj);
          socket.emit(`consumerAdded${id}`, 1);
          socket.broadcast.emit(`consumerAdded${id}`, 1);
        }

        console.log(connectedUsers, "connectedUsers");
      } else {
      }
      let updatedCount = await prisma.liveStreaming.update({
        where: {
          streamingId: id,
        },
        data: {
          noOfUsers: {
            increment: 1,
          },
        },
      });
      console.log(updatedCount, "updatedCount");
      sendResponse({}, callback);
    });

socket.on(`consume${id}`, async (data, callback) => {
  if (!router || !workerReady) {
    console.error("Router not ready for consume");
    sendReject({ text: "ERROR- router NOT READY" }, callback);
    return;
  }
  
  const kind = data.kind;
  console.log("-- consume --kind=" + kind + " for stream:", id);

  // **NEW: Get producers for this specific stream**
  const streamVideoProducer = streamProducers[id]?.videoProducer || videoProducer;
  const streamAudioProducer = streamProducers[id]?.audioProducer || audioProducer;

  console.log("Available producers for stream", id, ":", {
    video: !!streamVideoProducer,
    audio: !!streamAudioProducer
  });

  if (kind === "video") {
    if (streamVideoProducer) {
      let transport = getConsumerTrasnport(getId(socket));
      if (!transport) {
        console.error("transport NOT EXIST for id=" + getId(socket));
        return;
      }
      
      try {
        const { consumer, params } = await createConsumer(
          transport,
          streamVideoProducer, // Use stream-specific producer
          data.rtpCapabilities
        );
        
        const socketId = getId(socket);
        addVideoConsumer(socketId, consumer);
        
        consumer.observer.on("close", () => {
          console.log("consumer closed ---");
        });
        
        consumer.on("producerclose", () => {
          console.log("consumer -- on.producerclose");
          consumer.close();
          removeVideoConsumer(socketId);

          socket.emit(`producerClosed${id}`, {
            localId: socketId,
            remoteId: producerSocketId,
            kind: "video",
          });
        });

        console.log("-- video consumer ready ---");
        sendResponse(params, callback);
      } catch (error) {
        console.error("Error creating video consumer:", error);
        sendReject({ text: "Failed to create video consumer" }, callback);
      }
    } else {
      console.log("-- consume, but video producer NOT READY for stream:", id);
      const params = {
        producerId: null,
        id: null,
        kind: "video",
        rtpParameters: {},
      };
      sendResponse(params, callback);
    }
  } else if (kind === "audio") {
    if (streamAudioProducer) {
      let transport = getConsumerTrasnport(getId(socket));
      if (!transport) {
        console.error("transport NOT EXIST for id=" + getId(socket));
        return;
      }
      
      try {
        const { consumer, params } = await createConsumer(
          transport,
          streamAudioProducer, // Use stream-specific producer
          data.rtpCapabilities
        );
        
        const socketId = getId(socket);
        addAudioConsumer(socketId, consumer);
        
        consumer.observer.on("close", () => {
          console.log("consumer closed ---");
        });
        
        consumer.on("producerclose", () => {
          console.log("consumer -- on.producerclose");
          consumer.close();
          removeAudioConsumer(socketId);

          socket.emit(`producerClosed${id}`, {
            localId: socketId,
            remoteId: producerSocketId,
            kind: "audio",
          });
        });

        console.log("-- audio consumer ready ---");
        sendResponse(params, callback);
      } catch (error) {
        console.error("Error creating audio consumer:", error);
        sendReject({ text: "Failed to create audio consumer" }, callback);
      }
    } else {
      console.log("-- consume, but audio producer NOT READY for stream:", id);
      const params = {
        producerId: null,
        id: null,
        kind: "audio",
        rtpParameters: {},
      };
      sendResponse(params, callback);
    }
  } else {
    console.error("ERROR: UNKNOWN kind=" + kind);
  }
});

    socket.on(`resume${id}`, async (data, callback) => {
      const kind = data.kind;
      console.log("-- resume -- kind=" + kind);
      if (kind === "video") {
        let consumer = getVideoConsumer(getId(socket));
        if (!consumer) {
          console.error("consumer NOT EXIST for id=" + getId(socket));
          sendResponse({}, callback);
          return;
        }
        await consumer.resume();
        sendResponse({}, callback);
      } else {
        console.warn("NO resume for audio");
      }
    });
    console.log(id, "Stream ID");
    // In your liveStreamingController.js, update the START_RECORDING handler
    socket.on(`START_RECORDING${id}`, async (data) => {
      console.log("=== START_RECORDING event received ===");
      console.log("Stream ID:", id);
      console.log("Video Producer exists:", !!global.mediasoup.webrtc.videoProducer);
      console.log("Audio Producer exists:", !!global.mediasoup.webrtc.audioProducer);

      if (!global.mediasoup.webrtc.videoProducer && !global.mediasoup.webrtc.audioProducer) {
        console.error("No producers available for recording");
        socket.emit(`recordingError${id}`, { error: "No media producers available" });
        return;
      }

      try {
        await handleStartRecording(id, req.tokenData.userId, socket);
        console.log("Recording started successfully");
        socket.emit(`recordingStarted${id}`, { message: "Recording started" });
      } catch (error) {
        console.error("Error starting recording:", error);
        socket.emit(`recordingError${id}`, { error: error.message });
      }
    });
    socket.on(`STOP_RECORDING${id}`, handleStopRecording);

    // ---- sendback welcome message with on connected ---
    const newId = getId(socket);
    sendback(socket, { type: "welcome", id: newId });

    // --- send response to client ---
    function sendResponse(response, callback) {
      //console.log('sendResponse() callback:', callback);
      callback(null, response);
    }

    // --- send error to client ---
    function sendReject(error, callback) {
      callback(error.toString(), null);
    }

    function sendback(socket, message) {
      socket.emit(`message${id}`, message);
    }
  });
  res.json({
    data: { streamId: id },
    message: "api request response",
  });
}


    function getProducersForStream(streamId) {
  const producers = {
    video: streamProducers[streamId]?.videoProducer || videoProducer,
    audio: streamProducers[streamId]?.audioProducer || audioProducer
  };
  
  console.log(`Producers for stream ${streamId}:`, {
    video: !!producers.video,
    audio: !!producers.audio
  });
  
  return producers;
}
// In liveStreamingController.js - Add stream status check
async function getStreamStatus(req, res, next) {
  const { streamId } = req.params;
  
  try {
    const producers = getProducersForStream(streamId);
    const isActive = !!(producers.video || producers.audio);
    
    const streamInfo = await prisma.liveStreaming.findUnique({
      where: { streamingId: streamId }
    });
    
    res.json({
      active: isActive,
      hasVideo: !!producers.video,
      hasAudio: !!producers.audio,
      streamInfo: streamInfo
    });
  } catch (error) {
    console.error("Error checking stream status:", error);
    res.status(500).json({ error: "Failed to check stream status" });
  }
}

// Add route in routes/livestreaming.js


async function endLiveStream(req, res, next) {
  await handleStopRecording();
  let { time } = req.query;
  io.emit(`streamDisconnected${time}`)
  let { record } = req.query;
  let { usage } = req.query;
  await logAllLastSavedData(time);
  // let liveStreamRecord = await prisma.liveStream.findFirst({
  //   where:{
  //     streamingId:time
  //   }
  // })
  const pathToRemove = ["recording", "rtmp"];

  try {
    pathToRemove.forEach((subPath) => {
      const fileDest = `${__dirname}/${subPath}/${time}-vp8.sdp`;
      console.log("fileDest", fileDest);
      fs.unlink(fileDest, (err, data) => {
        if (err) {
          console.log("errror deleting file", err);
          return;
        }
        console.log("file deleted", data);
      });
    });
  } catch (error) {
    console.log(error);
  }
  let updatedRecord = await prisma.liveStreaming.update({
    where: {
      streamingId: time,
    },
    data: {
      endTime: new Date().toISOString(),
    },
  });
  console.log(updatedRecord, "updatedRecord`");

  console.log(time, "Query ");
  let id = `${req.tokenData.userId}${time}`;
  if (record == "true") {
    liveStreamQueue.add("liveStreamJob", {
      streamId: time,
      bucketId: req.tokenData.bucketId,
      usage: usage,
      // videoUrl: videoUrl
    });
  }
  let index = connectedUsers.findIndex((el) => el.streamId == time);
  if (index != -1) {
    connectedUsers.splice(index, 1);
  }
  res.json({
    data: { streamId: id },
    message: "Live stream has been ended",
  });
}

function getId(socket) {
  return socket.id;
}

function getClientCount() {
  // WARN: undocumented method to get clients number
  return io.eio.clientsCount;
}

function cleanUpPeer(socket) {
  const id = getId(socket);
  const consumer = getVideoConsumer(id);
  if (consumer) {
    consumer.close();
    removeVideoConsumer(id);
    console.log("clean up peer");
  }

  const transport = getConsumerTrasnport(id);
  if (transport) {
    transport.close();
    removeConsumerTransport(id);
  }

  if (producerSocketId === id) {
    console.log("---- cleanup producer ---");
    if (videoProducer) {
      videoProducer.close();
      videoProducer = null;
    }
    if (audioProducer) {
      audioProducer.close();
      audioProducer = null;
    }

    if (producerTransport) {
      producerTransport.close();
      producerTransport = null;
    }

    producerSocketId = null;

    // --- clenaup all consumers ---
    //console.log('---- cleanup clenaup all consumers ---');
    //removeAllConsumers();
  }
}

// ========= mediasoup ===========
const { createSdpText } = require("./recording/sdp");
const { generateStreamKey } = require("./utils/streaming");
const {
  saveBandwidthData,
  deleteDataOnDisconnect,
  logLastSavedData,
  logAllLastSavedData,
} = require("../utils/bandwidth");



let worker = null;
let router = null;
let producerTransport = null;
let videoProducer = null;
let audioProducer = null;
let producerSocketId = null;
let audioTransport = null;
//let consumerTransport = null;
//let subscribeConsumer = null;

async function startWorker() {
  try {
    const mediaCodecs = mediasoupOptions.router.mediaCodecs;

    console.log("Creating MediaSoup worker...");
    worker = await mediasoup.createWorker({
      logLevel: mediasoupOptions.worker.logLevel,
      logTags: mediasoupOptions.worker.logTags,
      rtcMinPort: mediasoupOptions.worker.rtcMinPort,
      rtcMaxPort: mediasoupOptions.worker.rtcMaxPort,
    });

    worker.on('died', (error) => {
      console.error('MediaSoup worker died:', error);
      process.exit(1);
    });

    console.log("Creating MediaSoup router...");
    router = await worker.createRouter({ mediaCodecs });

    console.log("-- mediasoup worker and router started successfully --");
  } catch (error) {
    console.error("Error starting MediaSoup worker:", error);
    throw error;
  }
}

// startWorker();

let workerReady = false;
let initializationPromise = null;

async function initializeMediaSoup() {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log("Initializing MediaSoup...");
      
      if (!worker) {
        await startWorker();
      }
      
      workerReady = true;
      console.log("MediaSoup worker and router initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize MediaSoup:", error);
      workerReady = false;
      initializationPromise = null; // Reset on failure
      throw error;
    }
  })();

  return initializationPromise;
}



// Handle the stream data received by the Consumer
//
// Room {
//   id,
//   transports[],
//   consumers[],
//   producers[],
// }
//

// --- multi-consumers --
let transports = {};
let videoConsumers = {};
let audioConsumers = {};

function getConsumerTrasnport(id) {
  return transports[id];
}

function addConsumerTrasport(id, transport) {
  transports[id] = transport;
  console.log("consumerTransports count=" + Object.keys(transports).length);
}

function removeConsumerTransport(id) {
  delete transports[id];
  console.log("removeConsumerTransport");
  console.log("consumerTransports count=" + Object.keys(transports).length);
}

function getVideoConsumer(id) {
  return videoConsumers[id];
}

function addVideoConsumer(id, consumer) {
  videoConsumers[id] = consumer;
  // socket.broadcast.on(`consumerJoined${id}`,Object.keys(videoConsumers).length)
  console.log("videoConsumers add count=" + Object.keys(videoConsumers).length);
}

function removeVideoConsumer(id) {
  delete videoConsumers[id];
  console.log(
    "videoConsumers remove count=" + Object.keys(videoConsumers).length
  );
}

function getAudioConsumer(id) {
  return audioConsumers[id];
}

function addAudioConsumer(id, consumer) {
  audioConsumers[id] = consumer;
  console.log("audioConsumers count=" + Object.keys(audioConsumers).length);
}

function removeAudioConsumer(id) {
  delete audioConsumers[id];
  console.log("audioConsumers count=" + Object.keys(audioConsumers).length);
}

function removeAllConsumers() {
  for (const key in videoConsumers) {
    const consumer = videoConsumers[key];
    console.log("key=" + key + ",  consumer:", consumer);
    consumer.close();
    delete videoConsumers[key];
  }
  console.log(
    "removeAllConsumers videoConsumers count=" +
    Object.keys(videoConsumers).length
  );

  for (const key in audioConsumers) {
    const consumer = audioConsumers[key];
    console.log("key=" + key + ",  consumer:", consumer);
    consumer.close();
    delete audioConsumers[key];
  }
}
async function createTransport() {
  if (!router) {
    throw new Error("Router not initialized");
  }

  try {
    const transport = await router.createWebRtcTransport(
      mediasoupOptions.webRtcTransport
    );
    console.log("-- create transport id=" + transport.id);

    return {
      transport: transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  } catch (error) {
    console.error("Error creating WebRTC transport:", error);
    throw error;
  }
}
async function createConsumer(transport, producer, rtpCapabilities) {
  let consumer = null;
  if (
    !router.canConsume({
      producerId: producer.id,
      rtpCapabilities,
    })
  ) {
    console.error("can not consume");
    return;
  }

  //consumer = await producerTransport.consume({ // NG: try use same trasport as producer (for loopback)
  consumer = await transport
    .consume({
      // OK
      producerId: producer.id,
      rtpCapabilities,
      paused: producer.kind === "video",
    })
    .catch((err) => {
      console.error("consume failed", err);
      return;
    });

  //if (consumer.type === 'simulcast') {
  //  await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
  //}

  return {
    consumer: consumer,
    params: {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    },
  };
}

async function startRecordingFfmpeg(videoID, userId, socket, videoPorts) {
  console.log(socket, "socket in startRecording");
  let storageAvailable;
  let storageLeft;
  let activePlan = await prisma.subscriptions.findFirst({
    where: {
      userId: userId,
      status: SubscriptionStatus.active,
    },
    include: {
      subscriptionPlan: true,
    },
  });
  let usageTableBeingUsed;
  if (!activePlan) {
    let usageTable = await prisma.usageTable.findMany({
      where: {
        userId: userId,
        to: {
          gt: Date.now(),
        },
        // subscriptionId: null
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (usageTable.length > 0) {
      storageAvailable = usageTable[0].left;
      usageTableBeingUsed = usageTable[0];
    }
  } else {
    let usageTable = await prisma.usageTable.findFirst({
      where: {
        userId: userId,
        subscriptionId: activePlan.id,
      },
    });
    if (usageTable) {
      storageAvailable = usageTable.left;
      usageTableBeingUsed = usageTable;
    }
  }
  // Return a Promise that can be awaited
  let recResolve;
  const promise = new Promise((res, _rej) => {
    recResolve = res;
  });

  const useAudio = true;
  const useVideo = true;
  const useH264 = false;

  // const cmdProgram = "ffmpeg"; // Found through $PATH
  const cmdProgram = FFmpegStatic; // From package "ffmpeg-static"

  let cmdInputPath = `${__dirname}/recording/input-vp8.sdp`;
  let cmdOutputPath = `${__dirname}/recording/${videoID}.webm`;
  let cmdCodec = "";
  let cmdFormat = "-f webm -flags +global_header";

  // Ensure correct FFmpeg version is installed
  const ffmpegOut = Process.execSync(cmdProgram + " -version", {
    encoding: "utf8",
  });
  const ffmpegVerMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/.exec(ffmpegOut);
  let ffmpegOk = false;
  if (ffmpegOut.startsWith("ffmpeg version git")) {
    // Accept any Git build (it's up to the developer to ensure that a recent
    // enough version of the FFmpeg source code has been built)
    ffmpegOk = true;
  } else if (ffmpegVerMatch) {
    const ffmpegVerMajor = parseInt(ffmpegVerMatch[1], 10);
    if (ffmpegVerMajor >= 4) {
      ffmpegOk = true;
    }
  }

  if (!ffmpegOk) {
    console.error("FFmpeg >= 4.0.0 not found in $PATH; please install it");
    process.exit(1);
  }

  if (useAudio) {
    cmdCodec += " -map 0:a:0 -c:a copy";
  }
  if (useVideo) {
    cmdCodec += " -map 0:v:0 -c:v copy";

    if (useH264) {
      cmdInputPath = `${__dirname}/recording/input-h264.sdp`;
      cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.mp4`;

      // "-strict experimental" is required to allow storing
      // OPUS audio into MP4 container
      cmdFormat = "-f mp4 -strict experimental";
    }
  }
  let sdpstring = createSdpText(videoPorts);
  fs.writeFile(
    `${__dirname}/recording/${videoID}-vp8.sdp`,
    sdpstring,
    (err, data) => { }
  );
  let fileToConvertPath = `${__dirname}/recording/${videoID}-vp8.sdp`;
  // Run process
  cmdCodec = "-c:v libvpx -b:v 2M -crf 10 -c:a libvorbis";
  const cmdArgStr = [
    "-nostdin",
    "-protocol_whitelist file,rtp,udp",
    // "-loglevel debug",
    // "-analyzeduration 5M",
    // "-probesize 5M",
    "-fflags +genpts",
    `-i ${fileToConvertPath}`,
    cmdCodec,
    cmdFormat,
    `-y ${cmdOutputPath}`,
  ]
    .join(" ")
    .trim();

  console.log(`Run command: ${cmdProgram} ${cmdArgStr}`);

  let recProcess = Process.spawn(cmdProgram, cmdArgStr.split(/\s+/));
  global.recProcess = recProcess;

  recProcess.on("error", (err) => {
    console.error("Recording process error:", err);
  });

  recProcess.on("exit", (code, signal) => {
    console.log("Recording process exit, code: %d, signal: %s", code, signal);

    global.recProcess = null;
    stopMediasoupRtp();

    if (!signal || signal === "SIGINT") {
      console.log("Recording stopped");
    } else {
      console.warn(
        "Recording process didn't exit cleanly, output file might be corrupt"
      );
    }
  });

  // FFmpeg writes its logs to stderr

  recProcess.stderr.on("data", (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/g)
      .filter(Boolean) // Filter out empty strings
      .forEach((line) => {
        console.log(line);
        if (line.startsWith("ffmpeg version")) {
          setTimeout(() => {
            recResolve();
          }, 1000);
        }
      });
    if (fs.existsSync(cmdOutputPath)) {
      const stat = fs.statSync(cmdOutputPath);
      currentFileSize = stat.size / 1048576;
      console.log(currentFileSize, "check vurrent file size");
      storageLeft = storageAvailable - currentFileSize;
      socket.emit(`updateStorage${videoID}`, {
        left: storageLeft,
        usageTableBeingUsed: usageTableBeingUsed["id"],
      });
      // console.log(currentFileSize,"currentFileSize")
    }
  });

  return promise;
}
async function startRtmp(videoID, userId, socket, videoPorts) {
  // Return a Promise that can be awaited
  let recResolve;
  const promise = new Promise((res, _rej) => {
    recResolve = res;
  });

  const useAudio = true;
  const useVideo = true;
  const useH264 = false;

  // const cmdProgram = "ffmpeg"; // Found through $PATH
  const cmdProgram = FFmpegStatic; // From package "ffmpeg-static"
  // Generate unique SDP content for each video ID

  const rtmpServer = process.env.RTMPSERVER;
  // let cmdInputPath = `${__dirname}/recording/input-vp8.sdp`;
  // let cmdOutputPath = `${__dirname}/recording/${videoID}.webm`;
  let cmdInputPath = `${__dirname}/rtmp/${videoID}-vp8.sdp`;
  let rtmpUrl = `${rtmpServer}/${videoID}`;
  // cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.mp4`;
  let cmdOutputPath = rtmpUrl;
  let cmdCodec = "";
  let cmdFormat = "-f webm -flags +global_header";

  // Ensure correct FFmpeg version is installed
  const ffmpegOut = Process.execSync(cmdProgram + " -version", {
    encoding: "utf8",
  });
  const ffmpegVerMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/.exec(ffmpegOut);
  let ffmpegOk = false;
  if (ffmpegOut.startsWith("ffmpeg version git")) {
    // Accept any Git build (it's up to the developer to ensure that a recent
    // enough version of the FFmpeg source code has been built)
    ffmpegOk = true;
  } else if (ffmpegVerMatch) {
    const ffmpegVerMajor = parseInt(ffmpegVerMatch[1], 10);
    if (ffmpegVerMajor >= 4) {
      ffmpegOk = true;
    }
  }

  if (!ffmpegOk) {
    console.error("FFmpeg >= 4.0.0 not found in $PATH; please install it");
    process.exit(1);
  }

  if (useAudio) {
    cmdCodec += " -map 0:a:0 -c:a copy";
  }
  if (useVideo) {
    console.log("video");
    cmdCodec += " -map 0:v:0 -c:v copy";

    if (useH264) {
      cmdInputPath = `${__dirname}/rtmp/input-h264.sdp`;
      let rtmpUrl = `${rtmpServer}/${videoID}`;
      // cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.mp4`;
      cmdOutputPath = rtmpUrl;

      // "-strict experimental" is required to allow storing
      // OPUS audio into MP4 container
      cmdFormat = "-f mp4 -strict experimental";
    }
  }
  // cmdCodec =
  //   "-c:a aac -b:a 192k -c:v libx264 -preset veryfast -tune zerolatency -b:v 2M";
  cmdCodec =
    // "-c:a aac -b:a 128k -c:v libx264 -preset superfast -tune zerolatency -maxrate 1M -bufsize 2M";
    "-c:a aac -b:a 128k -c:v libx264 -preset superfast -tune zerolatency -maxrate 1M";
  cmdFormat = "-f flv";
  let sdpstring = createSdpText(videoPorts);
  fs.writeFile(
    `${__dirname}/rtmp/${videoID}-vp8.sdp`,
    sdpstring,
    (err, data) => { }
  );
  let fileToConvertPath = `${__dirname}/rtmp/${videoID}-vp8.sdp`;
  // Run process
  const cmdArgStr = [
    "-nostdin",
    "-protocol_whitelist file,rtp,udp",
    // "-loglevel debug",
    // "-analyzeduration 5M",
    // "-probesize 5M",
    "-fflags +genpts",
    `-i ${fileToConvertPath}`,
    "-map 0:v:0 -c:v copy",
    cmdCodec,
    `-f flv ${cmdOutputPath}`,
  ]
    .join(" ")
    .trim();

  console.log(`Run command: ${cmdProgram} ${cmdArgStr}`);

  let recProcess = Process.spawn(cmdProgram, cmdArgStr.split(/\s+/));
  global.recProcess = recProcess;

  recProcess.on("error", (err) => {
    console.error("Recording process error:", err);
  });

  recProcess.on("exit", (code, signal) => {
    console.log("Recording process exit, code: %d, signal: %s", code, signal);

    global.recProcess = null;
    stopMediasoupRtp();

    if (!signal || signal === "SIGINT") {
      console.log("Recording stopped");
    } else {
      console.warn(
        "Recording process didn't exit cleanly, output file might be corrupt"
      );
    }
  });

  // FFmpeg writes its logs to stderr

  recProcess.stderr.on("data", (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/g)
      .filter(Boolean) // Filter out empty strings
      .forEach((line) => {
        console.log(line);
        if (line.startsWith("ffmpeg version")) {
          setTimeout(() => {
            recResolve();
          }, 1000);
        }
      });
    if (fs.existsSync(cmdOutputPath)) {
      const stat = fs.statSync(cmdOutputPath);
      currentFileSize = stat.size / 1048576;
      console.log(currentFileSize, "check vurrent file size");
      // console.log(currentFileSize,"currentFileSize")
    }
  });

  return promise;
}
let currentFileSize = 0;
// Set up Mediasoup and obtain WebRTC streams (audio and video)
// Function to get the audio stream

// Handle FFmpeg process events and errors similarly to the previous example
function getRandomPortInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}
async function handleStartRecording(videoID, userId, socket) {
    console.log("=== Recording Debug ===");
  console.log("Video ID:", videoID);
  console.log("User ID:", userId);
  console.log("Video Producer:", !!global.mediasoup.webrtc.videoProducer);
  console.log("Audio Producer:", !!global.mediasoup.webrtc.audioProducer);
  
  // Check if output directories exist
  const recordingDir = path.join(__dirname, 'recording');
  const rtmpDir = path.join(__dirname, 'rtmp');
  
  if (!fs.existsSync(recordingDir)) {
    fs.mkdirSync(recordingDir, { recursive: true });
    console.log("Created recording directory");
  }
  
  if (!fs.existsSync(rtmpDir)) {
    fs.mkdirSync(rtmpDir, { recursive: true });
    console.log("Created rtmp directory");
  }
  console.log(videoID, "Video id");
  const router1 = router;

  const useAudio = true;
  const useVideo = true;
  let rtpVideoPort = null;
  let rtpVideoRemotePort = null;
  let rtcpVideoPort = null;
  let rtcpVideoRemotePort = null;
  let rtpAudioPort = null;
  let rtpAudioRemotePort = null;
  let rtcpAudioPort = null;
  let rtcpAudioRemotePort = null;
  // Start mediasoup's RTP consumer(s)

  if (useAudio) {
    const rtpTransport = await router1.createPlainTransport({
      // No RTP will be received from the remote side
      comedia: false,

      // FFmpeg and GStreamer don't support RTP/RTCP multiplexing ("a=rtcp-mux" in SDP)
      rtcpMux: false,

      ...mediasoupOptions.plainTransport,
    });
    global.mediasoup.rtp.audioTransport = rtpTransport;

    await rtpTransport.connect({
      ip: mediasoupOptions.recording.ip,
      port: getRandomPortInRange(5000, 7000),
      rtcpPort: getRandomPortInRange(5000, 7000),
    });
    // await rtpTransport.connect({
    //   ip: mediasoupOptions.recording.ip,
    //   port: mediasoupOptions.recording.audioPort,
    //   rtcpPort: mediasoupOptions.recording.audioPortRtcp,
    // });

    console.log(
      "mediasoup AUDIO RTP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.tuple.localIp,
      rtpTransport.tuple.localPort,
      rtpTransport.tuple.remoteIp,
      rtpTransport.tuple.remotePort,
      rtpTransport.tuple.protocol
    );
    rtpAudioPort = rtpTransport.tuple.localPort;
    rtpAudioRemotePort = rtpTransport.tuple.remotePort;

    console.log(
      "mediasoup AUDIO RTCP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.rtcpTuple.localIp,
      rtpTransport.rtcpTuple.localPort,
      rtpTransport.rtcpTuple.remoteIp,
      rtpTransport.rtcpTuple.remotePort,
      rtpTransport.rtcpTuple.protocol
    );
    rtcpAudioPort = rtpTransport.rtcpTuple.localPort;
    rtcpAudioRemotePort = rtpTransport.rtcpTuple.remotePort;

    const rtpConsumer = await rtpTransport.consume({
      producerId: global.mediasoup.webrtc.audioProducer.id,
      rtpCapabilities: router.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
      paused: true,
    });
    global.mediasoup.rtp.audioConsumer = rtpConsumer;

    console.log(
      "mediasoup AUDIO RTP SEND consumer created, kind: %s, type: %s, paused: %s, SSRC: %s CNAME: %s",
      rtpConsumer.kind,
      rtpConsumer.type,
      rtpConsumer.paused,
      rtpConsumer.rtpParameters.encodings[0].ssrc,
      rtpConsumer.rtpParameters.rtcp.cname
    );
  }

  if (useVideo) {
    const rtpTransport = await router1.createPlainTransport({
      // No RTP will be received from the remote side
      comedia: false,

      // FFmpeg and GStreamer don't support RTP/RTCP multiplexing ("a=rtcp-mux" in SDP)
      rtcpMux: false,

      ...mediasoupOptions.plainTransport,
    });
    global.mediasoup.rtp.videoTransport = rtpTransport;

    await rtpTransport.connect({
      ip: mediasoupOptions.recording.ip,
      port: getRandomPortInRange(5000, 6000),
      rtcpPort: getRandomPortInRange(5000, 6000),
    });
    // await rtpTransport.connect({
    //   ip: mediasoupOptions.recording.ip,
    //   port: mediasoupOptions.recording.videoPort,
    //   rtcpPort: mediasoupOptions.recording.videoPortRtcp,
    // });

    console.log(
      "mediasoup VIDEO RTP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.tuple.localIp,
      rtpTransport.tuple.localPort,
      rtpTransport.tuple.remoteIp,
      rtpTransport.tuple.remotePort,
      rtpTransport.tuple.protocol
    );
    rtpVideoPort = rtpTransport.tuple.localPort;
    rtpVideoRemotePort = rtpTransport.tuple.remotePort;

    console.log(
      "mediasoup VIDEO RTCP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.rtcpTuple.localIp,
      rtpTransport.rtcpTuple.localPort,
      rtpTransport.rtcpTuple.remoteIp,
      rtpTransport.rtcpTuple.remotePort,
      rtpTransport.rtcpTuple.protocol
    );
    rtcpVideoPort = rtpTransport.rtcpTuple.localPort;
    rtcpVideoRemotePort = rtpTransport.rtcpTuple.remotePort;
    const rtpConsumer = await rtpTransport.consume({
      producerId: global.mediasoup.webrtc.videoProducer.id,
      rtpCapabilities: router.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
      paused: true,
    });
    global.mediasoup.rtp.videoConsumer = rtpConsumer;

    console.log(
      "mediasoup VIDEO RTP SEND consumer created, kind: %s, type: %s, paused: %s, SSRC: %s CNAME: %s",
      rtpConsumer.kind,
      rtpConsumer.type,
      rtpConsumer.paused,
      rtpConsumer.rtpParameters.encodings[0].ssrc,
      rtpConsumer.rtpParameters.rtcp.cname
    );
  }

  // ----
  let videoPorts = {
    rtpAudioPort,
    rtpAudioRemotePort,
    rtcpAudioPort,
    rtcpAudioRemotePort,
    rtpVideoPort,
    rtpVideoRemotePort,
    rtcpVideoPort,
    rtcpVideoRemotePort,
  };
  await startRecordingFfmpeg(videoID, userId, socket, videoPorts);
  // switch (recorder) {
  //   case "ffmpeg":
  //     break;
  //   case "gstreamer":
  //     await startRecordingGstreamer();
  //     break;
  //   case "external":
  //     await startRecordingExternal();
  //     break;
  //   default:
  //     console.warn("Invalid recorder:", recorder);
  //     break;
  // }

  if (useAudio) {
    const consumer = global.mediasoup.rtp.audioConsumer;
    console.log(
      "Resume mediasoup RTP consumer, kind: %s, type: %s",
      consumer.kind,
      consumer.type
    );
    consumer.resume();
  }
  if (useVideo) {
    const consumer = global.mediasoup.rtp.videoConsumer;
    console.log(
      "Resume mediasoup RTP consumer, kind: %s, type: %s",
      consumer.kind,
      consumer.type
    );
    consumer.resume();
  }
}
async function handleStartRTMP(videoID, userId, socket) {
  console.log(videoID, "Video id");
  const router1 = router;

  const useAudio = true;
  const useVideo = true;

  let rtpVideoPort = null;
  let rtpVideoRemotePort = null;
  let rtcpVideoPort = null;
  let rtcpVideoRemotePort = null;
  let rtpAudioPort = null;
  let rtpAudioRemotePort = null;
  let rtcpAudioPort = null;
  let rtcpAudioRemotePort = null;
  // Start mediasoup's RTP consumer(s)

  if (useAudio) {
    const rtpTransport = await router1.createPlainTransport({
      // No RTP will be received from the remote side
      comedia: false,

      // FFmpeg and GStreamer don't support RTP/RTCP multiplexing ("a=rtcp-mux" in SDP)
      rtcpMux: false,

      ...mediasoupOptions.plainTransport,
    });
    global.mediasoup.rtp.audioTransport = rtpTransport;

    await rtpTransport.connect({
      ip: mediasoupOptions.recording.ip,
      port: getRandomPortInRange(5000, 7000),
      rtcpPort: getRandomPortInRange(5000, 7000),
    });
    // await rtpTransport.connect({
    //   ip: mediasoupOptions.recording.ip,
    //   port: mediasoupOptions.recording.audioPort,
    //   rtcpPort: mediasoupOptions.recording.audioPortRtcp,
    // });

    console.log(
      "mediasoup AUDIO RTP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.tuple.localIp,
      rtpTransport.tuple.localPort,
      rtpTransport.tuple.remoteIp,
      rtpTransport.tuple.remotePort,
      rtpTransport.tuple.protocol
    );
    rtpAudioPort = rtpTransport.tuple.localPort;
    rtpAudioRemotePort = rtpTransport.tuple.remotePort;

    console.log(
      "mediasoup AUDIO RTCP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.rtcpTuple.localIp,
      rtpTransport.rtcpTuple.localPort,
      rtpTransport.rtcpTuple.remoteIp,
      rtpTransport.rtcpTuple.remotePort,
      rtpTransport.rtcpTuple.protocol
    );
    rtcpAudioPort = rtpTransport.rtcpTuple.localPort;
    rtcpAudioRemotePort = rtpTransport.rtcpTuple.remotePort;

    const rtpConsumer = await rtpTransport.consume({
      producerId: global.mediasoup.webrtc.audioProducer.id,
      rtpCapabilities: router.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
      paused: true,
    });
    global.mediasoup.rtp.audioConsumer = rtpConsumer;

    console.log(
      "mediasoup AUDIO RTP SEND consumer created, kind: %s, type: %s, paused: %s, SSRC: %s CNAME: %s",
      rtpConsumer.kind,
      rtpConsumer.type,
      rtpConsumer.paused,
      rtpConsumer.rtpParameters.encodings[0].ssrc,
      rtpConsumer.rtpParameters.rtcp.cname
    );
  }

  if (useVideo) {
    const rtpTransport = await router1.createPlainTransport({
      // No RTP will be received from the remote side
      comedia: false,

      // FFmpeg and GStreamer don't support RTP/RTCP multiplexing ("a=rtcp-mux" in SDP)
      rtcpMux: false,

      ...mediasoupOptions.plainTransport,
    });
    global.mediasoup.rtp.videoTransport = rtpTransport;

    await rtpTransport.connect({
      ip: mediasoupOptions.recording.ip,
      port: getRandomPortInRange(5000, 6000),
      rtcpPort: getRandomPortInRange(5000, 6000),
    });
    // await rtpTransport.connect({
    //   ip: mediasoupOptions.recording.ip,
    //   port: mediasoupOptions.recording.videoPort,
    //   rtcpPort: mediasoupOptions.recording.videoPortRtcp,
    // });

    console.log(
      "mediasoup VIDEO RTP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.tuple.localIp,
      rtpTransport.tuple.localPort,
      rtpTransport.tuple.remoteIp,
      rtpTransport.tuple.remotePort,
      rtpTransport.tuple.protocol
    );
    rtpVideoPort = rtpTransport.tuple.localPort;
    rtpVideoRemotePort = rtpTransport.tuple.remotePort;

    console.log(
      "mediasoup VIDEO RTCP SEND transport connected: %s:%d <--> %s:%d (%s)",
      rtpTransport.rtcpTuple.localIp,
      rtpTransport.rtcpTuple.localPort,
      rtpTransport.rtcpTuple.remoteIp,
      rtpTransport.rtcpTuple.remotePort,
      rtpTransport.rtcpTuple.protocol
    );
    rtcpVideoPort = rtpTransport.rtcpTuple.localPort;
    rtcpVideoRemotePort = rtpTransport.rtcpTuple.remotePort;
    const rtpConsumer = await rtpTransport.consume({
      producerId: global.mediasoup.webrtc.videoProducer.id,
      rtpCapabilities: router.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
      paused: true,
    });
    global.mediasoup.rtp.videoConsumer = rtpConsumer;

    console.log(
      "mediasoup VIDEO RTP SEND consumer created, kind: %s, type: %s, paused: %s, SSRC: %s CNAME: %s",
      rtpConsumer.kind,
      rtpConsumer.type,
      rtpConsumer.paused,
      rtpConsumer.rtpParameters.encodings[0].ssrc,
      rtpConsumer.rtpParameters.rtcp.cname
    );
  }

  // ----
  let videoPorts = {
    rtpAudioPort,
    rtpAudioRemotePort,
    rtcpAudioPort,
    rtcpAudioRemotePort,
    rtpVideoPort,
    rtpVideoRemotePort,
    rtcpVideoPort,
    rtcpVideoRemotePort,
  };
  // await startRecordingFfmpeg(videoID, userId, socket);
  await startRtmp(videoID, userId, socket, videoPorts);
  // switch (recorder) {
  //   case "ffmpeg":
  //     break;
  //   case "gstreamer":
  //     await startRecordingGstreamer();
  //     break;
  //   case "external":
  //     await startRecordingExternal();
  //     break;
  //   default:
  //     console.warn("Invalid recorder:", recorder);
  //     break;
  // }

  if (useAudio) {
    const consumer = global.mediasoup.rtp.audioConsumer;
    console.log(
      "Resume mediasoup RTP consumer, kind: %s, type: %s",
      consumer.kind,
      consumer.type
    );
    consumer.resume();
  }
  if (useVideo) {
    const consumer = global.mediasoup.rtp.videoConsumer;
    console.log(
      "Resume mediasoup RTP consumer, kind: %s, type: %s",
      consumer.kind,
      consumer.type
    );
    consumer.resume();
  }
}

async function handleStopRecording() {
  if (global?.recProcess) {
    global?.recProcess?.kill("SIGINT");
  } else {
    stopMediasoupRtp();
  }
}

// ----

function stopMediasoupRtp() {
  console.log("Stop mediasoup RTP transport and consumer");

  const useAudio = true;
  const useVideo = true;

  if (useAudio) {
    global?.mediasoup?.rtp?.audioConsumer?.close();
    global?.mediasoup?.rtp?.audioTransport?.close();
  }

  if (useVideo) {
    global?.mediasoup?.rtp?.videoConsumer?.close();
    global?.mediasoup?.rtp?.videoTransport?.close();
  }
}

async function updateUsageTable(path, usageTableId) {
  const stats = fs.statSync(path);
  let sizeInMb = (stats.size / 1048576).toFixed(0);
  console.log(sizeInMb, "sizeInMb for mp4 file");
  let usageTableRecord = await prisma.usageTable.findFirst({
    where: {
      id: Number(usageTableId),
    },
  });
  if (!usageTableRecord) {
    return false;
  }
  let left = Number(usageTableRecord.left) - Number(sizeInMb);
  console.log(left, "left");
  console.log(usageTableRecord.total, "usageTableRecord.total");
  let used = Number(usageTableRecord.total) - Number(left);
  await prisma.usageTable.update({
    where: {
      id: usageTableRecord.id,
    },
    data: {
      left: left,
      used: used,
    },
  });
  return true;
}
const liveStreamWorker = new Worker(
  "liveStreamQueue",
  async (job) => {
    console.log("job", job.data);
    var videoId = job.data.streamId;
    var bucketId = job.data.bucketId;
    var usageTableId = job.data.usage;
    console.log(usageTableId, "usageTableId");
    console.log("video ID", videoId);
    let cmdOutputPath = `${__dirname}/recording/${videoId}.webm`;
    if (cmdOutputPath) {
      console.log(cmdOutputPath, "cmdOutputPath");

      // const chc = spawn('ffmpeg', [
      //   '-i', cmdOutputPath,
      //   '-c:v', 'copy',
      //   `/${videoId}.mp4`
      // ])

      //   chc.on('error', (err) => {
      //     console.error(`FFmpeg error for resolution `, err);
      //     // errors.push(resolutions[index].folder);
      //   });

      //   chc.on .on('close', (code) => {
      //     console.log("CLOSE ", code)
      //   })

      // fs.existsSync('/home/jami/jami/gini-tech/Video-Processing/controller/recording/771692190447258.webm', (err, stats) => {
      //   if (err) {
      //     console.error(err, "Error");
      //     return;
      //   }
      //   if (stats.isFile()) {
      //     console.log('File');

      //     ffmpeg()

      //     // Input file
      //     .input(cmdOutputPath)

      //     // Audio bit rate
      //     // .outputOptions('-ab', '192k')

      //     // Output file
      //     .saveToFile(`${__dirname}/recording/${videoId}.mp4`)

      //     // Log the percentage of work completed
      //     .on('progress', (progress) => {
      //       if (progress.percent) {
      //         console.log(`Processing: ${Math.floor(progress.percent)}% done`);
      //       }
      //     })

      //     // The callback that is run when FFmpeg is finished
      //     .on('end', () => {
      //       console.log('FFmpeg has finished.');
      //     })

      //     // The callback that is run when FFmpeg encountered an error
      //     .on('error', (error) => {
      //       console.error(error);

      //     });

      //   } else if (stats.isDirectory()) {
      //     console.log('Directory');
      //   } else {
      //     console.log('Something else');
      //   }
      // });
      setTimeout(() => {
        ffmpeg()
          // Input file
          .input(cmdOutputPath)

          // Audio bit rate
          // .outputOptions('-ab', '192k')
          // Output file
          .saveToFile(`${__dirname}/recording/${videoId}.mp4`)

          // Log the percentage of work completed
          .on("progress", (progress) => {
            if (progress.percent) {
              console.log(`Processing: ${Math.floor(progress.percent)}% done`);
            }
          })

          // The callback that is run when FFmpeg is finished
          .on("end", () => {
            console.log("FFmpeg has finished.");
            updateUsageTable(
              `${__dirname}/recording/${videoId}.mp4`,
              usageTableId
            ).then((res) => {
              console.log(res, "check updated record res");
              mp4ToM3u8().then((res) => {
                setTimeout(() => {
                  const webmFilePath = `${__dirname}/recording/${videoId}.webm`;
                  const mp4FilePath = `${__dirname}/recording/${videoId}.mp4`;
                  if (fs.existsSync(webmFilePath)) {
                    fs.unlinkSync(webmFilePath);
                    console.log(`Deleted file: ${webmFilePath}`);
                  }
                  if (fs.existsSync(mp4FilePath)) {
                    let maxRetryCount = 5;
                    let deleted = false;
                    let retryCount = 0;
                    while (!deleted && retryCount < maxRetryCount) {
                      try {
                        fs.unlinkSync(mp4FilePath);
                        deleted = true;
                        console.log(`Deleted file: ${mp4FilePath}`);
                      } catch (err) {
                        retryCount++;
                      }
                    }
                  }
                  console.log("Console should be called at the end");
                }, 2000);
              });
            });
          })

          // The callback that is run when FFmpeg encountered an error
          .on("error", (error) => {
            console.error(error);
          });
      }, 2000);

      async function mp4ToM3u8() {
        console.log("mp4ToM3u8");
        return new Promise((resolve, reject) => {
          //   console.log("Working")
          //   ffmpeg(`${__dirname}/recording/${videoId}.mp4`)
          //   .addOption('-profile:v', 'baseline') // Set the video profile to baseline for compatibility with older devices
          //   .addOption('-start_number', '0') // Set the starting segment number
          //   .addOption('-hls_time', '2') // Set the duration of each segment
          //   .addOption('-hls_list_size', '0') // Set the maximum number of segments in the playlist (0 = unlimited)
          //   .addOption('-f', 'hls') // Set the output format to HLS
          //   .addOption('-hls_segment_filename', `${__dirname}/streams/360p/segment_%d.ts`) // Set the filename format for 360p segments
          //   .addOption('-vf', 'scale=w=640:h=360') // Set the resolution of the 360p version
          //   .output(`${__dirname}/streams/360p/${videoId}.m3u8`)
          //   .on('start', function (commandline) {
          //     console.log('spawned ffmpeg with command: ' + commandline);
          // })
          //   .on("progress", (progress) => {
          //     if (progress.percent) {
          //       console.log(`Processing: ${Math.floor(progress.percent)}% done`);
          //     }
          //   })
          //   .on("end", async () => {
          //     console.log("FFmpeg has finished.");
          //     upload360p(videoId)
          //   })
          //   .on("error", (error) => {
          //     console.error(error);
          //   })
          //   .run()
          const inputFilePath = `${__dirname}/recording/${videoId}.mp4`;
          const resolutions = [
            {
              width: 640,
              height: 360,
              folder: "360p",
              uploadFunction: upload360p,
            },
            {
              width: 854,
              height: 480,
              folder: "480p",
              uploadFunction: upload480p,
            },
            {
              width: 1280,
              height: 720,
              folder: "720p",
              uploadFunction: upload720p,
            },
          ];

          let commands;
          // console.log(thumbnail,"thumbnail")
          if (process.env.NODE_ENV == "development") {
            commands = resolutions.map(({ width, height, folder }, i) => {
              console.log(i, "check i");
              console.log("in commands");
              return spawn("ffmpeg", [
                "-i",
                inputFilePath,
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-map",
                "0",
                "-profile:v",
                "baseline",
                "-vf",
                `scale=${width}:${height}`,
                "-f",
                "segment",
                "-segment_time",
                "10",
                "-segment_list",
                `${__dirname}/streams/${folder}/${videoId}.m3u8`,
                `${__dirname}/streams/${folder}/${videoId}_output%d.ts`,
              ]);
            });
          } else {
            commands = resolutions.map(({ width, height, folder }, i) => {
              console.log(i, "check i");
              console.log("in commands");
              // return spawn('ffmpeg', [
              //   '-i', inputFilePath,
              //   '-c:v', 'libx264',
              //   '-c:a', 'aac',
              //   '-map', '0',
              //   '-profile:v', 'baseline',
              //   '-vf', `scale=${width}:${height}`,
              //   '-f', 'segment',
              //   '-segment_time', '10',
              //   '-segment_list', `${__dirname}/streams/${folder}/${videoId}.m3u8`,
              //   `${__dirname}/streams/${folder}/${videoId}_output%d.ts`
              // ]);

              return spawn("ffmpeg", [
                "-i",
                inputFilePath,
                "-vf",
                `scale=${width}:${height}`,
                "-c:v",
                "h264_nvenc",
                "-preset",
                "fast",
                "-b:v",
                "2000k",
                "-g",
                "30",
                "-keyint_min",
                "30",
                "-profile:v",
                "main",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-f",
                "hls",
                "-hls_time",
                "10",
                "-hls_list_size",
                "0",
                "-hls_segment_filename",
                `${__dirname}/streams/${folder}/${videoId}_output%d.ts`,
                `${__dirname}/streams/${folder}/${videoId}.m3u8`,
              ]);
            });
          }

          const errors = [];

          async function deleteTsFiles(folderPath, videoId) {
            try {
              let maxRetryCount = 5;
              var videoPath;
              const files = fs.readdirSync(folderPath);
              // let deleted = false
              for (let file of files) {
                if (
                  file.startsWith(videoId) &&
                  file.includes("_output") &&
                  file.endsWith(".ts")
                ) {
                  let retryCount = 0;
                  videoPath = path.join(folderPath, file);
                  let deleted = false;
                  while (!deleted && retryCount < maxRetryCount) {
                    try {
                      fs.unlinkSync(videoPath);
                      console.log(`Deleted file: ${videoPath}`);
                      deleted = true;
                    } catch (err) {
                      retryCount++;
                    }
                  }
                }
              }
            } catch (err) {
              console.error(err);
            }
          }

          for (const [index, ffmpeg] of commands.entries()) {
            ffmpeg.on("error", (err) => {
              console.error(
                `FFmpeg error for resolution ${resolutions[index].folder}:`,
                err
              );
              errors.push(resolutions[index].folder);
            });

            ffmpeg.on("close", async (code) => {
              if (code === 0) {
                console.log(
                  `Video conversion for ${resolutions[index].folder} completed successfully`
                );
                await resolutions[index]
                  .uploadFunction(
                    videoId,
                    `${__dirname}/recording/${videoId}.mp4`,
                    bucketId
                  )
                  .then(async () => {
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

                    fs.readdir(
                      `${__dirname}/streams/${resolutions[index].folder}`,
                      async function (err, files) {
                        const tsFiles = files.filter(
                          (el) => path.extname(el) === ".ts"
                        );
                        console.log(tsFiles, "TS FILES");
                        // do something with your files, by the way they are just filenames...

                        for (const [iter, file_] of tsFiles.entries()) {
                          spaces.upload(
                            {
                              Bucket: BUCKET_NAME,
                              Key: `users/${bucketId}/videos/${videoId}/${resolutions[index].folder}/${videoId}_output${iter}.ts`,
                              Body: fs.createReadStream(
                                `${__dirname}/streams/${resolutions[index].folder}/${videoId}_output${iter}.ts`
                              ),
                              ACL: "public-read",
                            },
                            function (err, data) {
                              if (err) {
                                console.log("Error", err);
                                // reject(err);
                              }
                              if (data) {
                                var correctUrl = data.Location.replace(
                                  `${process.env.REGION}`,
                                  `${process.env.REGION}.cdn`
                                );
                                console.log("Uploaded in:", correctUrl);
                                console.log("Output ts video uploaded");
                                // resolve(data);
                              }
                            }
                          );
                        }
                      }
                    );
                  })
                  .then(() => {
                    console.log(index, "Index");
                    let m3u8Path = `${__dirname}/streams/${resolutions[index].folder}/${videoId}.m3u8`;
                    if (fs.existsSync(m3u8Path)) {
                      fs.unlinkSync(m3u8Path);
                      console.log(`Deleted file: ${m3u8Path}`);
                    }
                    if (index == 2) {
                      resolve("Done");
                    }
                  })

                  .then(() => {
                    console.log(
                      `Video uploaded for ${resolutions[index].folder}`
                    );
                    if (index == 2) {
                      setTimeout(() => {
                        let arr = ["360p", "480p", "720p"];
                        for (let res of arr) {
                          console.log(
                            `${__dirname}/streams/${res}`,
                            "check folder for outputts"
                          );
                          deleteTsFiles(`${__dirname}/streams/${res}`, videoId);
                        }
                      }, 10000);
                    }
                  })
                  .catch((err) => {
                    console.error(
                      `Error uploading video for ${resolutions[index].folder}:`,
                      err
                    );
                    errors.push(resolutions[index].folder);
                  });
              } else {
                console.error(
                  `FFmpeg process for resolution ${resolutions[index].folder} exited with code`,
                  code
                );
                errors.push(resolutions[index].folder);
              }
              // Check if all commands have finished
              if (index === commands.length - 1) {
                if (errors.length === 0) {
                  console.log("Video conversion completed successfully");
                  // res.send('Video converted successfully');
                } else {
                  console.error(
                    "An error occurred during video conversion for the following resolutions:",
                    errors
                  );
                  // res.status(500).send('An error occurred during video conversion');
                }
              }
            });

            // ffmpeg.on('disconnect', (code) => {
            //   console.log(code, "FFMPEG EXITED")
            //   if(index == 0){
            //     fs.unlinkSync(`${__dirname}/recording/${videoId}.webm`);
            //     fs.unlinkSync(`${__dirname}/recording/${videoId}.mp4`);

            //   }
            // })
          }
        });
      }

      // const upload360p = async (videoId) => {
      //   console.log(videoId, "check videoId")
      //   // let vidId = videoId.splice(0, -4)
      //   return await new Promise((resolve, reject) => {
      //     const params = {
      //       Bucket: 'hls-video-storage',
      //       Key: `streams/360p/${videoId}.m3u8`,
      //       Body: fs.createReadStream(`${__dirname}/streams/360p/${videoId}.m3u8`),
      //     };

      //     // spaces.putBucketCors({
      //     //   Bucket: 'hls-video-storage',
      //     //   CORSConfiguration: {
      //     //     CORSRules: [{AllowedHeaders: ['*'], AllowedMethods:
      //     //     ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'], AllowedOrigins:
      //     //     ['*'], MaxAgeSeconds: 3000}]}
      //     // }, function(err, data) {
      //     //   if(err){
      //     //     console.log("bucket cors error")
      //     //   }
      //     //   else{
      //     //     console.log("bucket cors success")
      //     //   }
      //     // })

      //     spaces.upload({
      //       Bucket: 'hls-video-storage',
      //       Key: `streams/360p/${videoId}.m3u8`,
      //       Body: fs.createReadStream(`${__dirname}/streams/360p/${videoId}.m3u8`),
      //       ACL: "public-read"
      //     }, function (err, data) {
      //       if (err) {
      //         console.log('Error', err);
      //         reject(err);
      //       }
      //       if (data) {
      //         var correctUrl = data.Location.replace("nyc3", "nyc3.cdn");
      //         console.log('Uploaded in:', correctUrl);
      //         // update videoUrl in Video table
      //         // prisma.video.update({
      //         //   where: {
      //         //     videoId: videoId,
      //         //   },
      //         //   data: {
      //         //     videoUrl: data.Location,
      //         //     // processing: false,
      //         //   },
      //         // });
      //         // // console which video is uploaded
      //         // urlObj.url360P = correctUrl
      //         console.log('360p video uploaded');
      //         resolve(data);
      //       }
      //     });
      //   });
      // };
    } else {
      console.log("Id is not valid");
    }
  },
  {
    connection: redisConfig,
  }
);

liveStreamWorker.on("completed", (job, result) => {
  console.log(`Live stream Job completed with result ${result}`);
});

async function checkUserSubscriptionStatus() {
  let users = await prisma.user.findMany({
    where: {
      emailVerified: true,
    },
  });
  console.log(users, "users");
  for (let user of users) {
    let subscriptionRecords = await prisma.subscriptions.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });
    console.log(subscriptionRecords, "subscriptionRecords");
    if (subscriptionRecords.length > 0) {
      let usageTableRecord = await prisma.usageTable.findFirst({
        where: {
          userId: user.id,
          subscription: {
            id: subscriptionRecords[0].id,
            recur: false,
            status: SubscriptionStatus.active,
          },
        },
      });
      if (usageTableRecord) {
        console.log("usageTableRecord found");
        let currentDate = Date.now();
        let endDate = usageTableRecord.to;
        if (currentDate > endDate) {
          await prisma.subscriptions.update({
            where: {
              id: usageTableRecord.subscriptionId,
            },
            data: {
              status: SubscriptionStatus.expired,
            },
          });
        }
      }
    }
  }
}

async function deleteObjects(bucketName, prefix) {
  const s3 = new AWS.S3({
    endpoint: `https://${process.env.USER_BUCKET_URL}`,
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  });
  const listParams = {
    Bucket: bucketName,
    Prefix: prefix,
  };
  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) {
    console.log("No objects found to delete.");
    return;
  }

  const objectKeys = listedObjects.Contents.map((obj) => ({ Key: obj.Key }));
  console.log(objectKeys, "objectKeys");
  const deleteParams = {
    Bucket: bucketName,
    Delete: { Objects: objectKeys },
  };

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) {
    await deleteObjects(bucketName, prefix);
  }
}
async function deleteUserTableRecords(userId) {
  let userVideoTable = await prisma.video.updateMany({
    where: {
      userId: userId,
    },
    data: {
      deleted: true,
    },
  });
  console.log("userVideoTable deleted");
  let getScheduleVideoDataIds = await prisma.scheduleVideoData.deleteMany({
    where: {
      schedule: {
        userId: userId,
      },
    },
  });
  console.log("getScheduleVideoDataIds deleted");

  let userSchedulesTable = await prisma.scheduleVideo.deleteMany({
    where: {
      userId: userId,
    },
  });
  console.log("userSchedulesTable deleted");

  return true;
}
async function deleteUserData() {
  let currentDate = new Date();
  const oneMonthAgo = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  );
  let usageRecords = await prisma.usageTable.findMany({
    where: {
      subscription: {
        status: "expired",
      },
      to: {
        lt: oneMonthAgo.getTime(),
      },
    },
    distinct: ["userId"],
    orderBy: {
      subscription: {
        createdAt: "desc",
      },
    },
  });
  console.log(usageRecords, "usageRecords");
  for (let userData of usageRecords) {
    let bucketId = userData.bucketId;
    deleteObjects(bucketId, `${bucketId}`).then(() => {
      let deleted = deleteUserTableRecords(userData.userId);
    });
  }
}

// cron.schedule("0 5 * * *", () => {
//   // cron.schedule('*/10 * * * * *', () => {
//   console.log("started");
//   checkUserSubscriptionStatus();
// });

// cron.schedule("0 7 * * *", () => {
//   // cron.schedule('*/20 * * * * *', () => {
//   deleteUserData();
//   console.log("started");
// });

async function createLiveStreamRecord(data) {
  let streamRecord = {
    userId: data.userId,
    Title: data.title,
    description: data.description,
    thumbnail: "",
    streamType: "RTMP_STREAM",
    isCompleted: false,
    streamingId: generateStreamKey(),
    startTime: new Date().toISOString(),
    streamKey: data.streamKey,
  };
  try {
    const existRecord = await prisma.liveStreaming.findFirst({
      where: {
        streamKey: data.streamKey,
      },
    });
    if (!existRecord) {
      const liveStreamRecord = await prisma.liveStreaming.create({
        data: streamRecord,
      });
      return liveStreamRecord?.streamingId;
    } else {
      return existRecord?.streamingId;
    }
  } catch (err) {
    console.log("err>>", err);
  }
}
module.exports = {
  createLiveStream,
  endLiveStream,
  liveStreamQueue,
  createLiveStreamRecord,
  liveStreamWorker,
  processVideo,
  getStreamStatus,
};

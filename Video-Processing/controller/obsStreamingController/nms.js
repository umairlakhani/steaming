const { PrismaClient } = require("@prisma/client");
const {
  createLiveStreamRecord,
  liveStreamWorker,
} = require("../liveStreamingController");
const {
  getStreamKeyFromDatabase,
  deleteStreamKeyFromDatabase,
  isValidStreamKey,
  blockStreamKey,
  getStreamKeyFromStreamPath,
  endStream,
  getStreamKeyUser,
} = require("../utils/streaming");
const { addToRecordingJob, startRecordingRTMP } = require("../utils/recording");
const { deleteFiles } = require("../../utils/fileHelpers");
const { Queue, Worker } = require("bullmq");
const redisConfig = require("../../utils/redisConfig");

const NodeMediaServer = require("node-media-server"),
  config = require("./config/default").rtmp_server,
  helpers = require("./helpers/helpers");

let nms = new NodeMediaServer(config);
const thumbnailQueue = new Queue("thumbnailQueue", {
  connection:redisConfig,
});
const thumbnailWorker = new Worker(
  "thumbnailQueue",
  async (job) => {
    const { stream_key } = job.data;
    if (stream_key) {
      console.log("thumbnail woker started", stream_key);
      helpers.generateStreamThumbnail(stream_key);
    }
  },
  {
    connection: redisConfig,
  }
);

const removePreviousCron = async (stream_key) => {
  const existingJobs = await thumbnailQueue.getRepeatableJobs();
  console.log("existingJobs", existingJobs);

  const jobToRemove = existingJobs.find((job) => job.id === stream_key);

  if (jobToRemove) {
    await thumbnailQueue.removeRepeatableByKey(jobToRemove.key);
    console.log(`Removed previous cron job for stream_key: ${stream_key}`);
  } else {
    console.log(`No previous cron job found for stream_key: ${stream_key}`);
  }
};

const addCronJob = async (stream_key, cronExpression) => {
  try {
    await removePreviousCron(stream_key);
    await thumbnailQueue.add(
      `generateThumbnail:${stream_key}`,
      { stream_key },
      { repeat: { cron: cronExpression }, jobId: stream_key }
    );
  } catch (error) {
    console.log("error adding cron", error);
  }
};

const prePublish = async (id, StreamPath, args) => {
  let stream_key = getStreamKeyFromStreamPath(StreamPath);
  const existsInRedis = await isValidStreamKey(stream_key);
  let session = nms.getSession(id);
  try {
    if (!existsInRedis) {
      const streamKey = await getStreamKeyFromDatabase(stream_key);
      if (!streamKey) {
        await blockStreamKey(stream_key, 60);
        session.reject();

        return;
      }
      const cronExpression = process.env.CRON_SCHEDULE_OBS; // Every 20 sec, adjust as needed
      await helpers.generateStreamThumbnail(stream_key);
      await addCronJob(stream_key, cronExpression);
      const liveStreamId = await createLiveStreamRecord(streamKey);
      const userId = await getStreamKeyUser(stream_key);
      if (streamKey.recorded) {
        await startRecordingRTMP(liveStreamId, userId, stream_key);
      }
    } else {
      session.reject();
    }
  } catch (error) {
    session.reject();
    console.log("Error streaming rtmp", error);
  }
};

const donePublish = async (id, StreamPath, args) => {
  try {
    let stream_key = getStreamKeyFromStreamPath(StreamPath);
    const streamKey = await getStreamKeyFromDatabase(stream_key);
    const existsInRedis = await isValidStreamKey(stream_key);
    const thumbnailPaths = [`thumbnail/${stream_key}.jpg`];
    if (!existsInRedis) {
      await endStream(stream_key);
      // liveStreamWorker.run();
      const liveStreamId = await createLiveStreamRecord(streamKey);
      console.log("streamKey", streamKey);
      if (streamKey.recorded) {
        await addToRecordingJob(liveStreamId, stream_key);
        liveStreamWorker.on("completed", (stream) => {
          console.log(stream, "stream");
        });
      }
      await deleteStreamKeyFromDatabase(streamKey?.streamKey);
      await deleteFiles(thumbnailPaths);
      await removePreviousCron(stream_key);
    } else {
    }
  } catch (error) {
    console.log("Error closing rtmp stream", error);
  }
};

module.exports = {
  prePublish,
  donePublish,
};

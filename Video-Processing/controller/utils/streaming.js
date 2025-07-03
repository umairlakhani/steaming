const { PrismaClient } = require("@prisma/client");
const { Queue, Worker } = require("bullmq");
const { Redis } = require("ioredis");
const helpers = require("../obsStreamingController/helpers/helpers");
const redisConfig = require("../../utils/redisConfig");
const prisma = new PrismaClient();
const thumbnailQueue = new Queue("thumbnailQueue", {
  connection: redisConfig
});
const thumbnailWorker = new Worker("thumbnailQueue", async (job) => {
  const { stream_key } = job.data;
  if (stream_key) {
    console.log("thumbnail woker started", stream_key);
    helpers.generateStreamThumbnail(stream_key);
  }
},
{
  connection: redisConfig
}
);

const redisClient = Redis.createClient(redisConfig);

const generateStreamKey = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let streamKey = "";
  for (let i = 0; i < 10; i++) {
    streamKey += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return streamKey;
};

const getStreamKeyFromDatabase = async (stream_key) => {
  try {
    const streamKey = await prisma.streamKey.findFirst({
      where: {
        streamKey: stream_key,
      },
    });

    return streamKey;
  } catch (error) {
    throw new Error("Error retrieving StreamKey");
  }
};

const deleteStreamKeyFromDatabase = async (stream_key) => {
  try {
    await prisma.streamKey.delete({
      where: {
        streamKey: stream_key,
      },
    });
  } catch (error) {
    throw new Error("Error retrieving StreamKey");
  }
};

const isValidStreamKey = async (streamKey) => {
  const result = await redisClient.hget("blocked_keys", streamKey);
  return !!result;
};

const blockStreamKey = async (streamKey, blockDuration) => {
  await redisClient.hset("blocked_keys", streamKey, "blocked");
  await redisClient.expire(`blocked_keys`, blockDuration);
};

const getStreamKeyFromStreamPath = (path) => {
  let parts = path.split("/");
  return parts[parts.length - 1];
};

const endStream = async (streamKey) => {
  await prisma.liveStreaming.updateMany({
    where: {
      streamKey: streamKey,
    },
    data: {
      endTime: new Date().toISOString(),
    },
  });
};

const getStreamKeyUser = async (streamKey) => {
  try {
    const stream = await prisma.streamKey.findFirst({
      where: {
        streamKey: streamKey,
      },
    });
    if (stream) {
      return stream.userId;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error retrieving user");
  }
};

const getLiveStreamingUser = async (streamingId) => {
  try {
    const stream = await prisma.liveStreaming.findFirst({
      where: {
        streamingId: streamingId,
      },
      include: {
        user: true,
      },
    });
    return stream?.user?.id;
  } catch (error) {
    console.log(error);
    throw new Error("Error retrieving user");
  }
};

module.exports = {
  generateStreamKey,
  deleteStreamKeyFromDatabase,
  endStream,
  getStreamKeyFromStreamPath,
  getStreamKeyFromDatabase,
  blockStreamKey,
  isValidStreamKey,
  getLiveStreamingUser,
  getStreamKeyUser,
};

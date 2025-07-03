// const { liveStreamQueue } = require("../liveStreamingController");
const { PrismaClient, SubscriptionStatus } = require("@prisma/client");
// const { getStreamKeyUser } = require("./streaming");
const fs = require("fs");
const FFmpegStatic = require("ffmpeg-static");
const Process = require("child_process");
const { Queue } = require("bullmq");
const redisConfig = require("../../utils/redisConfig");
const prisma = new PrismaClient();
const liveStreamQueue = new Queue("liveStreamQueue", {
  connection: redisConfig
});

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

const addToRecordingJob = async (streamId, streamKey) => {
  let { bucketId, used } = await userUsage(streamKey);
  liveStreamQueue.add("liveStreamJob", {
    streamId: streamId,
    bucketId: bucketId,
    usage: used,
  });
  console.log(liveStreamQueue);
};

const userUsage = async (streamKey) => {
  try {
    const userId = await getStreamKeyUser(streamKey);
    if (userId) {
      const usage = await prisma.usageTable.findFirst({
        where: {
          userId,
        },
      });

      return usage;
    } else {
      console.log("Usage not found.");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error retrieving usage");
  }
};
const userBucket = async (userId) => {
  try {
      const usage = await prisma.usageTable.findFirst({
        where: {
          userId,
        },
      });
      return usage;
  } catch (error) {
    console.log(error);
    throw new Error("Error retrieving usage");
  }
};

async function startRecordingRTMP(videoID, userId, stream_key) {
  let storageAvailable;
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

  // const cmdProgram = "ffmpeg"; // Found through $PATH
  const cmdProgram = FFmpegStatic; // From package "ffmpeg-static"

  let cmdInputPath = `rtmp://${process.env.RTMP_STREAM_HOST}:${process.env.RTMP_STREAM_PORT}/live/${stream_key}`;
  console.log("cmdInputPath", cmdInputPath);
  let cmdOutputPath = `controller/recording/${videoID}.webm`;

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
  const cmdCodec = '-c:v copy -c:a aac'; // Video and audio codecs for the output
const cmdFormat = '-f mp4'; // Output format specification
  // Run process
  const cmdArgStr = [
    "-nostdin",
    "-protocol_whitelist file,rtp,udp,rtmp,tcp",
    "-fflags +genpts",
    `-i ${cmdInputPath}`,
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
  });

  return promise;
}

module.exports = { userUsage, addToRecordingJob, startRecordingRTMP,userBucket };

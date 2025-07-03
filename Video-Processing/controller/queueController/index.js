const { Queue, Worker } = require("bullmq");

const redisConfig = require("../../utils/redisConfig");
const { isFFmpegRunning, stopPaperspaceMachine } = require("../../utils/paperSpace");
// Initialize your queue
const queueName = "paperSpaceCron";
const queue = new Queue(queueName, {
  connection: redisConfig,
});
const machineId = process.env.PAPERSPACE_MACHINE_ID;
const stoppingPaperSpace=async () => {
  try {
    let ffmpegRuning = await isFFmpegRunning();
    if (ffmpegRuning) {
      console.log("FFmpeg is running.");
    } else {
      console.log("FFmpeg is not running. Stopping Paperspace machine.");

      try {
        console.log("Stopping paperspace");
        await removePreviousCron()
        PaperspaceWorker.close()
        stopPaperspaceMachine(machineId)
        console.log("paperspace stopped");
      } catch (stopError) {
        console.error("Error stopping Paperspace machine:", stopError);
      }
    }
  } catch (error) {
    console.error("Error checking FFmpeg status:", error);
  }
}
// Remove previous cron job if it exists
async function removePreviousCron() {
  const existingJobs = await queue.getRepeatableJobs();
  console.log("job?.name",existingJobs);
  for (const job of existingJobs) {
    console.log(job?.name);
    if (job?.name === "paperSpaceCron") {
      await queue.removeRepeatableByKey(job?.key);
    }
  }
}

// Add a new cron job to the queue
async function addCronJob(cronExpression, startDate) {
  await removePreviousCron(); // Remove previous cron job if any
  await queue.add(
    "paperSpaceCron",
    { cronNumber: 1 },
    { repeat: { cron: cronExpression, immediately: false } }
  );
}

const cronAddApi = async (req, res) => {
  try {
    const cronExpression = process.env.CRON_SCHEDULE_PAPERSPACE;
    const startDate = Date.now() + 200000;
    await stoppingPaperSpace();
    await addCronJob(cronExpression, startDate);
    res.status(200).send("Cron job added successfully!");
  } catch (error) {
    res.status(402).send("Error starting cron job");
  }
};

const cronDeleteApi = async (req, res) => {
  await removePreviousCron();
  res.status(200).send("Cron job removed successfully!");
};

const PaperspaceWorker = new Worker(
  queueName,
  async (job) => {
    try {
      console.log(`Processing job ${job.id}...`);
      console.log("stopping process");
      await stoppingPaperSpace()
    } catch (error) {
      console.error("Error processing job:", error);
    }
  },
  {
    connection: redisConfig,
  }
);

module.exports = {
  cronAddApi,
  cronDeleteApi,
  removePreviousCron,
  PaperspaceWorker,
  addCronJob,
};

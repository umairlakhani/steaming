const cron = require("node-cron");
const {
  isFFmpegRunning,
  stopPaperspaceMachine,
} = require("../../utils/paperSpace");
const machineId = process.env.PAPERSPACE_MACHINE_ID;
const cronSchedulePaperSpace = process.env.CRON_SCHEDULE_PAPERSPACE;
const url_taskMap = {};
let scheduledJob = null;

const startPaperSpaceCron = (req, res) => {
  if (!scheduledJob) {
    startCronPaperSpaceCron();
    res?.send("Cron job started.");
  } else {
    res?.send("Cron job already started.");
  }
};

const stopPaperSpaceCron = (req, res) => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;

    res.send("Cron job stopped.");
  } else {
    res.send("Cron job  already stopped.");
  }
};
const stoppingPaperSpace=async () => {
  try {
    let ffmpegRuning = await isFFmpegRunning();
    if (ffmpegRuning) {
      console.log("FFmpeg is running.");
    } else {
      console.log("FFmpeg is not running. Stopping Paperspace machine.");

      try {
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
const startCronPaperSpaceCron = () => {
  scheduledJob = cron.schedule(
    cronSchedulePaperSpace,
    stoppingPaperSpace,
    {
      scheduled: false,
    }
  );
  scheduledJob.start();
};


module.exports = {
  scheduledJob,
  stopPaperSpaceCron,
  startPaperSpaceCron,
  startCronPaperSpaceCron,
  stoppingPaperSpace
};

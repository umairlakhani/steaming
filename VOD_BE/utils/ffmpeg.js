//const ffmpeg = require("fluent-ffmpeg");
//const path = require("path");

//ffmpeg.setFfprobePath("/usr/bin/ffmpeg");

const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');

// Set the correct path to ffprobe explicitly
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Input video file path
// const inputFilePath = 'path/to/input_video.mp4';

// Array of resolutions
const resolutions = ["360p", "480p", "720p", "1080p"];

// Function to calculate estimated size for a given resolution
function calculateSize(resolution, inputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      // Get input video bitrate
      const inputBitrate = metadata.format.bit_rate;
      const duration = metadata.format.duration;

      // Calculate estimated size for the given resolution
      const estimatedSize =
        ((inputBitrate / 8) * duration * getResolutionMultiplier(resolution)) /
        (1024 * 1024);

      resolve({
        resolution,
        estimatedSize: estimatedSize,
      });
    });
  });
}

// Function to get resolution multiplier
function getResolutionMultiplier(resolution) {
  switch (resolution) {
    case "360p":
      return 0.3;
    case "480p":
      return 0.5;
    case "720p":
      return 1;
    case "1080p":
      return 2.5;
    default:
      return 1;
  }
}

// Calculate estimated size for each resolution
async function calculateSizes(inputFilePath) {
  const sizePromises = resolutions.map((resolution) =>
    calculateSize(resolution, inputFilePath)
  );

  try {
    const sizes = await Promise.all(sizePromises);
    const totalEstimatedSize = sizes.reduce((total, num) => {
        return total + num.estimatedSize;
      }, 0);
      console.log(`totalEstimatedSize: ${totalEstimatedSize}`);
    console.log("Estimated Sizes:");
    sizes.forEach((size) => {
      console.log(`${size.resolution}: ${size.estimatedSize.toFixed(2)}mb`);
    });
    return totalEstimatedSize
  } catch (error) {
    console.error("Error calculating sizes:", error);
  }
}

module.exports = { calculateSizes };

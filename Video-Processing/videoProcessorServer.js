const http = require("http");
const https = require("https");
const fs = require("fs").promises;
const fsSync = require("fs");
const url = require("url");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { Worker } = require("bullmq");
const cliProgress = require("cli-progress");
const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");
const { exec } = require("child_process");
require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

// Import controllers and utilities
const {
  updateStorage,
  getBucketCurrentStorage,
  userEligibleToUpload,
} = require("./controller/storageController");
const { io } = require("./server");
const redisConfig = require("./utils/redisConfig");

// Configuration constants
const CONFIG = {
  HOSTNAME: process.env.NODE_ENV === "development" ? "127.0.0.1" : "164.92.96.75",
  PORT: 3000,
  RESOLUTIONS: [
    { width: 640, height: 360, folder: "360p", bitrate: "800k" },
    { width: 854, height: 480, folder: "480p", bitrate: "1200k" },
    { width: 1280, height: 720, folder: "720p", bitrate: "2500k" },
    { width: 1920, height: 1080, folder: "1080p", bitrate: "4000k" },
  ],
  FFMPEG_SETTINGS: {
    SEGMENT_TIME: 10,
    GOP_SIZE: 30,
    AUDIO_BITRATE: "128k",
  },
  MAX_CONCURRENT_UPLOADS: 3,
  CLEANUP_DELAY: 1000,
};

// Initialize Prisma with proper connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configure connection pool
  log: ['error', 'warn'],
  // Add connection pool settings
  __internal: {
    engine: {
      connectionLimit: 10, // Limit connections per instance
    },
  },
});

// Handle Prisma connection lifecycle
const handlePrismaConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const s3Client = new S3Client({
  region: process.env.DO_BUCKET_REGION,
  endpoint: `https://${process.env.DO_BUCKET_NAME}.${process.env.DO_BUCKET_REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  },
  forcePathStyle: true,
});

// Database connection pool manager
class DatabaseManager {
  static async withTransaction(callback) {
    return await prisma.$transaction(callback, {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    });
  }

  static async executeWithRetry(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error.code === 'P2037' && attempt < maxRetries) {
          console.warn(`Database connection failed, retrying... (${attempt}/${maxRetries})`);
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw error;
      }
    }
  }
}

// Progress tracking class
class ProgressTracker {
  constructor(videoId, totalSteps = 5) {
    this.videoId = videoId;
    this.progress = 0;
    this.totalSteps = totalSteps;
    this.stepSize = 100 / totalSteps;
  }

  updateProgress(increment = 1) {
    this.progress = Math.min(100, this.progress + (increment * this.stepSize));
    io.emit(`videoProgress${this.videoId}`, { progress: this.progress, videoId: this.videoId });
    console.log(`Progress for ${this.videoId}: ${Math.round(this.progress)}%`);
  }

  setProgress(value) {
    this.progress = Math.max(0, Math.min(100, value));
    io.emit(`videoProgress${this.videoId}`, { progress: this.progress, videoId: this.videoId });
  }
}

// Utility functions
class FileUtils {
  static async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async safeUnlink(filePath, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.unlink(filePath);
        return true;
      } catch (err) {
        if (i === maxRetries - 1) {
          console.error(`Failed to delete ${filePath} after ${maxRetries} attempts:`, err);
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Download service
class DownloadService {
  static async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`Download failed: ${response.statusCode}`));
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        if (isNaN(totalSize)) {
          return reject(new Error('Invalid content length'));
        }

        const progressBar = new cliProgress.SingleBar({
          format: 'Download |{bar}| {percentage}% | ETA: {eta}s',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true,
        });

        progressBar.start(totalSize, 0);
        const fileStream = fsSync.createWriteStream(outputPath);

        response.on('data', (chunk) => {
          progressBar.increment(chunk.length);
        });

        response.on('error', (err) => {
          progressBar.stop();
          fileStream.destroy();
          reject(err);
        });

        fileStream.on('error', (err) => {
          progressBar.stop();
          reject(err);
        });

        response.pipe(fileStream);

        fileStream.on('finish', async () => {
          progressBar.stop();
          
          // Verify download
          const fileSize = await FileUtils.getFileSize(outputPath);
          if (fileSize === 0) {
            return reject(new Error('Downloaded file is empty'));
          }
          if (fileSize < 1000) {
            return reject(new Error('Downloaded file is too small'));
          }
          
          // Verify it's a valid video file
          await DownloadService.verifyVideoFile(outputPath);
          resolve();
        });
      }).on('error', reject);
    });
  }

  static async verifyVideoFile(filePath) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ]);

      let hasError = false;

      ffprobe.stderr.on('data', (data) => {
        console.error('FFprobe stderr:', data.toString());
        hasError = true;
      });

      ffprobe.on('close', (code) => {
        if (code === 0 && !hasError) {
          resolve();
        } else {
          reject(new Error('Invalid video file'));
        }
      });
    });
  }
}

// Upload service
class UploadService {
  constructor() {
    this.semaphore = new Semaphore(CONFIG.MAX_CONCURRENT_UPLOADS);
  }

  async uploadToSpaces(filePath, s3Key, isPublic = true) {
    await this.semaphore.acquire();
    
    try {
      const fileStream = fsSync.createReadStream(filePath);
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.DO_BUCKET_NAME,
          Key: s3Key,
          Body: fileStream,
          ACL: isPublic ? "public-read" : "private",
        },
      });

      const result = await upload.done();
      
      // Convert to CDN URL
      const cdnUrl = result.Location?.replace(
        `${process.env.DO_BUCKET_REGION}`,
        `${process.env.DO_BUCKET_REGION}.cdn`
      );

      return { ...result, Location: cdnUrl };
    } finally {
      this.semaphore.release();
    }
  }

  async uploadResolutionFiles(videoId, bucketId, resolution, outputDir) {
    const resolutionDir = path.join(outputDir, resolution.folder);
    const files = await fs.readdir(resolutionDir);
    const tsFiles = files.filter(file => 
      file.startsWith(videoId) && file.includes('_output') && file.endsWith('.ts')
    );

    const uploadPromises = tsFiles.map(async (file, index) => {
      const filePath = path.join(resolutionDir, file);
      const s3Key = `users/${bucketId}/videos/${videoId}/${resolution.folder}/${file}`;
      
      try {
        await this.uploadToSpaces(filePath, s3Key, true);
        console.log(`Uploaded ${file} for ${resolution.folder}`);
        
        // Clean up local file after successful upload
        await FileUtils.safeUnlink(filePath);
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
    return tsFiles.length;
  }
}

// Semaphore for controlling concurrent operations
class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.current < this.max) {
        this.current++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.current--;
    }
  }
}

// FFmpeg service
class FFmpegService {
  static async checkEncoderAvailability() {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-encoders']);
      let output = '';
      
      ffmpeg.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ffmpeg.on('close', () => {
        const hasNvenc = output.includes('h264_nvenc');
        const hasLibx264 = output.includes('libx264');
        const hasH264Vaapi = output.includes('h264_vaapi');
        const hasH264Videotoolbox = output.includes('h264_videotoolbox');
        
        resolve({
          nvenc: hasNvenc,
          libx264: hasLibx264,
          vaapi: hasH264Vaapi,
          videotoolbox: hasH264Videotoolbox
        });
      });
    });
  }

  static async convertVideo(inputPath, outputDir, videoId, progressTracker) {
    // Check available encoders first
    const encoders = await FFmpegService.checkEncoderAvailability();
    console.log('Available encoders:', encoders);

    const promises = CONFIG.RESOLUTIONS.map(async (resolution) => {
      const resolutionDir = path.join(outputDir, resolution.folder);
      await FileUtils.ensureDirectory(resolutionDir);
      
      return FFmpegService.convertToResolution(
        inputPath, 
        resolutionDir, 
        videoId, 
        resolution,
        progressTracker,
        encoders
      );
    });

    const results = await Promise.allSettled(promises);
    
    // Check for failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some conversions failed:', failures);
      throw new Error(`${failures.length} resolution conversions failed`);
    }

    return results.map(result => result.value);
  }

  static async convertToResolution(inputPath, outputDir, videoId, resolution, progressTracker, encoders) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, `${videoId}.m3u8`);
      const segmentPattern = path.join(outputDir, `${videoId}_output%d.ts`);

      // Choose the best available encoder
      let ffmpegArgs;
      if (process.env.NODE_ENV === "production" && encoders.nvenc) {
        ffmpegArgs = FFmpegService.getProductionArgs(inputPath, resolution, outputPath, segmentPattern);
      } else if (encoders.libx264) {
        ffmpegArgs = FFmpegService.getDevelopmentArgs(inputPath, resolution, outputPath, segmentPattern);
      } else {
        // Fallback to basic encoding without specifying encoder
        ffmpegArgs = FFmpegService.getFallbackArgs(inputPath, resolution, outputPath, segmentPattern);
      }

      console.log(`Using FFmpeg args for ${resolution.folder}:`, ffmpegArgs.join(' '));

      const ffmpeg = spawn("ffmpeg", ffmpegArgs);
      
      let stderr = '';

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
        // Update progress based on stderr output
        // Emit FFmpeg progress to client
        io.emit(`checkProgressResponse${videoId}`, { progress: Math.round(progressTracker.progress), videoId });
        // Could parse progress from stderr here if needed
      });

      ffmpeg.on("error", (err) => {
        console.error(`FFmpeg error for ${resolution.folder}:`, err);
        reject(err);
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          console.log(`Conversion completed for ${resolution.folder}`);
          resolve({ resolution: resolution.folder, outputPath });
        } else {
          console.error(`FFmpeg failed for ${resolution.folder} with code ${code}`);
          console.error('Stderr:', stderr);
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr.slice(-200)}`));
        }
      });
    });
  }

  static getDevelopmentArgs(inputPath, resolution, outputPath, segmentPattern) {
    return [
      "-i", inputPath,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-preset", "medium",
      "-crf", "23",
      "-vf", `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
      "-profile:v", "baseline",
      "-level", "3.0",
      "-pix_fmt", "yuv420p",
      "-g", CONFIG.FFMPEG_SETTINGS.GOP_SIZE.toString(),
      "-keyint_min", CONFIG.FFMPEG_SETTINGS.GOP_SIZE.toString(),
      "-sc_threshold", "0",
      "-b:a", CONFIG.FFMPEG_SETTINGS.AUDIO_BITRATE,
      "-ar", "44100",
      "-f", "hls",
      "-hls_time", CONFIG.FFMPEG_SETTINGS.SEGMENT_TIME.toString(),
      "-hls_list_size", "0",
      "-hls_segment_filename", segmentPattern,
      "-hls_flags", "independent_segments",
      outputPath,
    ];
  }

  static getProductionArgs(inputPath, resolution, outputPath, segmentPattern) {
    return [
      "-i", inputPath,
      "-vf", `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v", "h264_nvenc",
      "-preset", "fast",
      "-b:v", resolution.bitrate,
      "-maxrate", resolution.bitrate,
      "-bufsize", `${parseInt(resolution.bitrate) * 2}k`,
      "-g", CONFIG.FFMPEG_SETTINGS.GOP_SIZE.toString(),
      "-keyint_min", CONFIG.FFMPEG_SETTINGS.GOP_SIZE.toString(),
      "-profile:v", "main",
      "-level", "4.0",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", CONFIG.FFMPEG_SETTINGS.AUDIO_BITRATE,
      "-ar", "44100",
      "-f", "hls",
      "-hls_time", CONFIG.FFMPEG_SETTINGS.SEGMENT_TIME.toString(),
      "-hls_list_size", "0",
      "-hls_segment_filename", segmentPattern,
      "-hls_flags", "independent_segments",
      outputPath,
    ];
  }

  // Fallback args when specific encoders aren't available
  static getFallbackArgs(inputPath, resolution, outputPath, segmentPattern) {
    return [
      "-i", inputPath,
      "-vf", `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v", "libx264", // Try libx264 as fallback
      "-preset", "medium",
      "-crf", "23",
      "-profile:v", "baseline",
      "-level", "3.0",
      "-pix_fmt", "yuv420p",
      "-g", CONFIG.FFMPEG_SETTINGS.GOP_SIZE.toString(),
      "-c:a", "aac",
      "-b:a", CONFIG.FFMPEG_SETTINGS.AUDIO_BITRATE,
      "-ar", "44100",
      "-f", "hls",
      "-hls_time", CONFIG.FFMPEG_SETTINGS.SEGMENT_TIME.toString(),
      "-hls_list_size", "0",
      "-hls_segment_filename", segmentPattern,
      outputPath,
    ];
  }
}

// Thumbnail service
class ThumbnailService {
  static async generateThumbnail(videoUrl, videoId, bucketId) {
    const outputFileName = path.parse(videoId).name;
    const localThumbnailDir = 'thumbnail';
    const thumbnailDir = `users/${bucketId}/thumbnail`;
    
    await FileUtils.ensureDirectory(localThumbnailDir);
    const localThumbnailPath = path.join(localThumbnailDir, `${outputFileName}.jpg`);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-ss", "00:00:01",
        "-i", videoUrl,
        "-vframes", "1",
        "-q:v", "2",
        "-update", "1",
        localThumbnailPath,
      ]);

      let stderr = '';

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
        const progress = 8;
        io.emit(`checkProgressResponse${videoId}`, {progress, videoId });
      });

      ffmpeg.on("close", async (code) => {
        if (code !== 0) {
          console.error('Thumbnail generation failed:', stderr);
          return reject(new Error(`Thumbnail generation failed with code: ${code}`));
        }

        if (!(await FileUtils.fileExists(localThumbnailPath))) {
          return reject(new Error("Thumbnail file not found"));
        }

        try {
          const uploadService = new UploadService();
          const result = await uploadService.uploadToSpaces(
            localThumbnailPath,
            `${thumbnailDir}/${outputFileName}.jpg`,
            true // public
          );

          // Update database with retry logic
          await DatabaseManager.executeWithRetry(async () => {
            return await prisma.video.update({
              where: { videoId: outputFileName },
              data: { thumbnail: result.Location },
            });
          });

          // Cleanup
          await FileUtils.safeUnlink(localThumbnailPath);
          
          resolve(result);
        } catch (error) {
          await FileUtils.safeUnlink(localThumbnailPath);
          reject(error);
        }
      });
    });
  }
}

// Main video processor
class VideoProcessor {
  constructor() {
    this.uploadService = new UploadService();
  }

  async processVideo(jobData) {
    const { videoId, bucketId, videoUrl } = jobData;
    const progressTracker = new ProgressTracker(videoId);
    const id = path.parse(videoId).name;

    try {
      progressTracker.setProgress(10);

      // Setup directories
      const outputDir = path.join("videos", id);
      await FileUtils.ensureDirectory(outputDir);
      
      for (const resolution of CONFIG.RESOLUTIONS) {
        await FileUtils.ensureDirectory(path.join(outputDir, resolution.folder));
      }

      // Download video
      const inputPath = path.join("videos", `${id}.mp4`);
      await DownloadService.downloadFile(videoUrl, inputPath);
      progressTracker.updateProgress();

      // Generate thumbnail
      await ThumbnailService.generateThumbnail(videoUrl, videoId, bucketId);
      progressTracker.updateProgress();

      // Convert video to multiple resolutions
      await FFmpegService.convertVideo(inputPath, outputDir, id, progressTracker);
      progressTracker.updateProgress();

      // Upload all resolution files and collect metadata
      const resolutionData = await this.uploadAllResolutions(id, bucketId, outputDir);
      progressTracker.updateProgress();

      // Update database with final data using transaction
      await this.updateVideoDatabase(id, resolutionData, bucketId);
      progressTracker.setProgress(100);

      // Cleanup
      await this.cleanup(inputPath, outputDir);

      console.log(`Video processing completed successfully for ${videoId}`);
      return { success: true, videoId: id };

    } catch (error) {
      console.error(`Video processing failed for ${videoId}:`, error);
      
      // Update database to mark as failed with retry logic
      await DatabaseManager.executeWithRetry(async () => {
        return await prisma.video.update({
          where: { videoId: id },
          data: { processing: false, failed: true },
        });
      }).catch(console.error);

      throw error;
    }
  }

  async uploadAllResolutions(videoId, bucketId, outputDir) {
    const resolutionUrls = {};
    const resolutionSizes = {};
    let totalSize = 0;

    // Upload main m3u8 files for each resolution
    for (const resolution of CONFIG.RESOLUTIONS) {
      const m3u8Path = path.join(outputDir, resolution.folder, `${videoId}.m3u8`);
      const s3Key = `users/${bucketId}/videos/${videoId}/${resolution.folder}/${videoId}.m3u8`;
      
      const result = await this.uploadService.uploadToSpaces(m3u8Path, s3Key, false);
      resolutionUrls[`url${resolution.folder.toUpperCase()}`] = result.Location;

      // Upload segment files
      await this.uploadService.uploadResolutionFiles(videoId, bucketId, resolution, outputDir);

      // Calculate size
      const resolutionDir = path.join(outputDir, resolution.folder);
      const files = await fs.readdir(resolutionDir);
      const tsFiles = files.filter(file => file.endsWith('.ts'));
      
      let resolutionSize = 0;
      for (const file of tsFiles) {
        const filePath = path.join(resolutionDir, file);
        const size = await FileUtils.getFileSize(filePath);
        resolutionSize += size;
      }
      
      resolutionSizes[resolution.folder] = resolutionSize;
      totalSize += resolutionSize;
    }

    return { urls: resolutionUrls, sizes: resolutionSizes, totalSize };
  }

  async updateVideoDatabase(videoId, resolutionData, bucketId) {
    const { urls, sizes, totalSize } = resolutionData;

    // Use a transaction to ensure all database operations succeed or fail together
    return await DatabaseManager.withTransaction(async (tx) => {
      // Update main video record
      const updatedVideo = await tx.video.update({
        where: { videoId },
        data: {
          videoUrl: urls.url720P || urls.url480P || urls.url360P || urls.url1080P,
          processing: false,
          size: totalSize,
          ...urls,
        },
      });

      // Create resolution detail records in batches to avoid too many concurrent connections
      const batchSize = 2; // Process 2 resolutions at a time
      for (let i = 0; i < CONFIG.RESOLUTIONS.length; i += batchSize) {
        const batch = CONFIG.RESOLUTIONS.slice(i, i + batchSize);
        const batchPromises = batch.map(resolution => 
          tx.videoDetail.create({
            data: {
              videoId,
              resolution: resolution.folder,
              size: sizes[resolution.folder] || 0,
            },
          })
        );
        
        await Promise.all(batchPromises);
      }

      // Update user storage
      const totalSizeInMb = totalSize / (1024 * 1024);
      const totalStorage = await getBucketCurrentStorage(bucketId);
      const eligible= await userEligibleToUpload(
        updatedVideo.userId,
        totalStorage,
        totalSizeInMb
      );

      console.log(eligible.canUpload, "eligible");
      console.log(eligible.planStorageInMB, "planStorageinMbs");
      console.log(eligible, "eligible");
      
      await updateStorage(
        bucketId,
        totalStorage,
        totalSizeInMb,
        eligible.planStorageInMB
      );

      // Emit completion event
      io.emit(`videoProcessed${videoId}`, updatedVideo);

      return updatedVideo;
    });
  }

  async cleanup(inputPath, outputDir) {
    try {
      // Delete input file
      await FileUtils.safeUnlink(inputPath);
      
      // Delete output directory and all contents
      await fs.rm(outputDir, { recursive: true, force: true });
      
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

// Initialize database connection
handlePrismaConnection();

// Worker setup with reduced concurrency to prevent connection exhaustion
const videoProcessor = new VideoProcessor();

const worker = new Worker(
  "videoQueue",
  async (job) => {
    console.log('Processing video job:', job.data);
    return await videoProcessor.processVideo(job.data);
  },
  {
    connection: redisConfig,
    concurrency: 1, // Reduced to 1 to prevent connection pool exhaustion
  }
);

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, result);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

// Export for use in other modules
module.exports = {
  VideoProcessor,
  FFmpegService,
  ThumbnailService,
  UploadService,
  DownloadService,
  FileUtils,
  CONFIG,
  DatabaseManager,
};
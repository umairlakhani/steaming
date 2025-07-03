let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const request = require('request');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Set the URL of the video file
const videoUrl = 'https://static.videezy.com/system/resources/previews/000/020/407/original/Modern_Typography_Titles_After_Effects_Template_15_Preview.mp4';

// Set the output directory for the HLS files
const outputDirPath = 'videos';

const command = ffmpeg(request(videoUrl))
  .addOption('-profile:v', 'baseline') // Set the video profile to baseline for compatibility with older devices
  .addOption('-start_number', '0') // Set the starting segment number
  .addOption('-hls_time', '2') // Set the duration of each segment
  .addOption('-hls_list_size', '0') // Set the maximum number of segments in the playlist (0 = unlimited)
  .addOption('-f', 'hls') // Set the output format to HLS
  .addOption('-hls_segment_filename', `${outputDirPath}/360p/segment_%d.ts`) // Set the filename format for 360p segments
  .addOption('-vf', 'scale=w=640:h=360') // Set the resolution of the 360p version
  .output(`${outputDirPath}/360p/playlist.m3u8`) // Set the filename for the 360p playlist
  .addOption('-hls_segment_filename', `${outputDirPath}/480p/segment_%d.ts`) // Set the filename format for 480p segments
  .addOption('-vf', 'scale=w=854:h=480') // Set the resolution of the 480p version
  .output(`${outputDirPath}/480p/playlist.m3u8`) // Set the filename for the 480p playlist
  .addOption('-hls_segment_filename', `${outputDirPath}/720p/segment_%d.ts`) // Set the filename format for 720p segments
  .addOption('-vf', 'scale=w=1280:h=720') // Set the resolution of the 720p version
  .output(`${outputDirPath}/720p/playlist.m3u8`) // Set the filename for the 720p playlist
  .addOption('-hls_segment_filename', `${outputDirPath}/1080p/segment_%d.ts`) // Set the filename format for 1080p segments
  .addOption('-vf', 'scale=w=1920:h=1080') // Set the resolution of the 1080p version
  .output(`${outputDirPath}/1080p/playlist.m3u8`) // Set the filename for the 1080p playlist
  .addOption('-hls_segment_filename', `${outputDirPath}/1440p/segment_%d.ts`) // Set the filename format for 1440p segments
  .addOption('-vf', 'scale=w=2560:h=1440') // Set the resolution of the 1440p version
  .output(`${outputDirPath}/1440p/playlist.m3u8`) // Set the filename for the 1440p playlist
  .addOption('-hls_segment_filename', `${outputDirPath}/2160p/segment_%d.ts`) // Set the filename format for 2160p segments
  .addOption('-vf', 'scale=w=3840:h=2160') // Set the resolution of the 2160p version
  .output(`${outputDirPath}/2160p/playlist.m3u8`); // Set the filename for the 2160p playlist

// Run the command and log the output
command.on('end', () => console.log('HLS playlist created'))
  .on('error', (err) => console.error('Error creating HLS playlist:', err.message))
  .run();
const http = require('http');
const https = require('https');
const fs = require('fs');
const cliProgress = require('cli-progress');

const download = (url, path, callback) => {
  const protocol = url.startsWith('https') ? https : http;

  const fileStream = fs.createWriteStream(path);
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  protocol
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        fileStream.close();
        fs.unlinkSync(path);
        callback(
          new Error(
            `Failed to download file. Status code: ${response.statusCode}`,
          ),
        );
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      progressBar.start(totalSize, 0);

      response.on('data', (chunk) => {
        progressBar.increment(chunk.length);
        fileStream.write(chunk);
      });

      response.on('end', () => {
        progressBar.stop();
        fileStream.end();
        callback();
      });

      response.on('error', (error) => {
        progressBar.stop();
        fileStream.close();
        fs.unlinkSync(path);
        callback(error);
      });
    })
    .on('error', (error) => {
      fileStream.close();
      fs.unlinkSync(path);
      callback(error);
    });
};

const videoId = '195da0e7cad277cd471d0bc15';
https://temp-video.nyc3.cdn.digitaloceanspaces.com/temp-video/137c89702d49e6593cd995600
const videoUrl =
  'https://temp-video.nyc3.digitaloceanspaces.com/temp-video/temp-video/b6dc8eb504eb5dc461027f700';
const videoPath = `videos/${videoId}.mp4`;

download(videoUrl, videoPath, (error) => {
  if (error) {
    console.error('An error occurred while downloading the video:', error);
    return;
  }

  console.log('Video downloaded successfully!');
  // Further processing or operations can be performed here
});

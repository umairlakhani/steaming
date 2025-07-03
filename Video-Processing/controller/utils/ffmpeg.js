const ffmpeg = require('fluent-ffmpeg');

// Input video file path
// const inputFilePath = 'path/to/input_video.mp4';

// Array of resolutions
const resolutions = ['360p', '480p', '720p'];

// Function to calculate estimated size for a given resolution
function calculateSize(resolution,inputFilePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            // Get input video bitrate
            const inputBitrate = metadata.format.bit_rate;

            // Calculate estimated size for the given resolution
            const estimatedSize = (inputBitrate / 8) * getResolutionMultiplier(resolution);

            resolve({
                resolution,
                estimatedSize: estimatedSize.toFixed(2) + ' bytes',
            });
        });
    });
}

// Function to get resolution multiplier
function getResolutionMultiplier(resolution) {
    switch (resolution) {
        case '360p':
            return 0.3;
        case '480p':
            return 0.5;
        case '720p':
            return 1;
        default:
            return 1;
    }
}

// Calculate estimated size for each resolution
async function calculateSizes(inputFilePath) {
    const sizePromises = resolutions.map(resolution => calculateSize(resolution,inputFilePath));

    try {
        const sizes = await Promise.all(sizePromises);
        console.log('Estimated Sizes:');
        sizes.forEach(size => {
            console.log(`${size.resolution}: ${size.estimatedSize}`);
        });
    } catch (error) {
        console.error('Error calculating sizes:', error);
    }
}


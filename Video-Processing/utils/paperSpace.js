const paperspace_node = require('paperspace-node');
const { exec } = require('child_process');
var paperspace = paperspace_node({
    apiKey: process.env.PAPERSPACE_API_KEY
});


function isFFmpegRunning() {
  return new Promise((resolve, reject) => {
    exec('pgrep ffmpeg', (error, stdout) => {
      if (error) {
      }
      const isRunning = stdout.trim() !== '';
      resolve(isRunning);
    });
  });
}

function stopPaperspaceMachine(machineId) {
  return new Promise((resolve, reject) => {
    paperspace.machines.stop({ machineId }, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp.state);
    });
  });
}


module.exports={stopPaperspaceMachine,isFFmpegRunning,isFFmpegRunning}
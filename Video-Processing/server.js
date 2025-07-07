
// --- read options ---
require("dotenv").config();
const fs = require("fs");
// process.env.FFPROBE_PATH = '/opt/homebrew/bin/ffprobe';
let serverOptions = {
  hostName: process.env.MEDIA_SOUP_IP,
  // hostName: "192.168.18.189",
  listenPort: 3000,
  useHttps: process.env.HTTPS,
  // useHttps: false,
  httpsKeyFile: "./key.pem",
  httpsCertFile: "./cert.pem",
};
console.log(process.env.MEDIA_SOUP_IP, "chest name");

let sslOptions = {};
if (serverOptions.useHttps) {
  sslOptions.key = fs.readFileSync(serverOptions.httpsKeyFile, "utf8");
  sslOptions.cert = fs.readFileSync(serverOptions.httpsCertFile, "utf8");
  sslOptions.passphrase = "abcdefg";
}

// --- prepare server ---
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const app = express();
const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
// Tell fluent-ffmpeg where it can find FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);
const morgan = require("morgan");

// app.use(cors({
//     origin: 'https://dev.mediapilot.io/'
// }));
const webPort = serverOptions.listenPort;
// We'll set up the streamRouter after io is created
const cronRouter = require("./routes/cronRouter");
const nms = require("./controller/obsStreamingController/media_server");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { setupBullMQ, PaperspaceWorker, addCronJob } = require("./controller/queueController");

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://localhost:5173",
      "https://dev.mediapilot.io",
      "http://192.168.18.185:4200",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(morgan("dev"));
// We'll set up the streamRouter after io is created
app.use("/api/paperspace", cronRouter);
app.use(function (err, req, res, next) {
  console.log(err, "Error in app");

  // render the error page
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

let webServer = null;

webServer = http.Server(app).listen(webPort, function () {
  console.log(
    "Web server start. http://" +
      serverOptions.hostName +
      ":" +
      webServer.address().port +
      "/"
  );
});
// }

// --- file check ---
function isFileExist(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK);
    //console.log('File Exist path=' + path);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      //console.log('File NOT Exist path=' + path);
      return false;
    }
  }

  console.error("MUST NOT come here");
  return false;
}

// --- socket.io server ---
const io = require("socket.io")(webServer, {
  path: "/socket.io",
  cors: {
    origin:"*",
  },
transports: ['websocket', 'polling']
});
const pubClient = createClient({
  url:`${process.env.REDIS_URL}`,
  tls: {
    rejectUnauthorized: false, // Set to true to reject unauthorized connections (recommended for production)
  }
});
pubClient.on("error", (err) => {
  console.error("PubClient Error:", err);
});
const subClient = pubClient.duplicate();

subClient.on("error", (err) => {
  console.error("SubClient Error:", err);
});
io.adapter(createAdapter(pubClient, subClient));
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    console.log("socket redis Pub and Sub clients connected");
   io.listen(3002)
})
  .catch((err) => {
    console.log("Error connecting Pub or Sub clients", err);
  });
console.log(io, "check io in serve");

// Set up streamRouter with io instance
const streamRouter = require("./routes/livestreaming")(io);
app.use("/api/livestream", streamRouter);

// **INITIALIZE MEDIASOUP ON SERVER START**
const { initializeMediaSoup } = require("./controller/liveStreamingController");
console.log("🚀 Initializing MediaSoup on server start...");
// Pass io instance to avoid circular dependency
initializeMediaSoup(io)
  .then(() => {
    console.log("✅ MediaSoup initialized successfully on server start");
  })
  .catch((error) => {
    console.error("❌ Failed to initialize MediaSoup on server start:", error);
  });

nms.run();
// Start adding your cron job
const cronExpression = process.env.CRON_SCHEDULE_PAPERSPACE;
 addCronJob(cronExpression);
PaperspaceWorker.run()
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// RTMP event listeners
nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

module.exports = app;
module.exports.io = io;

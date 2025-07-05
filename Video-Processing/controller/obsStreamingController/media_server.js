const { PrismaClient } = require("@prisma/client");
const { createLiveStreamRecord } = require("../liveStreamingController");
const {
  getStreamKeyFromDatabase,
  deleteStreamKeyFromDatabase,
  isValidStreamKey,
  blockStreamKey,
  getStreamKeyFromStreamPath,
  endStream,
} = require("../utils/streaming");
const { donePublish, prePublish } = require("./nms");

const NodeMediaServer = require("node-media-server"),
  config = require("./config/default").rtmp_server,
  helpers = require("./helpers/helpers");

let nms = new NodeMediaServer(config);

// Add comprehensive logging
nms.on('preConnect', (id, args) => {
  console.log(`[RTMP] preConnect - ID: ${id}, Args:`, args);
});

nms.on('postConnect', (id, args) => {
  console.log(`[RTMP] postConnect - ID: ${id}, Args:`, args);
});

nms.on('doneConnect', (id, args) => {
  console.log(`[RTMP] doneConnect - ID: ${id}, Args:`, args);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log(`[RTMP] prePublish - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
  prePublish(id, StreamPath, args);
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log(`[RTMP] postPublish - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log(`[RTMP] donePublish - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
  donePublish(id, StreamPath, args);
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log(`[RTMP] prePlay - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log(`[RTMP] postPlay - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log(`[RTMP] donePlay - ID: ${id}, StreamPath: ${StreamPath}, Args:`, args);
});

module.exports = nms;